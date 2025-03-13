-- Add foreign key constraints to establish proper relationships

-- Add foreign key constraint to sales table
ALTER TABLE IF EXISTS public.sales
ADD CONSTRAINT fk_sales_product
FOREIGN KEY (product_id)
REFERENCES public.products(id)
ON DELETE SET NULL;

-- Add foreign key constraint to purchases table
ALTER TABLE IF EXISTS public.purchases
ADD CONSTRAINT fk_purchases_product
FOREIGN KEY (product_id)
REFERENCES public.products(id)
ON DELETE SET NULL;

-- Add foreign key constraint to consumption table
ALTER TABLE IF EXISTS public.consumption
ADD CONSTRAINT fk_consumption_product
FOREIGN KEY (product_id)
REFERENCES public.products(id)
ON DELETE SET NULL;

-- Add foreign key constraint linking consumption to original sale if applicable
ALTER TABLE IF EXISTS public.consumption
ADD CONSTRAINT fk_consumption_sale
FOREIGN KEY (original_sale_id)
REFERENCES public.sales(id)
ON DELETE SET NULL;

-- Add foreign key constraint linking sales to consumption for converted sales
ALTER TABLE IF EXISTS public.sales
ADD CONSTRAINT fk_sales_consumption
FOREIGN KEY (consumption_id)
REFERENCES public.consumption(id)
ON DELETE SET NULL; 