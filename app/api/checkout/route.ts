import { NextResponse } from 'next/server';
import { createMollieClient } from '@mollie/api-client';
import { supabase } from '../../../lib/supabase';

const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY || '',
});

export async function POST(request: Request) {
  try {
    const { items, customerEmail, customerName, customerAddress } = await request.json();

    // 1. Bereken het totale bedrag op een veilige manier
    const totalAmount = items.reduce((sum: number, item: any) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + price * quantity;
    }, 0);

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Het totaalbedrag is ongeldig of 0. Voeg producten toe met een geldige prijs.' },
        { status: 400 }
      );
    }

    const formattedAmount = totalAmount.toFixed(2);

    // 2. Sla de bestelling op in de Supabase 'orders' tabel
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          customer_email: customerEmail || 'klant@voorbeeld.nl',
          customer_name: customerName || 'Klant',
          customer_address: customerAddress || 'Teststraat 1, 1234 AB Teststad',
          total_price: parseFloat(formattedAmount),
          status: 'pending',
          items: items,
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error('Fout bij opslaan bestelling in database:', orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

  // 3. Maak de betaling aan bij Mollie
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maaktje.vercel.app';

const payment = await mollieClient.payments.create({
  amount: {
    currency: 'EUR',
    value: formattedAmount, // Let op: moet een string zijn met 2 decimalen, bijv. "12.50"
  },
  description: `Bestelling #${order.id} bij Maaktje`,
  redirectUrl: `${siteUrl}/success`,
  cancelUrl: `${siteUrl}/cart`, // Stuur de klant terug naar de winkelwagen als ze afbreken
  webhookUrl: `${siteUrl}/api/mollie-webhook`,
  metadata: {
    orderId: order.id,
    customerEmail,
  },
});

    // 4. Update de bestelling in Supabase met de Mollie payment ID
    await supabase
      .from('orders')
      .update({ payment_id: payment.id })
      .eq('id', order.id);

    // 5. Stuur de iDEAL betaallink terug
    return NextResponse.json({ checkoutUrl: payment.getCheckoutUrl() });
  } catch (error: any) {
    console.error('Fout bij maken van betaling:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
