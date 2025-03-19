-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  hsn_code TEXT,
  unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create purchases table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  date TEXT,
  invoice_no TEXT,
  qty NUMERIC(10, 2) NOT NULL DEFAULT 0,
  incl_gst NUMERIC(10, 2) DEFAULT 0,
  ex_gst NUMERIC(10, 2) DEFAULT 0,
  taxable_value NUMERIC(10, 2) DEFAULT 0,
  igst NUMERIC(10, 2) DEFAULT 0,
  cgst NUMERIC(10, 2) DEFAULT 0,
  sgst NUMERIC(10, 2) DEFAULT 0,
  invoice_value NUMERIC(10, 2) DEFAULT 0,
  supplier TEXT,
  transaction_type TEXT DEFAULT 'purchase',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sales table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  date TEXT,
  invoice_no TEXT,
  qty NUMERIC(10, 2) NOT NULL DEFAULT 0,
  incl_gst NUMERIC(10, 2) DEFAULT 0,
  ex_gst NUMERIC(10, 2) DEFAULT 0,
  taxable_value NUMERIC(10, 2) DEFAULT 0,
  igst NUMERIC(10, 2) DEFAULT 0,
  cgst NUMERIC(10, 2) DEFAULT 0,
  sgst NUMERIC(10, 2) DEFAULT 0,
  invoice_value NUMERIC(10, 2) DEFAULT 0,
  customer TEXT,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'online', 'other')),
  transaction_type TEXT DEFAULT 'sale',
  converted_to_consumption BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  consumption_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create consumption table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.consumption (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  date TEXT,
  qty NUMERIC(10, 2) NOT NULL DEFAULT 0,
  purpose TEXT,
  transaction_type TEXT DEFAULT 'consumption',
  original_sale_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create balance_stock table if it doesn't exist (in case it wasn't created earlier)
CREATE TABLE IF NOT EXISTS public.balance_stock (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  qty NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON public.purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON public.sales(product_id);
CREATE INDEX IF NOT EXISTS idx_consumption_product_id ON public.consumption(product_id);
CREATE INDEX IF NOT EXISTS idx_balance_stock_product_id ON public.balance_stock(product_id);

-- Add foreign key constraints
ALTER TABLE IF EXISTS public.consumption
ADD CONSTRAINT fk_consumption_sale
FOREIGN KEY (original_sale_id)
REFERENCES public.sales(id)
ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.sales
ADD CONSTRAINT fk_sales_consumption
FOREIGN KEY (consumption_id)
REFERENCES public.consumption(id)
ON DELETE SET NULL;

-- Set up Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_stock ENABLE ROW LEVEL SECURITY;

-- Create policies to allow authenticated users to perform all operations
CREATE POLICY "Allow all operations for authenticated users on products" 
ON public.products FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all operations for authenticated users on purchases" 
ON public.purchases FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all operations for authenticated users on sales" 
ON public.sales FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all operations for authenticated users on consumption" 
ON public.consumption FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all operations for authenticated users on balance_stock" 
ON public.balance_stock FOR ALL TO authenticated USING (true); 