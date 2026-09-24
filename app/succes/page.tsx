'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function SuccessPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function markOrderPaid() {
      // Haal het order_id op uit de URL
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('order_id');

      if (orderId) {
        // Update status naar 'paid'
        await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', orderId);
      }
      setLoading(false);
    }

    markOrderPaid();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white border rounded-xl p-8 max-w-md w-full text-center shadow-sm">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Bedankt voor je bestelling!</h1>
        <p className="text-gray-600 mb-6">
          {loading
            ? 'Je bestelling wordt verwerkt...'
            : 'De betaling is succesvol ontvangen en geregistreerd. We gaan direct voor je aan de slag!'}
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition"
        >
          Terug naar de winkel
        </Link>
      </div>
    </div>
  );
}