import { NextResponse } from 'next/server';
import { createMollieClient } from '@mollie/api-client';
import { supabase } from '../../../lib/supabase';

const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY || '',
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const paymentId = formData.get('id') as string;

    if (!paymentId) {
      return NextResponse.json({ error: 'Geen payment ID' }, { status: 400 });
    }

    const payment = await mollieClient.payments.get(paymentId);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_id', paymentId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Bestelling niet gevonden' }, { status: 404 });
    }

    if (payment.isPaid() && order.status !== 'paid') {
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', order.id);

      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.id)
            .single();

          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity);
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.id);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
