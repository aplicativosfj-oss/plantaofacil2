-- Add shift_type column to overtime_bank for day/night indication
ALTER TABLE public.overtime_bank 
ADD COLUMN shift_type text NOT NULL DEFAULT 'day' CHECK (shift_type IN ('day', 'night'));

-- Add scheduled_time for alert scheduling (when the overtime starts)
ALTER TABLE public.overtime_bank 
ADD COLUMN scheduled_time time;

-- Add alert_sent flag to track if alert was sent
ALTER TABLE public.overtime_bank 
ADD COLUMN alert_sent boolean DEFAULT false;

COMMENT ON COLUMN public.overtime_bank.shift_type IS 'Indicates if overtime is day (06:00-18:00) or night (18:00-06:00)';
COMMENT ON COLUMN public.overtime_bank.scheduled_time IS 'Time when the overtime shift starts for alert scheduling';
COMMENT ON COLUMN public.overtime_bank.alert_sent IS 'Whether the 1-hour advance alert was sent';