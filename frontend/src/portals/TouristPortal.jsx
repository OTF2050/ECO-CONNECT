import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import EcoCopilotChat from '../components/EcoCopilotChat';
import { API_BASE } from '../config';
import GovFooter from '../components/GovFooter';
import FeedbackWidget from '../components/FeedbackWidget';
import ProgressTimeline from '../components/ProgressTimeline';
import EcoCreditsPanel from '../components/EcoCreditsPanel';
import { exportReportPdf } from '../utils/reportExport';

const experienceMeta = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('honey') || t.includes('extraction')) return { image: '/images/experiences/honey.png', icon: '🍯', duration: '2 Hours', guide: 'Salem Al Hattawi' };
  if (t.includes('date') || t.includes('harvest')) return { image: '/images/experiences/harvesting.png', icon: '🌴', duration: '2 Hours', guide: 'Anwar Hossain' };
  if (t.includes('hike') || t.includes('forest')) return { image: '/images/experiences/hiking.png', icon: '🥾', duration: '1.5 Hours', guide: 'Saeed Al Ketbi' };
  if (t.includes('star') || t.includes('sky')) return { image: '/images/experiences/stargazing.png', icon: '🌌', duration: '2 Hours', guide: 'Fatima Al-Dhaheri' };
  return { image: '/images/experiences/hiking.png', icon: '⛺', duration: '2 Hours', guide: 'Local Guide' };
};

