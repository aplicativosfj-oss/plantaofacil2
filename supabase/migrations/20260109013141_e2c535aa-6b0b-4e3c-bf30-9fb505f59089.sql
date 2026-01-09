-- Adicionar política de DELETE para chat_messages
CREATE POLICY "Anyone can delete own messages" 
ON public.chat_messages 
FOR DELETE 
USING (true);

-- Criar função para limpar mensagens antigas (24 horas)
CREATE OR REPLACE FUNCTION public.cleanup_old_chat_messages()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.chat_messages
  WHERE created_at < now() - interval '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;