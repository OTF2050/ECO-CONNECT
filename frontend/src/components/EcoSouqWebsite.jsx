import React, { useState, useEffect, useContext } from 'react';
import { API_BASE } from '../config';
import { AuthContext } from '../context/AuthContext';

const MARKET_CATEGORIES = [
  { id: 'all', icon: '🛒', label: 'All Listings' },
  { id: 'produce', icon: '🌴', label: 'Fresh Produce' },
  { id: 'handicraft', icon: '🧶', label: 'Handicrafts' },
  { id: 'seeds', icon: '🌱', label: 'Seeds & Soil' },
  { id: 'tools', icon: '🔧', label: 'Farm Tools' },
  { id: 'tech', icon: '🔌', label: 'Tech & Energy' },
];

const productMeta = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('honey')) return { icon: '🍯', category: 'produce' };
  if (t.includes('date')) return { icon: '🌴', category: 'produce' };
  if (t.includes('olive') || t.includes('oil')) return { icon: '🫒', category: 'produce' };
  if (t.includes('egg')) return { icon: '🥚', category: 'produce' };
  if (t.includes('milk') || t.includes('soap')) return { icon: '🧼', category: 'handicraft' };
  if (t.includes('rug') || t.includes('sadu') || t.includes('wool')) return { icon: '🧶', category: 'handicraft' };
  if (t.includes('seed') || t.includes('palm')) return { icon: '🌱', category: 'seeds' };
  if (t.includes('compost') || t.includes('fertilizer') || t.includes('soil')) return { icon: '🌾', category: 'seeds' };
  if (t.includes('laptop') || t.includes('thinkpad')) return { icon: '🖥️', category: 'tech' };
  if (t.includes('solar') || t.includes('power') || t.includes('panel') || t.includes('battery')) return { icon: '🔋', category: 'tech' };
  if (t.includes('net') || t.includes('greenhouse')) return { icon: '🥅', category: 'tools' };
  if (t.includes('pump') || t.includes('hydrometer') || t.includes('irrigation') || t.includes('controller')) return { icon: '🔧', category: 'tools' };
  return { icon: '📦', category: 'all' };
};

