-- Create balance_stock table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.balance_stock (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  qty NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on product_id for faster lookups
CREATE INDEX IF NOT EXISTS balance_stock_product_id_idx ON public.balance_stock(product_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.balance_stock ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" 
ON public.balance_stock
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true); 