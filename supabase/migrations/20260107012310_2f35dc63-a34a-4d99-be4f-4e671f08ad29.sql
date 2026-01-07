-- Add new columns to agents table
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS unit TEXT;

-- Update existing agents to have default values (optional)
UPDATE public.agents SET city = 'Feijó' WHERE city IS NULL;
UPDATE public.agents SET unit = 'CASE Feijó' WHERE unit IS NULL;