export default function EcoSouqWebsite() {
  const { user, name, logout, ecoCredits, refreshCredits } = useContext(AuthContext);

  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  // Catalog load states
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  // Multi-step Checkout States
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Cart/Info, 2: Payment, 3: Processing, 4: Receipt
  const [email, setEmail] = useState('');
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingRegion, setShippingRegion] = useState('Hatta (Dubai)');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'credits'
  const [processingProgress, setProcessingProgress] = useState(0);
  const [receiptDetails, setReceiptDetails] = useState(null);

  const [checkoutMsg, setCheckoutMsg] = useState('');
  const [checkoutErr, setCheckoutErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [traceItem, setTraceItem] = useState(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setShippingName(name || '');
    }
  }, [user, name]);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    setCatalogLoading(true);
    setCatalogError('');
    try {
      const res = await fetch(`${API_BASE}/api/inventory`);
      if (!res.ok) throw new Error('Catalog service is unavailable right now.');
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load Eco Souq inventory catalog:', err);
      setCatalogError(err.message || 'Could not reach the marketplace. Please check your connection and retry.');
    } finally {
      setCatalogLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.description.toLowerCase().includes(search.toLowerCase());
    
    if (categoryFilter === 'all') return matchesSearch;
    
    const meta = productMeta(item.title);
    return matchesSearch && meta.category === categoryFilter;
  });

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      if (existing.quantity >= item.stock) return;
      setCart(prev => prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart(prev => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(c => {
      if (c.id === id) {
        const nq = c.quantity + delta;
        if (nq <= 0) return c;
        if (nq > c.stock) return c;
        return { ...c, quantity: nq };
      }
      return c;
    }));
  };

  const cartTotal = cart.reduce((acc, c) => acc + (c.price * c.quantity), 0);

  const handleInfoSubmit = (e) => {
    e.preventDefault();
    setCheckoutErr('');
    if (!email.trim() || !shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim()) {
      setCheckoutErr('Please fill out all contact and delivery details.');
      return;
    }
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailValid) {
      setCheckoutErr('Please enter a valid email address.');
      return;
    }
    setCheckoutStep(2);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setCheckoutErr('');

    if (paymentMethod === 'credits') {
      if (!user) {
        setCheckoutErr('Please sign in to your Eco Connect account to pay with Eco-Credits!');
        return;
      }
      const requiredCredits = Math.round(cartTotal);
      if (ecoCredits < requiredCredits) {
        setCheckoutErr(`Insufficient Eco-Credits. You have ${ecoCredits} credits, but this order requires ${requiredCredits} credits.`);
        return;
      }
    } else {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length !== 16 || !/^\d+$/.test(cleanCard)) {
        setCheckoutErr('Please enter a valid 16-digit credit card number.');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        setCheckoutErr('Please enter expiry date in MM/YY format.');
        return;
      }
      if (cardCvv.length !== 3 || !/^\d+$/.test(cardCvv)) {
        setCheckoutErr('Please enter a valid 3-digit CVV code.');
        return;
      }
      if (!cardName.trim()) {
        setCheckoutErr('Please enter the cardholder name.');
        return;
      }
    }

    setCheckoutStep(3);
    setProcessingProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setProcessingProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        
        const invNo = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
        const co2Val = (cartTotal * 0.15).toFixed(2);
        const dateStr = new Date().toLocaleString('en-AE', { dateStyle: 'medium', timeStyle: 'short' });

        setReceiptDetails({
          invoiceNo: invNo,
          date: dateStr,
          customerName: shippingName,
          email: email,
          phone: shippingPhone,
          address: shippingAddress,
          region: shippingRegion,
          paymentType: paymentMethod === 'credits' ? 'Eco-Credits 🪙' : 'Visa / MasterCard 💳',
          items: [...cart],
          total: cartTotal,
          co2Saved: co2Val,
        });

        setCart([]);
        setCheckoutStep(4);
      }
    }, 200);
  };

  const handlePrintReceipt = () => {
    if (!receiptDetails) return;
    import('../utils/reportExport').then(({ exportReportPdf }) => {
      exportReportPdf({
        title: `Eco Souq Invoice - ${receiptDetails.invoiceNo}`,
        subtitle: 'Ministry of Climate Change & Environment',
        kpis: [
          { label: 'Invoice Reference', value: receiptDetails.invoiceNo },
          { label: 'Amount Paid', value: `${receiptDetails.total} AED` },
          { label: 'CO2 Saved', value: `${receiptDetails.co2Saved} kg` }
        ],
        sections: [
          {
            heading: 'Customer & Delivery Info',
            rows: [
              ['Recipient Name', receiptDetails.customerName],
              ['Email Address', receiptDetails.email],
              ['Contact Number', receiptDetails.phone],
              ['Delivery Region', receiptDetails.region],
              ['Detailed Address', receiptDetails.address],
              ['Transaction Date', receiptDetails.date],
              ['Payment Method', receiptDetails.paymentType]
            ]
          },
          {
            heading: 'Items Purchased',
            rows: receiptDetails.items.map(item => [
              `${item.title} (Qty: ${item.quantity})`,
              `${item.price * item.quantity} AED`
            ])
          }
        ],
        footer: 'Direct Farmer Support Certified · UAE Green Economy Initiative'
      });
    });
  };

  const resetCheckout = () => {
    setCheckoutStep(1);
    setReceiptDetails(null);
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* Glow effects */}
      <div className="pointer-events-none fixed top-0 left-1/4 h-96 w-96 rounded-full bg-emerald-600/10 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-10 right-10 h-80 w-80 rounded-full bg-teal-500/10 blur-[100px]" />

      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏬</span>
          <div>
            <h1 className="text-lg font-black tracking-wider text-emerald-400">ECO SOUQ</h1>
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">HATTA LOCAL FARM DIRECT MARKETPLACE</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-250 rounded-xl px-3 py-1.5 shadow-sm text-left">
              <div>
                <span className="text-[10px] font-bold text-zinc-800 block leading-tight">
                  {name || 'User'}
                </span>
                <span className="text-[8px] uppercase tracking-wider text-emerald-700 font-mono">
                  {user.role === 'farmer' ? '🌾 Vendor' : '👤 Buyer'} {ecoCredits > 0 ? ` · 🪙 ${ecoCredits} Cr` : ''}
                </span>
              </div>
              <button 
                onClick={logout}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer border-l border-zinc-200 pl-2 ml-1"
              >
                Sign Out 🚪
              </button>
            </div>
          ) : (
            <a href="#/souq/login" className="text-xs font-bold text-[#0f7a54] hover:text-[#0b5c3e] border border-emerald-600/30 hover:border-emerald-600 rounded-xl px-3 py-1.5 bg-emerald-50/50 transition-colors">
              Sign In 🔑
            </a>
          )}
          <button 
            onClick={() => setShowCart(true)}
            className="relative bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            🛒 Cart ({cart.reduce((sum, c) => sum + c.quantity, 0)})
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero section */}
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <div className="rounded-3xl border border-zinc-900 bg-gradient-to-br from-[#10231b]/80 via-[#15171e]/90 to-[#1a1410]/80 p-8 text-center md:text-left md:flex justify-between items-center gap-8 relative overflow-hidden">
          <div className="space-y-3 z-10 relative">
            <span className="bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
              100% UAE Local Heritage Goods
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-zinc-50 leading-tight">Fresh Produce & Rural Goods Direct From Hatta Farms</h2>
            <p className="text-xs md:text-sm text-zinc-400 max-w-lg leading-relaxed">
              Support local smallholder farmers directly. Verify the blockchain-based crop provenance, carbon savings, and digital quality stamp for every purchase.
            </p>
          </div>
          <div className="text-7xl hidden md:block select-none opacity-80 filter drop-shadow-2xl">
            🌴🍯🍊
          </div>
        </div>

        {/* Filters and search */}
        <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {MARKET_CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategoryFilter(c.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  categoryFilter === c.id 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-950' 
                    : 'bg-transparent text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900/40'
                }`}
              >
                <span>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
          
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search produce, handicrafts, tools..."
            className="bg-zinc-950 border border-zinc-850 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl px-4 py-2 text-xs text-zinc-200 outline-none w-full md:max-w-xs transition-all"
          />
        </div>

        {/* Product listing grid */}
        {catalogLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-36 bg-zinc-100" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-zinc-100 rounded w-3/4" />
                  <div className="h-2.5 bg-zinc-100 rounded w-full" />
                  <div className="h-2.5 bg-zinc-100 rounded w-2/3" />
                  <div className="h-8 bg-zinc-100/80 rounded-xl mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : catalogError ? (
          <div className="border border-dashed border-rose-500/30 bg-rose-500/5 rounded-3xl p-16 text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <p className="text-sm text-rose-300 font-semibold">{catalogError}</p>
            <button
              onClick={fetchCatalog}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all"
            >
              🔄 Retry Loading Catalog
            </button>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="border border-dashed border-zinc-900 rounded-3xl p-16 text-center text-zinc-500 text-sm space-y-3">
            <div className="text-4xl">📭</div>
            <p>No items matched your criteria.</p>
            {(search || categoryFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setCategoryFilter('all'); }}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs transition-all"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredInventory.map(item => {
              const meta = productMeta(item.title);
              const outOfStock = item.stock <= 0;
              const hasOrganicCert = item.title.toLowerCase().includes('organic') || item.description.toLowerCase().includes('organic');

              return (
                <div key={item.id} className="group bg-white border border-zinc-200 hover:border-emerald-500/40 rounded-2xl overflow-hidden flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="h-36 bg-emerald-50/10 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-40 group-hover:scale-105 transition-all duration-300" />
                    <span className="text-5xl filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300 z-10 select-none">
                      {meta.icon}
                    </span>
                    
                    {hasOrganicCert && (
                      <span className="absolute top-3 left-3 bg-emerald-100 border border-emerald-300/40 text-[#0f7a54] text-[8px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full z-10">
                        ☘ Organic
                      </span>
                    )}

                    <span className="absolute top-3 right-3 text-[10px] text-zinc-500 font-mono bg-zinc-100 px-2 py-0.5 rounded-full">
                      Qty: {item.stock}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-850 group-hover:text-emerald-700 transition-colors leading-tight">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 leading-normal font-light line-clamp-2">
                        {item.description}
                      </p>
                      <p className="text-[10px] text-zinc-405">
                        Seller: <span className="font-semibold text-zinc-600">{item.owner_name || 'Hatta Local Farmer'}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 mt-auto">
                      <span className="font-mono font-black text-[#0f7a54] text-sm">
                        {item.price === 0 ? 'FREE' : `${item.price} AED`}
                      </span>
                      
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => setTraceItem(item)}
                          className="bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 px-2 py-2 rounded-xl text-[10px] font-bold border border-zinc-200 transition-all cursor-pointer"
                          title="Provenance Details"
                        >
                          🔬 Trace
                        </button>
                        <button
                          onClick={() => addToCart(item)}
                          disabled={outOfStock}
                          className="bg-[#0f7a54] hover:bg-[#0b5c3e] text-white font-bold px-3 py-2 rounded-xl text-[10px] transition-all disabled:opacity-40 cursor-pointer"
                        >
                          {outOfStock ? 'Sold Out' : 'Buy 🛒'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Provenance Traceability Modal */}
      {traceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
            <h3 className="text-md font-black text-[#4ade80] flex items-center gap-2 mb-3">
              <span>🔬</span> Digital Crop Provenance
            </h3>
            <button 
              onClick={() => setTraceItem(null)} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 font-bold"
            >
              ✕
            </button>
            <div className="space-y-3.5 border-t border-zinc-800 pt-3 text-xs">
              <div>
                <span className="text-zinc-500 block uppercase font-bold text-[9px]">Item Name</span>
                <span className="font-bold text-zinc-250">{traceItem.title}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-zinc-500 block uppercase font-bold text-[9px]">Farmer Name</span>
                  <span className="text-zinc-300">{traceItem.owner_name || 'Hatta Local Farmer'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block uppercase font-bold text-[9px]">Origin Location</span>
                  <span className="text-zinc-300">Hatta Farm Plots, UAE</span>
                </div>
                <div>
                  <span className="text-zinc-500 block uppercase font-bold text-[9px]">Eco credits value</span>
                  <span className="text-[#4ade80] font-bold">{Math.round(traceItem.price * 0.1)} credits</span>
                </div>
                <div>
                  <span className="text-zinc-500 block uppercase font-bold text-[9px]">Blockchain Status</span>
                  <span className="text-blue-400 font-bold">✓ Encrypted Ledger</span>
                </div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col items-center gap-2">
                <span className="text-[10px] text-zinc-500">QR Authentication Tag</span>
                <div className="w-32 h-32 bg-white flex items-center justify-center rounded-lg border p-1 shadow-md">
                  {/* Mock barcode details */}
                  <div className="w-full h-full border border-dashed border-zinc-300 flex flex-col items-center justify-center p-2 text-center text-zinc-800">
                    <span className="text-xs font-bold font-mono tracking-widest text-black">ECO-HATTA-{traceItem.id}</span>
                    <span className="text-[9px] text-zinc-500 mt-1">Direct Wholesale Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shopping Cart Drawer overlay */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 border-l border-zinc-200 h-full p-6 flex flex-col justify-between shadow-2xl">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <h3 className="text-md font-bold text-zinc-800 flex items-center gap-2">
                {checkoutStep === 1 && <>🛒 Shopping Cart &amp; Delivery</>}
                {checkoutStep === 2 && <>💳 Secure Payment Options</>}
                {checkoutStep === 3 && <>🔒 Processing Transaction</>}
                {checkoutStep === 4 && <>🧾 Order Invoice Receipt</>}
              </h3>
              {checkoutStep !== 3 && (
                <button 
                  onClick={() => { setShowCart(false); resetCheckout(); setCheckoutErr(''); }} 
                  className="text-zinc-500 hover:text-zinc-700 text-sm font-bold cursor-pointer"
                >
                  ✕ Close
                </button>
              )}
            </div>

            {/* Error Message */}
            {checkoutErr && (
              <div className="mt-4 bg-rose-50 border border-rose-250 text-rose-700 rounded-xl p-3.5 text-xs font-semibold leading-relaxed animate-pulse">
                ⚠️ {checkoutErr}
              </div>
            )}

            {/* Step 1: Cart Items & Delivery Information */}
            {checkoutStep === 1 && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden mt-4">
                {cart.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500">
                    <div className="text-5xl mb-3">🛒</div>
                    <p className="text-sm font-semibold">Your shopping cart is empty</p>
                    <p className="text-xs text-zinc-500 mt-1">Browse and add fresh local items to support Hatta farmers.</p>
                  </div>
                ) : (
                  <>
                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 max-h-[35%] border-b border-zinc-100 pb-4">
                      {cart.map(c => (
                        <div key={c.id} className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex justify-between gap-3 relative">
                          <div className="flex-1 space-y-1 text-left">
                            <h4 className="text-xs font-bold text-zinc-800 leading-tight">{c.title}</h4>
                            <span className="text-[10px] text-zinc-500 block">Stock limit: {c.stock}</span>
                            <div className="flex items-center gap-2 pt-1">
                              <button 
                                onClick={() => updateQuantity(c.id, -1)}
                                className="w-5 h-5 bg-white rounded border border-zinc-200 flex items-center justify-center text-xs hover:bg-zinc-100 font-bold"
                              >
                                -
                              </button>
                              <span className="text-xs font-mono font-bold text-zinc-700 px-1">{c.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(c.id, 1)}
                                className="w-5 h-5 bg-white rounded border border-zinc-200 flex items-center justify-center text-xs hover:bg-zinc-100 font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-right flex flex-col justify-between items-end">
                            <button 
                              onClick={() => removeFromCart(c.id)}
                              className="text-rose-600 hover:text-rose-700 text-[10px] font-bold cursor-pointer"
                            >
                              Remove
                            </button>
                            <span className="font-mono text-xs font-black text-emerald-700 mt-2">
                              {(c.price * c.quantity)} AED
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Form */}
                    <form onSubmit={handleInfoSubmit} className="flex-1 overflow-y-auto space-y-3 pt-4 pr-1 text-left">
                      <h4 className="text-xs font-bold text-zinc-750 uppercase tracking-wider mb-2">Delivery Details</h4>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-zinc-500">Recipient Name *</label>
                          <input
                            type="text"
                            required
                            value={shippingName}
                            onChange={(e) => setShippingName(e.target.value)}
                            placeholder="Salem Al Hattawi"
                            className="w-full bg-zinc-50 border border-zinc-250 rounded-xl p-2.5 text-xs text-zinc-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-zinc-500">Phone Number *</label>
                          <input
                            type="tel"
                            required
                            value={shippingPhone}
                            onChange={(e) => setShippingPhone(e.target.value)}
                            placeholder="+971 50 123 4567"
                            className="w-full bg-zinc-50 border border-zinc-250 rounded-xl p-2.5 text-xs text-zinc-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-zinc-500">Email Address *</label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="buyer@hatta.ae"
                            className="w-full bg-zinc-50 border border-zinc-250 rounded-xl p-2.5 text-xs text-zinc-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-zinc-500">Delivery Region *</label>
                          <select
                            value={shippingRegion}
                            onChange={(e) => setShippingRegion(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-250 rounded-xl p-2.5 text-xs text-zinc-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                          >
                            <option value="Hatta (Dubai)">Hatta (Dubai)</option>
                            <option value="Liwa Oasis">Liwa Oasis</option>
                            <option value="Al Qua'a">Al Qua'a</option>
                            <option value="Al Ain">Al Ain</option>
                            <option value="Fujairah">Fujairah</option>
                            <option value="Dubai City">Dubai City</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold text-zinc-500">Detailed Street Address *</label>
                        <input
                          type="text"
                          required
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="Plot 12, near Hatta Honey Farm, Safa Road"
                          className="w-full bg-zinc-50 border border-zinc-250 rounded-xl p-2.5 text-xs text-zinc-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                        />
                      </div>

                      {/* Info Summary Footer */}
                      <div className="border-t border-zinc-100 pt-4 mt-2 flex justify-between items-center">
                        <div className="text-left">
                          <span className="text-[10px] text-zinc-500 block uppercase font-bold">Total Price</span>
                          <span className="font-mono text-[#0f7a54] text-lg font-black">{cartTotal} AED</span>
                        </div>
                        <button
                          type="submit"
                          className="bg-[#0f7a54] hover:bg-[#0b5c3e] text-white font-bold py-3 px-6 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                        >
                          Proceed to Payment 💳
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Secure Payment Formulation */}
            {checkoutStep === 2 && (
              <div className="flex-1 flex flex-col justify-between mt-4 text-left">
                <div className="space-y-4 flex-1">
                  <button 
                    onClick={() => setCheckoutStep(1)}
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-700 flex items-center gap-1 cursor-pointer mb-2"
                  >
                    ← Back to Cart &amp; Delivery
                  </button>

                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-left">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Order Summary</span>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-zinc-850 font-bold">{cart.length} items for delivery to {shippingRegion}</span>
                      <span className="font-mono font-black text-emerald-700 text-md">{cartTotal} AED</span>
                    </div>
                  </div>

                  {/* Payment Method Tabs */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${paymentMethod === 'card' ? 'bg-[#0f7a54] text-white border-[#0f7a54] shadow-sm' : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'}`}
                      >
                        💳 Credit / Debit Card
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!user) {
                            setCheckoutErr('Please sign in to your Eco Connect account to pay with Green Eco-Credits!');
                          } else {
                            setCheckoutErr('');
                            setPaymentMethod('credits');
                          }
                        }}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${paymentMethod === 'credits' ? 'bg-[#0f7a54] text-white border-[#0f7a54] shadow-sm' : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'} ${!user ? 'opacity-55' : ''}`}
                      >
                        🪙 Green Eco-Credits
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'card' ? (
                    /* Credit Card Form fields */
                    <form onSubmit={handlePaymentSubmit} className="space-y-3.5">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold text-zinc-500">Name on Card *</label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="e.g. Salem Al Ketbi"
                          className="w-full bg-zinc-50 border border-zinc-250 rounded-xl p-2.5 text-xs text-zinc-800 outline-none focus:border-emerald-500 focus:bg-white"
                        />
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold text-zinc-500">Card Number *</label>
                        <input
                          type="text"
                          required
                          maxLength="19"
                          value={cardNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            const matches = val.match(/\d{4,16}/g);
                            const match = (matches && matches[0]) || '';
                            const parts = [];
                            for (let i = 0, len = match.length; i < len; i += 4) {
                              parts.push(match.substring(i, i + 4));
                            }
                            if (parts.length > 0) {
                              setCardNumber(parts.join(' '));
                            } else {
                              setCardNumber(val);
                            }
                          }}
                          placeholder="4000 1234 5678 9010"
                          className="w-full bg-zinc-50 border border-zinc-250 rounded-xl p-2.5 text-xs text-[#16241f] font-mono outline-none focus:border-emerald-500 focus:bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-zinc-500">Expiry Date *</label>
                          <input
                            type="text"
                            required
                            maxLength="5"
                            value={cardExpiry}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.length > 2) {
                                val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                              }
                              setCardExpiry(val);
                            }}
                            placeholder="MM/YY"
                            className="w-full bg-zinc-50 border border-zinc-250 rounded-xl p-2.5 text-xs text-[#16241f] font-mono outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-zinc-500">CVV *</label>
                          <input
                            type="password"
                            required
                            maxLength="3"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            placeholder="123"
                            className="w-full bg-zinc-50 border border-zinc-250 rounded-xl p-2.5 text-xs text-[#16241f] font-mono outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#0f7a54] hover:bg-[#0b5c3e] text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all mt-4 cursor-pointer"
                      >
                        🔒 Simulate Payment &amp; Order
                      </button>
                    </form>
                  ) : (
                    /* Eco Credits payment details */
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-550 font-medium">Your Green Credit Balance:</span>
                          <span className="font-bold text-[#0f7a54] font-mono text-sm">🪙 {ecoCredits} credits</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-emerald-100/50 pt-2">
                          <span className="text-zinc-550 font-medium">Cost of Order (1 AED = 1 Credit):</span>
                          <span className="font-bold text-emerald-700 font-mono text-sm">🪙 {Math.round(cartTotal)} credits</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                      >
                        🪙 Deduct Credits &amp; Fulfill Order
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Transaction Processing Simulation */}
            {checkoutStep === 3 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-spin" />
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-zinc-800">Securing Transaction Gateway</h4>
                  <p className="text-xs text-zinc-500 font-light max-w-xs leading-normal">
                    {processingProgress < 30 && "Initiating secure card handshake..."}
                    {processingProgress >= 30 && processingProgress < 75 && "Encrypting blockchain crop provenance tag..."}
                    {processingProgress >= 75 && "Registering Hatta local shipping invoice..."}
                  </p>
                </div>
                <div className="w-full max-w-xs">
                  <div className="flex justify-between text-[10px] text-zinc-400 font-bold mb-1.5 font-mono">
                    <span>PROGRESS</span>
                    <span>{processingProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300" style={{ width: `${processingProgress}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Digital printable receipt display */}
            {checkoutStep === 4 && receiptDetails && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden mt-4 text-left">
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  
                  {/* Success banner */}
                  <div className="text-center space-y-2 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <span className="text-4xl">✅</span>
                    <h4 className="text-sm font-black text-emerald-800 uppercase tracking-wide">Order Placed Successfully!</h4>
                    <p className="text-[10px] text-zinc-500">Hatta Farm Logistics is routing delivery responders</p>
                  </div>

                  {/* Receipt Paper */}
                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3 font-sans relative">
                    {/* Visual notches */}
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-900 border-r border-zinc-200" />
                    <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-900 border-l border-zinc-200" />

                    <div className="flex justify-between items-start border-b border-zinc-100 pb-3">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold">Invoice Ref</span>
                        <h5 className="text-xs font-mono font-bold text-zinc-800 leading-tight">{receiptDetails.invoiceNo}</h5>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold">Transaction Date</span>
                        <p className="text-[10px] text-zinc-600 font-mono leading-tight">{receiptDetails.date}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs border-b border-zinc-100 pb-3 font-light text-zinc-650">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block">Deliver To</span>
                        <span className="font-semibold text-zinc-800">{receiptDetails.customerName}</span>
                        <span className="block text-[10px]">{receiptDetails.phone}</span>
                        <span className="block text-[10px]">{receiptDetails.region}</span>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block">Billing Summary</span>
                        <span className="block text-[10px]">Email: {receiptDetails.email}</span>
                        <span className="block text-[10px]">Method: {receiptDetails.paymentType}</span>
                        <span className="block text-[10px] truncate">Address: {receiptDetails.address}</span>
                      </div>
                    </div>

                    {/* Simple Invoice Items table */}
                    <div className="space-y-1.5 py-1 text-xs">
                      <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block">Line Items</span>
                      {receiptDetails.items.map(item => (
                        <div key={item.id} className="flex justify-between text-zinc-650 font-mono text-[10px]">
                          <span>{item.title} (x{item.quantity})</span>
                          <span className="text-zinc-800">{(item.price * item.quantity)} AED</span>
                        </div>
                      ))}
                    </div>

                    {/* Offset & Grand Total summary */}
                    <div className="border-t border-zinc-100 pt-3 flex justify-between items-center">
                      <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[8.5px] font-black text-emerald-800 uppercase tracking-widest">
                        🌱 Saved {receiptDetails.co2Saved} kg CO2
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-450 font-bold block">Paid Total</span>
                        <span className="font-mono text-emerald-700 text-sm font-black">{receiptDetails.total} AED</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Receipt Actions Footer */}
                <div className="border-t border-zinc-200 pt-4 mt-2 flex gap-2.5">
                  <button
                    onClick={handlePrintReceipt}
                    className="flex-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 font-bold py-2.5 rounded-xl text-xs uppercase cursor-pointer"
                  >
                    Print Invoice 🖨️
                  </button>
                  <button
                    onClick={() => { setShowCart(false); resetCheckout(); }}
                    className="flex-1 bg-[#0f7a54] hover:bg-[#0b5c3e] text-white font-bold py-2.5 rounded-xl text-xs uppercase cursor-pointer"
                  >
                    Continue Shopping 🛍️
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
