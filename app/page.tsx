'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showCart, setShowCart] = useState(false);

  // Klantgegevens state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fout bij ophalen producten:', error.message);
      } else if (data) {
        setProducts(data);
      }
      setLoading(false);
    }

    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsCheckoutLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          customerName: customerName || 'Klant',
          customerEmail: customerEmail || 'klant@voorbeeld.nl',
          customerAddress: customerAddress || 'Onbekend adres',
        }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert('Er ging iets mis bij het starten van de betaling: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Fout bij afrekenen.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Mijn Webshop</h1>
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-sm font-medium text-gray-600 hover:text-blue-600">
              ⚙️ Beheerderspaneel
            </a>
            <button
              onClick={() => setShowCart(!showCart)}
              className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-sm hover:bg-blue-200 transition"
            >
              🛒 Winkelwagen ({totalCartCount})
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-800">
          Onze Producten
        </h2>

        {/* Zijpaneel / Modal voor Winkelwagen */}
        {showCart && (
          <div className="mb-8 p-6 bg-white border rounded-xl shadow-md max-w-xl mx-auto">
            <h3 className="text-xl font-bold mb-4 border-b pb-2">Jouw Winkelwagen</h3>
            {cart.length === 0 ? (
              <p className="text-gray-500">Je winkelwagen is nog leeg.</p>
            ) : (
              <div>
                <div className="mb-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity}x €{item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-bold">€{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}

                  <div className="flex justify-between items-center mt-4 pt-2 text-lg font-bold">
                    <span>Totaal:</span>
                    <span className="text-blue-600">€{totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Formulier voor klantgegevens */}
                <form onSubmit={handleCheckout} className="mt-6 border-t pt-4 flex flex-col gap-3">
                  <h4 className="font-bold text-gray-700">Jouw Gegevens voor Verzending:</h4>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Naam</label>
                    <input
                      type="text"
                      required
                      placeholder="Jan Jansen"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-2 border rounded text-sm bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">E-mailadres</label>
                    <input
                      type="email"
                      required
                      placeholder="jan@voorbeeld.nl"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full p-2 border rounded text-sm bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Adres + Huisnummer</label>
                    <input
                      type="text"
                      required
                      placeholder="Kerkstraat 12, 1011 AB Amsterdam"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full p-2 border rounded text-sm bg-white text-gray-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCheckoutLoading}
                    className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition disabled:bg-gray-400"
                  >
                    {isCheckoutLoading ? 'Bezig met laden...' : 'Afrekenen met iDEAL'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Producten Grid */}
        {loading ? (
          <p className="text-center text-gray-500 py-12">Producten laden uit de database...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Er staan nog geen producten in de winkel.</p>
            <a href="/admin" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">
              Voeg je eerste product toe via het Beheerderspaneel
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
                <div className="h-48 bg-gray-100 overflow-hidden relative">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Geen afbeelding
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{product.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description || 'Geen beschrijving beschikbaar.'}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl font-bold text-gray-900">€{product.price.toFixed(2)}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Voorraad: {product.stock}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition"
                    >
                      In winkelwagen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}