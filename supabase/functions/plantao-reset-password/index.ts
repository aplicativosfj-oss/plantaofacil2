import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-master-token',
};

interface ResetPasswordRequest {
  cpf: string;
  new_password: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // SECURITY: Validate master session token
    const masterToken = req.headers.get('x-master-token');
    
    if (!masterToken) {
      console.error('No master token provided');
      return new Response(
        JSON.stringify({ error: 'Não autorizado - token de sessão ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate the master session using the secure RPC function
    const { data: sessionData, error: sessionError } = await supabase
      .rpc('validate_master_session', { p_token: masterToken });

    if (sessionError || !sessionData || sessionData.length === 0 || !sessionData[0].is_valid) {
      console.error('Invalid master session:', sessionError?.message || 'Session validation failed');
      return new Response(
        JSON.stringify({ error: 'Sessão de master inválida ou expirada' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const masterInfo = sessionData[0];

    // Rate limiting check for this operation
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitId = `edge:reset:${clientIp}`;
    
    const { data: rateLimitData } = await supabase
      .rpc('check_rate_limit', { 
        p_identifier: rateLimitId, 
        p_attempt_type: 'edge_function',
        p_ip_address: clientIp,
        p_max_attempts: 10,
        p_window_minutes: 5
      });

    if (rateLimitData && rateLimitData.length > 0 && !rateLimitData[0].is_allowed) {
      return new Response(
        JSON.stringify({ error: 'Muitas requisições. Tente novamente mais tarde.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { cpf, new_password } = (await req.json()) as ResetPasswordRequest;

    if (!cpf || !new_password) {
      return new Response(
        JSON.stringify({ error: 'CPF e nova senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password strength
    if (new_password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 8 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean CPF
    const cleanCpf = cpf.replace(/\D/g, '');

    // Reject passwords that contain the CPF
    if (new_password.includes(cleanCpf) || new_password.includes(cleanCpf.slice(-6))) {
      return new Response(
        JSON.stringify({ error: 'A senha não pode conter o CPF' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the agent by CPF
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, user_id, full_name')
      .eq('cpf', cleanCpf)
      .single();

    if (agentError || !agent) {
      // Record failed attempt for audit
      await supabase.rpc('record_login_attempt', {
        p_identifier: rateLimitId,
        p_attempt_type: 'edge_function',
        p_ip_address: clientIp,
        p_was_successful: false
      });
      
      return new Response(
        JSON.stringify({ error: 'Agente não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!agent.user_id) {
      return new Response(
        JSON.stringify({ error: 'Agente não possui usuário de autenticação vinculado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the user's password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      agent.user_id,
      { password: new_password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar senha: ' + updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record successful operation
    await supabase.rpc('record_login_attempt', {
      p_identifier: rateLimitId,
      p_attempt_type: 'edge_function',
      p_ip_address: clientIp,
      p_was_successful: true
    });

    // Log the password reset with master info
    await supabase.from('app_usage_logs').insert({
      agent_id: agent.id,
      action_type: 'password_reset',
      action_details: { 
        reset_by: 'master', 
        master_id: masterInfo.master_id,
        master_username: masterInfo.username,
        reset_at: new Date().toISOString(),
        ip_address: clientIp
      },
      ip_address: clientIp,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Senha resetada com sucesso',
        agent_name: agent.full_name 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in plantao-reset-password:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
