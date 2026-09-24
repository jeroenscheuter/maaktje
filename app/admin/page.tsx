'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface OrderItem {
  id?: string;
  title: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  customer_email: string;
  customer_name?: string;
  customer_address?: string;
  total_price: number;
  status: string;
  items: OrderItem[];
}

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Product state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState('10');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Bestellingen ophalen
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fout bij ophalen bestellingen:', error.message);
    } else if (data) {
      setOrders(data as Order[]);
    }
    setOrdersLoading(false);
  }, []);

  // Automatisch bestellingen ophalen zodra ingelogd
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  // Inloggen verifiëren
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: inputPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
      } else {
        setLoginError('🔑 Onjuist wachtwoord, probeer opnieuw.');
      }
    } catch (err) {
      setLoginError('Fout bij communicatie met de server.');
    }
  };

  // Product toevoegen
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);

    if (isNaN(parsedPrice) || isNaN(parsedStock)) {
      setMessage('⚠️ Voer een geldige prijs en voorraad in.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('products').insert([
      {
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        image_url: imageUrl.trim(),
        stock: parsedStock,
      },
    ]);

    setLoading(false);

    if (error) {
      setMessage(`Fout bij toevoegen: ${error.message}`);
    } else {
      setMessage('✅ Product succesvol toegevoegd aan de database!');
      setTitle('');
      setDescription('');
      setPrice('');
      setImageUrl('');
      setStock('10');
    }
  };

  // 1. Inlogscherm wanneer niet ingelogd
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-xl border shadow-md max-w-md w-full">
          <div className="text-center mb-6">
            <span className="text-4xl" role="img" aria-label="slot">🔒</span>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">Beheerders Login</h1>
            <p className="text-sm text-gray-500">Voer het wachtwoord in om door te gaan</p>
          </div>

          {loginError && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Wachtwoord
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2 border rounded text-gray-900 bg-white"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition"
            >
              Inloggen
            </button>
          </form>

          <div className="text-center mt-6">
            <a href="/" className="text-sm text-blue-600 hover:underline">
              ← Terug naar de webshop
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. Beheerdersdashboard
  return (
    <div className="max-w-4xl mx-auto p-8 font-sans">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Beheerderspaneel</h1>
          <span className="text-xs text-green-600 font-semibold">🔒 Beveiligde sessie</span>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-sm bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded font-medium border border-red-200"
          >
            Uitloggen
          </button>
          <a href="/" className="text-blue-600 hover:underline font-medium text-sm">
            ← Terug naar webshop
          </a>
        </div>
      </div>

      {/* Product Toevoegen */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">Nieuw Product Toevoegen</h2>

        {message && (
          <div
            className={`p-4 mb-6 rounded text-white ${
              message.startsWith('✅') ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleAddProduct} className="flex flex-col gap-4 border p-6 rounded-lg shadow-sm bg-white">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Productnaam</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bijv. T-shirt Blauw"
              className="w-full p-2 border rounded text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Omschrijving</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Korte omschrijving..."
              rows={3}
              className="w-full p-2 border rounded text-gray-900 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Prijs (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="29.95"
                className="w-full p-2 border rounded text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Voorraad</label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full p-2 border rounded text-gray-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Afbeelding URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full p-2 border rounded text-gray-900 bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition mt-2 disabled:bg-gray-400"
          >
            {loading ? 'Bezig met opslaan...' : 'Product Opslaan'}
          </button>
        </form>
      </section>

      {/* Bestellingen Overzicht */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-700">Binnengekomen Bestellingen</h2>
          <button
            onClick={fetchOrders}
            disabled={ordersLoading}
            className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-gray-700 font-medium disabled:opacity-50"
          >
            {ordersLoading ? '⏳ Laden...' : '🔄 Verversen'}
          </button>
        </div>

        {ordersLoading ? (
          <p className="text-gray-500">Bestellingen laden...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-500 bg-white p-6 border rounded-lg">Er zijn nog geen bestellingen geplaatst.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border rounded-lg p-5 shadow-sm">
                <div className="flex justify-between items-start mb-3 border-b pb-3">
                  <div>
                    <span className="font-mono text-xs text-gray-400 block mb-1">ID: {order.id}</span>
                    <p className="text-base font-bold text-gray-900">
                      👤 {order.customer_name || 'Geen naam opgegeven'}
                    </p>
                    <p className="text-sm text-gray-600">✉️ {order.customer_email}</p>
                    <p className="text-sm text-gray-600">📍 {order.customer_address || 'Geen adres opgegeven'}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-bold rounded ${
                        order.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.status === 'paid' ? '✅ Betaald' : '⏳ In afwachting'}
                    </span>
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      €{Number(order.total_price || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Gekochte Artikelen:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <li key={item.id || idx}>
                          • {item.quantity}x {item.title} (€{Number(item.price || 0).toFixed(2)} per stuk)
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-400 italic">Geen artikelen aanwezig in deze bestelling</li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