export default function TouristPortal() {
  const { token, name, logout, ecoCredits, refreshCredits } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [lastPurchase, setLastPurchase] = useState(null);
  const [qrModalItem, setQrModalItem] = useState(null);
  
  // Existing API States
  const [inventory, setInventory] = useState([]);
  const [tours, setTours] = useState([]);
  const [selectedTour, setSelectedTour] = useState('');
  const [visitorCount, setVisitorCount] = useState(2);
  const [tourSuccessMsg, setTourSuccessMsg] = useState('');
  const [bookingRef, setBookingRef] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [donateTitle, setDonateTitle] = useState('');
  const [donateDesc, setDonateDesc] = useState('');
  const [donateStock, setDonateStock] = useState(1);
  const [inventoryMsg, setInventoryMsg] = useState('');

  // ========================
  // SHOPPING CART STATE & METHODS
  // ========================
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutTripId, setCheckoutTripId] = useState('');
  const [trips, setTrips] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccessMsg, setCheckoutSuccessMsg] = useState('');
  const [acquiringId, setAcquiringId] = useState(null);

  const fetchTrips = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/logistics/trips`);
      if (res.ok) {
        const data = await res.json();
        setTrips(data.filter(t => t.status === 'open'));
      }
    } catch (err) {
      console.error('Error fetching logistics trips:', err);
    }
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) return prev;
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setInventoryMsg(`Added "${item.title}" to cart.`);
    setTimeout(() => setInventoryMsg(''), 3000);
  };

  const updateCartQty = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === itemId) {
            const nextQty = i.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > i.stock) return i;
            return { ...i, quantity: nextQty };
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => {
    setCart([]);
    setCheckoutTripId('');
    setCheckoutSuccessMsg('');
  };

  const handleCartCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    setInventoryMsg('');
    setCheckoutSuccessMsg('');
    let successCount = 0;
    let errors = [];

    for (const cartItem of cart) {
      for (let q = 0; q < cartItem.quantity; q++) {
        try {
          const res = await fetch(`${API_BASE}/api/transactions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              item_id: cartItem.id,
              amount: cartItem.price
            })
          });
          if (res.ok) {
            successCount++;
          } else {
            const data = await res.json();
            errors.push(data.detail || `Failed for ${cartItem.title}`);
          }
        } catch (err) {
          errors.push(`Network error for ${cartItem.title}`);
        }
      }
    }

    if (checkoutTripId && successCount > 0) {
      try {
        const totalWeight = cart.reduce((sum, item) => sum + (item.quantity * 2.0), 0);
        const produceList = cart.map(i => `${i.quantity}x ${i.title}`).join(', ');
        await fetch(`${API_BASE}/api/logistics/trips/${checkoutTripId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            produce: `Order Delivery: ${produceList}`,
            weight_kg: totalWeight
          })
        });
      } catch (err) {
        console.error('Failed to link logistics carpool:', err);
      }
    }

    setIsCheckingOut(false);
    if (successCount > 0) {
      const ref = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
      setLastPurchase({
        ref,
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        tripId: checkoutTripId,
        date: new Date().toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' })
      });
      setCheckoutSuccessMsg(`Order processed! ${successCount} item(s) purchased successfully.`);
      if (typeof refreshCredits === 'function') {
        refreshCredits();
      }
      setEcoPoints(prev => prev + (successCount * 25));
      setCart([]);
      fetchInventory();
    } else if (errors.length > 0) {
      setInventoryMsg(`Checkout failed: ${errors[0]}`);
    }
  };

  const productMeta = (title = '') => {
    const t = title.toLowerCase();
    if (t.includes('honey')) return { icon: '🍯', category: 'produce', image: '/images/honey.png' };
    if (t.includes('date')) return { icon: '🌴', category: 'produce', image: '/images/dates.png' };
    if (t.includes('olive') || t.includes('oil')) return { icon: '🫒', category: 'produce' };
    if (t.includes('egg')) return { icon: '🥚', category: 'produce' };
    if (t.includes('milk') || t.includes('soap')) return { icon: '🧼', category: 'handicraft' };
    if (t.includes('rug') || t.includes('sadu') || t.includes('wool')) return { icon: '🧶', category: 'handicraft', image: '/images/sadu.png' };
    if (t.includes('seed') || t.includes('palm')) return { icon: '🌱', category: 'seeds', image: '/images/seedlings.png' };
    if (t.includes('compost') || t.includes('fertilizer') || t.includes('soil')) return { icon: '🌾', category: 'seeds' };
    if (t.includes('laptop') || t.includes('thinkpad')) return { icon: '🖥️', category: 'tech' };
    if (t.includes('solar') || t.includes('power') || t.includes('panel') || t.includes('battery')) return { icon: '🔋', category: 'tech' };
    if (t.includes('net') || t.includes('greenhouse')) return { icon: '🥅', category: 'tools' };
    if (t.includes('pump') || t.includes('hydrometer') || t.includes('irrigation') || t.includes('controller')) return { icon: '🔧', category: 'tools' };
    return { icon: '📦', category: 'all' };
  };

  // Shared Challenge States
  const [startups, setStartups] = useState(() => {
    const saved = localStorage.getItem('eco_startups');
    return saved ? JSON.parse(saved) : [];
  });
  const [sosFeed, setSosFeed] = useState(() => {
    const saved = localStorage.getItem('eco_sos_feed');
    return saved ? JSON.parse(saved) : [];
  });
  const [opportunities, setOpportunities] = useState(() => {
    const saved = localStorage.getItem('eco_opportunities');
    return saved ? JSON.parse(saved) : [];
  });
  const [surveys, setSurveys] = useState(() => {
    const saved = localStorage.getItem('eco_surveys');
    return saved ? JSON.parse(saved) : { honey: 14, dates: 28, rugs: 9, tours: 17 };
  });

  // Local interaction states
  const [surveyQ1, setSurveyQ1] = useState('honey');
  const [surveyQ2, setSurveyQ2] = useState('100-200 AED');
  const [surveySuccessMsg, setSurveySuccessMsg] = useState('');
  const [sosType, setSosType] = useState('Stuck in Sand');
  const [sosDescription, setSosDescription] = useState('');
  const [sosSuccess, setSosSuccess] = useState('');
  const [isSendingSos, setIsSendingSos] = useState(false);
  const [fundSuccess, setFundSuccess] = useState('');

  // Computer Vision & Speech States
  const [uploadingImage, setUploadingImage] = useState(false);
  const [diagnosedData, setDiagnosedData] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  // New Complex Tourist Features States
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [itineraryPlan, setItineraryPlan] = useState(null);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [ecoPoints, setEcoPoints] = useState(65);
  const [virtualTreeLevel, setVirtualTreeLevel] = useState(0); // 0: seed, 1: sprout, 2: sapling, 3: mature tree
  const [plantingMsg, setPlantingMsg] = useState('');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      triggerCvDiagnosis(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const triggerCvDiagnosis = async (base64Str) => {
    setUploadingImage(true);
    setDiagnosedData(null);
    try {
      const res = await fetch(`${API_BASE}/api/computer-vision/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base_64: base64Str })
      });
      if (res.ok) {
        const data = await res.json();
        setDiagnosedData(data);
        
        // Map category to Tourist Portal SOS options
        const categoryMapping = {
          water: "Stuck in Sand",
          accident: "Offroad Breakdown",
          medical: "Medical Alert",
          other: "Stuck in Sand"
        };
        setSosType(categoryMapping[data.category] || "Stuck in Sand");
        setSosDescription(`[AI Auto-Diagnosis: ${data.issue_detected}] ${data.diagnosis} Recommended: ${data.recommended_action}`);
      }
    } catch (err) {
      console.error("CV Diagnosis failed:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleMicClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'ar-AE';
      rec.onstart = () => setIsTranscribing(true);
      rec.onresult = async (e) => {
        const text = e.results[0][0].transcript;
        setSosDescription((prev) => prev ? prev + ' ' + text : text);
        try {
          await fetch(`${API_BASE}/api/speech/transcribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio_base64: 'raw-mic-tourist', text_fallback: text })
          });
        } catch (err) {
          console.error(err);
        }
      };
      rec.onerror = () => setIsTranscribing(false);
      rec.onend = () => setIsTranscribing(false);
      rec.start();
    } else {
      setIsTranscribing(true);
      setTimeout(async () => {
        setIsTranscribing(false);
        const sampleArabicDistress = "سيارتي عالقة في الكثبان الرملية خلف القطاع 4، بحاجة لجرار سحب";
        setSosDescription((prev) => prev ? prev + ' ' + sampleArabicDistress : sampleArabicDistress);
        try {
          await fetch(`${API_BASE}/api/speech/transcribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio_base64: 'raw-simulated-mic-tourist', text_fallback: sampleArabicDistress })
          });
        } catch (err) {
          console.error(err);
        }
      }, 2000);
    }
  };

  // Navigation Items
  const NAV_ITEMS = [
    { id: 'marketplace', icon: '🏬', label: 'Eco Souq' },
    { id: 'eco-tourism', icon: '✈️', label: 'Guided Tours' },
    { id: 'my-trip', icon: '🧳', label: 'My Trip' },
    { id: 'eco-launch', icon: '🚀', label: 'Back Startups' },
    { id: 'eco-credits', icon: '🪙', label: 'Eco Credits' },
    { id: 'eco-shield', icon: '🚨', label: 'SOS Shield' },
    { id: 'eco-insights', icon: '📊', label: 'Intent Survey' },
    { id: 'eco-events', icon: '📅', label: 'Heritage Hub' }
  ];

  const fetchTours = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ecotours`);
      if (res.ok) {
        const data = await res.json();
        setTours(data);
        if (data.length > 0) {
          setSelectedTour(data[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Error fetching tours:', err);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/inventory`);
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchTours();
    fetchTrips();
    
    // Periodically sync localStorage items
    const interval = setInterval(() => {
      const savedStartups = localStorage.getItem('eco_startups');
      if (savedStartups) setStartups(JSON.parse(savedStartups));
      
      const savedSos = localStorage.getItem('eco_sos_feed');
      if (savedSos) setSosFeed(JSON.parse(savedSos));
      
      const savedOpps = localStorage.getItem('eco_opportunities');
      if (savedOpps) setOpportunities(JSON.parse(savedOpps));

      const savedSurveys = localStorage.getItem('eco_surveys');
      if (savedSurveys) setSurveys(JSON.parse(savedSurveys));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleBookTour = async (e) => {
    e.preventDefault();
    const tour = tours.find(t => t.id.toString() === selectedTour.toString());
    if (!tour) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tour_id: tour.id,
          slots: visitorCount,
          booking_date: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBookingRef(data.reference || 'ECO-' + Date.now());
        setShowFeedback(false);
        setTourSuccessMsg(`Booking confirmed! Reference: ${data.reference}. Total cost: ${data.total_price} AED.`);
      } else {
        const errData = await res.json();
        setTourSuccessMsg(`Booking failed: ${errData.detail || 'Check slots and try again.'}`);
      }
    } catch (err) {
      setTourSuccessMsg('Failed to contact booking server.');
    }
  };

  const handlePostDonation = async (e) => {
    e.preventDefault();
    if (!donateTitle || !donateDesc) return;
    setInventoryMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: donateTitle,
          description: donateDesc,
          type: 'donate',
          price: 0.0,
          stock: donateStock
        })
      });

      if (res.ok) {
        setInventoryMsg('Donation posted successfully to circular marketplace!');
        setDonateTitle('');
        setDonateDesc('');
        fetchInventory();
      } else {
        setInventoryMsg('Failed to post donation.');
      }
    } catch (err) {
      setInventoryMsg('Network error posting donation.');
    }
  };

  const handleAcquireItem = async (itemId, type, price) => {
    setInventoryMsg('');
    setAcquiringId(itemId);
    try {
      const res = await fetch(`${API_BASE}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          item_id: itemId,
          amount: price
        })
      });
      if (res.ok) {
        setInventoryMsg(type === 'sell' ? 'Purchase completed successfully! Direct payout routed to local grower.' : 'Donation claimed successfully!');
        setEcoPoints(prev => prev + 25);
        fetchInventory();
      } else {
        const errData = await res.json();
        setInventoryMsg(errData.detail || 'Transaction failed.');
      }
    } catch (err) {
      setInventoryMsg('Network error compiling transaction.');
    } finally {
      setAcquiringId(null);
    }
  };

  const handleFundStartup = (startupId, amount) => {
    const updated = startups.map(s => {
      if (s.id === startupId) {
        return { ...s, funding: (s.funding || 0) + amount };
      }
      return s;
    });
    setStartups(updated);
    localStorage.setItem('eco_startups', JSON.stringify(updated));
    setFundSuccess(`Pre-order voucher purchased! ${amount} AED has been seed funded to the founder.`);
    setTimeout(() => setFundSuccess(''), 3000);
  };

  const handlePostSos = (e) => {
    e.preventDefault();
    if (!sosDescription) return;
    setIsSendingSos(true);
    setSosSuccess('');

    let lat = 24.1102;
    let lng = 55.4418;
    let region = "Al-Qaw'ah Desert Sector (Live GPS)";

    const performPublish = (latitude, longitude, area) => {
      const newSos = {
        id: Date.now(),
        sender: name || "Tourist Visitor",
        type: sosType,
        description: sosDescription,
        lat: parseFloat(latitude.toFixed(4)),
        lng: parseFloat(longitude.toFixed(4)),
        time: "Just now",
        responders: [],
        region: area,
        status: "Pending"
      };
      const updated = [newSos, ...sosFeed];
      setSosFeed(updated);
      localStorage.setItem('eco_sos_feed', JSON.stringify(updated));
      setSosSuccess("🚨 Distress signal broadcasted! Admin control center and Al-Qaw'ah responders have been pinged.");
      setSosDescription('');
      setImagePreview('');
      setDiagnosedData(null);
      setIsSendingSos(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          performPublish(position.coords.latitude, position.coords.longitude, "Al-Qaw'ah Desert (Live GPS)");
        },
        () => {
          performPublish(lat, lng, region);
        }
      );
    } else {
      performPublish(lat, lng, region);
    }
  };

  const handleSurveySubmit = (e) => {
    e.preventDefault();
    const current = { ...surveys };
    current[surveyQ1] = (current[surveyQ1] || 0) + 1;
    setSurveys(current);
    localStorage.setItem('eco_surveys', JSON.stringify(current));
    setSurveySuccessMsg("📊 Purchase intent recorded! Local entrepreneurs and Gov planners will see your feedback instantly.");
    setTimeout(() => setSurveySuccessMsg(''), 4000);
  };

  const handleToggleActivity = (id) => {
    setSelectedActivities(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const generateItinerary = () => {
    if (selectedActivities.length === 0) return;
    setItineraryLoading(true);
    setItineraryPlan(null);
    
    setTimeout(() => {
      const items = [];
      const activityData = {
        honey: { time: "09:00 – 11:00", title: "Sidr Honey Apiary Tour", desc: "Meet bee-keeper Salem, taste raw honey directly from hives, and learn local ecological pollinator steps.", guide: "Salem Al Hattawi", location: "Hatta Apiary Block A" },
        sadu: { time: "11:30 – 13:00", title: "Heritage Sadu Weaving Workshop", desc: "Hand-weave wool coasters with master weaver Fatima and understand Bedouin geometric design traditions.", guide: "Fatima Al-Dhaheri", location: "Community Craft Center" },
        hike: { time: "14:00 – 16:00", title: "Eco Forest Ecological Hike", desc: "Walk through protected Hatta Eco woodland, identify native desert flora, and observe conservation initiatives.", guide: "Saeed Al Ketbi", location: "Eco Nature Sanctuary" },
        farm: { time: "16:30 – 18:00", title: "Date Harvesting & Irrigation", desc: "Participate in date harvesting, check solar-powered water sensors, and learn historic Aflaj canal systems.", guide: "Anwar Hossain", location: "Al Wathba Heritage Farm" },
        stars: { time: "19:00 – 21:00", title: "Desert Stargazing & Bedouin Camp", desc: "Observe desert constellations under clear skies, share campfire coffee, and listen to traditional oral history.", guide: "Salem Al Hattawi", location: "Dunes Camp Sector 4" }
      };

      selectedActivities.forEach((actId) => {
        if (activityData[actId]) {
          items.push(activityData[actId]);
        }
      });

      items.sort((a, b) => a.time.localeCompare(b.time));

      setItineraryPlan({
        title: "Your Hatta Eco-Adventure Itinerary",
        duration: `${items.length * 2} Hours`,
        stopsCount: items.length,
        items
      });
      setItineraryLoading(false);
    }, 1200);
  };

  const renderMarketplace = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Donate */}
          <div className="lg:col-span-1 bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg h-fit">
            <h3 className="text-md font-bold text-teal-400 mb-2 flex items-center gap-2">
              <span>📦</span> Donate Refurbished Tools
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-light">
              Donate environmental sensors, laptops, or agricultural gear to support remote UAE schools and farms.
            </p>

            <form onSubmit={handlePostDonation} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Equipment Name</label>
                <input
                  type="text"
                  value={donateTitle}
                  onChange={(e) => setDonateTitle(e.target.value)}
                  placeholder="e.g. Refurbished Soil Ph Hydrometer"
                  className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-750 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-350 outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Details / Specifications</label>
                <textarea
                  value={donateDesc}
                  onChange={(e) => setDonateDesc(e.target.value)}
                  rows="3"
                  placeholder="Describe working condition, specs, or drop-off point..."
                  className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-750 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-350 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-555 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
              >
                Publish Donation Item 📡
              </button>
            </form>
          </div>

          {/* Right Column: Shop list */}
          <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2">
                <span>🏬</span> Eco Souq - Direct Farm Marketplace
              </h3>
              <button onClick={fetchInventory} className="text-[10px] uppercase font-bold text-emerald-400 hover:text-emerald-355 cursor-pointer">Reload Catalog 🔄</button>
            </div>

            {inventoryMsg && (
              <div className="mb-6 bg-zinc-950 border border-zinc-850 text-emerald-400 text-xs p-3 rounded-xl">
                {inventoryMsg}
              </div>
            )}

            {inventory.length === 0 ? (
              <div className="border border-dashed border-zinc-850 rounded-xl p-12 text-center text-zinc-500 text-xs">
                No items currently listed in circular exchange.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {inventory.map((item) => {
                  const isMine = item.owner_name && item.owner_name === name;
                  const outOfStock = item.stock <= 0;
                  const meta = productMeta(item.title);
                  const gradientMap = {
                    produce: 'from-emerald-500/20 to-teal-600/20 text-emerald-400',
                    handicraft: 'from-amber-500/20 to-orange-600/20 text-amber-400',
                    seeds: 'from-lime-500/20 to-emerald-600/20 text-lime-400',
                    tools: 'from-blue-500/20 to-indigo-600/20 text-blue-400',
                    tech: 'from-cyan-500/20 to-blue-600/20 text-cyan-400',
                    all: 'from-zinc-700/20 to-zinc-800/20 text-zinc-400'
                  };
                  const gradClass = gradientMap[meta.category] || gradientMap.all;

                  return (
                    <div key={item.id} className="group bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300 transform relative">
                      {/* Card cover background banner */}
                      <div className="h-24 w-full relative overflow-hidden flex items-center justify-center">
                        {meta.image ? (
                          <img src={meta.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className={`absolute inset-0 bg-gradient-to-br ${gradClass}`} />
                        )}
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
                        
                        {/* Floating 3D emoji with drop shadow */}
                        <span className="text-4xl filter drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)] group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 z-10 select-none">
                          {meta.icon}
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-3 gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider truncate ${
                              item.type === 'sell' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {item.type === 'sell' ? 'Local Produce' : 'Corporate Support'}
                            </span>
                            <span className="text-[10px] text-zinc-550 font-mono">Stock: {item.stock}</span>
                          </div>
                          <h4 className="text-sm font-semibold text-zinc-200 mb-2">{item.title}</h4>
                          <p className="text-xs text-zinc-455 leading-relaxed font-light mb-4">{item.description}</p>
                          <p className="text-[10px] text-zinc-500 mb-4">Seller: <span className="text-zinc-400 font-semibold">{item.owner_name || 'EcoConnect'}</span></p>
                        </div>

                        <div className="flex flex-wrap gap-3 justify-between items-center pt-4 border-t border-zinc-905 mt-auto">
                          <span className="font-mono text-emerald-400 font-bold text-md">
                            {item.price === 0 ? 'FREE' : `${item.price} AED`}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setQrModalItem(item)}
                              className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
                              title="Show Traceability QR Code"
                            >
                              📷 QR
                            </button>
                            {item.type === 'donate' ? (
                              <button
                                onClick={() => handleAcquireItem(item.id, item.type, item.price)}
                                disabled={outOfStock || acquiringId === item.id}
                                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-emerald-400 px-3 py-2.5 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-30 cursor-pointer"
                              >
                                {acquiringId === item.id ? 'Claiming…' : 'Claim Item 📦'}
                              </button>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                disabled={outOfStock || isMine}
                                className="bg-emerald-600 hover:bg-emerald-555 text-white px-3 py-2.5 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-35 cursor-pointer animate-fadeIn"
                              >
                                {isMine ? 'Your Item' : 'Add to Cart 🛒'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Eco Carbon Points & Virtual Tree Planter */}
        <div className="bg-zinc-900/30 border border-emerald-900/40 p-6 rounded-2xl backdrop-blur-xl shadow-lg mt-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
            <div>
              <h3 className="text-md font-bold text-[#4ade80] flex items-center gap-2">
                <span>🌱</span> Eco Carbon Offset Points & Tree Planter
              </h3>
              <p className="text-xs text-zinc-455 mt-0.5">Collect points by buying local products or booking eco-tours, and redeem them to plant trees in Hatta.</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-850 px-4 py-2 rounded-xl text-center">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block">My Carbon Points</span>
              <span className="text-md font-black text-emerald-455">{ecoPoints} PTS</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Visual Tree Plot */}
            <div className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-5 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-550 block mb-3">My Eco Plot</span>
              <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-4xl shadow-inner relative">
                {virtualTreeLevel === 0 && '🕳️'}
                {virtualTreeLevel === 1 && <span className="animate-bounce">🌱</span>}
                {virtualTreeLevel === 2 && '🌿'}
                {virtualTreeLevel === 3 && <span className="text-5xl">🌳</span>}
                
                {virtualTreeLevel > 0 && (
                  <span className="absolute bottom-0 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                    Stage {virtualTreeLevel}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-zinc-200 mt-4">
                {virtualTreeLevel === 0 && 'Plot Prepared (Empty)'}
                {virtualTreeLevel === 1 && 'Eco Sprout'}
                {virtualTreeLevel === 2 && 'Young Sapling'}
                {virtualTreeLevel === 3 && 'Mature Eco Canopy!'}
              </p>
              <p className="text-[9.5px] text-zinc-500 mt-1 leading-normal font-light">
                {virtualTreeLevel === 0 && 'Redeem 50 points to plant your first seed.'}
                {virtualTreeLevel === 1 && 'Carbon offset: 5 kg CO₂ / year.'}
                {virtualTreeLevel === 2 && 'Carbon offset: 12 kg CO₂ / year.'}
                {virtualTreeLevel === 3 && 'Carbon offset: 25 kg CO₂ / year. Fully Crowned!'}
              </p>
            </div>

            {/* Redeem Controls */}
            <div className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-2">Redeem Points</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-light mb-4">
                  Each virtual growth stage requires 50 points. Leveling up supports genuine planting operations in the Eastern UAE region.
                </p>
              </div>

              {plantingMsg && (
                <div className="mb-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 text-[10px] p-2 rounded-lg text-center animate-fadeIn">
                  {plantingMsg}
                </div>
              )}

              <button
                onClick={() => {
                  if (ecoPoints < 50) {
                    setPlantingMsg('⚠️ Insufficient Carbon Points! Try buying local goods.');
                    setTimeout(() => setPlantingMsg(''), 3000);
                  } else if (virtualTreeLevel >= 3) {
                    setPlantingMsg('🎉 Your Eco tree is already fully mature! 🌳');
                    setTimeout(() => setPlantingMsg(''), 3000);
                  } else {
                    setEcoPoints(prev => prev - 50);
                    setVirtualTreeLevel(prev => prev + 1);
                    setPlantingMsg('🌱 Seedling grew! Growth stage unlocked.');
                    setTimeout(() => setPlantingMsg(''), 3000);
                  }
                }}
                disabled={virtualTreeLevel >= 3}
                className="w-full bg-emerald-600 hover:bg-emerald-550 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
              >
                {virtualTreeLevel >= 3 ? 'Max Growth Level Reached 🌳' : 'Redeem 50 PTS to Plant/Grow 🌿'}
              </button>
            </div>

            {/* Ledger Activities */}
            <div className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-zinc-550 block mb-2">How to earn points?</span>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">🛒 <span>Marketplace Purchase</span></span>
                  <span className="text-emerald-455 font-bold font-mono">+25 PTS</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">🎟️ <span>Book Eco-Tourism Guide</span></span>
                  <span className="text-emerald-455 font-bold font-mono">+40 PTS</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">📝 <span>Submit Survey Intent</span></span>
                  <span className="text-emerald-455 font-bold font-mono">+10 PTS</span>
                </div>
              </div>

              <div className="mt-4 bg-[#15171e] p-2 rounded-lg text-center border border-zinc-850">
                <p className="text-[9px] text-zinc-500 font-light">Part of Dubai DET sustainable tourism initiatives.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Cart Button */}
        {cart.length > 0 && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-emerald-500 to-teal-650 hover:from-emerald-600 hover:to-teal-700 text-white font-bold p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group animate-fadeIn"
          >
            <div className="relative">
              <span className="text-2xl">🛒</span>
              <span className="absolute -top-3 -right-3 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce border-2 border-[#15171e]">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
          </button>
        )}

        {/* Sliding Cart Drawer Backdrop */}
        {isCartOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
            onClick={() => setIsCartOpen(false)}
          />
        )}

        {/* Sliding Cart Drawer */}
        <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#15171e]/95 border-l border-zinc-800/80 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Header */}
          <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <h3 className="text-lg font-bold text-zinc-100">Your Shopping Cart</h3>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-zinc-500 hover:text-zinc-355 text-sm font-bold border border-zinc-800 hover:border-zinc-700 rounded-lg px-2.5 py-1 transition-all cursor-pointer"
            >
              Close ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {checkoutSuccessMsg && lastPurchase ? (
              /* Success Invoice Receipt */
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl mx-auto text-emerald-400 animate-pulse">
                  ✓
                </div>
                <div>
                  <h4 className="text-lg font-black text-emerald-400">Transaction Successful!</h4>
                  <p className="text-xs text-zinc-400 mt-1">Thank you for supporting sustainable circular trade.</p>
                </div>

                {/* Invoice details */}
                <div className="bg-zinc-950/85 border border-zinc-850 p-5 rounded-2xl text-left font-mono space-y-4">
                  <div className="border-b border-dashed border-zinc-800 pb-3 text-center">
                    <span className="text-xs uppercase font-bold tracking-wider text-zinc-500 block">EcoConnect Circular Invoice</span>
                    <span className="text-[9px] text-zinc-650 block mt-0.5">REF: {lastPurchase.ref}</span>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Customer:</span>
                      <span className="text-zinc-200 font-bold">{name}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Date:</span>
                      <span className="text-zinc-200">{lastPurchase.date}</span>
                    </div>
                    {lastPurchase.tripId && (
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>Shipping via:</span>
                        <span>Carpool (Consolidated)</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-b border-dashed border-zinc-800 py-3 space-y-1">
                    {lastPurchase.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-zinc-300">
                        <span>{item.quantity}x {item.title}</span>
                        <span>{(item.price * item.quantity).toFixed(2)} AED</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-sm font-black text-emerald-400">
                    <span>TOTAL AMOUNT PAID:</span>
                    <span>{lastPurchase.total.toFixed(2)} AED</span>
                  </div>

                  {/* QR Code Verification */}
                  <div className="border-t border-dashed border-zinc-800 pt-4 text-center space-y-2">
                    <span className="text-[10px] text-zinc-400 block font-sans">SCAN TO VERIFY RECEIPT</span>
                    <div className="bg-white p-2 rounded-xl inline-block">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(lastPurchase.ref + ':' + name + ':' + lastPurchase.total)}`}
                        alt="Receipt QR"
                        className="w-[110px] h-[110px]"
                      />
                    </div>
                  </div>

                  {lastPurchase.tripId && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl text-[10px] leading-relaxed flex items-start gap-2">
                      <span className="text-xs">🌱</span>
                      <div>
                        <span className="font-bold block">Consolidated Delivery Reward Added!</span>
                        <span>You earned an extra <span className="font-bold">+15 Eco-Credits</span> and prevented redundant transit emissions.</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      exportReportPdf({
                        title: 'EcoConnect Trade Receipt',
                        subtitle: 'Ministry of Climate Change & Environment',
                        kpis: [
                          { label: 'Total Amount', value: `${lastPurchase.total.toFixed(2)} AED` },
                          { label: 'Reference Code', value: lastPurchase.ref },
                          { label: 'Purchase Date', value: lastPurchase.date },
                          { label: 'Buyer Name', value: name }
                        ],
                        sections: [
                          {
                            heading: 'Purchased Resources (Circular Trade)',
                            rows: lastPurchase.items.map(i => [`${i.quantity}x ${i.title}`, `${(i.price * i.quantity).toFixed(2)} AED`])
                          },
                          {
                            heading: 'Verification & Logistics',
                            rows: [
                              ['Delivery Mode', lastPurchase.tripId ? 'Consolidated Carpool logistics' : 'Standard courier/pickup'],
                              ['Verification Hash', `BLOCK-${lastPurchase.ref.split('-')[1]}`]
                            ]
                          }
                        ],
                        footer: 'Thank you for supporting UAE agriculture. This receipt serves as official proof of payment.'
                      });
                    }}
                    className="flex-1 bg-zinc-850 hover:bg-zinc-850 border border-zinc-780 hover:border-zinc-700 text-zinc-300 font-bold py-3 rounded-xl text-xs uppercase transition-all cursor-pointer"
                  >
                    Download PDF ⬇️
                  </button>
                  <button
                    onClick={() => {
                      setCheckoutSuccessMsg('');
                      setLastPurchase(null);
                      setIsCartOpen(false);
                    }}
                    className="flex-1 bg-[#1b3d34] hover:bg-emerald-900/60 border border-emerald-500/20 text-[#4ade80] font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Return to Market
                  </button>
                </div>
              </div>
            ) : cart.length === 0 ? (
              /* Empty Cart */
              <div className="text-center py-12 space-y-4">
                <span className="text-5xl block opacity-40 animate-pulse">🛒</span>
                <p className="text-zinc-400 text-xs">Your shopping cart is empty.</p>
                <p className="text-zinc-650 text-[11px] leading-normal font-light">Browse products in the marketplace and click "Add to Cart" to start listing items.</p>
              </div>
            ) : (
              /* Cart List */
              <div className="space-y-6">
                <div className="space-y-3.5">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-zinc-150">{item.title}</h4>
                        <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">{item.price} AED</p>
                        <p className="text-[9px] text-zinc-550 font-light mt-0.5">Seller: {item.owner_name}</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 border border-zinc-800/80 rounded-xl px-2.5 py-1.5 bg-[#15171e]">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="text-zinc-400 hover:text-zinc-200 text-xs font-black px-1.5 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs text-zinc-150 font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          disabled={item.quantity >= item.stock}
                          className="text-zinc-400 hover:text-zinc-200 text-xs font-black px-1.5 disabled:opacity-30 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping Consolidation Options */}
                <div className="border-t border-zinc-850 pt-5 space-y-3.5">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-350 flex items-center gap-1.5">
                      <span>🚛</span> Ship via Active Carpools (Farm-to-Hub)
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                      Consolidate logistics with other farmers heading to the city. Saves transit fuel emissions and earns you additional eco rewards.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-start gap-3 bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-850 rounded-xl p-3.5 cursor-pointer transition-all">
                      <input
                        type="radio"
                        name="logistics"
                        checked={!checkoutTripId}
                        onChange={() => setCheckoutTripId('')}
                        className="mt-0.5 accent-emerald-500"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-zinc-250 block">Standard Courier Delivery</span>
                        <span className="text-[9.5px] text-zinc-555 block leading-normal mt-0.5">Independent shipment. Standard credits.</span>
                      </div>
                    </label>

                    {trips.map((t) => (
                      <label
                        key={t.id}
                        className={`flex items-start gap-3 border rounded-xl p-3.5 cursor-pointer transition-all ${checkoutTripId === t.id ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-zinc-950/60 hover:bg-zinc-950 border-zinc-850'}`}
                      >
                        <input
                          type="radio"
                          name="logistics"
                          checked={checkoutTripId === t.id}
                          onChange={() => setCheckoutTripId(t.id)}
                          className="mt-0.5 accent-emerald-500"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-xs font-bold text-zinc-250">Consolidate with {t.driver_name}</span>
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">+15 CREDITS</span>
                          </div>
                          <span className="text-[9.5px] text-zinc-555 block leading-normal mt-1 flex-wrap">
                            Route: {t.route} · Capacity: {(t.max_weight_kg - t.current_weight_kg).toFixed(1)} kg left
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Summary Subtotal */}
                <div className="border-t border-zinc-850 pt-5 space-y-2">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Subtotal:</span>
                    <span className="text-zinc-200 font-bold">{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} AED</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Eco Carbon Offset:</span>
                    <span className="text-[#4ade80] font-bold">-{cart.reduce((sum, item) => sum + (item.quantity * 0.8), 0).toFixed(1)} kg CO₂</span>
                  </div>
                  {checkoutTripId && (
                    <div className="flex justify-between text-xs text-emerald-400">
                      <span>Logistics Consolidation Reward:</span>
                      <span className="font-bold">+15 Eco-Credits</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-zinc-100 border-t border-zinc-850 pt-2.5">
                    <span>Total:</span>
                    <span>{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} AED</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          {!checkoutSuccessMsg && cart.length > 0 && (
            <div className="p-6 border-t border-zinc-800/80 bg-zinc-950/40">
              <button
                onClick={handleCartCheckout}
                disabled={isCheckingOut}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-lg cursor-pointer"
              >
                {isCheckingOut ? 'Processing Checkout…' : 'Proceed to Checkout 💰'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMyTrip = () => {
    return (
      <div className="max-w-4xl mx-auto w-full space-y-6 text-left animate-fadeIn">
        {/* Header */}
        <div className="bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧳</span>
            <div>
              <h2 className="text-md font-bold text-zinc-100">My Trip &amp; Travel Hub</h2>
              <p className="text-[10px] text-zinc-400 font-mono">YOUR ACTIVE TOUR BOARDING PASSES &amp; INVOICES</p>
            </div>
          </div>
        </div>

        {!bookingRef && !itineraryPlan && !lastPurchase ? (
          <div className="border border-dashed border-zinc-850 rounded-2xl p-12 text-center text-zinc-550 space-y-3">
            <span className="text-5xl block opacity-50">🧭</span>
            <p className="text-sm font-semibold">No active trip itineraries or tickets yet.</p>
            <p className="text-xs font-light max-w-sm mx-auto leading-normal">Book a local guided experience, compile a heritage route, or buy artisanal dates in the shop to see your documents here!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Active Permits & Boarding Pass */}
            <div className="space-y-6">
              {bookingRef ? (
                <div className="bg-gradient-to-br from-[#c2a14e]/10 to-zinc-950 border border-[#c2a14e]/30 rounded-2xl p-6 text-center space-y-4 shadow-xl font-mono text-xs relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-[#c2a14e] to-teal-500" />
                  <div className="flex justify-between items-center text-[10px] text-zinc-400 border-b border-zinc-800 pb-2">
                    <span>MOCCAE RURAL ECO-TOUR TICKET</span>
                    <span className="font-bold text-emerald-455">CONFIRMED</span>
                  </div>
                  
                  <div className="text-left space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Visitor Name:</span>
                      <span className="text-zinc-200 font-bold">{name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Experience:</span>
                      <span className="text-zinc-200 truncate max-w-[200px]">{tours.find(t => t.id.toString() === selectedTour)?.title || 'Hatta Eco Tour'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Booking Reference:</span>
                      <span className="text-[#c2a14e] font-bold">{bookingRef}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Total Guests:</span>
                      <span className="text-zinc-200 font-bold">{visitorCount} Persons</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-zinc-800 pt-4 flex flex-col items-center gap-3">
                    <div className="bg-white p-2 rounded-xl inline-block">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(bookingRef + ':' + name + ':' + visitorCount)}`}
                        alt="Booking QR"
                        className="w-[110px] h-[110px]"
                      />
                    </div>
                    <span className="text-[9px] text-zinc-550 font-sans">SHOW THIS TO YOUR LOCAL GUIDE AT CHECKPOINT</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      exportReportPdf({
                        title: 'Ecotourism Boarding Pass',
                        subtitle: 'Ministry of Climate Change & Environment',
                        kpis: [
                          { label: 'Booking Code', value: bookingRef },
                          { label: 'Visitor Name', value: name },
                          { label: 'Total Guests', value: String(visitorCount) },
                          { label: 'Status', value: 'CONFIRMED' }
                        ],
                        sections: [
                          {
                            heading: 'Tour Itinerary & Details',
                            rows: [
                              ['Experience Name', tours.find(t => t.id.toString() === selectedTour)?.title || 'Hatta Heritage'],
                              ['Location Region', tours.find(t => t.id.toString() === selectedTour)?.region || 'Hatta'],
                              ['Booking Validity', 'Valid for selected reservation day only'],
                              ['Carbon Transit Footprint Offset', `${(visitorCount * 1.8).toFixed(1)} kg CO2 saved via consolidation`]
                            ]
                          }
                        ],
                        footer: 'Proceed directly to the agricultural gateway. Bring your Emirates ID and digital boarding ticket.'
                      });
                    }}
                    className="w-full bg-[#1b3d34] text-[#4ade80] py-3 rounded-xl text-xs uppercase font-sans font-bold hover:brightness-110 cursor-pointer border-0"
                  >
                    Download Boarding Pass (PDF) ⬇️
                  </button>
                </div>
              ) : (
                <div className="border border-zinc-900 bg-zinc-950/40 rounded-2xl p-6 text-center text-zinc-550">
                  <span className="text-2xl block mb-1">🎫</span>
                  <p className="text-xs">No active guided tour ticket.</p>
                </div>
              )}

              {/* Purchase Invoice */}
              {lastPurchase ? (
                <div className="bg-[#111317] border border-zinc-850 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-xs font-bold text-zinc-200">Shop Purchase Receipt</span>
                    <span className="text-[10px] text-emerald-450 font-mono">Paid</span>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Ref Code:</span>
                      <span className="text-zinc-300 font-bold">{lastPurchase.ref}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Total Charged:</span>
                      <span className="text-emerald-400 font-bold">{lastPurchase.total.toFixed(2)} AED</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Date:</span>
                      <span className="text-zinc-300">{lastPurchase.date}</span>
                    </div>
                  </div>

                  <div className="border-t border-zinc-900 pt-3 flex justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(lastPurchase.ref)}`}
                      alt="Receipt QR"
                      className="w-[90px] h-[90px] p-1.5 bg-white rounded-lg"
                    />
                  </div>

                  <button
                    onClick={() => {
                      exportReportPdf({
                        title: 'Circular Market Invoice',
                        subtitle: 'Local Farmer Direct Exchange',
                        kpis: [
                          { label: 'Invoice Ref', value: lastPurchase.ref },
                          { label: 'Grand Total', value: `${lastPurchase.total.toFixed(2)} AED` },
                          { label: 'Buyer Name', value: name },
                          { label: 'Date', value: lastPurchase.date }
                        ],
                        sections: [
                          {
                            heading: 'Billing & Transaction Details',
                            rows: [
                              ['Payment Status', 'PAID / SETTLED'],
                              ['Merchant Authority', 'Hatta Community Exchange Desk'],
                              ['Voucher Applied', 'None / direct points settlement']
                            ]
                          }
                        ]
                      });
                    }}
                    className="w-full bg-zinc-850 hover:bg-zinc-800 text-zinc-200 py-2.5 rounded-xl text-xs uppercase font-sans font-bold cursor-pointer border-0"
                  >
                    Print Invoice (PDF) ⬇️
                  </button>
                </div>
              ) : null}
            </div>

            {/* Right: Compiled Route Itinerary */}
            <div>
              {itineraryPlan ? (
                <div className="bg-[#111317] border border-zinc-855 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <h4 className="text-xs font-bold text-zinc-200">{itineraryPlan.title}</h4>
                    <span className="text-[10px] text-emerald-450 font-mono font-bold">
                      {itineraryPlan.stopsCount} stops · {itineraryPlan.duration}
                    </span>
                  </div>

                  <div className="relative border-l border-emerald-950/40 ml-2 pl-4 space-y-4">
                    {itineraryPlan.items.map((item, idx) => (
                      <div key={idx} className="relative group">
                        <span className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-zinc-950 border border-emerald-500 flex items-center justify-center text-[7.5px] font-bold text-emerald-400">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex justify-between items-center text-xs">
                            <p className="font-semibold text-zinc-300">{item.title}</p>
                            <span className="text-[9px] text-[#c2a14e] font-mono">{item.time}</span>
                          </div>
                          <p className="text-[10.5px] text-zinc-555 font-light mt-0.5 leading-relaxed">{item.desc}</p>
                          <p className="text-[9px] text-zinc-650 mt-1 font-mono">Guide: {item.guide} · Loc: {item.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Node trail map and carbon */}
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-4 mt-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-550 block mb-1">Route Node Trail</span>
                      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[9px] text-[#4ade80] py-2 border-b border-zinc-900 leading-relaxed">
                        <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded">📍 START</span>
                        <span>➔</span>
                        {selectedActivities.map((act, i) => (
                          <React.Fragment key={act}>
                            <span className="bg-emerald-900/30 border border-emerald-500/30 px-2 py-0.5 rounded text-emerald-400">
                              {act === 'honey' ? '🐝 Apiary' : act === 'sadu' ? '🧶 Sadu' : act === 'hike' ? '🥾 Hike' : act === 'farm' ? '🌾 Farm' : '🌌 Stars'}
                            </span>
                            {i < selectedActivities.length - 1 && <span>➔</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-zinc-555">Shared Transit Carbon Saved:</span>
                      <span className="text-emerald-450 font-bold">-{ (selectedActivities.length * 1.5).toFixed(1) } kg CO₂eq</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-zinc-850 rounded-2xl p-8 text-center text-zinc-550">
                  <span className="text-2xl block mb-1">🧭</span>
                  <p className="text-xs">No active itinerary plan loaded.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEcoTourism = () => {
    return (
      <div className="max-w-4xl mx-auto w-full space-y-6 text-left">
        {/* Header */}
        <div className="bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⛺</span>
            <div>
              <h2 className="text-md font-bold text-zinc-100">UAE Heritage &amp; Ecotourism Guides</h2>
              <p className="text-[10px] text-zinc-400 font-mono">100% OF TOUR PROCEEDS DIRECTLY EMPOWER LOCAL FAMILIES</p>
            </div>
          </div>
        </div>

        {/* Live Experience Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tours.map(t => {
            const meta = experienceMeta(t.title);
            return (
              <div key={t.id} className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group hover:border-[#c2a14e]/40 transition-all duration-300">
                <div className="h-40 w-full relative overflow-hidden">
                  <img src={meta.image} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 flex items-center gap-2">
                    <span className="text-xl">{meta.icon}</span>
                    <span className="text-xs font-bold text-zinc-100 tracking-wide uppercase drop-shadow">{t.region}</span>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-bold text-zinc-200">{t.title}</h4>
                    <p className="text-xs text-zinc-550 leading-relaxed font-light">{t.description}</p>
                    <p className="text-[10px] text-[#c2a14e] font-mono">Guide: {meta.guide} · Duration: {meta.duration}</p>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-zinc-900">
                    <span className="text-sm font-black text-emerald-400">{t.price} AED <span className="text-[9px] text-zinc-500 font-light">/ person</span></span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTour(t.id.toString());
                        // Scroll to form or auto focus
                        const f = document.getElementById('booking-form-anchor');
                        if (f) f.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-[#247055] hover:bg-emerald-600 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase cursor-pointer transition-all"
                    >
                      Select &amp; Book
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirmed Boarding Pass Ticket */}
        {bookingRef && (
          <div className="bg-gradient-to-br from-[#c2a14e]/10 to-zinc-950 border border-[#c2a14e]/30 rounded-2xl p-6 text-center space-y-4 shadow-xl font-mono text-xs relative overflow-hidden my-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-[#c2a14e] to-teal-500" />
            <div className="flex justify-between items-center text-[10px] text-zinc-400 border-b border-zinc-800 pb-2">
              <span>MOCCAE RURAL ECO-TOUR BOARDING TICKET</span>
              <span className="font-bold text-emerald-400">ACTIVE PERMIT</span>
            </div>
            
            <div className="text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-550">Passenger / Visitor:</span>
                <span className="text-zinc-200 font-bold">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-550">Tour Experience:</span>
                <span className="text-zinc-200">{tours.find(t => t.id.toString() === selectedTour)?.title || 'Hatta Eco Tour'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-550">Booking Reference:</span>
                <span className="text-[#c2a14e] font-bold font-mono">{bookingRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-550">Slots Reserved:</span>
                <span className="text-zinc-200 font-bold">{visitorCount} Persons</span>
              </div>
            </div>

            <div className="border-t border-dashed border-zinc-800 pt-4 flex flex-col items-center gap-3">
              <div className="bg-white p-2 rounded-xl inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(bookingRef + ':' + name + ':' + visitorCount)}`}
                  alt="Booking QR"
                  className="w-[110px] h-[110px]"
                />
              </div>
              <span className="text-[9px] text-zinc-500 font-sans">SHOW THIS CODE TO YOUR LOCAL GUIDE AT GATEWAY CHECKPOINT</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  exportReportPdf({
                    title: 'Ecotourism Boarding Pass',
                    subtitle: 'Ministry of Climate Change & Environment',
                    kpis: [
                      { label: 'Booking Code', value: bookingRef },
                      { label: 'Visitor Name', value: name },
                      { label: 'Total Guests', value: String(visitorCount) },
                      { label: 'Status', value: 'CONFIRMED' }
                    ],
                    sections: [
                      {
                        heading: 'Tour Itinerary & Details',
                        rows: [
                          ['Experience Name', tours.find(t => t.id.toString() === selectedTour)?.title || 'Hatta Heritage'],
                          ['Location Region', tours.find(t => t.id.toString() === selectedTour)?.region || 'Hatta'],
                          ['Booking Validity', 'Valid for selected reservation day only'],
                          ['Carbon Transit Footprint Offset', `${(visitorCount * 1.8).toFixed(1)} kg CO2 saved via consolidation`]
                        ]
                      }
                    ],
                    footer: 'Proceed directly to the agricultural gateway. Bring your Emirates ID and digital boarding ticket.'
                  });
                }}
                className="w-full bg-[#1b3d34] text-[#4ade80] py-3 rounded-xl text-xs uppercase font-sans font-bold hover:brightness-110 cursor-pointer"
              >
                Download Boarding Pass (PDF) ⬇️
              </button>
            </div>
          </div>
        )}

        {/* Booking Form */}
        <div id="booking-form-anchor" className="bg-[#15171e] border border-zinc-800/80 p-6 rounded-2xl shadow-lg">
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-4">
            Reservation desk
          </h3>
          
          {tourSuccessMsg && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 text-xs p-3 rounded-xl">
              {tourSuccessMsg}
            </div>
          )}

          {bookingRef && !showFeedback && (
            <button
              onClick={() => setShowFeedback(true)}
              className="w-full mb-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-550 text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
            >
              ⭐ Rate Your Booking Experience
            </button>
          )}

          {showFeedback && bookingRef && (
            <div className="mb-4">
              <FeedbackWidget
                referenceId={bookingRef}
                referenceType="booking"
                userName={name}
                onDone={() => setShowFeedback(false)}
              />
            </div>
          )}

          <form onSubmit={handleBookTour} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-550 tracking-wider">Select Experience</label>
                <select
                  value={selectedTour}
                  onChange={(e) => setSelectedTour(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-350 outline-none cursor-pointer"
                >
                  {tours.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.price} AED/person)</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-555 tracking-wider">Number of Visitors</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={visitorCount}
                  onChange={(e) => setVisitorCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-zinc-950 border border-zinc-855 hover:border-zinc-750 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-350 outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-550 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer uppercase"
            >
              Confirm Eco-Booking 🎟️
            </button>
          </form>
        </div>

        {/* Heritage Itinerary Planner */}
        <div className="bg-zinc-900/30 border border-emerald-900/40 p-6 rounded-2xl backdrop-blur-xl shadow-lg">
          <h3 className="text-md font-bold text-emerald-400 mb-2 flex items-center gap-2">
            <span>🧭</span> Hatta Heritage Eco-Itinerary Planner
          </h3>
          <p className="text-xs text-zinc-450 mb-4 font-light">
            Select traditional activities in Hatta, and let the planner compile a custom, eco-friendly chronological timeline.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Activities select list */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-550 block mb-1">Available Experiences</span>
              {[
                { id: 'honey', label: '🐝 Honey Apiary & Tasting Tour', desc: ' Salem Al Hattawi · 2 Hours' },
                { id: 'sadu', label: '🧶 Traditional Sadu Weaving Workshop', desc: ' Fatima Al-Dhaheri · 1.5 Hours' },
                { id: 'hike', label: '🥾 Eco Forest Ecological Hike', desc: ' Saeed Al Ketbi · 2 Hours' },
                { id: 'farm', label: '🌾 Date Harvesting & Aflaj Systems', desc: ' Anwar Hossain · 1.5 Hours' },
                { id: 'stars', label: '🌌 Desert Stargazing & Bedouin Camp', desc: ' Salem Al Hattawi · 2 Hours' }
              ].map(act => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => handleToggleActivity(act.id)}
                  className={`w-full p-3 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                    selectedActivities.includes(act.id)
                      ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400'
                      : 'bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:border-zinc-750 hover:bg-[#151a1d]'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold">{act.label}</p>
                    <p className="text-[9px] text-zinc-500 font-light mt-0.5">{act.desc}</p>
                  </div>
                  <span className="text-xs">{selectedActivities.includes(act.id) ? '✓' : '+'}</span>
                </button>
              ))}

              <button
                onClick={generateItinerary}
                disabled={selectedActivities.length === 0 || itineraryLoading}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-555 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all disabled:opacity-40 cursor-pointer"
              >
                {itineraryLoading ? 'Generating Plan...' : 'Generate Custom Itinerary ✨'}
              </button>
            </div>

            {/* Generated Plan Output */}
            <div className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-4 flex flex-col justify-center">
              {itineraryLoading && (
                <div className="text-center py-10 space-y-3 animate-pulse">
                  <span className="text-3xl block animate-spin">🌀</span>
                  <p className="text-xs text-zinc-500">Compiling guides, routes and timings...</p>
                </div>
              )}

              {!itineraryLoading && !itineraryPlan && (
                <div className="text-center py-12 text-zinc-555">
                  <span className="text-4xl block mb-2 opacity-50">🗺️</span>
                  <p className="text-xs">Select one or more experiences to generate your personalized route.</p>
                </div>
              )}

              {!itineraryLoading && itineraryPlan && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <h4 className="text-xs font-bold text-zinc-200">{itineraryPlan.title}</h4>
                    <span className="text-[10px] text-emerald-450 font-mono font-bold">
                      {itineraryPlan.stopsCount} stops · {itineraryPlan.duration}
                    </span>
                  </div>

                  <div className="relative border-l border-emerald-900/40 ml-2 pl-4 space-y-4">
                    {itineraryPlan.items.map((item, idx) => (
                      <div key={idx} className="relative group">
                        <span className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-zinc-950 border border-emerald-500 flex items-center justify-center text-[7.5px] font-bold text-emerald-400 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-all duration-300">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs font-semibold text-zinc-300">{item.title}</p>
                            <span className="text-[9px] text-[#c2964b] font-mono">{item.time}</span>
                          </div>
                          <p className="text-[10.5px] text-zinc-500 font-light mt-0.5 leading-relaxed">{item.desc}</p>
                          <p className="text-[9px] text-zinc-650 mt-1 font-mono">Guide: {item.guide} · Loc: {item.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Interactive route map and carbon index */}
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-4 mt-4">
                    <div className="text-left">
                      <span className="text-[10px] uppercase font-bold text-zinc-550 block mb-1">Itinerary Route Map Node Trail</span>
                      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[9px] text-[#4ade80] py-2 border-b border-zinc-900 leading-relaxed">
                        <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded">📍 START</span>
                        <span>➔</span>
                        {selectedActivities.map((act, i) => (
                          <React.Fragment key={act}>
                            <span className="bg-emerald-900/30 border border-emerald-500/30 px-2 py-0.5 rounded text-emerald-400">
                              {act === 'honey' ? '🐝 Apiary' : act === 'sadu' ? '🧶 Sadu' : act === 'hike' ? '🥾 Hike' : act === 'farm' ? '🌾 Farm' : '🌌 Stars'}
                            </span>
                            {i < selectedActivities.length - 1 && <span>➔</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono text-left pt-1">
                      <span className="text-zinc-550">Shared Transit Carbon Offset:</span>
                      <span className="text-emerald-450 font-bold">-{ (selectedActivities.length * 1.5).toFixed(1) } kg CO₂eq</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEcoLaunch = () => {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg">
          <h3 className="text-md font-bold text-emerald-400 mb-2 flex items-center gap-2">
            <span>🚀</span> Back Local Startups (Challenge 1)
          </h3>
          <p className="text-xs text-zinc-450 mb-6 font-light">
            Empower micro-businesses in remote desert communities. Pre-purchase vouchers or seed grant local founders to help them secure their first customers.
          </p>

          {fundSuccess && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl">
              {fundSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {startups.filter(s => s.status === 'Approved').map(biz => (
              <div key={biz.id} className="bg-zinc-950 border border-zinc-905 p-5 rounded-xl flex flex-col justify-between hover:border-zinc-800 transition-all">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-zinc-200">{biz.name}</span>
                    <span className="text-[9px] uppercase tracking-wider bg-emerald-500/10 text-emerald-450 px-2 py-0.5 rounded-full font-mono">Licensed</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-normal font-light mb-4">{biz.idea}</p>
                  <div className="bg-[#15171e] p-3 rounded-lg border border-zinc-850 flex justify-between text-center text-[10px] mb-4">
                    <div>
                      <span className="text-zinc-550 block uppercase text-[8px]">Founder</span>
                      <span className="font-semibold text-zinc-300">{biz.owner}</span>
                    </div>
                    <div>
                      <span className="text-zinc-550 block uppercase text-[8px]">Funding Raised</span>
                      <span className="font-semibold text-emerald-450">{biz.funding || 0} AED / {biz.costs} AED</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-zinc-900">
                  <button 
                    onClick={() => handleFundStartup(biz.id, 50)} 
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold py-2 rounded-lg text-zinc-300 transition-all cursor-pointer"
                  >
                    Voucher (50 AED) 🏷️
                  </button>
                  <button 
                    onClick={() => handleFundStartup(biz.id, 100)} 
                    className="flex-1 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/30 hover:text-zinc-950 text-emerald-450 text-[10px] font-bold py-2 rounded-lg transition-all cursor-pointer"
                  >
                    Seed Grant (100 AED) 🤝
                  </button>
                </div>
              </div>
            ))}
            {startups.filter(s => s.status === 'Approved').length === 0 && (
              <div className="col-span-2 py-8 text-center text-zinc-550 text-xs border border-dashed border-zinc-850 rounded-xl">
                No licensed startups currently looking for backing.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEcoShield = () => {
    const alertsList = [
      { id: 1, text: "🚨 Sandstorm advisory sector 4. Visibility < 50m. Tourists avoid offroad driving.", type: "high" },
      { id: 2, text: "🌡️ Heat Index Alert: Temperature reaching 48°C in Al-Qaw'ah dunes. Carry 5L water.", type: "warning" }
    ];

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* SOS Button panel */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg">
          <h3 className="text-md font-bold text-rose-500 mb-2 flex items-center gap-2">
            <span>🚨</span> Emergency SOS Beacon (Challenge 2)
          </h3>
          <p className="text-xs text-zinc-450 mb-6 font-light">
            Are you lost, stuck in dunes, or in need of medical rescue? Triggering this beacon shares your GPS coordinates directly with neighboring farms and Al Ain rescue center.
          </p>

          {sosSuccess && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-[#4ade80] text-xs p-3 rounded-xl">
              {sosSuccess}
            </div>
          )}

          <form onSubmit={handlePostSos} className="space-y-4 max-w-xl mx-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-555">SOS Category</label>
                <select 
                  value={sosType} 
                  onChange={(e) => setSosType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl p-3 text-xs text-zinc-350 outline-none"
                >
                  <option value="Stuck in Sand">🏜️ Stuck in Sand / Lost Vehicle</option>
                  <option value="Medical Alert">🌡️ Extreme Heat / Dehydration</option>
                  <option value="Offroad Breakdown">🔧 Vehicle Mechanical Failure</option>
                </select>
              </div>
              <div className="flex flex-col justify-end p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl">
                <span className="text-[8px] text-zinc-550 block uppercase font-bold">Beacon Lock</span>
                <span className="text-[10px] text-teal-400 truncate">📍 GPS Position Attached</span>
              </div>
            </div>

            {/* AI Vision Diagnostics */}
            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                  <span>📷</span> AI Vision Diagnostics (Optional)
                </span>
                {uploadingImage && <span className="text-[10px] text-rose-500 font-mono animate-pulse">Running diagnosis...</span>}
              </div>
              
              <div className="flex items-center gap-3">
                <label className="bg-[#1f222d] border border-zinc-700 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold px-3 py-2 rounded-lg cursor-pointer transition-all">
                  Select Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                  />
                </label>
                <p className="text-[9px] text-zinc-500 font-light leading-normal">
                  Upload image of stuck vehicle, mechanical failure or medical distress to auto-analyze and draft ticket.
                </p>
              </div>

              {imagePreview && (
                <div className="flex gap-3 items-start bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-850">
                  <img 
                    src={imagePreview} 
                    alt="Tourist distress upload preview" 
                    className="w-12 h-12 object-cover rounded-md border border-zinc-800" 
                  />
                  {diagnosedData ? (
                    <div className="text-[9.5px] leading-normal font-sans text-zinc-300">
                      <p className="text-emerald-450 font-bold">✓ Diagnosed: {diagnosedData.issue_detected}</p>
                      <p className="text-[8.5px] text-zinc-500 font-light mt-0.5">{diagnosedData.diagnosis}</p>
                    </div>
                  ) : (
                    <p className="text-[9.5px] text-zinc-555 animate-pulse mt-1">Analyzing pixels with neural network...</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-bold text-zinc-555">Emergency Details</label>
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded border transition-all cursor-pointer ${
                    isTranscribing 
                      ? 'bg-rose-500/20 text-rose-500 border-rose-500/30 animate-pulse' 
                      : 'bg-zinc-850 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  {isTranscribing ? (
                    <>🎙️ Listening...</>
                  ) : (
                    <>🎙️ Click to Speak</>
                  )}
                </button>
              </div>
              <textarea 
                value={sosDescription} 
                onChange={(e) => setSosDescription(e.target.value)} 
                rows="3" 
                placeholder="Explain what help you need and describe what you see around you..." 
                className="w-full bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl p-3 text-xs text-zinc-350 outline-none"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isSendingSos} 
              className="w-full bg-rose-600 hover:bg-rose-505 text-white font-bold py-3.5 px-4 rounded-xl text-xs shadow-lg shadow-rose-950/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              {isSendingSos ? "Initiating Emergency Broadcast..." : "🚨 BROADCAST SOS BEACON"}
            </button>
          </form>
        </div>

        {/* Safety Advisories */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg">
          <h3 className="text-sm font-bold text-zinc-200 mb-4">Live Safety Advisories</h3>
          <div className="space-y-3">
            {alertsList.map(a => (
              <div key={a.id} className={`p-4 rounded-xl border flex gap-3 ${
                a.type === 'high' ? 'bg-rose-500/10 border-rose-500/20 text-rose-350' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
              }`}>
                <span>⚠️</span>
                <p className="text-xs font-semibold leading-normal">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderEcoInsights = () => {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg">
          <h3 className="text-md font-bold text-[#4ade80] mb-2 flex items-center gap-2">
            <span>📊</span> Tourist Demand Survey (Challenge 3)
          </h3>
          <p className="text-xs text-zinc-400 mb-6 font-light">
            Share what products or tours you want to buy. Your preferences directly update the local Farmers' Demand Index, helping local families determine what crops or crafts to focus on.
          </p>

          {surveySuccessMsg && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl">
              {surveySuccessMsg}
            </div>
          )}

          <form onSubmit={handleSurveySubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-550">What are you looking to buy or experience?</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                {[
                  { value: 'honey', label: 'Pure Sidr Honey', icon: '🍯', desc: 'Locally harvested medicinal honey' },
                  { value: 'dates', label: 'Organic Khalas Dates', icon: '🌴', desc: 'Premium dates sorted by local farmers' },
                  { value: 'rugs', label: 'Handwoven Sadu Rugs', icon: '🧶', desc: 'Traditional wool craft by local artisans' },
                  { value: 'tours', label: 'Heritage Desert Tours', icon: '⛺', desc: 'Guided stargazing & dunes experiences' }
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSurveyQ1(item.value)}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
                      surveyQ1 === item.value 
                        ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-950/10' 
                        : 'bg-zinc-950/60 border-zinc-850 text-zinc-300 hover:border-zinc-700 hover:bg-[#1a2024]'
                    }`}
                  >
                    <span className="text-2xl mb-2">{item.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold">{item.label}</h4>
                      <p className="text-[9px] text-zinc-500 mt-1 leading-normal font-light">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-555">What is your typical budget range?</label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {[
                  { value: '50-100 AED', label: '50 - 100', currency: 'AED' },
                  { value: '100-250 AED', label: '100 - 250', currency: 'AED' },
                  { value: '250-500 AED', label: '250 - 500', currency: 'AED' },
                  { value: '500+ AED', label: '500+', currency: 'AED' }
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSurveyQ2(item.value)}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                      surveyQ2 === item.value 
                        ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-950/10' 
                        : 'bg-zinc-950/60 border-zinc-850 text-zinc-300 hover:border-zinc-700 hover:bg-[#1a2024]'
                    }`}
                  >
                    <span className="text-xs font-bold">{item.label}</span>
                    <span className="text-[8px] text-zinc-500 font-mono mt-0.5">{item.currency}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-550 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
            >
              📊 Submit Survey to Co-Ops
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderEcoEvents = () => {
    const list = opportunities.filter(o => o.type === 'event');

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg">
          <h3 className="text-md font-bold text-emerald-400 mb-2 flex items-center gap-2">
            <span>📅</span> Heritage Discovery Hub (Challenge 4)
          </h3>
          <p className="text-xs text-zinc-400 mb-6 font-light">
            Stay informed about regional farmers' markets, cultural workshops, and agricultural festivals hosted in remote areas like Al-Qaw'ah and Hatta.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {list.map(opp => (
              <div key={opp.id} className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex flex-col justify-between hover:border-zinc-850 transition-all">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-zinc-200">{opp.title}</span>
                    <span className="text-[10px] text-zinc-550 font-mono">{opp.date}</span>
                  </div>
                  <p className="text-xs text-zinc-450 leading-normal font-light mb-4">{opp.desc}</p>
                </div>
                <button 
                  onClick={() => alert(`Registered for ${opp.title}! Details will be sent to your email.`)}
                  className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[10px] font-bold py-2 rounded-lg text-zinc-300 transition-all cursor-pointer"
                >
                  Register / Get Tickets 🎟️
                </button>
              </div>
            ))}
            {list.length === 0 && (
              <div className="col-span-2 py-8 text-center text-zinc-555 text-xs border border-dashed border-zinc-850 rounded-xl">
                No local events currently listed. Check back soon!
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 flex">
      {/* Sidebar navigation */}
      <aside className="w-64 shrink-0 hidden md:flex flex-col border-r border-zinc-800/60 bg-[#0f1115] h-screen sticky top-0">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-zinc-800/60 shrink-0">
          <span className="text-2xl">🐫</span>
          <span className="text-md font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent tracking-wide">ECO VISITOR</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 transform relative ${
                activeTab === item.id 
                  ? 'bg-[#1a2024] text-[#4ade80] border border-emerald-900/50 translate-x-1 shadow-inner pl-6' 
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 border border-transparent hover:translate-x-0.5'
              }`}
            >
              {activeTab === item.id && <span className="absolute left-2.5 w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />}
              <span className="text-base opacity-90">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-zinc-800/60 p-3 shrink-0">
          <div className="flex items-center justify-between gap-2 px-2 py-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-[10px] uppercase">
                {name ? name.substring(0, 2) : 'TV'}
              </div>
              <div className="leading-tight min-w-0">
                <p className="text-[11px] font-bold text-zinc-200 truncate">{name || 'Guest Investor'}</p>
                <p className="text-[9px] text-zinc-550">Tourist & Funder</p>
              </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-black rounded-lg px-2 py-1 shrink-0 flex items-center gap-1">
              <span>🪙</span>
              <span>{ecoCredits}</span>
            </div>
          </div>
          <button onClick={logout} className="w-full text-xs font-semibold text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/40 rounded-xl px-3 py-2 transition-all cursor-pointer">Logout 🚪</button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-40 border-b border-zinc-800/60 bg-[#0f1115]/95 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 h-14">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐫</span>
              <span className="text-sm font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">ECO VISITOR</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-black rounded-lg px-2.5 py-1 flex items-center gap-1">
                <span>🪙</span>
                <span>{ecoCredits}</span>
              </div>
              <button onClick={logout} className="text-[11px] font-semibold text-zinc-400 hover:text-red-400 border border-zinc-800 rounded-lg px-2.5 py-1.5 cursor-pointer">Logout 🚪</button>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 pb-2 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === item.id ? 'bg-[#1a2024] text-[#4ade80] border border-emerald-900/50' : 'text-zinc-400 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'marketplace' && renderMarketplace()}
          {activeTab === 'eco-tourism' && renderEcoTourism()}
          {activeTab === 'my-trip' && renderMyTrip()}
          {activeTab === 'eco-launch' && renderEcoLaunch()}
          {activeTab === 'eco-credits' && <EcoCreditsPanel />}
          {activeTab === 'eco-shield' && renderEcoShield()}
          {activeTab === 'eco-insights' && renderEcoInsights()}
          {activeTab === 'eco-events' && renderEcoEvents()}
          
          <GovFooter />
        </div>
      </div>

      {qrModalItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setQrModalItem(null)}>
          <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-6 w-full max-w-sm text-center space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-zinc-100">{qrModalItem.title}</h3>
            <p className="text-xs text-[#a89060] font-light leading-relaxed">Scan this QR Code to trace agricultural holding information, local water use efficiency, and soil certificates on-chain.</p>
            <div className="bg-white p-3 rounded-2xl inline-block">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/#/trace/' + qrModalItem.id)}`} alt="Product QR Code" className="w-[150px] h-[150px]" />
            </div>
            <div className="text-[10px] text-zinc-550 font-mono">TRACEABILITY CODE: TRACE-{qrModalItem.id}</div>
            <button onClick={() => setQrModalItem(null)} className="w-full bg-[#1b3d34] text-[#4ade80] py-2.5 rounded-xl text-xs font-bold hover:brightness-110 cursor-pointer">Close</button>
          </div>
        </div>
      )}
      <EcoCopilotChat role="tourist" />
    </div>
  );
}
