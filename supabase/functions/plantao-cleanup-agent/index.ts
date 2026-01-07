import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CleanupRequest {
  cpf?: string;
  cleanAll?: boolean;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { cpf, cleanAll }: CleanupRequest = await req.json();

    const cleanupResults: string[] = [];

    if (cleanAll) {
      // Limpar TODOS os agentes e usuários do plantão
      console.log("Limpando todos os dados do Plantão...");

      // 1. Deletar todos os registros relacionados a agentes
      await admin.from("agent_alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      cleanupResults.push("agent_alerts");

      await admin.from("agent_days_off").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      cleanupResults.push("agent_days_off");

      await admin.from("agent_presence").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      cleanupResults.push("agent_presence");

      await admin.from("agent_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      cleanupResults.push("agent_messages");

      await admin.from("chat_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      cleanupResults.push("chat_messages");

      await admin.from("calendar_notes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      cleanupResults.push("calendar_notes");

      await admin.from("overtime_bank").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      cleanupResults.push("overtime_bank");

      await admin.from("license_payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      cleanupResults.push("license_payments");

      await admin.from("shift_swaps").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      cleanupResults.push("shift_swaps");

      await admin.from("shifts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      cleanupResults.push("shifts");

      await admin.from("agent_licenses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      cleanupResults.push("agent_licenses");

      await admin.from("app_usage_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      cleanupResults.push("app_usage_logs");

      // 2. Obter todos os agentes para deletar usuários auth
      const { data: agents } = await admin.from("agents").select("user_id, cpf");
      
      if (agents && agents.length > 0) {
        for (const agent of agents) {
          if (agent.user_id) {
            // Deletar user_roles
            await admin.from("user_roles").delete().eq("user_id", agent.user_id);
            
            // Deletar usuário auth
            try {
              await admin.auth.admin.deleteUser(agent.user_id);
              cleanupResults.push(`auth_user_${agent.cpf}`);
            } catch (e) {
              console.error(`Erro ao deletar auth user ${agent.user_id}:`, e);
            }
          }
        }
      }

      // 3. Deletar todos os agentes
      await admin.from("agents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      cleanupResults.push("agents");

      // 4. Limpar usuários auth órfãos do plantão (emails @plantaopro.local)
      const { data: usersData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (usersData?.users) {
        for (const user of usersData.users) {
          if (user.email?.endsWith("@plantaopro.local")) {
            try {
              await admin.from("user_roles").delete().eq("user_id", user.id);
              await admin.auth.admin.deleteUser(user.id);
              cleanupResults.push(`orphan_auth_${user.email}`);
            } catch (e) {
              console.error(`Erro ao deletar usuário órfão ${user.email}:`, e);
            }
          }
        }
      }

    } else if (cpf) {
      // Limpar apenas um CPF específico
      const cleanCpf = cpf.replace(/\D/g, "");
      console.log(`Limpando agente com CPF: ${cleanCpf}`);

      // Buscar agente
      const { data: agent } = await admin
        .from("agents")
        .select("id, user_id")
        .eq("cpf", cleanCpf)
        .maybeSingle();

      if (agent) {
        // Deletar registros relacionados
        await admin.from("agent_alerts").delete().eq("agent_id", agent.id);
        await admin.from("agent_days_off").delete().eq("agent_id", agent.id);
        await admin.from("agent_presence").delete().eq("agent_id", agent.id);
        await admin.from("agent_messages").delete().eq("sender_id", agent.id);
        await admin.from("chat_messages").delete().eq("sender_id", agent.id);
        await admin.from("calendar_notes").delete().eq("agent_id", agent.id);
        await admin.from("overtime_bank").delete().eq("agent_id", agent.id);
        await admin.from("license_payments").delete().eq("agent_id", agent.id);
        await admin.from("shift_swaps").delete().or(`requester_id.eq.${agent.id},target_id.eq.${agent.id}`);
        await admin.from("shifts").delete().eq("agent_id", agent.id);
        await admin.from("agent_licenses").delete().eq("agent_id", agent.id);
        await admin.from("app_usage_logs").delete().eq("agent_id", agent.id);

        if (agent.user_id) {
          await admin.from("user_roles").delete().eq("user_id", agent.user_id);
          try {
            await admin.auth.admin.deleteUser(agent.user_id);
            cleanupResults.push("auth_user");
          } catch (e) {
            console.error(`Erro ao deletar auth user:`, e);
          }
        }

        await admin.from("agents").delete().eq("id", agent.id);
        cleanupResults.push("agent");
      }

      // Verificar e limpar usuário auth órfão com este CPF
      const email = `${cleanCpf}@plantaopro.local`;
      const { data: usersData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const authUser = usersData?.users?.find(
        (u: any) => (u.email ?? "").toLowerCase() === email.toLowerCase()
      );

      if (authUser) {
        await admin.from("user_roles").delete().eq("user_id", authUser.id);
        try {
          await admin.auth.admin.deleteUser(authUser.id);
          cleanupResults.push("orphan_auth_user");
        } catch (e) {
          console.error(`Erro ao deletar auth user órfão:`, e);
        }
      }
    }

    console.log(`Limpeza concluída: ${cleanupResults.join(", ")}`);

    return new Response(
      JSON.stringify({
        success: true,
        cleaned: cleanupResults,
        message: `Limpeza concluída: ${cleanupResults.length} itens removidos`,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Erro ao limpar dados";
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
