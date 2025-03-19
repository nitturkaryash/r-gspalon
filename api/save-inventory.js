import { supabase } from './_supabase.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { products, purchases, sales, consumption, balance } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Products data is required' });
    }

    // Create a transaction to ensure all operations succeed or fail together
    const results = {
      products: { success: 0, error: 0 },
      purchases: { success: 0, error: 0 },
      sales: { success: 0, error: 0 },
      consumption: { success: 0, error: 0 },
      balance: { success: 0, error: 0 }
    };

    // Process products
    for (const product of products) {
      try {
        // Check if product already exists
        const { data: existingProducts, error: queryError } = await supabase
          .from('products')
          .select('id')
          .eq('name', product.product_name)
          .eq('hsn_code', product.hsn_code);

        if (queryError) throw queryError;

        let productId;

        if (existingProducts && existingProducts.length > 0) {
          // Update existing product
          productId = existingProducts[0].id;
          const { error: updateError } = await supabase
            .from('products')
            .update({
              unit: product.units
            })
            .eq('id', productId);

          if (updateError) throw updateError;
        } else {
          // Insert new product
          productId = uuidv4();
          const { error: insertError } = await supabase
            .from('products')
            .insert({
              id: productId,
              name: product.product_name,
              hsn_code: product.hsn_code,
              unit: product.units
            });

          if (insertError) throw insertError;
        }

        // Store the product ID for reference in other tables
        product.id = productId;
        results.products.success++;
      } catch (error) {
        console.error('Error processing product:', error);
        results.products.error++;
      }
    }

    // Create a map of product names to IDs for easy lookup
    const productMap = {};
    for (const product of products) {
      if (product.id) {
        const key = `${product.product_name}|${product.hsn_code}`;
        productMap[key] = product.id;
      }
    }

    // Process purchases
    if (purchases && Array.isArray(purchases)) {
      for (const purchase of purchases) {
        try {
          const key = `${purchase.product_name}|${purchase.hsn_code}`;
          const productId = productMap[key];

          if (!productId) {
            console.error(`Product not found for purchase: ${key}`);
            results.purchases.error++;
            continue;
          }

          const { error: insertError } = await supabase
            .from('purchases')
            .insert({
              id: uuidv4(),
              product_id: productId,
              date: purchase.date,
              invoice_no: purchase.invoice_no,
              qty: purchase.qty,
              incl_gst: purchase.price_incl_gst,
              ex_gst: purchase.price_ex_gst,
              taxable_value: purchase.taxable_value,
              igst: purchase.igst,
              cgst: purchase.cgst,
              sgst: purchase.sgst,
              invoice_value: purchase.invoice_value,
              supplier: purchase.supplier || '',
              transaction_type: 'purchase'
            });

          if (insertError) throw insertError;
          results.purchases.success++;
        } catch (error) {
          console.error('Error processing purchase:', error);
          results.purchases.error++;
        }
      }
    }

    // Process sales
    if (sales && Array.isArray(sales)) {
      for (const sale of sales) {
        try {
          const key = `${sale.product_name}|${sale.hsn_code}`;
          const productId = productMap[key];

          if (!productId) {
            console.error(`Product not found for sale: ${key}`);
            results.sales.error++;
            continue;
          }

          const { error: insertError } = await supabase
            .from('sales')
            .insert({
              id: uuidv4(),
              product_id: productId,
              date: sale.date,
              invoice_no: sale.invoice_no,
              qty: sale.qty,
              incl_gst: sale.mrp_incl_gst,
              ex_gst: sale.mrp_ex_gst,
              taxable_value: sale.sales_taxable_value,
              igst: sale.sales_igst,
              cgst: sale.sales_cgst,
              sgst: sale.sales_sgst,
              invoice_value: sale.invoice_value,
              customer: sale.customer || '',
              payment_method: sale.payment_method || 'cash',
              transaction_type: 'sale',
              converted_to_consumption: false,
              purchase_cost_per_unit_ex_gst: sale.purchase_cost_per_unit_ex_gst,
              purchase_gst_percentage: sale.purchase_gst_percentage,
              purchase_taxable_value: sale.purchase_taxable_value,
              purchase_igst: sale.purchase_igst,
              purchase_cgst: sale.purchase_cgst,
              purchase_sgst: sale.purchase_sgst,
              total_purchase_cost: sale.total_purchase_cost,
              discount_percentage: sale.discount_percentage,
              discounted_sales_rate_ex_gst: sale.discounted_sales_rate_ex_gst,
              sales_gst_percentage: sale.sales_gst_percentage
            });

          if (insertError) throw insertError;
          results.sales.success++;
        } catch (error) {
          console.error('Error processing sale:', error);
          results.sales.error++;
        }
      }
    }

    // Process consumption
    if (consumption && Array.isArray(consumption)) {
      for (const item of consumption) {
        try {
          const key = `${item.product_name}|${item.hsn_code}`;
          const productId = productMap[key];

          if (!productId) {
            console.error(`Product not found for consumption: ${key}`);
            results.consumption.error++;
            continue;
          }

          const { error: insertError } = await supabase
            .from('consumption')
            .insert({
              id: uuidv4(),
              product_id: productId,
              date: item.date,
              qty: item.qty,
              purpose: item.purpose || '',
              transaction_type: 'consumption',
              purchase_cost_per_unit_ex_gst: item.purchase_cost_per_unit_ex_gst,
              purchase_gst_percentage: item.purchase_gst_percentage,
              taxable_value: item.taxable_value,
              igst: item.igst,
              cgst: item.cgst,
              sgst: item.sgst,
              total_purchase_cost: item.total_purchase_cost
            });

          if (insertError) throw insertError;
          results.consumption.success++;
        } catch (error) {
          console.error('Error processing consumption:', error);
          results.consumption.error++;
        }
      }
    }

    // Process balance stock
    if (balance && Array.isArray(balance)) {
      for (const item of balance) {
        try {
          const key = `${item.product_name}|${item.hsn_code}`;
          const productId = productMap[key];

          if (!productId) {
            console.error(`Product not found for balance: ${key}`);
            results.balance.error++;
            continue;
          }

          // Check if balance record already exists for this product
          const { data: existingBalance, error: queryError } = await supabase
            .from('balance_stock')
            .select('id')
            .eq('product_id', productId);

          if (queryError) throw queryError;

          if (existingBalance && existingBalance.length > 0) {
            // Update existing balance
            const { error: updateError } = await supabase
              .from('balance_stock')
              .update({
                qty: item.qty,
                taxable_value: item.taxable_value,
                igst: item.igst,
                cgst: item.cgst,
                sgst: item.sgst,
                invoice_value: item.invoice_value
              })
              .eq('id', existingBalance[0].id);

            if (updateError) throw updateError;
          } else {
            // Insert new balance
            const { error: insertError } = await supabase
              .from('balance_stock')
              .insert({
                id: uuidv4(),
                product_id: productId,
                qty: item.qty,
                taxable_value: item.taxable_value,
                igst: item.igst,
                cgst: item.cgst,
                sgst: item.sgst,
                invoice_value: item.invoice_value
              });

            if (insertError) throw insertError;
          }

          results.balance.success++;
        } catch (error) {
          console.error('Error processing balance:', error);
          results.balance.error++;
        }
      }
    }

    // Calculate balance stock for products without explicit balance entries
    if (results.products.success > 0) {
      try {
        // Get all products
        const { data: allProducts, error: queryError } = await supabase
          .from('products')
          .select('id');

        if (queryError) throw queryError;

        for (const product of allProducts) {
          // Check if balance exists
          const { data: existingBalance, error: balanceQueryError } = await supabase
            .from('balance_stock')
            .select('id')
            .eq('product_id', product.id);

          if (balanceQueryError) throw balanceQueryError;

          // If no balance exists, calculate it
          if (!existingBalance || existingBalance.length === 0) {
            // Get purchases
            const { data: productPurchases, error: purchasesError } = await supabase
              .from('purchases')
              .select('qty, taxable_value, igst, cgst, sgst, invoice_value')
              .eq('product_id', product.id);

            if (purchasesError) throw purchasesError;

            // Get sales
            const { data: productSales, error: salesError } = await supabase
              .from('sales')
              .select('qty, purchase_taxable_value, purchase_igst, purchase_cgst, purchase_sgst, total_purchase_cost')
              .eq('product_id', product.id);

            if (salesError) throw salesError;

            // Get consumption
            const { data: productConsumption, error: consumptionError } = await supabase
              .from('consumption')
              .select('qty, taxable_value, igst, cgst, sgst, total_purchase_cost')
              .eq('product_id', product.id);

            if (consumptionError) throw consumptionError;

            // Calculate balance
            let qty = 0;
            let taxableValue = 0;
            let igst = 0;
            let cgst = 0;
            let sgst = 0;
            let invoiceValue = 0;

            // Add purchases
            for (const purchase of productPurchases || []) {
              qty += purchase.qty || 0;
              taxableValue += purchase.taxable_value || 0;
              igst += purchase.igst || 0;
              cgst += purchase.cgst || 0;
              sgst += purchase.sgst || 0;
              invoiceValue += purchase.invoice_value || 0;
            }

            // Subtract sales
            for (const sale of productSales || []) {
              qty -= sale.qty || 0;
              taxableValue -= sale.purchase_taxable_value || 0;
              igst -= sale.purchase_igst || 0;
              cgst -= sale.purchase_cgst || 0;
              sgst -= sale.purchase_sgst || 0;
              invoiceValue -= sale.total_purchase_cost || 0;
            }

            // Subtract consumption
            for (const consumption of productConsumption || []) {
              qty -= consumption.qty || 0;
              taxableValue -= consumption.taxable_value || 0;
              igst -= consumption.igst || 0;
              cgst -= consumption.cgst || 0;
              sgst -= consumption.sgst || 0;
              invoiceValue -= consumption.total_purchase_cost || 0;
            }

            // Insert balance if there are any transactions
            if (productPurchases.length > 0 || productSales.length > 0 || productConsumption.length > 0) {
              const { error: insertError } = await supabase
                .from('balance_stock')
                .insert({
                  id: uuidv4(),
                  product_id: product.id,
                  qty: qty,
                  taxable_value: taxableValue,
                  igst: igst,
                  cgst: cgst,
                  sgst: sgst,
                  invoice_value: invoiceValue
                });

              if (insertError) throw insertError;
            }
          }
        }
      } catch (error) {
        console.error('Error calculating balance stock:', error);
      }
    }

    return res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error saving inventory data:', error);
    return res.status(500).json({ error: error.message });
  }
} 