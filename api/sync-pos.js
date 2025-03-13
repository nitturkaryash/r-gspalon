import { supabase } from './_supabase.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { posOrders } = req.body;

    if (!posOrders || !Array.isArray(posOrders)) {
      return res.status(400).json({ error: 'POS orders data is required as an array' });
    }

    const results = {
      processed: 0,
      skipped: 0,
      errors: []
    };

    // Process each POS order
    for (const order of posOrders) {
      try {
        // Skip if already processed
        const { data: existingSales, error: checkError } = await supabase
          .from('sales')
          .select('id')
          .eq('pos_order_id', order.id);

        if (checkError) throw checkError;

        if (existingSales && existingSales.length > 0) {
          results.skipped++;
          continue;
        }

        // Process each service in the order
        for (const service of order.services || []) {
          // Skip if no product is associated
          if (!service.productId) continue;

          // Get product details
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', service.productId)
            .single();

          if (productError) throw productError;

          if (!product) {
            results.errors.push(`Product not found for service: ${service.name}`);
            continue;
          }

          // Calculate purchase cost
          // First, get the latest purchase for this product
          const { data: latestPurchase, error: purchaseError } = await supabase
            .from('purchases')
            .select('*')
            .eq('product_id', product.id)
            .order('date', { ascending: false })
            .limit(1)
            .single();

          if (purchaseError && purchaseError.code !== 'PGRST116') {
            // PGRST116 is "Results contain 0 rows" - not an error in this context
            throw purchaseError;
          }

          // If no purchase found, use default values
          let purchaseCostPerUnitExGst = 0;
          let purchaseGstPercentage = 0;
          let purchaseTaxableValue = 0;
          let purchaseIgst = 0;
          let purchaseCgst = 0;
          let purchaseSgst = 0;
          let totalPurchaseCost = 0;

          if (latestPurchase) {
            purchaseCostPerUnitExGst = latestPurchase.ex_gst / latestPurchase.qty;
            purchaseGstPercentage = latestPurchase.igst / latestPurchase.taxable_value;
            purchaseTaxableValue = purchaseCostPerUnitExGst * service.quantity;
            purchaseIgst = purchaseTaxableValue * purchaseGstPercentage;
            purchaseCgst = purchaseIgst / 2;
            purchaseSgst = purchaseIgst / 2;
            totalPurchaseCost = purchaseTaxableValue + purchaseIgst;
          }

          // Calculate sales values
          const salesExGst = service.price / (1 + (service.gstPercentage || 0));
          const salesTaxableValue = salesExGst * service.quantity;
          const salesGstPercentage = service.gstPercentage || 0;
          const salesIgst = salesTaxableValue * salesGstPercentage;
          const salesCgst = salesIgst / 2;
          const salesSgst = salesIgst / 2;
          const invoiceValue = salesTaxableValue + salesIgst;

          // Insert sales record
          const { error: insertError } = await supabase
            .from('sales')
            .insert({
              id: uuidv4(),
              product_id: product.id,
              date: new Date(order.createdAt).toISOString().split('T')[0],
              invoice_no: order.id,
              qty: service.quantity,
              incl_gst: service.price,
              ex_gst: salesExGst,
              taxable_value: salesTaxableValue,
              igst: salesIgst,
              cgst: salesCgst,
              sgst: salesSgst,
              invoice_value: invoiceValue,
              customer: order.customerName || '',
              payment_method: order.paymentMethod || 'cash',
              transaction_type: 'sale',
              converted_to_consumption: false,
              purchase_cost_per_unit_ex_gst: purchaseCostPerUnitExGst,
              purchase_gst_percentage: purchaseGstPercentage,
              purchase_taxable_value: purchaseTaxableValue,
              purchase_igst: purchaseIgst,
              purchase_cgst: purchaseCgst,
              purchase_sgst: purchaseSgst,
              total_purchase_cost: totalPurchaseCost,
              discount_percentage: 0,
              discounted_sales_rate_ex_gst: salesExGst,
              sales_gst_percentage: salesGstPercentage,
              pos_order_id: order.id,
              pos_service_id: service.id
            });

          if (insertError) throw insertError;

          // Update balance stock
          const { data: balanceStock, error: balanceError } = await supabase
            .from('balance_stock')
            .select('*')
            .eq('product_id', product.id)
            .single();

          if (balanceError && balanceError.code !== 'PGRST116') {
            throw balanceError;
          }

          if (balanceStock) {
            // Update existing balance
            const { error: updateError } = await supabase
              .from('balance_stock')
              .update({
                qty: balanceStock.qty - service.quantity,
                taxable_value: balanceStock.taxable_value - purchaseTaxableValue,
                igst: balanceStock.igst - purchaseIgst,
                cgst: balanceStock.cgst - purchaseCgst,
                sgst: balanceStock.sgst - purchaseSgst,
                invoice_value: balanceStock.invoice_value - totalPurchaseCost
              })
              .eq('id', balanceStock.id);

            if (updateError) throw updateError;
          } else {
            // Create new balance record with negative values
            const { error: insertBalanceError } = await supabase
              .from('balance_stock')
              .insert({
                id: uuidv4(),
                product_id: product.id,
                qty: -service.quantity,
                taxable_value: -purchaseTaxableValue,
                igst: -purchaseIgst,
                cgst: -purchaseCgst,
                sgst: -purchaseSgst,
                invoice_value: -totalPurchaseCost
              });

            if (insertBalanceError) throw insertBalanceError;
          }
        }

        results.processed++;
      } catch (error) {
        console.error('Error processing POS order:', error);
        results.errors.push(`Error processing order ${order.id}: ${error.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error syncing POS data:', error);
    return res.status(500).json({ error: error.message });
  }
} 