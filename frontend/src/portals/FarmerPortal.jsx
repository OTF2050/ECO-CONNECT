import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE } from '../config';
import EcoCopilotChat from '../components/EcoCopilotChat';
import GovFooter from '../components/GovFooter';
import FeedbackWidget from '../components/FeedbackWidget';
import ProgressTimeline from '../components/ProgressTimeline';
import GovConnect from '../components/GovConnect';
import FalconAgent from '../components/FalconAgent';
import EntrepreneurHub from '../components/EntrepreneurHub';
import DocumentScanner from '../components/DocumentScanner';
import SmartDocumentVerification from '../components/SmartDocumentVerification';
import SosBeacon from '../components/SosBeacon';
import EcoKpiGrid from '../components/EcoKpiGrid';
import CropCompare from '../components/CropCompare';
import SubsidyEligibility from '../components/SubsidyEligibility';
import { exportReportPdf } from '../utils/reportExport';
import DemandRadar from '../components/market/DemandRadar';
import FarmToHub from '../components/market/FarmToHub';
import TraceabilityStudio from '../components/market/TraceabilityStudio';
import DynamicServiceModal from '../components/DynamicServiceModal';
import EcoCreditsPanel from '../components/EcoCreditsPanel';

// Catalogue of official government services available to rural residents.
// Selecting a service pre-fills the formal request form below.
const GOV_SERVICES = [
  {
    category: 'Agricultural & Livestock Services',
    agency: 'ADAFSA / MOCCAE',
    icon: '🐪',
    services: [
      { icon: '🌾', type: 'subsidy', name: 'Subsidized Animal Feed', desc: 'Apply for the monthly allocation of discounted feed for camels or sheep.' },
      { icon: '🩺', type: 'equipment', name: 'Veterinary Visit Request', desc: 'Book a government vet for livestock vaccinations or emergency care.' },
      { icon: '🪲', type: 'equipment', name: 'Pest Control Intervention', desc: 'Request a municipality team to handle invasive pests like the Red Palm Weevil on date palms.' },
      { icon: '🏅', type: 'permit', name: 'Organic Produce Certification', desc: 'Apply to have local farm goods officially stamped as organic for the city markets.' },
    ],
  },
  {
    category: 'Municipal & Infrastructure Reporting',
    agency: 'Al Ain Municipality',
    icon: '🏗️',
    services: [
      { icon: '🚱', type: 'water_quota', name: 'Irrigation Network Leak', desc: 'Report a busted pipe wasting water in the agricultural zones. (High Urgency)' },
      { icon: '🏜️', type: 'equipment', name: 'Sand Clearance Request', desc: 'Request tractors to clear dunes that have shifted onto rural roads, blocking farm access.' },
      { icon: '🚛', type: 'equipment', name: 'Agricultural Waste Pickup', desc: 'Schedule a heavy-duty truck to remove palm fronds or fertilizer bags and prevent illegal dumping.' },
      { icon: '🔆', type: 'permit', name: 'Solar Panel Grid Integration', desc: "Request a technical inspection to connect a farm's new solar panels to the main electrical grid." },
    ],
  },
  {
    category: 'Economic & Social Licensing',
    agency: 'DED & Tourism',
    icon: '📜',
    services: [
      { icon: '🧶', type: 'permit', name: 'Rural Crafts Trade License', desc: 'Fast-track permit allowing families to legally sell handmade goods (like Sadu weaving) on the platform.' },
      { icon: '🏕️', type: 'permit', name: 'Eco-Tourism Host Registration', desc: 'Permit for a farm owner to legally host tourists for stargazing or desert camping.' },
      { icon: '🎪', type: 'permit', name: 'Community Event Permit', desc: "Request approval to host a local farmers' market or heritage festival in the area." },
    ],
  },
];

// --- Demo static data for the showcase modules (no backend routing required) ---

// 1. Green Fintech Digital Wallet
const GREEN_WALLET = {
  walletId: 'GW-7741-AE',
  currency: 'AED',
  balance: 8450.75,
  activity: [
    { icon: '🌱', label: 'Organic Date Sale · Eco-Market', amount: 320.0, when: 'Today' },
    { icon: '🏛️', label: 'Animal Feed Subsidy · MOCCAE', amount: 1500.0, when: 'Yesterday' },
    { icon: '⛺', label: 'Eco-Tour Booking Payout', amount: 640.0, when: '2 days ago' },
    { icon: '🛰️', label: 'Drip Irrigation Sensor', amount: -210.0, when: '4 days ago' },
  ],
};

// 2. Priority-Based Resource Queue (Circular Economy)
const DONATION_QUEUE = [
  {
    item: 'Refurbished Lenovo ThinkPad (Student Laptop)',
    donor: 'Abu Dhabi Tech Corp',
    icon: '🖥️',
    units: 4,
    queue: [
      { position: 1, name: 'Aisha M.', registered: 'Jun 20 · 08:02', status: 'Allocated' },
      { position: 2, name: 'You (Salem)', registered: 'Jun 21 · 14:37', status: 'Next in line' },
      { position: 3, name: 'Khalid R.', registered: 'Jun 22 · 19:11', status: 'Waiting' },
    ],
  },
  {
    item: 'Smart Drip Irrigation Sensor Kit',
    donor: 'Dubai AgriTech Foundation',
    icon: '🛰️',
    units: 2,
    queue: [
      { position: 1, name: 'You (Salem)', registered: 'Jun 19 · 07:45', status: 'Allocated' },
      { position: 2, name: 'Mariam S.', registered: 'Jun 23 · 10:20', status: 'Waiting' },
      { position: 3, name: 'Omar T.', registered: 'Jun 24 · 16:58', status: 'Waiting' },
    ],
  },
];

// 3. My Farm — operations dashboard demo data
const MY_FARM = {
  name: 'Al Wathba Heritage Farm',
  region: 'Al Ain · Eastern Region',
  area: '4.2 hectares',
  healthScore: 86,
  water: { used: 1240, quota: 2000, unit: 'm³ / month' },
  crops: [
    { icon: '🌴', name: 'Khalas Date Palms', stage: 'Fruiting', health: 'Healthy', progress: 78 },
    { icon: '🫒', name: 'Olive Grove', stage: 'Flowering', health: 'Healthy', progress: 54 },
    { icon: '🌿', name: 'Alfalfa (Fodder)', stage: 'Vegetative', health: 'Watch', progress: 40 },
    { icon: '🍋', name: 'Lemon Trees', stage: 'Ripening', health: 'Healthy', progress: 88 },
  ],
  livestock: [
    { icon: '🐪', name: 'Camels', count: 6, note: 'Vaccinated' },
    { icon: '🐐', name: 'Goats', count: 24, note: 'Grazing' },
    { icon: '🐑', name: 'Sheep', count: 18, note: 'Healthy' },
    { icon: '🐓', name: 'Hens', count: 60, note: 'Laying' },
  ],
  tasks: [
    { icon: '💧', label: 'Irrigate Block C (alfalfa)', due: 'Today · 16:00', done: false },
    { icon: '🪲', label: 'Red Palm Weevil trap check', due: 'Tomorrow', done: false },
    { icon: '🚛', label: 'Compost delivery pickup', due: 'Jun 28', done: false },
    { icon: '🌴', label: 'Pollinate date palms (Block A)', due: 'Completed', done: true },
  ],
};

// 3b. Pest & Disease Control — integrated pest management (IPM) watchlist demo data
const PEST_WATCH = [
  {
    id: 1, name: 'Red Palm Weevil', crop: 'Khalas Date Palms', icon: '🪲',
    severity: 'High', risk: 78, type: 'Pest',
    symptoms: 'Wilting fronds, oozing tunnels and a fermented odour around the crown.',
    action: 'Deploy pheromone traps, inject neem near the crown, and remove infested offshoots.',
  },
  {
    id: 2, name: 'Dubas Bug', crop: 'Date Palms', icon: '🐛',
    severity: 'Medium', risk: 48, type: 'Pest',
    symptoms: 'Sticky honeydew and sooty mould on fronds with reduced fruit yield.',
    action: 'Spray horticultural oil at dawn and encourage ladybird predators.',
  },
  {
    id: 3, name: 'Powdery Mildew', crop: 'Alfalfa (Fodder)', icon: '🍂',
    severity: 'Medium', risk: 51, type: 'Disease',
    symptoms: 'White powdery patches, leaf yellowing and stunted regrowth.',
    action: 'Improve airflow, avoid overhead watering and apply sulphur dust.',
  },
  {
    id: 4, name: 'Citrus Aphids', crop: 'Lemon Trees', icon: '🦟',
    severity: 'Low', risk: 22, type: 'Pest',
    symptoms: 'Curled new leaves, sticky residue and ants farming the colonies.',
    action: 'Apply insecticidal soap or neem spray and release lacewings.',
  },
  {
    id: 5, name: 'Olive Spider Mites', crop: 'Olive Grove', icon: '🕷️',
    severity: 'Low', risk: 18, type: 'Pest',
    symptoms: 'Fine webbing and stippled, bronzed leaves during hot, dry spells.',
    action: 'Raise humidity, hose foliage and apply miticidal neem oil.',
  },
];

// 4. Community — local farmer network demo data
const COMMUNITY = {
  members: 1280,
  online: 47,
  posts: [
    { author: 'Mariam S.', avatar: 'MS', region: 'Liwa', time: '12m ago', text: 'Red Palm Weevil spotted near Block 4 — municipality team responded within a day. Stay alert and check your traps! 🪲', likes: 23, comments: 6, tag: 'Pest Alert' },
    { author: 'Khalid R.', avatar: 'KR', region: 'Hatta', time: '1h ago', text: 'Sharing my drip-irrigation setup that cut water use by 30%. Happy to host a visit for anyone interested. 💧', likes: 51, comments: 14, tag: 'Knowledge Share' },
    { author: 'Aisha M.', avatar: 'AM', region: 'Al Ain', time: '3h ago', text: 'Our Sidr honey harvest is in! Listing it on Eco Market this week. Thank you all for the bee-keeping tips. 🍯', likes: 38, comments: 9, tag: 'Harvest' },
  ],
  events: [
    { icon: '🎪', name: "Al Ain Farmers' Market", date: 'Jun 30 · 07:00', going: 64 },
    { icon: '🐝', name: 'Beekeeping Workshop', date: 'Jul 04 · 16:00', going: 22 },
    { icon: '💧', name: 'Water Conservation Forum', date: 'Jul 09 · 10:00', going: 41 },
  ],
  groups: [
    { icon: '🌴', name: 'Date Palm Growers', members: 412 },
    { icon: '🐪', name: 'Livestock Keepers', members: 286 },
    { icon: '🧶', name: 'Heritage Crafts', members: 198 },
    { icon: '☀️', name: 'Solar & Off-Grid Farms', members: 154 },
  ],
};

// 5. Employees — farm workforce management demo data
const EMPLOYEES = {
  monthlyPayroll: 18400,
  currency: 'AED',
  staff: [
    { id: 'EMP-01', name: 'Rahul Kumar', role: 'Farm Supervisor', avatar: 'RK', status: 'On Duty', attendance: 96, wage: 4200, shift: '06:00 – 14:00', task: 'Oversee date palm block A' },
    { id: 'EMP-02', name: 'Bilal Ahmed', role: 'Irrigation Technician', avatar: 'BA', status: 'On Duty', attendance: 92, wage: 3600, shift: '05:00 – 13:00', task: 'Drip system maintenance' },
    { id: 'EMP-03', name: 'Maria Santos', role: 'Livestock Caretaker', avatar: 'MS', status: 'On Leave', attendance: 88, wage: 3400, shift: '07:00 – 15:00', task: 'Goat & sheep feeding' },
    { id: 'EMP-04', name: 'Joseph Mensah', role: 'Harvest Worker', avatar: 'JM', status: 'On Duty', attendance: 90, wage: 3000, shift: '06:00 – 14:00', task: 'Olive grove harvesting' },
    { id: 'EMP-05', name: 'Anwar Hossain', role: 'Greenhouse Assistant', avatar: 'AH', status: 'Off Duty', attendance: 85, wage: 2900, shift: '14:00 – 22:00', task: 'Seedling nursery care' },
    { id: 'EMP-06', name: 'Priya Nair', role: 'Packhouse & Sales', avatar: 'PN', status: 'On Duty', attendance: 94, wage: 3300, shift: '08:00 – 16:00', task: 'Pack Eco-Market orders' },
  ],
};

// Top navigation items, grouped into labelled sections for a cleaner interface
const NAV_ITEMS = [
  { id: 'marketplace', icon: '📦', label: 'Eco Market', group: 'Marketplace' },
  { id: 'eco-tourism', icon: '⛺', label: 'Eco Business', group: 'Marketplace' },
  { id: 'my-farm', icon: '🌾', label: 'My Farm', group: 'Farm Operations' },
  { id: 'employees', icon: '👷', label: 'Employees', group: 'Farm Operations' },
  { id: 'eco-grid', icon: '⚡💧', label: 'Eco-Grid', group: 'Farm Operations' },
  { id: 'compare', icon: '⚖️', label: 'Crop Compare', group: 'Farm Operations' },
  { id: 'eco-learn', icon: '📚', label: 'Eco-Learn', group: 'Farm Operations' },
  { id: 'tools-library', icon: '🔧', label: 'Eco Souq (Tools)', group: 'Farm Operations' },
  { id: 'eco-launch', icon: '🚀', label: 'Entrepreneur Hub', group: 'Grow & Trade' },
  { id: 'eco-credits', icon: '🪙', label: 'Eco Credits', group: 'Grow & Trade' },
  { id: 'scan', icon: '📷', label: 'Scan Docs', group: 'Grow & Trade' },
  { id: 'my-vault', icon: '🗂️', label: 'My Vault', group: 'Grow & Trade' },
  { id: 'falcon', icon: '🦅', label: 'Falcon AI', group: 'Grow & Trade' },
  { id: 'contracts', icon: '📜', label: 'Trade Contracts', group: 'Grow & Trade' },
  { id: 'eco-shield', icon: '🆘', label: 'SOS Beacon', group: 'Community & Gov' },
  { id: 'community', icon: '👥', label: 'Community', group: 'Community & Gov' },
  { id: 'gov-connect', icon: '🏛️', label: 'Gov-Connect', group: 'Community & Gov' },
  { id: 'subsidy-check', icon: '⚖️', label: 'Subsidy Check', group: 'Community & Gov' },
  { id: 'earnings', icon: '💳', label: 'Financial Ledger', group: 'Community & Gov' },
];

// Ordered list of nav section labels (preserves declaration order)
const NAV_GROUPS = NAV_ITEMS.reduce((acc, item) => {
  if (!acc.includes(item.group)) acc.push(item.group);
  return acc;
}, []);

// Sub-tabs inside the unified Gov-Connect section
const GOV_CONNECT_TABS = [
  { id: 'ai-care', icon: '📣', label: 'Eco Reporting' },
  { id: 'civic', icon: '📡', label: 'Civic Reporting' },
  { id: 'gov-requests', icon: '🏛️', label: 'Gov Requests' },
];

// Marketplace category quick-filters (matched against title + description keywords)
const MARKET_CATEGORIES = [
  { id: 'all', icon: '🛒', label: 'All', keywords: [] },
  { id: 'produce', icon: '🌴', label: 'Produce', keywords: ['date', 'olive', 'egg', 'honey', 'milk', 'oil'] },
  { id: 'handicraft', icon: '🧶', label: 'Handicrafts', keywords: ['rug', 'sadu', 'wool', 'soap', 'craft'] },
  { id: 'seeds', icon: '🌱', label: 'Seeds & Soil', keywords: ['seed', 'seedling', 'palm', 'compost', 'fertilizer', 'soil'] },
  { id: 'tools', icon: '🔧', label: 'Farm Tools', keywords: ['irrigation', 'pump', 'controller', 'netting', 'greenhouse', 'hydrometer'] },
  { id: 'tech', icon: '🔌', label: 'Tech & Energy', keywords: ['laptop', 'thinkpad', 'solar', 'power', 'panel', 'battery'] },
];

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

function FarmTelemetry() {
  const [soilMoisture, setSoilMoisture] = useState(28.4);
  const [temp, setTemp] = useState(38.6);
  const [humidity, setHumidity] = useState(41.5);
  const [nitrogen, setNitrogen] = useState(72);
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSoilMoisture(prev => parseFloat((prev + (Math.random() - 0.5) * 0.4).toFixed(1)));
      setTemp(prev => parseFloat((prev + (Math.random() - 0.5) * 0.2).toFixed(1)));
      setHumidity(prev => parseFloat((prev + (Math.random() - 0.5) * 0.5).toFixed(1)));
      setNitrogen(prev => Math.round(prev + (Math.random() - 0.5) * 2));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSynthesizeReport = async () => {
    setLoading(true);
    setReport('');
    try {
      const res = await fetch(`${API_BASE}/api/falcon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Synthesize a brief expert farm report for Ahmed's Al Ain Farm. Current Sensor Data: Soil Moisture ${soilMoisture}%, Temp ${temp}°C, Humidity ${humidity}%, Nitrogen ${nitrogen} mg/kg. Crops: Date Palm (Harvester stage), Greenhouse Tomatoes (Flowering). Livestock: 8 camels, 25 goats. Suggest water conservation actions.`
        })
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data.reply);
      } else {
        setReport('Report compilation failed. Please verify AI agent availability.');
      }
    } catch {
      setReport('Advisory server connection timeout. Ahmed\'s Al Ain Farm is showing optimal soil moisture. Tomatoes are healthy, but recommend increasing irrigation by 5% due to rising ambient temperature.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Live IoT Telemetry Sensors</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Soil Moisture', value: `${soilMoisture}%`, icon: '💧', desc: 'Optimal: 25-35%', color: 'text-blue-400' },
            { label: 'Ambient Temp', value: `${temp}°C`, icon: '🌡️', desc: 'Al Ain High Range', color: 'text-amber-400' },
            { label: 'Humidity Index', value: `${humidity}%`, icon: '🌫️', desc: 'Evaporation active', color: 'text-teal-400' },
            { label: 'Soil Nitrogen (N)', value: `${nitrogen} ppm`, icon: '🧪', desc: 'Healthy nutrient load', color: 'text-indigo-400' },
          ].map((s) => (
            <div key={s.label} className="bg-[#15171e] border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-zinc-550">{s.label}</span>
                <span className="text-lg">{s.icon}</span>
              </div>
              <div className="mt-3">
                <span className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</span>
                <p className="text-[9px] text-zinc-500 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#1c1810] border border-[#9b7a36]/40 p-5 rounded-2xl space-y-4 text-left">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h4 className="text-sm font-bold text-zinc-150 flex items-center gap-2"><span>🔮</span> Falcon AI Farm Summary Synthesizer</h4>
            <p className="text-[10px] text-[#a89060] font-mono mt-0.5">COMPILE BLOCKCHAIN &amp; IOT CROP ADVISORY</p>
          </div>
          <button
            onClick={handleSynthesizeReport}
            disabled={loading}
            className="bg-[#9b7a36] hover:bg-[#b08c45] text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all disabled:opacity-40 cursor-pointer shadow-lg animate-fadeIn"
          >
            {loading ? 'Synthesizing Report...' : 'Generate AI Farm Summary Report ⚡'}
          </button>
        </div>

        {report && (
          <div className="bg-[#0f0b05] border border-[#9b7a36]/20 p-4 rounded-xl text-xs text-[#e9dcc0] leading-relaxed font-light whitespace-pre-wrap">
            {report}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FarmerPortal() {
  const { token, name, logout, ecoCredits, refreshCredits } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [govConnectTab, setGovConnectTab] = useState('ai-care');
  const [lastPurchase, setLastPurchase] = useState(null);
  const [newlyCreatedProduct, setNewlyCreatedProduct] = useState(null);
  const [qrModalItem, setQrModalItem] = useState(null);

  // Trade Contracts State
  const [contractsList, setContractsList] = useState([
    {
      id: 'CTR-7729',
      buyerName: 'LuLu Hypermarket Group HQ',
      produceType: 'Sidr Honey & Organic Dates',
      quota: '500 kg / Month',
      priceAed: '120 AED/kg',
      paymentTerms: 'Net-30 Days',
      status: 'Awaiting Digital Signature',
      dateProposed: '2026-06-25',
      signeeName: '',
      licenseRef: ''
    },
    {
      id: 'CTR-4028',
      buyerName: 'Jumeirah Luxury Resorts & Hotels',
      produceType: 'Premium Khalas Dates (Extra Large)',
      quota: '1,200 kg / Month',
      priceAed: '45 AED/kg',
      paymentTerms: 'Net-15 Days',
      status: 'Signed & Active',
      dateProposed: '2026-06-10',
      signeeName: 'Anwar Hossain',
      licenseRef: 'LIC-HATTA-881'
    },
    {
      id: 'CTR-1092',
      buyerName: 'MOCCAE Organic Distribution Network',
      produceType: 'Fruit Tree Seedlings & Saplings',
      quota: '3,000 units / Quarter',
      priceAed: '18 AED/unit',
      paymentTerms: 'Immediate Grant Release',
      status: 'Signed & Active',
      dateProposed: '2026-05-18',
      signeeName: 'Anwar Hossain',
      licenseRef: 'LIC-HATTA-881'
    }
  ]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [signingLicenseNum, setSigningLicenseNum] = useState('');
  const [signingName, setSigningName] = useState('');
  const [signSuccess, setSignSuccess] = useState('');
  const [signErr, setSignErr] = useState('');

  // Proposed B2B Supply Contracts State
  const [propBuyer, setPropBuyer] = useState('LuLu Hypermarket Group HQ');
  const [propProduce, setPropProduce] = useState('');
  const [propQuota, setPropQuota] = useState('');
  const [propPrice, setPropPrice] = useState('');
  const [propTerms, setPropTerms] = useState('Net-30 Days');
  const [propErr, setPropErr] = useState('');
  const [propSuccess, setPropSuccess] = useState('');

  // Farm Tools Sharing Library State
  const [toolsList, setToolsList] = useState([
    { id: 'TL-01', name: 'Tractor Rotary Tiller', icon: '🚜', owner: 'Jassim Farm', cost: 50, status: 'Available', category: 'Machinery', type: 'Rent' },
    { id: 'TL-02', name: 'Soil pH Sensor Kit', icon: '🧪', owner: 'Hatta Hub', cost: 10, status: 'Available', category: 'Sensors', type: 'Borrow' },
    { id: 'TL-03', name: 'Date Palm Ladder (High)', icon: '🧗', owner: 'Saeed Al Mansouri', cost: 15, status: 'Borrowed', category: 'Harvesting', type: 'Borrow' },
    { id: 'TL-04', name: 'Drip Irrigation Pump', icon: '🔧', owner: 'Rashid Al Bedwawi', cost: 30, status: 'Available', category: 'Irrigation', type: 'Rent' }
  ]);
  const [borrowMsg, setBorrowMsg] = useState('');
  const [borrowErr, setBorrowErr] = useState('');
  const [newToolName, setNewToolName] = useState('');
  const [newToolCost, setNewToolCost] = useState('');
  const [newToolIcon, setNewToolIcon] = useState('🔧');
  const [newToolCategory, setNewToolCategory] = useState('Machinery');
  const [newToolType, setNewToolType] = useState('Rent');
  const [toolsCategoryFilter, setToolsCategoryFilter] = useState('All');
  const [toolsTypeFilter, setToolsTypeFilter] = useState('All');

  // ========================
  // ECO-CARE STATE
  // ========================
  const [reports, setReports] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('water');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ========================
  // GOVERNMENT REQUESTS STATE
  // ========================
  const [govRequests, setGovRequests] = useState([]);
  const [govTitle, setGovTitle] = useState('');
  const [govDesc, setGovDesc] = useState('');
  const [govType, setGovType] = useState('subsidy');
  const [govAmount, setGovAmount] = useState('');
  const [govSuccessMsg, setGovSuccessMsg] = useState('');
  const [govErrorMsg, setGovErrorMsg] = useState('');
  const [govIsSubmitting, setGovIsSubmitting] = useState(false);

  // Dynamic Service Modal State
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  // ========================
  // MARKETPLACE STATE
  // ========================
  const [inventory, setInventory] = useState([]);
  const [inventoryMsg, setInventoryMsg] = useState('');
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [acquiringId, setAcquiringId] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [postPrice, setPostPrice] = useState(0);
  const [postStock, setPostStock] = useState(1);
  const [postType, setPostType] = useState('sell'); 
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Eco Market entry role — 'buyer' | 'seller' | null (shows choice gate)
  // Honors a one-time flag set by the "Login as a Seller" shortcut on the login page.
  const [marketRole, setMarketRole] = useState(() => {
    try {
      const preset = sessionStorage.getItem('ecoMarketRole');
      if (preset) {
        sessionStorage.removeItem('ecoMarketRole');
        return preset;
      }
    } catch { /* sessionStorage unavailable */ }
    return null;
  });

  const handleVoiceCommand = (cmd) => {
    if (!cmd) return;
    if (cmd === 'open_seller_tools') {
      setMarketRole('seller');
      setActiveTab('marketplace');
    } else if (cmd === 'open_market_radar') {
      setMarketRole('seller');
      setActiveTab('earnings');
    } else if (cmd === 'open_crafts_license') {
      setActiveTab('eco-launch');
    } else if (cmd === 'open_water_leak') {
      setSelectedServiceId('water_leak');
      setIsServiceModalOpen(true);
    } else if (cmd === 'open_vet_visit') {
      setSelectedServiceId('vet_visit');
      setIsServiceModalOpen(true);
    } else if (cmd === 'open_vault') {
      setActiveTab('my-vault');
    } else if (cmd === 'open_eco_market') {
      setActiveTab('marketplace');
    }
  };

  // Employee roster & task assignments — loaded/saved to localStorage
  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem('eco_employees_staff');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'EMP-01', name: 'Rahul Kumar', role: 'Farm Supervisor', avatar: 'RK', status: 'On Duty', attendance: 96, wage: 4200, shift: '06:00 – 14:00' },
      { id: 'EMP-02', name: 'Bilal Ahmed', role: 'Irrigation Technician', avatar: 'BA', status: 'On Duty', attendance: 92, wage: 3600, shift: '05:00 – 13:00' },
      { id: 'EMP-03', name: 'Maria Santos', role: 'Livestock Caretaker', avatar: 'MS', status: 'On Leave', attendance: 88, wage: 3400, shift: '07:00 – 15:00' },
      { id: 'EMP-04', name: 'Ramesh Kumar', role: 'Senior Farm Hand', avatar: 'RK', status: 'On Duty', attendance: 96, wage: 4680, shift: '06:00 – 14:00' },
      { id: 'EMP-05', name: 'Anwar Hossain', role: 'Greenhouse Assistant', avatar: 'AH', status: 'Off Duty', attendance: 85, wage: 2900, shift: '14:00 – 22:00' },
      { id: 'EMP-06', name: 'Priya Nair', role: 'Packhouse & Sales', avatar: 'PN', status: 'On Duty', attendance: 94, wage: 3300, shift: '08:00 – 16:00' },
    ];
  });

  const [empTasks, setEmpTasks] = useState(() => {
    const saved = localStorage.getItem('eco_employees_tasks');
    if (saved) return JSON.parse(saved);
    return {
      'EMP-01': ['Oversee date palm block A'],
      'EMP-02': ['Drip system maintenance'],
      'EMP-03': ['Goat & sheep feeding'],
      'EMP-04': ['Irrigate east date palm sector', 'Inspect bee colonies (boxes 1–10)', 'Sort & pack Khalas dates for resort order'],
      'EMP-05': ['Seedling nursery care'],
      'EMP-06': ['Pack Eco-Market orders'],
    };
  });

  const [taskDrafts, setTaskDrafts] = useState({});

  // Sync staffList & empTasks state changes to localStorage
  useEffect(() => {
    localStorage.setItem('eco_employees_staff', JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    localStorage.setItem('eco_employees_tasks', JSON.stringify(empTasks));
  }, [empTasks]);

  // Modal State for adding employee
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('Farm Hand');
  const [newEmpWage, setNewEmpWage] = useState(3000);
  const [newEmpShift, setNewEmpShift] = useState('06:00 – 14:00');

  const addEmployeeTask = (empId) => {
    const text = (taskDrafts[empId] || '').trim();
    if (!text) return;
    const nextTasks = [...(empTasks[empId] || []), text];
    setEmpTasks((prev) => ({ ...prev, [empId]: nextTasks }));
    setTaskDrafts((prev) => ({ ...prev, [empId]: '' }));
  };

  const removeEmployeeTask = (empId, index) => {
    const nextTasks = empTasks[empId].filter((_, i) => i !== index);
    setEmpTasks((prev) => ({ ...prev, [empId]: nextTasks }));
  };

  const handleAddEmployeeSubmit = (e) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;
    const newId = `EMP-${String(staffList.length + 1).padStart(2, '0')}`;
    const newEmpObj = {
      id: newId,
      name: newEmpName,
      role: newEmpRole,
      avatar: newEmpName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      status: 'Off Duty',
      attendance: 100,
      wage: Number(newEmpWage),
      shift: newEmpShift
    };
    setStaffList([...staffList, newEmpObj]);
    setEmpTasks(prev => ({ ...prev, [newId]: [] }));
    setShowAddEmpModal(false);
    setNewEmpName('');
  };

  // ========================
  // ECO-TOURISM STATE
  // ========================
  const [myTours, setMyTours] = useState([]);
  const [tourBookings, setTourBookings] = useState([]);
  const [tourTitle, setTourTitle] = useState('');
  const [tourPrice, setTourPrice] = useState('');
  const [tourDetails, setTourDetails] = useState('');
  const [tourRegion, setTourRegion] = useState('Hatta (Dubai)');
  const [tourMsg, setTourMsg] = useState('');
  const [tourError, setTourError] = useState('');

  // ========================
  // EARNINGS STATE
  // ========================
  const [earningsData, setEarningsData] = useState(null);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [loanAmount, setLoanAmount] = useState(30000);
  const [loanMonths, setLoanMonths] = useState(36);
  const [loanApplied, setLoanApplied] = useState(false);
  const [loanRef, setLoanRef] = useState('');

  // ========================
  // SHOPPING CART STATE & METHODS
  // ========================
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutTripId, setCheckoutTripId] = useState('');
  const [trips, setTrips] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccessMsg, setCheckoutSuccessMsg] = useState('');

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

    // Loop over cart items and submit transactions
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
      setCart([]);
      fetchInventory();
    } else if (errors.length > 0) {
      setInventoryMsg(`Checkout failed: ${errors[0]}`);
    }
  };

  // ========================
  // ECO-SHIELD STATE
  // ========================
  const [liveAlerts, setLiveAlerts] = useState(() => {
    const saved = localStorage.getItem('eco_live_alerts');
    if (saved) return JSON.parse(saved);
    const defaults = [
      { id: 1, text: "🚨 Warning: Sandstorm approaching the southern sector (Al-Qaw'ah), please cover crops.", severity: "high", time: "10m ago" },
      { id: 2, text: "🌾 Dune Alert: Sand dunes encroaching on Sector 4 road, tractor clearance requested.", severity: "medium", time: "1h ago" },
      { id: 3, text: "💧 Flash Flood Advisory: Low-lying wadi channels around Al Ain / Al-Qaw'ah are filling up.", severity: "medium", time: "2h ago" }
    ];
    localStorage.setItem('eco_live_alerts', JSON.stringify(defaults));
    return defaults;
  });
  const [sosFeed, setSosFeed] = useState(() => {
    const saved = localStorage.getItem('eco_sos_feed');
    if (saved) return JSON.parse(saved);
    const defaults = [
      { id: 1, sender: "Ahmed Al-Mansoori", type: "Stuck in Sand", description: "My patrol car is stuck in deep dunes behind farm block 12. Need pull assistance.", lat: 24.1205, lng: 55.4512, time: "5m ago", responders: ["Salem (You)"], region: "Al-Qaw'ah South", status: "Pending" },
      { id: 2, sender: "Fatima Al-Dhaheri", type: "Tractor Failure", description: "Drip feeder pump belt snapped, need spare or agricultural mechanic help.", lat: 24.1561, lng: 55.4891, time: "25m ago", responders: [], region: "Al-Qaw'ah East", status: "Pending" }
    ];
    localStorage.setItem('eco_sos_feed', JSON.stringify(defaults));
    return defaults;
  });
  const [sosDescription, setSosDescription] = useState('');
  const [sosType, setSosType] = useState('Stuck in Sand');
  const [sosSuccess, setSosSuccess] = useState('');
  const [isSendingSos, setIsSendingSos] = useState(false);

  // ========================
  // ECO-LEARN STATE
  // ========================
  const [mentorRequests, setMentorRequests] = useState([
    { id: 1, topic: "Pest Management (Red Palm Weevil)", time: "Jun 24", status: "Mentor Assigned (Dr. Saeed, ADAFSA Al Ain)", farm: "Al Wathba Heritage Farm" }
  ]);
  const [mentorTopic, setMentorTopic] = useState('Drip Irrigation Engineering');
  const [mentorDesc, setMentorDesc] = useState('');
  const [mentorSuccess, setMentorSuccess] = useState('');
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [videoProgress, setVideoProgress] = useState({});
  const [ecoLearnTab, setEcoLearnTab] = useState('dashboard');
  const [lessonFilter, setLessonFilter] = useState('All');
  // Real-time field conditions (Open-Meteo live feed — no API key required)
  const [liveField, setLiveField] = useState(null);
  const [liveFieldLoading, setLiveFieldLoading] = useState(true);
  const [liveFieldError, setLiveFieldError] = useState('');
  const [liveFieldUpdated, setLiveFieldUpdated] = useState(null);

  // ========================
  // ECO-GRID STATE
  // ========================
  const [solarPanelAngle, setSolarPanelAngle] = useState(45); // degrees
  const [weatherCondition, setWeatherCondition] = useState('sunny'); // sunny, dusty, cloudy
  const [waterFlowRate, setWaterFlowRate] = useState(15); // Liters/min
  const [batteryStorage, setBatteryStorage] = useState(72); // percentage

  // New Complex IoT & Net-Metering Simulator States
  const [valveMode, setValveMode] = useState('smart'); // 'manual' | 'smart'
  const [valveOpen, setValveOpen] = useState(false);
  const [soilMoisture, setSoilMoisture] = useState(38.5); // percentage
  const [ambientTemp, setAmbientTemp] = useState(41.2); // Celsius
  const [ambientHumid, setAmbientHumid] = useState(24.0); // percentage
  const [dailySolarGen, setDailySolarGen] = useState(48); // kWh
  const [batteryCapacity, setBatteryCapacity] = useState(120); // kWh
  const [netExportAed, setNetExportAed] = useState(245.50); // AED credit

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Ambient Fluctuations
      setAmbientTemp(prev => parseFloat(Math.min(47.5, Math.max(34.0, prev + (Math.random() > 0.5 ? 0.3 : -0.3))).toFixed(1)));
      setAmbientHumid(prev => parseFloat(Math.min(38.0, Math.max(12.0, prev + (Math.random() > 0.5 ? 1 : -1))).toFixed(1)));

      // 2. Soil Moisture and Valve Automation
      setSoilMoisture(prev => {
        let next = prev;
        if (valveOpen) {
          next = Math.min(100.0, prev + 1.5);
        } else {
          next = Math.max(10.0, prev - 0.5);
        }

        // Automatic control if smart mode is active
        if (valveMode === 'smart') {
          if (next < 35.0 && !valveOpen) {
            setValveOpen(true);
          } else if (next >= 48.0 && valveOpen) {
            setValveOpen(false);
          }
        }
        return parseFloat(next.toFixed(1));
      });

      // 3. Battery Storage & Net Export simulator
      setBatteryStorage(prev => {
        let delta = 0;
        if (weatherCondition === 'sunny') delta = 0.8;
        else if (weatherCondition === 'cloudy') delta = -0.3;
        else delta = -0.6; // dusty
        
        return parseFloat(Math.min(100, Math.max(0, prev + delta)).toFixed(1));
      });

      setNetExportAed(prev => {
        const generationAed = (dailySolarGen / 24.0) * 0.15; // simulate feed-in tariff AED per interval
        return parseFloat((prev + generationAed).toFixed(2));
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [valveOpen, valveMode, weatherCondition, dailySolarGen]);

  // ========================
  // ECO-LEARN — REAL-TIME FIELD CONDITIONS (Open-Meteo, no API key)
  // ========================
  const fetchLiveField = async () => {
    // Hatta agricultural belt, UAE
    const lat = 24.80;
    const lon = 56.13;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,` +
      `precipitation,weather_code,wind_speed_10m,uv_index,` +
      `soil_temperature_0cm,soil_moisture_0_to_1cm&timezone=Asia%2FDubai`;
    try {
      setLiveFieldError('');
      const res = await fetch(url);
      if (!res.ok) throw new Error('weather service unavailable');
      const data = await res.json();
      const c = data.current || {};
      setLiveField({
        temp: c.temperature_2m,
        feels: c.apparent_temperature,
        humidity: c.relative_humidity_2m,
        wind: c.wind_speed_10m,
        uv: c.uv_index,
        soilTemp: c.soil_temperature_0cm,
        soilMoisture: c.soil_moisture_0_to_1cm,
        code: c.weather_code,
        isDay: c.is_day,
        precip: c.precipitation,
      });
      setLiveFieldUpdated(new Date());
    } catch (err) {
      setLiveFieldError('Live feed unreachable — check connection.');
    } finally {
      setLiveFieldLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveField();
    const interval = setInterval(fetchLiveField, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Map WMO weather codes to label + icon
  const wmoInfo = (code) => {
    const m = {
      0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
      45: ['Fog', '🌫️'], 48: ['Rime fog', '🌫️'],
      51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Dense drizzle', '🌧️'],
      61: ['Light rain', '🌧️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '⛈️'],
      80: ['Rain showers', '🌧️'], 81: ['Showers', '🌧️'], 82: ['Violent showers', '⛈️'],
      95: ['Thunderstorm', '⛈️'], 96: ['Storm + hail', '⛈️'], 99: ['Severe storm', '⛈️'],
    };
    return m[code] || ['Hazy / dusty', '🌪️'];
  };

  // ========================
  // SHARED CHALLENGE STATE
  // ========================
  const [startups, setStartups] = useState(() => {
    const saved = localStorage.getItem('eco_startups');
    if (saved) return JSON.parse(saved);
    const defaults = [
      { id: 1, owner: "Salem Al Hattawi", name: "Sidr Palm Dates Shop", idea: "Selling organic dates packaged with local honey.", skill: "Dates Sorting & Packaging", stage: "Approved License", status: "Approved", funding: 150, costs: 350 },
      { id: 2, owner: "Fatima Al-Dhaheri", name: "Al-Qaw'ah Heritage Sadu Weaving", idea: "Traditional handmade camel-wool weaving craft rugs.", skill: "Sadu Weaving", stage: "Idea Phase", status: "Pending", funding: 0, costs: 300 }
    ];
    localStorage.setItem('eco_startups', JSON.stringify(defaults));
    return defaults;
  });
  const [opportunities, setOpportunities] = useState(() => {
    const saved = localStorage.getItem('eco_opportunities');
    if (saved) return JSON.parse(saved);
    const defaults = [
      { id: 1, title: "Annual Hatta Date Palm Festival", desc: "Exhibit your crops to over 10,000 visitors. Free booths for local farmers.", type: "event", date: "Jul 15" },
      { id: 2, title: "Subsidized Solar Water Pump Installation", desc: "Ministry of Climate Change grants covering 60% of off-grid solar equipment.", type: "grant", date: "Deadline: Aug 01" }
    ];
    localStorage.setItem('eco_opportunities', JSON.stringify(defaults));
    return defaults;
  });
  const [surveys, setSurveys] = useState(() => {
    const saved = localStorage.getItem('eco_surveys');
    if (saved) return JSON.parse(saved);
    const defaults = { honey: 14, dates: 28, rugs: 9, tours: 17 };
    localStorage.setItem('eco_surveys', JSON.stringify(defaults));
    return defaults;
  });

  const [launchName, setLaunchName] = useState('');
  const [launchIdea, setLaunchIdea] = useState('');
  const [launchSkill, setLaunchSkill] = useState('Dates Sorting & Packaging');
  const [launchSuccess, setLaunchSuccess] = useState('');
  const [showPlanId, setShowPlanId] = useState(null);
  const [researchProduct, setResearchProduct] = useState('Raw Sidr Honey');
  const [testPrice, setTestPrice] = useState(130);

  // ========================
  // PREDICTIVE MARKET RADAR STATE
  // ========================
  const [radarInsights, setRadarInsights] = useState([]);
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarError, setRadarError] = useState('');

  const fetchRadarInsights = async () => {
    setRadarLoading(true);
    setRadarError('');
    try {
      const res = await fetch(`${API_BASE}/api/predictive/market-radar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRadarInsights(data.insights || []);
      } else {
        setRadarError('Failed to retrieve predictive market radar data.');
      }
    } catch (err) {
      setRadarError('Error contacting Eco Predictive AI service.');
    } finally {
      setRadarLoading(false);
    }
  };

  const fetchMyToursAndBookings = async () => {
    try {
      const toursRes = await fetch(`${API_BASE}/api/ecotours`);
      const bookingsRes = await fetch(`${API_BASE}/api/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (toursRes.ok) {
        const toursData = await toursRes.json();
        const myFilteredTours = toursData.filter(t => t.owner_name === name);
        setMyTours(myFilteredTours);
      }
      
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setTourBookings(bookingsData);
      }
    } catch (err) {
      console.error('Error fetching tours/bookings:', err);
    }
  };

  const fetchEarnings = async () => {
    setEarningsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/farmers/earnings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEarningsData(data);
      }
    } catch (err) {
      console.error('Error fetching earnings data:', err);
    } finally {
      setEarningsLoading(false);
    }
  };

  const handleHostExperience = async (e) => {
    e.preventDefault();
    if (!tourTitle || !tourPrice || !tourDetails) return;
    setTourMsg('');
    setTourError('');
    
    try {
      const res = await fetch(`${API_BASE}/api/ecotours`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: tourTitle,
          description: tourDetails,
          price: parseFloat(tourPrice),
          region: tourRegion
        })
      });
      
      if (res.ok) {
        setTourMsg('Experience published successfully! You are now hosting this ecotour.');
        setTourTitle('');
        setTourPrice('');
        setTourDetails('');
        fetchMyToursAndBookings();
        fetchEarnings();
      } else {
        const errData = await res.json();
        setTourError(errData.detail || 'Failed to publish experience.');
      }
    } catch (err) {
      setTourError('Error contacting backend server.');
    }
  };

  const fetchMyReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  const fetchInventory = async () => {
    setInventoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/inventory`);
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setInventoryLoading(false);
    }
  };

  const fetchMyGovRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/government-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGovRequests(data);
      }
    } catch (err) {
      console.error('Error fetching government requests:', err);
    }
  };

  // Pre-fill the official request form from the government services catalogue.
  const applyForService = (svc) => {
    if (svc.name === 'Veterinary Visit Request') {
      setSelectedServiceId('vet_visit');
      setIsServiceModalOpen(true);
    } else if (svc.name === 'Irrigation Network Leak') {
      setSelectedServiceId('water_leak');
      setIsServiceModalOpen(true);
    } else if (svc.name === 'Rural Crafts Trade License') {
      setSelectedServiceId('trade_license');
      setIsServiceModalOpen(true);
    } else {
      setGovType(svc.type);
      setGovTitle(svc.name);
      setGovDesc(svc.desc);
      setGovAmount('');
      setGovSuccessMsg('');
      setGovErrorMsg('');
    }
  };

  useEffect(() => {
    fetchMyReports();
    fetchInventory();
    fetchMyGovRequests();
    fetchMyToursAndBookings();
    fetchEarnings();
    fetchRadarInsights();
    fetchTrips();

    // Periodically sync localStorage items to reflect live changes from the Tourist and Admin portals
    const interval = setInterval(() => {
      const savedAlerts = localStorage.getItem('eco_live_alerts');
      if (savedAlerts) setLiveAlerts(JSON.parse(savedAlerts));

      const savedSos = localStorage.getItem('eco_sos_feed');
      if (savedSos) setSosFeed(JSON.parse(savedSos));

      const savedStartups = localStorage.getItem('eco_startups');
      if (savedStartups) setStartups(JSON.parse(savedStartups));

      const savedOpps = localStorage.getItem('eco_opportunities');
      if (savedOpps) setOpportunities(JSON.parse(savedOpps));

      const savedSurveys = localStorage.getItem('eco_surveys');
      if (savedSurveys) setSurveys(JSON.parse(savedSurveys));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handlePostGovRequest = async (e) => {
    e.preventDefault();
    if (!govTitle || !govDesc) return;
    
    setGovIsSubmitting(true);
    setGovErrorMsg('');
    setGovSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/government-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          request_type: govType,
          title: govTitle,
          description: govDesc,
          amount_requested: govType === 'subsidy' && govAmount ? parseFloat(govAmount) : null
        })
      });
      
      if (res.ok) {
        setGovSuccessMsg('Governmental request submitted successfully to the environmental department.');
        setGovTitle('');
        setGovDesc('');
        setGovAmount('');
        fetchMyGovRequests();
      } else {
        const errData = await res.json();
        setGovErrorMsg(errData.detail || 'Failed to submit request.');
      }
    } catch (err) {
      setGovErrorMsg('Network error communicating with Eco backend.');
    } finally {
      setGovIsSubmitting(false);
    }
  };

  const handlePostReport = async (e) => {
    e.preventDefault();
    if (!title || !description) return;
    
    setIsSubmitting(true);
    setIsFetchingGps(true);
    setErrorMsg('');
    setSuccessMsg('');

    let latitude = 24.8151;
    let longitude = 56.1264;

    const postReportPayload = (lat, lng) => {
      return fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          category,
          latitude: lat,
          longitude: lng
        })
      });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          setIsFetchingGps(false);
          try {
            const res = await postReportPayload(latitude, longitude);
            if (res.ok) {
              setSuccessMsg('Report submitted successfully! AI analyzed routing completed.');
              setTitle('');
              setDescription('');
              fetchMyReports();
            } else {
              setErrorMsg('Failed to dispatch report. Check API services.');
            }
          } catch (err) {
            setErrorMsg('Network error communicating with Eco backend.');
          } finally { setIsSubmitting(false); }
        },
        async (err) => {
          setIsFetchingGps(false);
          try {
            const res = await postReportPayload(latitude, longitude);
            if (res.ok) {
              setSuccessMsg('Report submitted (Fallback GPS initialized).');
              setTitle('');
              setDescription('');
              fetchMyReports();
            }
          } catch (e) { setErrorMsg('Failed to write report.'); } 
          finally { setIsSubmitting(false); }
        }
      );
    } else {
      setIsFetchingGps(false);
      try {
        const res = await postReportPayload(latitude, longitude);
        if (res.ok) {
          setSuccessMsg('Report submitted with region defaults.');
          setTitle('');
          setDescription('');
          fetchMyReports();
        }
      } catch (e) { setErrorMsg('Failed to write report.'); } 
      finally { setIsSubmitting(false); }
    }
  };

  const handlePostResource = async (e) => {
    e.preventDefault();
    if (!postTitle || !postDesc) return;
    setInventoryMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: postTitle,
          description: postDesc,
          type: postType,
          price: postType === 'donate' ? 0 : parseFloat(postPrice),
          stock: parseInt(postStock)
        })
      });

      if (res.ok) {
        const resultData = await res.json();
        setInventoryMsg('Resource posted successfully to marketplace!');
        setNewlyCreatedProduct(resultData);
        setPostTitle('');
        setPostDesc('');
        setPostPrice(0);
        setPostStock(1);
        fetchInventory();
      } else {
        setInventoryMsg('Failed to post resource.');
      }
    } catch (err) {
      setInventoryMsg('Network error posting resource.');
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
        setInventoryMsg(type === 'sell' ? 'Purchase completed successfully! Funds credited to the seller wallet.' : 'Donation claimed successfully! Pickup details sent to your account.');
        fetchInventory();
        fetchEarnings();
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

  const renderMarketplace = () => {
    // Entry gate — choose how to enter the Eco Market
    if (!marketRole) {
      return (
        <div className="max-w-3xl mx-auto w-full">
          <div className="text-center mb-8">
            <span className="text-4xl">📦</span>
            <h2 className="text-2xl font-black text-zinc-100 mt-3">Welcome to the Eco Market</h2>
            <p className="text-sm text-zinc-400 mt-1">How would you like to enter today?</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <button
              onClick={() => { setMarketRole('buyer'); setFilterType('all'); }}
              className="group bg-[#15171e] border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-8 text-left transition-all shadow-lg"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-3xl mb-4 group-hover:scale-105 transition-transform">🛒</div>
              <h3 className="text-lg font-bold text-zinc-100 mb-1">Enter as a Buyer</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">Browse local produce, handicrafts, seeds, tools and corporate donations. Claim resources and place orders.</p>
              <span className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-emerald-400">Start Browsing →</span>
            </button>
            <button
              onClick={() => { setMarketRole('seller'); setFilterType('all'); }}
              className="group bg-[#15171e] border border-zinc-800 hover:border-[#c2964b]/50 rounded-2xl p-8 text-left transition-all shadow-lg"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#c2964b]/10 border border-[#c2964b]/30 flex items-center justify-center text-3xl mb-4 group-hover:scale-105 transition-transform">🏷️</div>
              <h3 className="text-lg font-bold text-zinc-100 mb-1">Enter as a Seller</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">List your farm produce and resources, manage your stock, and reach buyers across the community.</p>
              <span className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-[#c2964b]">Open Seller Tools →</span>
            </button>
          </div>
        </div>
      );
    }

    const filteredInventory = inventory.filter(item => {
      const matchQuery = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === 'all' ? true : item.type === filterType;
      let matchCategory = true;
      if (categoryFilter !== 'all') {
        const cat = MARKET_CATEGORIES.find(c => c.id === categoryFilter);
        const hay = `${item.title} ${item.description}`.toLowerCase();
        matchCategory = cat ? cat.keywords.some(k => hay.includes(k)) : true;
      }
      return matchQuery && matchType && matchCategory;
    });

    const totalListings = inventory.length;
    const forSaleCount = inventory.filter(i => i.type === 'sell').length;
    const donationCount = inventory.filter(i => i.type === 'donate').length;
    const inStockCount = inventory.filter(i => i.stock > 0).length;

    return (
      <div className="space-y-6 max-w-6xl mx-auto w-full">
        {/* Hero band */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800/60 bg-gradient-to-br from-[#10231b] via-[#15171e] to-[#1a1410] p-6 md:p-8">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute right-24 bottom-0 w-40 h-40 rounded-full bg-[#c2964b]/10 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {marketRole === 'seller' ? '🏷️ Seller Mode' : '🛒 Buyer Mode'}
                </span>
                <button onClick={() => setMarketRole(null)} className="text-[10px] font-bold text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 rounded-full px-2.5 py-1 transition-all">Switch</button>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-zinc-100">Smart Eco Market</h2>
              <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-md leading-relaxed">
                Trade local produce with AI demand forecasting, shared low-carbon delivery, and blockchain-verified provenance.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Live Listings', value: totalListings, tone: 'text-zinc-100' },
                { label: 'For Sale', value: forSaleCount, tone: 'text-blue-400' },
                { label: 'Donations', value: donationCount, tone: 'text-[#c2964b]' },
                { label: 'In Stock', value: inStockCount, tone: 'text-[#4ade80]' },
              ].map((s) => (
                <div key={s.label} className="bg-black/30 backdrop-blur border border-zinc-800/60 rounded-2xl px-4 py-2.5 min-w-[110px]">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">{s.label}</p>
                  <p className={`text-xl font-black ${s.tone}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Predictive Demand Analytics */}
        {marketRole === 'seller' && <DemandRadar />}

        {/* Seller-only: Crop Traceability Studio */}
        {marketRole === 'seller' && <TraceabilityStudio />}

        {inventoryMsg && (
          <div className="bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl">
            {inventoryMsg}
          </div>
        )}

        {/* Browse section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2"><span>🧺</span> Browse the Market</h3>
            <div className="flex items-center gap-2">
              <button onClick={fetchInventory} disabled={inventoryLoading} className="bg-[#1f222d] hover:bg-zinc-700 text-zinc-300 font-bold py-2 px-3.5 rounded-xl text-xs border border-zinc-700/50 transition-all disabled:opacity-50">
                {inventoryLoading ? 'Syncing…' : 'Refresh 🔄'}
              </button>
              {marketRole === 'seller' && (
                <button onClick={() => setIsPostModalOpen(true)} className="bg-[#247055] hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20">
                  <span>+</span> Post Resource
                </button>
              )}
            </div>
          </div>

          {/* Search + type filters */}
          <div className="bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between">
            <div className="flex-1 min-w-[200px] relative">
              <span className="absolute left-3 top-2.5 text-zinc-500">🔍</span>
              <input
                type="text"
                placeholder="Search date harvests, craft rugs, electronics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 outline-none text-zinc-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filterType === 'all' ? 'bg-zinc-800 text-zinc-200 border border-zinc-700' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}>All</button>
              <button onClick={() => setFilterType('sell')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filterType === 'sell' ? 'bg-zinc-800 text-zinc-200 border border-zinc-700' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}>Local Sales</button>
              <button onClick={() => setFilterType('donate')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filterType === 'donate' ? 'bg-[#c2964b] text-zinc-950' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}>Donations</button>
            </div>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            {MARKET_CATEGORIES.map((c) => {
              const count = c.id === 'all'
                ? inventory.length
                : inventory.filter(i => c.keywords.some(k => `${i.title} ${i.description}`.toLowerCase().includes(k))).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${categoryFilter === c.id ? 'bg-[#1b3d34] text-[#4ade80] border-emerald-900/50' : 'bg-[#15171e] text-zinc-400 border-zinc-800/60 hover:text-zinc-200 hover:border-zinc-700'}`}
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Product grid */}
          {inventoryLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#15171e] border border-zinc-800 rounded-2xl p-6 min-h-[300px] animate-pulse">
                  <div className="h-4 w-24 bg-zinc-800 rounded-full mb-8" />
                  <div className="h-16 w-16 bg-zinc-800 rounded-2xl mx-auto mb-8" />
                  <div className="h-4 w-3/4 bg-zinc-800 rounded mb-3" />
                  <div className="h-3 w-full bg-zinc-800/70 rounded mb-2" />
                  <div className="h-3 w-2/3 bg-zinc-800/70 rounded" />
                </div>
              ))}
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-2xl p-16 text-center">
              <div className="text-5xl mb-3 opacity-60">🛒</div>
              <p className="text-sm text-zinc-300 font-semibold">No resources match your filters</p>
              <p className="text-xs text-zinc-500 mt-1">Try a different search, switch category, or post the first resource.</p>
              {marketRole === 'seller' && (
                <button onClick={() => setIsPostModalOpen(true)} className="mt-5 bg-[#247055] hover:bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all">+ Post Resource</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredInventory.map(item => {
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
                  <div key={item.id} className="group bg-[#15171e] border border-zinc-800 hover:border-emerald-500/30 rounded-2xl overflow-hidden flex flex-col transition-all relative">
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

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${item.type === 'donate' ? 'bg-[#1b3d34] text-[#4ade80] border border-emerald-900/40' : 'bg-blue-950 text-blue-400 border border-blue-900/40'}`}>
                          {item.type === 'donate' ? 'DONATION' : 'SALE'}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${outOfStock ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50'}`}>
                          {outOfStock ? 'OUT OF STOCK' : `${item.stock} in stock`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1 text-[10px] text-[#c2964b] uppercase font-bold tracking-wider">
                          <span>📍</span> {item.type === 'donate' ? 'DUBAI' : 'HATTA REGION'}
                        </div>
                        {isMine && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">YOUR LISTING</span>}
                      </div>

                      <h4 className="text-base font-bold text-zinc-100 mb-1">{item.title}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed font-light mb-3 flex-1">{item.description}</p>
                      
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-4 border-t border-zinc-800/50 pt-2">
                        <span>Seller: <span className="text-zinc-400 font-semibold">{item.owner_name || 'EcoConnect'}</span></span>
                        {item.sold_count > 0 && <span>{item.sold_count} acquired</span>}
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-base font-black text-[#4ade80]">
                          {item.price === 0 ? 'FREE' : `${item.price} AED`}
                        </span>
                        <div className="flex items-center gap-1.5 mt-auto">
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
                              disabled={outOfStock || isMine || acquiringId === item.id}
                              className="bg-[#247055] hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-[#1f222d] disabled:text-zinc-400 cursor-pointer flex-1"
                            >
                              {acquiringId === item.id ? 'Claiming…' : isMine ? 'Your Item' : outOfStock ? 'Unavailable' : 'Claim Free'}
                            </button>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              disabled={outOfStock || isMine}
                              className="bg-emerald-600 hover:bg-emerald-555 text-white text-xs font-semibold px-3 py-2.5 rounded-xl transition-all disabled:opacity-35 disabled:cursor-not-allowed disabled:bg-[#1f222d] disabled:text-zinc-400 cursor-pointer animate-fadeIn flex-1"
                            >
                              {isMine ? 'Your Item' : outOfStock ? 'Unavailable' : 'Add to Cart 🛒'}
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



        {/* Priority-Based Resource Queue (Circular Economy) */}
        <div className="bg-[#15171e] border border-zinc-800/60 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start justify-between flex-wrap gap-2 mb-1">
            <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2"><span>⚖️</span> Priority Resource Claim Queue</h3>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-[#1b3d34] text-[#4ade80] border border-emerald-900/50 px-2 py-1 rounded-full">Transparent · First-Registered, First-Served</span>
          </div>
          <p className="text-[11px] text-zinc-400 mb-5">High-value corporate donations are allocated strictly by registration timing — no merit, no bias, fully auditable.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {DONATION_QUEUE.map((d) => (
              <div key={d.item} className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{d.icon}</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-zinc-200">{d.item}</h4>
                    <p className="text-[10px] text-zinc-500">Donated by {d.donor} · {d.units} units available</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {d.queue.map((q) => (
                    <div key={q.position} className={`flex items-center justify-between rounded-lg px-3 py-2 text-[11px] border ${q.name.startsWith('You') ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#15171e] border-zinc-850'}`}>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold flex items-center justify-center">{q.position}</span>
                        <span className={`font-semibold ${q.name.startsWith('You') ? 'text-[#4ade80]' : 'text-zinc-300'}`}>{q.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-600 font-mono">{q.registered}</span>
                        <span className={`font-bold ${q.status === 'Allocated' ? 'text-emerald-400' : q.status === 'Next in line' ? 'text-amber-400' : 'text-zinc-500'}`}>{q.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
              className="text-zinc-500 hover:text-zinc-350 text-sm font-bold border border-zinc-800 hover:border-zinc-700 rounded-lg px-2.5 py-1 transition-all cursor-pointer"
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

  const renderAiCare = () => {
    return (
      <div className="max-w-6xl mx-auto w-full space-y-6">
         <div className="mb-4 flex justify-between items-center bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌿</span>
              <div>
                <h2 className="text-md font-bold text-zinc-100">Environmental Incident Reporting</h2>
                <p className="text-[10px] text-zinc-400 font-mono">ECO <span className="text-blue-400">CONNECT</span> SYSTEM</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold bg-[#1b3d34] text-[#4ade80] border border-emerald-900/50 px-3 py-1.5 rounded-full">🦅 Powered by Falcon Local LLM</span>
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Submit Form */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-md font-bold text-emerald-400 mb-2 flex items-center gap-2">
                  <span>📣</span> Submit Eco-Incident Report
                </h3>
                <p className="text-xs text-zinc-400 mb-6">
                  File issues directly. Our on-device Falcon AI engine will automatically route your ticket.
                </p>

                {successMsg && <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl">{successMsg}</div>}
                {errorMsg && <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl">{errorMsg}</div>}

                <form onSubmit={handlePostReport} className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-500">Report Subject Title</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Damaged pipes" className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-zinc-500">Category</label>
                      <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none">
                        <option value="water">💧 Water Leakage</option>
                        <option value="soil">🍂 Soil Damage</option>
                        <option value="crop">🐛 Crop Pest / Rot</option>
                        <option value="waste">♻️ Waste Dumping</option>
                      </select>
                    </div>
                    
                    <div className="flex flex-col justify-end p-2 bg-[#0a0a0a] border border-zinc-850 rounded-xl">
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold">Metadata Lock</span>
                      <span className="text-[10px] text-teal-400 truncate">📍 GPS Tag Auto-Sealed</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-500">Situation Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4" className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" required />
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold py-3 px-4 rounded-xl text-xs disabled:opacity-50">
                    {isSubmitting ? "Processing..." : "📡 Dispatch Alert"}
                  </button>
                </form>
              </div>
            </div>

            {/* Logs */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2"><span>📋</span> Your Tickets</h3>
                  <button onClick={fetchMyReports} className="text-[10px] uppercase font-bold text-emerald-400">Refresh 🔄</button>
                </div>

                {reports.length === 0 ? (
                  <div className="border border-dashed border-zinc-850 rounded-xl p-12 text-center text-zinc-500 text-xs">No active tickets.</div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="bg-[#0a0a0a] border border-zinc-850 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-semibold text-zinc-200">{report.title}</h4>
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full">{report.status}</span>
                        </div>
                        <p className="text-xs text-zinc-400 font-light">{report.description}</p>
                        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                          <span>{report.latitude.toFixed(4)}°N, {report.longitude.toFixed(4)}°E</span>
                          <span className="text-emerald-500/80">Assigned: {report.assigned_dept}</span>
                        </div>
                        <div className="flex justify-end pt-1">
                          <a href={`${API_BASE}/api/reports/${report.id}/pdf`} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400 hover:text-emerald-300">📄 Download PDF</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
         </div>
      </div>
    );
  };

  const renderEcoTourism = () => {
    return (
      <div className="max-w-6xl mx-auto w-full space-y-6">
         <div className="mb-4 flex justify-between items-center bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⛺</span>
              <div>
                <h2 className="text-md font-bold text-zinc-100">Eco Business Hub</h2>
                <p className="text-[10px] text-zinc-400 font-mono">HOST EXPERIENCES &amp; AGRI-TOURISM</p>
              </div>
            </div>
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg h-fit">
              <h3 className="text-md font-bold text-emerald-400 mb-2 flex items-center gap-2">
                <span>➕</span> Offer New Experience
              </h3>
              <p className="text-xs text-zinc-400 mb-6 font-light">
                Host tourists in your farm or guide them through local trails. Create a sustainable income while preserving our heritage.
              </p>
              {tourMsg && <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl">{tourMsg}</div>}
              {tourError && <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl">{tourError}</div>}
              
              <form className="space-y-4" onSubmit={handleHostExperience}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">Experience Title</label>
                  <input type="text" value={tourTitle} onChange={(e) => setTourTitle(e.target.value)} placeholder="e.g. Hatta Date Harvesting Tour" className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-500">Price per Person (AED)</label>
                    <input type="number" value={tourPrice} onChange={(e) => setTourPrice(e.target.value)} placeholder="e.g. 150" className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-500">Region</label>
                    <input type="text" value={tourRegion} onChange={(e) => setTourRegion(e.target.value)} placeholder="e.g. Hatta (Dubai)" className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" required />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">Details</label>
                  <textarea rows="3" value={tourDetails} onChange={(e) => setTourDetails(e.target.value)} placeholder="Describe the activities..." className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" required />
                </div>
                <button type="submit" className="w-full bg-[#247055] hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg text-xs cursor-pointer">
                  Publish Experience 🌍
                </button>
              </form>
            </div>
 
            <div className="space-y-6">
              <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-md font-bold text-zinc-100 mb-6 flex items-center gap-2">
                  <span>📅</span> Your Active Listings
                </h3>
                <div className="space-y-4">
                  {myTours.length === 0 ? (
                    <div className="border border-dashed border-zinc-850 rounded-xl p-8 text-center text-zinc-500 text-xs">
                      No active ecotourism listings found.
                    </div>
                  ) : (
                    myTours.map((t) => {
                      const bookCount = tourBookings.filter(b => b.tour_title === t.title).length;
                      return (
                        <div key={t.id} className="bg-[#0a0a0a] border border-zinc-850 p-4 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-semibold text-zinc-200">{t.title}</h4>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">Active</span>
                          </div>
                          <p className="text-xs text-zinc-400 font-light mb-3">{t.description}</p>
                          <div className="flex justify-between text-xs text-zinc-500 font-mono">
                            <span>{t.price} AED / person</span>
                            <span className="text-blue-400">{bookCount} Upcoming Bookings</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-md font-bold text-teal-400 mb-6 flex items-center gap-2">
                  <span>🗓️</span> Guest Reservations
                </h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {tourBookings.length === 0 ? (
                    <div className="text-center py-6 text-zinc-600 text-xs">
                      No bookings recorded for your tours.
                    </div>
                  ) : (
                    tourBookings.map((b) => (
                      <div key={b.id} className="bg-[#0a0a0a] border border-zinc-850 p-3 rounded-xl text-xs flex justify-between items-center">
                        <div>
                          <span className="text-zinc-200 font-semibold block">{b.visitor_name}</span>
                          <span className="text-zinc-500 block text-[9px] truncate max-w-[150px]">{b.tour_title} • {b.booking_date}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-emerald-400 font-bold block">{b.total_price} AED</span>
                          <span className="text-[9px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-mono">{b.slots} slots</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
         </div>
         <div className="mt-8">
           <FarmToHub />
         </div>
      </div>
    );
  };

  const renderMyFarm = () => {
    const waterPct = Math.round((MY_FARM.water.used / MY_FARM.water.quota) * 100);
    const healthTone = (h) => h === 'Healthy' ? 'text-[#4ade80] bg-emerald-500/10 border-emerald-500/30' : h === 'Watch' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    return (
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Live eco-intelligence KPI snapshot */}
        <EcoKpiGrid />
        <FarmTelemetry />

        <div className="flex flex-wrap justify-between items-center gap-3 bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌾</span>
            <div>
              <h2 className="text-md font-bold text-zinc-100">{MY_FARM.name}</h2>
              <p className="text-[10px] text-zinc-400 font-mono">{MY_FARM.region.toUpperCase()} · {MY_FARM.area}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => exportReportPdf({
                title: 'Farm Intelligence Report',
                kpis: [
                  { label: 'Health Score', value: `${MY_FARM.healthScore}/100` },
                  { label: 'Active Crops', value: String(MY_FARM.crops.length) },
                  { label: 'Livestock', value: String(MY_FARM.livestock.reduce((a, l) => a + l.count, 0)) },
                  { label: 'Water Used', value: `${waterPct}%` },
                ],
                sections: [
                  { heading: 'Farm Overview', rows: [['Farm', MY_FARM.name], ['Region', MY_FARM.region], ['Area', MY_FARM.area]] },
                  { heading: 'Crop Field Status', rows: MY_FARM.crops.map((c) => [c.name, c.health]) },
                  { heading: 'Livestock', rows: MY_FARM.livestock.map((l) => [l.name, `${l.count} head`]) },
                  { heading: 'Open Tasks', rows: MY_FARM.tasks.filter((t) => !t.done).map((t) => [t.label, t.due]) },
                ],
              })}
              className="border border-[#9b7a36]/50 text-[#c2a14e] hover:bg-[#9b7a36]/10 font-semibold px-3 py-2 rounded-xl text-xs transition-all"
            >
              ⬇️ Farm Report (PDF)
            </button>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Farm Health Score</p>
              <p className="text-2xl font-black text-[#4ade80]">{MY_FARM.healthScore}<span className="text-sm text-zinc-500">/100</span></p>
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Active Crops', value: MY_FARM.crops.length, icon: '🌱', tone: 'text-[#4ade80]' },
            { label: 'Livestock Heads', value: MY_FARM.livestock.reduce((a, l) => a + l.count, 0), icon: '🐪', tone: 'text-zinc-100' },
            { label: 'Open Tasks', value: MY_FARM.tasks.filter(t => !t.done).length, icon: '📋', tone: 'text-amber-400' },
            { label: 'Water Used', value: `${waterPct}%`, icon: '💧', tone: 'text-blue-400' },
          ].map((s) => (
            <div key={s.label} className="bg-[#15171e] border border-zinc-800/60 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">{s.label}</span>
                <span className="text-base">{s.icon}</span>
              </div>
              <p className={`text-2xl font-black mt-1 ${s.tone}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* AI Planting Planner — predictive demand */}
        {marketRole === 'seller' && <DemandRadar compact />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crops */}
          <div className="lg:col-span-2 bg-[#15171e] border border-zinc-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-md font-bold text-zinc-100 mb-4 flex items-center gap-2"><span>🌿</span> Crop Field Status</h3>
            <div className="space-y-4">
              {MY_FARM.crops.map((c) => (
                <div key={c.name} className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.icon}</span>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-200">{c.name}</h4>
                        <p className="text-[10px] text-zinc-500">Stage: {c.stage}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full border ${healthTone(c.health)}`}>{c.health}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${c.progress}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Water + Livestock */}
          <div className="space-y-6">
            <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-md font-bold text-zinc-100 mb-3 flex items-center gap-2"><span>💧</span> Water Quota</h3>
              <div className="flex justify-between text-[10px] text-zinc-500 mb-1"><span>{MY_FARM.water.used} {MY_FARM.water.unit}</span><span>{MY_FARM.water.quota} cap</span></div>
              <div className="h-2.5 rounded-full bg-zinc-800 overflow-hidden"><div className={`h-full ${waterPct > 85 ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`} style={{ width: `${waterPct}%` }} /></div>
              <p className="text-[10px] text-zinc-500 mt-2">{100 - waterPct}% of your monthly allocation remaining.</p>
            </div>
            <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-md font-bold text-zinc-100 mb-4 flex items-center gap-2"><span>🐐</span> Livestock</h3>
              <div className="grid grid-cols-2 gap-3">
                {MY_FARM.livestock.map((l) => (
                  <div key={l.name} className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-3">
                    <div className="text-xl mb-1">{l.icon}</div>
                    <p className="text-lg font-black text-zinc-100 leading-none">{l.count}</p>
                    <p className="text-[10px] text-zinc-500">{l.name} · <span className="text-emerald-400">{l.note}</span></p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pest & Disease Control */}
        <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-6 shadow-lg">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🐛</span>
              <div>
                <h3 className="text-md font-bold text-zinc-100">Pest &amp; Disease Control</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Integrated pest management (IPM) watchlist across your active fields.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">{PEST_WATCH.filter(p => p.severity === 'High').length} High</span>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">{PEST_WATCH.filter(p => p.severity === 'Medium').length} Medium</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{PEST_WATCH.filter(p => p.severity === 'Low').length} Low</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PEST_WATCH.map((p) => {
              const tone = p.severity === 'High'
                ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                : p.severity === 'Medium'
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
              const barColor = p.severity === 'High' ? 'bg-rose-500' : p.severity === 'Medium' ? 'bg-amber-400' : 'bg-emerald-500';
              return (
                <div key={p.id} className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.icon}</span>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-200">{p.name}</h4>
                        <p className="text-[10px] text-zinc-500">{p.type} · {p.crop}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full border ${tone}`}>{p.severity}</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[9px] uppercase font-bold tracking-wider text-zinc-500 mb-1">
                      <span>Risk Index</span><span>{p.risk}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden"><div className={`h-full ${barColor}`} style={{ width: `${p.risk}%` }} /></div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[11px] text-zinc-400"><span className="text-zinc-500 font-bold">Symptoms: </span>{p.symptoms}</p>
                    <p className="text-[11px] text-emerald-300/90"><span className="text-emerald-500 font-bold">Treatment: </span>{p.action}</p>
                  </div>

                  <button
                    onClick={() => { setActiveTab('gov-connect'); setGovConnectTab('ai-care'); }}
                    className="w-full text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-900/50 bg-[#1b3d34]/40 hover:bg-[#1b3d34] rounded-lg py-2 transition-all"
                  >
                    📣 Log to AI Care
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-md font-bold text-zinc-100 mb-4 flex items-center gap-2"><span>📋</span> Farm Task Schedule</h3>
          <div className="space-y-2">
            {MY_FARM.tasks.map((t, i) => (
              <div key={i} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${t.done ? 'bg-[#0a0a0a] border-zinc-850 opacity-60' : 'bg-[#0a0a0a] border-zinc-850'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{t.icon}</span>
                  <span className={`text-sm ${t.done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>{t.label}</span>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${t.done ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{t.done ? 'Done ✓' : t.due}</span>
              </div>
            ))}
          </div>
        </div>

        {/* IoT Telemetry & Automated Valve Controller */}
        <div className="bg-[#15171e] border border-emerald-900/40 rounded-2xl p-6 shadow-lg">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
            <div>
              <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2">
                <span>🛰️</span> Smart IoT Telemetry & Drip Irrigation
              </h3>
              <p className="text-[11px] text-zinc-550 mt-0.5">Real-time aquifer water conservation telemetry & valve override automation.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${valveOpen ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500' : 'bg-zinc-600'}`} />
              <span className="text-[10.5px] uppercase font-mono font-bold text-zinc-400">
                Valve Status: {valveOpen ? 'Open (Irrigating)' : 'Closed'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Live Readouts */}
            <div className="md:col-span-2 grid grid-cols-3 gap-3">
              <div className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 block">Soil Moisture</span>
                  <span className="text-2xl font-black text-blue-450 mt-1 block">{soilMoisture}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${soilMoisture}%` }} />
                </div>
              </div>
              <div className="bg-[#0a0a0a] border border-[#a6802b]/20 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] uppercase font-mono font-bold text-[#c2964b] block">Ambient Temp</span>
                  <span className="text-2xl font-black text-[#c2964b] mt-1 block">{ambientTemp}°C</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-[#c2964b] transition-all duration-500" style={{ width: `${(ambientTemp / 50) * 100}%` }} />
                </div>
              </div>
              <div className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 block">Humidity</span>
                  <span className="text-2xl font-black text-teal-450 mt-1 block">{ambientHumid}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-teal-400 transition-all duration-500" style={{ width: `${ambientHumid}%` }} />
                </div>
              </div>
            </div>

            {/* Smart Valve Switchboard */}
            <div className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Control Mode</span>
                <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                  <button
                    onClick={() => { setValveMode('smart'); }}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition-all cursor-pointer ${valveMode === 'smart' ? 'bg-[#15171e] text-[#4ade80] shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Smart Auto
                  </button>
                  <button
                    onClick={() => { setValveMode('manual'); }}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition-all cursor-pointer ${valveMode === 'manual' ? 'bg-[#15171e] text-amber-400 shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Manual
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-zinc-900">
                <span className="text-[10px] text-zinc-400 font-medium">Valve Solenoid</span>
                <button
                  onClick={() => { if (valveMode === 'manual') setValveOpen(!valveOpen); }}
                  disabled={valveMode === 'smart'}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    valveMode === 'smart' 
                      ? 'bg-[#0f1115] text-zinc-600 border border-zinc-900 cursor-not-allowed' 
                      : valveOpen 
                        ? 'bg-rose-950/40 text-rose-450 border border-rose-900/50 hover:bg-rose-900/40 cursor-pointer' 
                        : 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/50 hover:bg-emerald-900/40 cursor-pointer'
                  }`}
                >
                  {valveOpen ? 'Override Close' : 'Override Open'}
                </button>
              </div>
            </div>
          </div>

          {/* Animated Water flow line */}
          {valveOpen && (
            <div className="mt-4 bg-[#0a0a0a] border border-blue-900/30 rounded-xl p-3 flex items-center justify-between gap-3 animate-fadeIn">
              <span className="text-[10px] text-blue-450 font-bold tracking-wide flex items-center gap-1.5">
                <span className="animate-spin text-sm">🌀</span> Water flow active (15 L/min)
              </span>
              <div className="flex-1 h-1.5 bg-blue-950/40 rounded-full relative overflow-hidden mx-4">
                <div 
                  className="h-full rounded-full" 
                  style={{
                    width: '100%',
                    backgroundImage: 'repeating-linear-gradient(90deg, #3b82f6 0px, #22d3ee 10px, #3b82f6 20px)',
                    backgroundSize: '40px 100%',
                    animation: 'waterFlow 0.8s linear infinite'
                  }}
                />
              </div>
              <span className="text-[9px] text-zinc-550 font-mono">Conserving Aquifer Head</span>
            </div>
          )}

          <style>{`
            @keyframes waterFlow {
              0% { background-position: 0px 0; }
              100% { background-position: 40px 0; }
            }
          `}</style>
        </div>
      </div>
    );
  };

  const renderEmployees = () => {
    const statusTone = (s) => s === 'On Duty' ? 'text-[#4ade80] bg-emerald-500/10 border-emerald-500/30' : s === 'On Leave' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30';
    const onDuty = staffList.filter(e => e.status === 'On Duty').length;
    const avgAttendance = Math.round(staffList.reduce((a, e) => a + e.attendance, 0) / staffList.length);
    const totalPayroll = staffList.reduce((a, e) => a + e.wage, 0);

    const handlePaySalary = (name, wage) => {
      alert(`💸 Wage Payment Successful!\n\nMonthly salary of ${wage.toLocaleString()} AED paid to ${name}.\nTransaction has been successfully committed to the Ministry Agricultural Ledger.`);
    };

    const handleMessageEmployee = (name) => {
      const text = prompt(`Message ${name}:`, 'Hello, please inspect irrigation sector B today.');
      if (text) {
        alert(`✉️ Message sent to ${name}: "${text}"`);
      }
    };

    return (
      <div className="max-w-6xl mx-auto w-full space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-3 bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👷</span>
            <div>
              <h2 className="text-md font-bold text-zinc-100">Farm Workforce</h2>
              <p className="text-[10px] text-zinc-400 font-mono">STAFF · ATTENDANCE &amp; PAYROLL MANAGEMENT</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddEmpModal(true)}
            className="bg-[#247055] hover:bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20 border-0 cursor-pointer"
          >
            <span>+</span> Add Employee
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Staff', value: staffList.length, icon: '👥', tone: 'text-zinc-100' },
            { label: 'On Duty Now', value: onDuty, icon: '✅', tone: 'text-[#4ade80]' },
            { label: 'Avg Attendance', value: `${avgAttendance}%`, icon: '📅', tone: 'text-blue-400' },
            { label: 'Monthly Payroll', value: `${totalPayroll.toLocaleString()} AED`, icon: '💵', tone: 'text-[#c2964b]' },
          ].map((s) => (
            <div key={s.label} className="bg-[#15171e] border border-zinc-800/60 rounded-2xl p-4 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">{s.label}</span>
                <span className="text-base">{s.icon}</span>
              </div>
              <p className={`text-xl font-black mt-1 ${s.tone}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Staff cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {staffList.map((e) => (
            <div key={e.id} className="bg-[#15171e] border border-zinc-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs uppercase">{e.avatar}</div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-200">{e.name}</h4>
                    <p className="text-[10px] text-zinc-500">{e.role} · {e.id}</p>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-1 rounded-full border ${statusTone(e.status)}`}>{e.status}</span>
              </div>

              <div className="flex items-center gap-2 mb-3 text-[11px] text-zinc-400">
                <span>🕑 {e.shift}</span>
                <span className="text-zinc-700">|</span>
                <span className="text-zinc-500">{(empTasks[e.id] || []).length} task{(empTasks[e.id] || []).length === 1 ? '' : 's'}</span>
              </div>

              {/* Task checklist */}
              <div className="mb-3 space-y-1.5">
                {(empTasks[e.id] || []).length === 0 && (
                  <p className="text-[10px] text-zinc-600 italic">No tasks assigned yet.</p>
                )}
                {(empTasks[e.id] || []).map((t, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 bg-[#1f222d] border border-zinc-800 rounded-lg px-2.5 py-1.5">
                    <span className="text-[11px] text-zinc-300 truncate">📋 {t}</span>
                    <button
                      type="button"
                      onClick={() => removeEmployeeTask(e.id, i)}
                      className="text-zinc-600 hover:text-red-400 text-xs leading-none transition-colors shrink-0 bg-transparent border-0 cursor-pointer"
                      aria-label="Remove task"
                    >✕</button>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="text"
                    value={taskDrafts[e.id] || ''}
                    onChange={(ev) => setTaskDrafts((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                    onKeyDown={(ev) => { if (ev.key === 'Enter') { ev.preventDefault(); addEmployeeTask(e.id); } }}
                    placeholder="Assign a new task…"
                    className="flex-1 bg-[#0f1115] border border-zinc-800 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-300 outline-none placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => addEmployeeTask(e.id)}
                    className="text-[10px] font-bold text-emerald-400 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 rounded-lg px-3 py-1.5 transition-all shrink-0 cursor-pointer"
                  >+ Add Task</button>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-zinc-550 mb-1"><span>Attendance</span><span>{e.attendance}%</span></div>
                <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden"><div className={`h-full ${e.attendance >= 90 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-amber-500'}`} style={{ width: `${e.attendance}%` }} /></div>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-850 pt-3">
                <div>
                  <p className="text-[9px] uppercase text-zinc-550 font-bold">Monthly Wage</p>
                  <p className="text-sm font-black text-[#4ade80]">{e.wage.toLocaleString()} AED</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMessageEmployee(e.name)}
                    className="text-[10px] font-bold text-zinc-300 bg-[#1f222d] hover:bg-zinc-700 border border-zinc-700/50 rounded-lg px-3 py-1.5 transition-all cursor-pointer"
                  >Message</button>
                  <button
                    onClick={() => handlePaySalary(e.name, e.wage)}
                    className="text-[10px] font-bold text-emerald-450 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 rounded-lg px-3 py-1.5 transition-all cursor-pointer"
                  >Pay</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Employee Modal */}
        {showAddEmpModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#15171e] border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 text-left font-sans shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-zinc-100">Add New Employee</h3>
                <button onClick={() => setShowAddEmpModal(false)} className="text-zinc-550 hover:text-zinc-350 bg-transparent border-0 cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleAddEmployeeSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wide">Employee Name</label>
                  <input
                    type="text"
                    required
                    value={newEmpName}
                    onChange={(ev) => setNewEmpName(ev.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="bg-[#0f1115] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wide">Clearance Role</label>
                  <input
                    type="text"
                    required
                    value={newEmpRole}
                    onChange={(ev) => setNewEmpRole(ev.target.value)}
                    placeholder="e.g. Senior Farm Hand"
                    className="bg-[#0f1115] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wide">Monthly Wage (AED)</label>
                    <input
                      type="number"
                      required
                      value={newEmpWage}
                      onChange={(ev) => setNewEmpWage(ev.target.value)}
                      placeholder="4500"
                      className="bg-[#0f1115] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wide">Shift Hours</label>
                    <input
                      type="text"
                      required
                      value={newEmpShift}
                      onChange={(ev) => setNewEmpShift(ev.target.value)}
                      placeholder="06:00 – 14:00"
                      className="bg-[#0f1115] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#247055] hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0 mt-2"
                >
                  Confirm Registration 🚀
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCommunity = () => {
    return (
      <div className="max-w-6xl mx-auto w-full space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-3 bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <h2 className="text-md font-bold text-zinc-100">Farmer Community Network</h2>
              <p className="text-[10px] text-zinc-400 font-mono">{MY_FARM.region.toUpperCase()} · PEER SUPPORT &amp; KNOWLEDGE SHARING</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div><p className="text-lg font-black text-zinc-100">{COMMUNITY.members.toLocaleString()}</p><p className="text-[9px] uppercase text-zinc-500">Members</p></div>
            <div><p className="text-lg font-black text-[#4ade80] flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />{COMMUNITY.online}</p><p className="text-[9px] uppercase text-zinc-500">Online</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-[10px] uppercase">{name ? name.substring(0, 2) : 'UA'}</div>
              <input type="text" placeholder="Share an update, ask the community…" className="flex-1 bg-[#0a0a0a] border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-300 outline-none focus:border-emerald-500" />
              <button className="bg-[#247055] hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all">Post</button>
            </div>
            {COMMUNITY.posts.map((p, i) => (
              <div key={i} className="bg-[#15171e] border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-[10px]">{p.avatar}</div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">{p.author}</p>
                      <p className="text-[10px] text-zinc-500">📍 {p.region} · {p.time}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#1b3d34] text-[#4ade80] border border-emerald-900/50 px-2 py-1 rounded-full">{p.tag}</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed mb-3">{p.text}</p>
                <div className="flex items-center gap-5 text-[11px] text-zinc-500">
                  <button className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">👍 {p.likes}</button>
                  <button className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">💬 {p.comments}</button>
                  <button className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">↗ Share</button>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar: events + groups */}
          <div className="space-y-6">
            <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-md font-bold text-zinc-100 mb-4 flex items-center gap-2"><span>📅</span> Upcoming Events</h3>
              <div className="space-y-3">
                {COMMUNITY.events.map((e, i) => (
                  <div key={i} className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{e.icon}</span>
                      <h4 className="text-xs font-semibold text-zinc-200 flex-1">{e.name}</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-mono">{e.date}</span>
                      <span className="text-[10px] text-emerald-400 font-bold">{e.going} going</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-md font-bold text-zinc-100 mb-4 flex items-center gap-2"><span>🌐</span> Interest Groups</h3>
              <div className="space-y-2">
                {COMMUNITY.groups.map((g, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#0a0a0a] border border-zinc-850 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{g.icon}</span>
                      <span className="text-xs font-semibold text-zinc-200">{g.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">{g.members}</span>
                      <button className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300">Join</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-md font-bold text-zinc-100 mb-4 flex items-center gap-2"><span>🏛️</span> Gov Programs & Subsidies</h3>
              <div className="space-y-3">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-3">
                    <h4 className="text-xs font-bold text-emerald-400 mb-1">{opp.title}</h4>
                    <p className="text-[10px] text-zinc-550 leading-relaxed font-light mb-2">{opp.desc}</p>
                    <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                      <span>{opp.date}</span>
                      <button className="text-emerald-400 hover:text-emerald-350 font-bold uppercase">Apply Now →</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGovRequests = () => {
    return (
      <div className="max-w-6xl mx-auto w-full space-y-6">
         <div className="mb-4 flex justify-between items-center bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏛️</span>
              <div>
                <h2 className="text-md font-bold text-zinc-100">Governmental Requests & Permitting</h2>
                <p className="text-[10px] text-zinc-400 font-mono">FEDERAL ENVIRONMENT & FARMER SUPPORT</p>
              </div>
            </div>
         </div>

         {/* Government Services Catalogue */}
         <div className="bg-[#15171e] border border-zinc-800/60 p-6 rounded-2xl shadow-lg">
            <h3 className="text-md font-bold text-zinc-100 mb-1 flex items-center gap-2"><span>🗂️</span> Available Government Services</h3>
            <p className="text-[11px] text-zinc-400 mb-5">Select a service to instantly pre-fill an official request below.</p>
            <div className="space-y-6">
              {GOV_SERVICES.map((group) => (
                <div key={group.category}>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-lg">{group.icon}</span>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">{group.category}</h4>
                    <span className="text-[9px] text-zinc-500 font-mono border border-zinc-800 rounded px-1.5 py-0.5">{group.agency}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    {group.services.map((svc) => (
                      <button
                        key={svc.name}
                        type="button"
                        onClick={() => applyForService(svc)}
                        className="text-left bg-[#0a0a0a] border border-zinc-850 hover:border-emerald-500/50 hover:bg-[#1a2024] rounded-xl p-4 transition-all group"
                      >
                        <div className="text-xl mb-2">{svc.icon}</div>
                        <h5 className="text-xs font-semibold text-zinc-200 group-hover:text-[#4ade80] mb-1">{svc.name}</h5>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">{svc.desc}</p>
                        <span className="mt-2 inline-block text-[9px] font-bold text-[#4ade80] uppercase">Apply →</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Submit Request Form */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-md font-bold text-emerald-400 mb-2 flex items-center gap-2">
                  <span>📨</span> Submit Official Request
                </h3>
                <p className="text-xs text-zinc-400 mb-6">
                  Apply for agricultural subsidies, water quota increases, or environmental permits.
                </p>

                {govSuccessMsg && <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl">{govSuccessMsg}</div>}
                {govErrorMsg && <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl">{govErrorMsg}</div>}

                <form onSubmit={handlePostGovRequest} className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-500">Request Type</label>
                    <select value={govType} onChange={(e) => setGovType(e.target.value)} className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none">
                      <option value="subsidy">💵 Financial Subsidy / Grant</option>
                      <option value="water_quota">💧 Water Quota Increase</option>
                      <option value="equipment">🚜 Equipment Support</option>
                      <option value="permit">📜 Environmental Permit</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-500">Request Title</label>
                    <input type="text" value={govTitle} onChange={(e) => setGovTitle(e.target.value)} placeholder="e.g. Sidr Palm Organic Fertilizer Grant" className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" required />
                  </div>

                  {govType === 'subsidy' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-zinc-500">Requested Amount (AED)</label>
                      <input type="number" value={govAmount} onChange={(e) => setGovAmount(e.target.value)} placeholder="e.g. 15000" className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" required />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-500">Description & Justification</label>
                    <textarea value={govDesc} onChange={(e) => setGovDesc(e.target.value)} rows="4" placeholder="Detail your request requirements and why support is needed..." className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" required />
                  </div>

                  <button type="submit" disabled={govIsSubmitting} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold py-3 px-4 rounded-xl text-xs disabled:opacity-50 transition-all">
                    {govIsSubmitting ? "Submitting..." : "🏛️ Send Request to Gov"}
                  </button>
                </form>
              </div>
            </div>

            {/* Submitted Requests List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2"><span>📋</span> Request Tracker</h3>
                  <button onClick={fetchMyGovRequests} className="text-[10px] uppercase font-bold text-emerald-400">Refresh 🔄</button>
                </div>

                {govRequests.length === 0 ? (
                  <div className="border border-dashed border-zinc-850 rounded-xl p-12 text-center text-zinc-500 text-xs">No government requests submitted yet.</div>
                ) : (
                  <div className="space-y-4">
                    {govRequests.map((req) => (
                      <div key={req.id} className="bg-[#0a0a0a] border border-zinc-850 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 mr-2 font-mono">
                              {req.request_type === 'subsidy' ? '💵 Subsidy' :
                               req.request_type === 'water_quota' ? '💧 Water' :
                               req.request_type === 'equipment' ? '🚜 Equipment' : '📜 Permit'}
                            </span>
                            <h4 className="text-sm font-semibold text-zinc-200 inline-block">{req.title}</h4>
                          </div>
                          <span className={`text-[10px] border px-2 py-0.5 rounded-full font-bold ${
                            req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            req.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          }`}>{req.status}</span>
                        </div>
                        <p className="text-xs text-zinc-400 font-light">{req.description}</p>
                        <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono pt-1">
                          <span>Submitted: {req.created_at}</span>
                          {req.amount_requested !== null && (
                            <span className="text-[#4ade80] font-bold">Requested: {req.amount_requested} AED</span>
                          )}
                        </div>
                        {req.status === 'Approved' && (
                          <div className="flex justify-end pt-2 border-t border-zinc-900/50 mt-1">
                            <a 
                              href={`${API_BASE}/api/government-requests/${req.id}/pdf`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[10px] text-[#4ade80] hover:text-emerald-300 font-semibold flex items-center gap-1"
                            >
                              Download Permit Certificate 📄
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
         </div>
      </div>
    );
  };

  const renderEarnings = () => {
    const data = earningsData || { total_earnings: 0, tour_earnings: 0, marketplace_earnings: 0, bookings_count: 0, sales_count: 0, ledger: [] };
    
    return (
      <div className="max-w-6xl mx-auto w-full space-y-6">
         <div className="mb-4 flex justify-between items-center bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💳</span>
              <div>
                <h2 className="text-md font-bold text-zinc-100">Farmer Ledger & Earnings Statement</h2>
                <p className="text-[10px] text-zinc-400 font-mono">FINANCIAL INTEGRITY LEDGER</p>
              </div>
            </div>
            <button onClick={fetchEarnings} className="text-[10px] uppercase font-bold text-emerald-400 cursor-pointer">Sync Ledger 🔄</button>
         </div>

         {/* Green Fintech Digital Wallet — part of the Financial Ledger */}
         <div className="rounded-2xl border border-emerald-800/40 bg-gradient-to-r from-[#0d2a1f] via-[#10231b] to-[#0a0a0a] p-5 shadow-lg shadow-emerald-950/30">
           <div className="flex flex-wrap items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl">💚</div>
               <div>
                 <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/80">Green Wallet · {GREEN_WALLET.walletId}</p>
                 <p className="text-3xl font-black text-zinc-100 leading-tight">
                   {GREEN_WALLET.balance.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                   <span className="text-sm font-bold text-emerald-400 ml-1">{GREEN_WALLET.currency}</span>
                 </p>
                 <p className="text-[10px] text-zinc-500">Instant settlements from Eco-Market sales &amp; government subsidies</p>
               </div>
             </div>
             <div className="flex items-center gap-2">
               <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all">↑ Send</button>
               <button className="bg-[#1f222d] hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-zinc-700/50 transition-all">↓ Top Up</button>
             </div>
           </div>
           <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
             {GREEN_WALLET.activity.map((tx, i) => (
               <div key={i} className="bg-[#0a0a0a]/60 border border-zinc-850 rounded-xl px-3 py-2">
                 <div className="flex items-center gap-1.5 text-[10px] text-zinc-400"><span>{tx.icon}</span><span className="truncate">{tx.label}</span></div>
                 <div className="flex justify-between items-center mt-1">
                   <span className={`text-xs font-bold ${tx.amount >= 0 ? 'text-[#4ade80]' : 'text-rose-400'}`}>{tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)}</span>
                   <span className="text-[9px] text-zinc-600">{tx.when}</span>
                 </div>
               </div>
             ))}
           </div>
         </div>

         {/* Summary Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
           <div className="bg-[#15171e] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
             <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider font-mono">Gross Total Earnings</span>
             <span className="text-3xl font-black text-[#4ade80] mt-3">{data.total_earnings.toFixed(2)} AED</span>
             <span className="text-[10px] text-zinc-500 mt-2 font-mono">Combined revenue streams</span>
           </div>
           
           <div className="bg-[#15171e] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
             <span className="text-zinc-550 text-[10px] uppercase font-bold tracking-wider font-mono">Ecotourism Guides</span>
             <span className="text-3xl font-black text-emerald-400 mt-3">{data.tour_earnings.toFixed(2)} AED</span>
             <span className="text-[10px] text-zinc-500 mt-2 font-mono">{data.bookings_count} bookings processed</span>
           </div>

           <div className="bg-[#15171e] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
             <span className="text-zinc-550 text-[10px] uppercase font-bold tracking-wider font-mono">Marketplace Sales</span>
             <span className="text-3xl font-black text-teal-400 mt-3">{data.marketplace_earnings.toFixed(2)} AED</span>
             <span className="text-[10px] text-zinc-500 mt-2 font-mono">{data.sales_count} sales transactions</span>
           </div>
         </div>

         {/* Micro-Finance & Khalifa Fund Loan Estimator */}
         <div className="bg-[#15171e] border border-[#c2964b]/40 rounded-2xl p-6 shadow-lg">
           <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
             <div>
               <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2">
                 <span>🤝</span> Khalifa Fund Subsidized Micro-Finance Calculator
               </h3>
               <p className="text-xs text-zinc-550 mt-0.5">Model interest-free capital expansion loans and apply directly under the MOCCAE Rural Growth Grant scheme.</p>
             </div>
             <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-emerald-450 border border-emerald-900/50 bg-[#1b3d34]/60 rounded-full px-2.5 py-1">
               0% Subsidized Interest
             </span>
           </div>

           {loanApplied ? (
             <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-6 text-center animate-fadeIn animate-duration-300">
               <span className="text-3xl block mb-2">✅</span>
               <h4 className="text-sm font-bold text-emerald-400">Application Successfully Dispatched!</h4>
               <p className="text-xs text-zinc-350 mt-1 max-w-lg mx-auto leading-relaxed">
                 Your request for a <strong>{loanAmount.toLocaleString()} AED</strong> interest-free loan has been sent to the Khalifa Fund & MOCCAE Audit Board.
               </p>
               <p className="text-[10px] text-zinc-500 font-mono mt-3">Application Reference: {loanRef} · Status: Under Review</p>
               <button 
                 onClick={() => { setLoanApplied(false); }}
                 className="mt-4 text-[10px] font-bold text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-4 py-2 cursor-pointer"
               >
                 Recalculate or Edit Application
               </button>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-4">
                 <div>
                   <div className="flex justify-between text-xs font-semibold mb-1">
                     <span className="text-zinc-350">Requested Principal</span>
                     <span className="text-emerald-450 font-mono">{loanAmount.toLocaleString()} AED</span>
                   </div>
                   <input 
                     type="range"
                     min="5000"
                     max="150000"
                     step="5000"
                     value={loanAmount}
                     onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                     className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#c2964b]"
                   />
                   <p className="text-[8.5px] text-zinc-550 mt-1">Min: 5k AED · Max: 150k AED</p>
                 </div>

                 <div>
                   <div className="flex justify-between text-xs font-semibold mb-1">
                     <span className="text-zinc-350">Repayment Period</span>
                     <span className="text-amber-500 font-mono">{loanMonths} Months</span>
                   </div>
                   <input 
                     type="range"
                     min="12"
                     max="60"
                     step="6"
                     value={loanMonths}
                     onChange={(e) => setLoanMonths(parseInt(e.target.value))}
                     className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#c2964b]"
                   />
                   <p className="text-[8.5px] text-zinc-550 mt-1">Min: 1 Year · Max: 5 Years</p>
                 </div>
               </div>

               {/* Calculations Column */}
               <div className="bg-[#0a0a0a]/60 border border-zinc-850 rounded-xl p-5 flex flex-col justify-between">
                 <div className="space-y-2">
                   <div className="flex justify-between text-xs">
                     <span className="text-zinc-500">Interest Rate:</span>
                     <span className="text-emerald-450 font-bold">0.00% (Subsidized)</span>
                   </div>
                   <div className="flex justify-between text-xs">
                     <span className="text-zinc-500">Processing Fee (1.5%):</span>
                     <span className="text-zinc-300 font-mono">{(loanAmount * 0.015).toFixed(0)} AED</span>
                   </div>
                   <div className="flex justify-between text-xs pt-2 border-t border-zinc-900 mt-2">
                     <span className="text-zinc-400 font-semibold">Monthly Repayment:</span>
                     <span className="text-zinc-200 font-mono font-bold">{(loanAmount / loanMonths).toFixed(2)} AED / mo</span>
                   </div>
                 </div>

                 <div className="mt-4 text-[9px] text-zinc-550 font-light leading-relaxed">
                   * Capital must be routed to certified sustainable projects (e.g. drip irrigation, organic composting, or solar grids).
                 </div>
               </div>

               {/* Submit Column */}
               <div className="bg-[#0a0a0a]/60 border border-zinc-850 rounded-xl p-5 flex flex-col justify-between items-center text-center">
                 <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-2">Sustainable Credit Review</span>
                 <p className="text-[10px] text-zinc-400 leading-normal mb-3">
                   Submit this estimation to request the MOCCAE Khalifa Fund rural credit dispatch.
                 </p>
                 <button
                   onClick={() => {
                     setLoanRef('MOCCAE-KF-' + Math.floor(Math.random() * 90000 + 10000));
                     setLoanApplied(true);
                   }}
                   className="w-full bg-[#a6802b] hover:bg-[#c2964b] text-zinc-950 font-black py-3 rounded-xl text-xs tracking-wider uppercase transition-all shadow-md shadow-amber-950/20 cursor-pointer"
                 >
                   Apply for Credit 📝
                 </button>
               </div>
             </div>
           )}
         </div>

         {/* Ledger Table */}
         <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg">
           <h3 className="text-sm font-bold text-zinc-200 mb-4">Transaction Ledger Details</h3>
           {data.ledger.length === 0 ? (
             <div className="border border-dashed border-zinc-850 rounded-xl p-12 text-center text-zinc-500 text-xs">
               No revenue-generating transactions logged in ledger.
             </div>
           ) : (
             <div className="overflow-x-auto overflow-y-hidden">
               <table className="w-full text-left text-xs border-collapse">
                 <thead>
                   <tr className="border-b border-zinc-850 text-zinc-400 font-mono text-[10px] uppercase">
                     <th className="py-3 px-2">Date & Time</th>
                     <th className="py-3 px-2">Category</th>
                     <th className="py-3 px-2">Details</th>
                     <th className="py-3 px-2">Reference ID</th>
                     <th className="py-3 px-2 text-right">Revenue</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-900 font-sans">
                   {data.ledger.map((item, idx) => (
                     <tr key={idx} className="hover:bg-zinc-900/30 text-zinc-300">
                       <td className="py-3 px-2 font-mono text-zinc-550">{item.date}</td>
                       <td className="py-3 px-2">
                         <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                           item.type === 'Ecotour Booking' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                         }`}>
                           {item.type}
                         </span>
                       </td>
                       <td className="py-3 px-2 font-semibold text-zinc-200">{item.description}</td>
                       <td className="py-3 px-2 font-mono text-[10px] text-zinc-500">{item.reference}</td>
                       <td className="py-3 px-2 text-right font-bold text-[#4ade80] font-mono">+{item.amount.toFixed(2)} AED</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
         </div>
      </div>
    );
  };

  const handleLaunchBusiness = (e) => {
    e.preventDefault();
    if (!launchName || !launchIdea) return;

    const newBiz = {
      id: Date.now(),
      owner: name || "Salem Al Hattawi",
      name: launchName,
      idea: launchIdea,
      skill: launchSkill,
      stage: "Idea Phase",
      status: "Pending",
      funding: 0,
      costs: launchSkill === 'Beekeeping & Honey' ? 450 : launchSkill === 'Sadu Weaving' ? 300 : 250
    };

    const updated = [newBiz, ...startups];
    setStartups(updated);
    localStorage.setItem('eco_startups', JSON.stringify(updated));

    setLaunchSuccess("🚀 Startup concept logged! Micro-license application submitted to Al Ain DED & ADAFSA department for fast-track approval.");
    setLaunchName('');
    setLaunchIdea('');
    setShowPlanId(newBiz.id);
  };

  const getLaunchPlanSteps = (skill) => {
    if (skill === 'Beekeeping & Honey') {
      return [
        { id: 1, label: "ADAFSA Apiary Permit", desc: "Acquire permission to host bee boxes in rural Al-Qaw'ah sector.", cost: "AED 100", status: "submitted" },
        { id: 2, label: "Source Hive Material", desc: "Purchase initial Sidr hives from Eco Market corporate donations.", cost: "AED 250", status: "pending" },
        { id: 3, label: "Packaging and Honey Sorting", desc: "Take the 1-min Eco-Learn course on Dates and Honey sorting.", cost: "Free", status: "pending" },
        { id: 4, label: "Publish on Eco Market", desc: "Open seller profile and list raw Sidr honey batches.", cost: "Free", status: "pending" }
      ];
    } else if (skill === 'Sadu Weaving') {
      return [
        { id: 1, label: "DED Rural Crafts Permit", desc: "Fast-track family license to legally trade hand-woven crafts.", cost: "AED 100", status: "submitted" },
        { id: 2, label: "Local Camel/Sheep Wool Sourcing", desc: "Connect with Al Wathba livestock breeders on EcoConnect community.", cost: "AED 150", status: "pending" },
        { id: 3, label: "Weaving and Design Check", desc: "Refine patterns with advice from senior weavers in Hatta group.", cost: "Free", status: "pending" },
        { id: 4, label: "List on Circular Shop", desc: "Publish Sadu blankets and rugs on Eco Market.", cost: "Free", status: "pending" }
      ];
    } else {
      return [
        { id: 1, label: "ADAFSA Organic Crop License", desc: "Certify date crops as organic for city markets.", cost: "AED 100", status: "submitted" },
        { id: 2, label: "Sort and Clean Dates Pack", desc: "Wash and sort dates into vacuum packs for premium pricing.", cost: "AED 100", status: "pending" },
        { id: 3, label: "Voucher Pre-order Launch", desc: "Enable tourist vouchers on the Eco Business portal.", cost: "Free", status: "pending" },
        { id: 4, label: "Distribute locally", desc: "Fulfill orders placed by tourists on the app.", cost: "Free", status: "pending" }
      ];
    }
  };

  const renderEcoLaunch = () => {
    return (
      <div className="max-w-6xl mx-auto w-full space-y-6">
        <div className="mb-4 flex flex-wrap justify-between items-center bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <div>
              <h2 className="text-md font-bold text-zinc-100">Local Founder Accelerator</h2>
              <p className="text-[10px] text-zinc-400 font-mono">ECO-LAUNCH PROFILE & PLANNER</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-[#1b3d34] text-emerald-450 border border-emerald-900/50 px-3 py-1.5 rounded-full">
            ● Challenge 1 Solution
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg h-fit">
            <h3 className="text-md font-bold text-emerald-400 mb-2 flex items-center gap-2">
              <span>💡</span> Idea to Business Plan
            </h3>
            <p className="text-xs text-zinc-400 mb-6 font-light">
              Submit your skill or agricultural business idea. Our accelerator generates your concrete Action Plan, cost breakdown, and registers your micro-permit.
            </p>

            {launchSuccess && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl">
                {launchSuccess}
              </div>
            )}

            <form onSubmit={handleLaunchBusiness} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Business Name</label>
                <input 
                  type="text" 
                  value={launchName} 
                  onChange={(e) => setLaunchName(e.target.value)} 
                  placeholder="e.g. Al-Qaw'ah Sidr Beekeeping" 
                  className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" 
                  required 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Core Skill / Focus</label>
                <select 
                  value={launchSkill} 
                  onChange={(e) => setLaunchSkill(e.target.value)} 
                  className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none"
                >
                  <option value="Beekeeping & Honey">🐝 Beekeeping & Honey Sales</option>
                  <option value="Sadu Weaving">🧶 Traditional Sadu Weaving crafts</option>
                  <option value="Dates Sorting & Packaging">🌴 Premium Date Sorting & Distribution</option>
                  <option value="Eco-Tourism Guide">⛺ Heritage Tour Guide Experience</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Describe your concept</label>
                <textarea 
                  value={launchIdea} 
                  onChange={(e) => setLaunchIdea(e.target.value)} 
                  rows="3" 
                  placeholder="e.g. I want to place 10 bee boxes on the east sector of my farm and bottle organic honey for tourists." 
                  className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" 
                  required 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-lg transition-all cursor-pointer"
              >
                🚀 Generate Business Roadmap
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {showPlanId && (
              <div className="bg-[#15171e] border-2 border-emerald-950 p-6 rounded-2xl shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <span>📋</span> Generated Action Roadmap: {startups.find(s => s.id === showPlanId)?.name}
                  </h3>
                  <button onClick={() => setShowPlanId(null)} className="text-[10px] font-bold text-zinc-550 hover:text-zinc-300">✕ Close Plan</button>
                </div>
                
                <div className="space-y-3">
                  {getLaunchPlanSteps(startups.find(s => s.id === showPlanId)?.skill).map(step => (
                    <div key={step.id} className="bg-[#0a0a0a] border border-zinc-850 p-3.5 rounded-xl flex items-start justify-between">
                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-350 flex items-center justify-center shrink-0 mt-0.5">{step.id}</span>
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-200">{step.label}</h4>
                          <p className="text-[10px] text-zinc-500 font-light mt-0.5 leading-normal">{step.desc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-teal-400 font-mono block">{step.cost}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${step.status === 'submitted' ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-850 text-zinc-500'}`}>{step.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-md font-bold text-zinc-100 mb-6 flex items-center gap-2">
                <span>🏢</span> Your Local Startup Permitting Status
              </h3>
              
              <div className="space-y-4">
                {startups.filter(s => s.owner === (name || "Salem Al Hattawi")).map(biz => (
                  <div key={biz.id} className="bg-[#0a0a0a] border border-zinc-850 p-5 rounded-xl space-y-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-200">{biz.name}</h4>
                        <p className="text-[10px] text-zinc-555 mt-0.5">Skill Area: {biz.skill}</p>
                      </div>
                      <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full ${
                        biz.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      }`}>{biz.status === 'Approved' ? 'Micro-License Active ✓' : 'License Application Pending ⏳'}</span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed font-light">{biz.idea}</p>

                    <div className="grid grid-cols-3 gap-3 bg-[#15171e] p-3 rounded-lg border border-zinc-850 text-center">
                      <div>
                        <span className="text-[9px] text-zinc-500 block font-mono">EST. LAUNCH COST</span>
                        <span className="text-xs font-bold text-zinc-250">{biz.costs} AED</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 block font-mono">SEED VOUCHERS CLAIMED</span>
                        <span className="text-xs font-bold text-emerald-400">{biz.funding} AED</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <button 
                          onClick={() => setShowPlanId(biz.id)} 
                          className="bg-zinc-850 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-zinc-800 transition-all"
                        >
                          View Plan 🗺️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getPriceInsight = (product, price) => {
    if (product === 'Raw Sidr Honey') {
      if (price < 70) return { prob: 98, msg: "High demand. Underpriced. You are leaving money on the table. Recommended: 110 - 150 AED." };
      if (price <= 160) return { prob: 82, msg: "Optimal price target. Excellent balance of high tourist conversion and margins." };
      return { prob: 18, msg: "Price barrier exceeded. Tourists report low willingness to purchase at this price." };
    } else if (product === 'Handwoven Sadu Rug') {
      if (price < 200) return { prob: 95, msg: "Underpriced. Sadu weaving requires intensive manual labor. Recommended: 300 - 450 AED." };
      if (price <= 450) return { prob: 78, msg: "Premium value matched. Suitable for foreign investors and collectors." };
      return { prob: 25, msg: "Luxury category pricing. Requires custom heritage story card packaging." };
    } else {
      if (price < 40) return { prob: 98, msg: "High volume sales expected. Lower margins. Recommended: 50 - 75 AED." };
      if (price <= 80) return { prob: 85, msg: "Optimal standard price for 1kg Khalas organic date box." };
      return { prob: 30, msg: "Exceeds market index. Highlight organic certificate stamp to justify pricing." };
    }
  };

  const renderEcoInsights = () => {
    const surveyCounts = surveys || { honey: 14, dates: 28, rugs: 9, tours: 17 };
    const totalVotes = Object.values(surveyCounts).reduce((a, b) => a + b, 0);

    const getPct = (votes) => {
      if (totalVotes === 0) return 0;
      return Math.round((votes / totalVotes) * 100);
    };

    const priceReport = getPriceInsight(researchProduct, testPrice);

    return (
      <div className="max-w-6xl mx-auto w-full space-y-6">
        <div className="mb-4 flex flex-wrap justify-between items-center bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h2 className="text-md font-bold text-zinc-100">Market Demand Index</h2>
              <p className="text-[10px] text-zinc-405 font-mono">ECO-INSIGHTS LOCAL DATA ENGINE</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-[#1b3d34] text-emerald-450 border border-emerald-900/50 px-3 py-1.5 rounded-full">
            ● Challenge 3 Solution
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <span>📈</span> Live Tourist Purchase Intent Tracker
              </h3>
              <button 
                onClick={() => {
                  const saved = localStorage.getItem('eco_surveys');
                  if (saved) setSurveys(JSON.parse(saved));
                }}
                className="text-[10px] font-bold text-emerald-405 cursor-pointer bg-transparent border-0"
              >
                Sync Tourist Surveys 🔄
              </button>
            </div>
            <p className="text-xs text-zinc-450 mb-6 font-light">
              Aggregated in real-time from surveys submitted by international tourists and eco-investors visiting Al-Qaw'ah and Hatta.
            </p>

            <div className="space-y-5">
              {[
                { label: "Pure Sidr Honey", key: "honey", icon: "🍯", color: "from-amber-550 to-yellow-500" },
                { label: "Organic Khalas Dates", key: "dates", icon: "🌴", color: "from-emerald-500 to-teal-400" },
                { label: "Handwoven Sadu Rugs", key: "rugs", icon: "🧶", color: "from-purple-500 to-indigo-400" },
                { label: "Stargazing Heritage Tours", key: "tours", icon: "⛺", color: "from-blue-500 to-cyan-400" }
              ].map(item => {
                const votes = surveyCounts[item.key] || 0;
                const pct = getPct(votes);
                return (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-zinc-200"><span>{item.icon}</span> {item.label}</span>
                      <span className="text-zinc-500 font-mono">{votes} searches/requests ({pct}%)</span>
                    </div>
                    <div className="h-3 w-full bg-zinc-800/60 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${item.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1 bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg h-fit space-y-6">
            <div>
              <h3 className="text-sm font-bold text-emerald-405 mb-1 flex items-center gap-2">
                <span>⚖️</span> Price Optimization Engine
              </h3>
              <p className="text-xs text-zinc-455 font-light">
                Select your product and set your price to analyze community demand conversions and target profit margins.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Select Product</label>
                <select 
                  value={researchProduct} 
                  onChange={(e) => setResearchProduct(e.target.value)} 
                  className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none"
                >
                  <option value="Raw Sidr Honey">🍯 Raw Sidr Honey (500g)</option>
                  <option value="Handwoven Sadu Rug">🧶 Handwoven Sadu Rug</option>
                  <option value="Premium Organic Dates">🌴 Premium Organic Dates (1kg)</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-300">Set Price (AED)</span>
                  <span className="text-emerald-450 font-mono">{testPrice} AED</span>
                </div>
                <input 
                  type="range" 
                  min={researchProduct === 'Handwoven Sadu Rug' ? 100 : 20} 
                  max={researchProduct === 'Handwoven Sadu Rug' ? 600 : 300} 
                  value={testPrice} 
                  onChange={(e) => setTestPrice(parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#0f7a54]"
                />
              </div>

              <div className="bg-[#0a0a0a] border border-zinc-850 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Tourist Demand Probability</span>
                  <span className={`text-md font-black ${priceReport.prob >= 75 ? 'text-emerald-450' : priceReport.prob >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>{priceReport.prob}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${priceReport.prob >= 75 ? 'bg-emerald-500' : priceReport.prob >= 40 ? 'bg-amber-500' : 'bg-rose-500'} transition-all`} style={{ width: `${priceReport.prob}%` }} />
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-light font-sans pt-1 border-t border-zinc-900/60">{priceReport.msg}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Predictive AI Market Radar Section */}
        <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4 border-b border-zinc-900 pb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>🔮</span> Eco AI Predictive Market Advisor (Decision Support)
              </h3>
              <p className="text-[11px] text-zinc-450 mt-1 font-light leading-normal">
                Analyzes local date stocks, active guide bookings, honey supply, and tourist intent trends to generate data-driven suggestions.
              </p>
            </div>
            
            <button 
              onClick={fetchRadarInsights}
              disabled={radarLoading}
              className="bg-emerald-600/15 border border-emerald-500/30 hover:bg-emerald-500 hover:text-zinc-950 text-emerald-450 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-950/15"
            >
              {radarLoading ? (
                <>
                  <span className="animate-spin inline-block">🔄</span> Generating forecasts...
                </>
              ) : (
                <>
                  <span>🔮</span> Run AI Predictive Scan
                </>
              )}
            </button>
          </div>

          {radarError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs p-3 rounded-xl">
              ⚠️ {radarError}
            </div>
          )}

          {radarLoading && (
            <div className="py-8 text-center space-y-3">
              <div className="w-9 h-9 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-zinc-500 animate-pulse">Running predictive AI regression algorithms on supply-demand indices...</p>
            </div>
          )}

          {!radarLoading && radarInsights.length === 0 && (
            <div className="py-8 text-center text-zinc-500 text-xs font-light">
              Press the Predictive Scan button to load AI business recommendations.
            </div>
          )}

          {!radarLoading && radarInsights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {radarInsights.map((insight, idx) => (
                <div key={idx} className="bg-zinc-950/40 border border-zinc-800 p-5 rounded-xl space-y-4 hover:border-emerald-500/30 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-zinc-200 flex items-center gap-2 text-sm">
                      <span className="text-xl">{insight.icon}</span>
                      {insight.product}
                    </span>
                    <span className="px-2.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {insight.trend}
                    </span>
                  </div>
                  
                  {/* Arabic Advice Speech Bubble */}
                  <div className="relative bg-[#1a2024] border border-emerald-900/30 p-3.5 rounded-xl text-xs text-emerald-450 leading-relaxed font-sans text-right">
                    <span className="absolute -top-1.5 right-4 w-3 h-3 bg-[#1a2024] border-t border-r border-emerald-900/30 rotate-45" />
                    {insight.advice}
                  </div>
                  
                  {/* Recommended Action */}
                  <div className="text-[11px] text-zinc-405 font-light flex items-start gap-2 pt-2 border-t border-zinc-900/40">
                    <strong className="text-emerald-500 font-bold font-mono">Suggested Action:</strong>
                    <span>{insight.action}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handlePostSos = (e) => {
    e.preventDefault();
    if (!sosDescription) return;
    setIsSendingSos(true);
    setSosSuccess('');

    let lat = 24.1205;
    let lng = 55.4512;
    let region = "Al-Qaw'ah South (Fallback GPS)";

    const performPublish = (latitude, longitude, area) => {
      const newSos = {
        id: Date.now(),
        sender: name || "Salem (You)",
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
      setSosSuccess("🚨 SOS broadcast dispatched! Neighbors within a 5km radius have been paged.");
      setSosDescription('');
      setIsSendingSos(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          performPublish(position.coords.latitude, position.coords.longitude, "Al-Qaw'ah Area (Live GPS)");
        },
        () => {
          performPublish(lat, lng, region);
        }
      );
    } else {
      performPublish(lat, lng, region);
    }
  };

  const handleRespondToSos = (sosId) => {
    const updated = sosFeed.map(item => {
      if (item.id === sosId) {
        if (!item.responders.includes("Salem (You)")) {
          return { ...item, responders: [...item.responders, "Salem (You)"] };
        }
      }
      return item;
    });
    setSosFeed(updated);
    localStorage.setItem('eco_sos_feed', JSON.stringify(updated));
  };

  const renderEcoShield = () => {
    return (
      <div className="max-w-6xl mx-auto w-full space-y-6">
        <div className="mb-4 flex flex-wrap justify-between items-center bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <h2 className="text-md font-bold text-zinc-100">Eco-Shield Early Warning & Distress</h2>
              <p className="text-[10px] text-zinc-400 font-mono">RAPID COMMUNITY RESCUE SHIELD</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30 px-3 py-1.5 rounded-full animate-pulse">
            ● Shield Active (Al-Qaw'ah Region)
          </span>
        </div>

        <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-md font-bold text-zinc-100 mb-3 flex items-center gap-2">
            <span>📡</span> Remote Area Alert Broadcast Feed
          </h3>
          <p className="text-xs text-zinc-400 mb-4 font-light">
            Real-time emergency updates from the Ministry and local Al-Qaw'ah monitoring sensors.
          </p>
          <div className="space-y-3">
            {liveAlerts.map(alert => (
              <div key={alert.id} className="flex items-start justify-between p-4 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-550">
                <div className="flex gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold">{alert.text}</p>
                    <p className="text-[10px] text-zinc-550 font-mono mt-1">Broadcasted: {alert.time}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setLiveAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  className="text-zinc-400 hover:text-zinc-200 text-xs font-bold px-2 py-1 bg-zinc-900/40 rounded-lg"
                >
                  Dismiss
                </button>
              </div>
            ))}
            {liveAlerts.length === 0 && (
              <div className="text-center py-4 text-xs text-zinc-500">No active environmental alerts. The sector is clear.</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg h-fit">
            <h3 className="text-md font-bold text-rose-500 mb-2 flex items-center gap-2">
              <span>🚨</span> Trigger Community SOS
            </h3>
            <p className="text-xs text-zinc-400 mb-6 font-light">
              Stuck in shifting sand or facing equipment breakdown? Ping neighbors in Al-Qaw'ah for rapid local assistance.
            </p>

            {sosSuccess && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-[#4ade80] text-xs p-3 rounded-xl">
                {sosSuccess}
              </div>
            )}

            <form onSubmit={handlePostSos} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Distress Category</label>
                <select 
                  value={sosType} 
                  onChange={(e) => setSosType(e.target.value)} 
                  className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-rose-500 rounded-xl p-3 text-xs text-zinc-300 outline-none"
                >
                  <option value="Stuck in Sand">🏜️ Stuck in Sand / Dune Drift</option>
                  <option value="Tractor Failure">🚜 Farm Vehicle / Tractor Failure</option>
                  <option value="Irrigation Failure">💧 Critical Irrigation Network Burst</option>
                  <option value="Medical / Heat Alert">🌡️ Extreme Heat / Medical Emergency</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Situation / Help Needed</label>
                <textarea 
                  value={sosDescription} 
                  onChange={(e) => setSosDescription(e.target.value)} 
                  rows="3" 
                  placeholder="Explain exactly what happened, and describe visible landmarks..." 
                  className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-rose-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" 
                  required 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSendingSos} 
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 px-4 rounded-xl text-xs shadow-lg shadow-rose-950/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                {isSendingSos ? "Broadcasting Distress Signal..." : "🚨 BROADCAST SOS EMERGENCY"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2">
                <span>🤝</span> Active Local Rescue Feed
              </h3>
              <span className="text-[9px] uppercase tracking-wider font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-400">
                Sorted by Proximity
              </span>
            </div>

            <div className="space-y-4">
              {sosFeed.map(sos => {
                const alreadyResponding = sos.responders.includes("Salem (You)");
                return (
                  <div key={sos.id} className="bg-[#0a0a0a] border border-zinc-850 p-5 rounded-xl space-y-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-rose-950/30 text-rose-500 font-bold text-xs flex items-center justify-center border border-rose-900/30">
                          {sos.sender.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-200">{sos.sender}</h4>
                          <p className="text-[10px] text-zinc-500 font-mono">📍 {sos.region} · {sos.time}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-1 rounded-full">
                        {sos.type}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed font-light">{sos.description}</p>

                    <div className="bg-[#15171e] p-3 rounded-lg border border-zinc-850 flex flex-wrap justify-between items-center gap-3">
                      <div className="text-[10px] text-zinc-500 font-mono">
                        <span>GPS Coordinates: {sos.lat.toFixed(4)}°N, {sos.lng.toFixed(4)}°E</span>
                        {sos.responders.length > 0 && (
                          <div className="text-emerald-400 font-bold mt-1">
                            Responders: {sos.responders.join(", ")}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRespondToSos(sos.id)}
                        disabled={alreadyResponding}
                        className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${
                          alreadyResponding 
                            ? 'bg-emerald-600/15 text-[#4ade80] border border-emerald-500/30 cursor-default' 
                            : 'bg-zinc-850 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 cursor-pointer'
                        }`}
                      >
                        {alreadyResponding ? "✓ You are Responding" : "🙋 Assist Neighbor"}
                      </button>
                    </div>
                  </div>
                );
              })}
              {sosFeed.length === 0 && (
                <div className="text-center py-12 text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                  No active distress calls. Everyone is safe!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handlePlayVideo = (id) => {
    setPlayingVideoId(id);
    setVideoProgress(prev => ({ ...prev, [id]: 0 }));
    
    const interval = setInterval(() => {
      setVideoProgress(prev => {
        const current = prev[id] || 0;
        if (current >= 100) {
          clearInterval(interval);
          return prev;
        }
        return { ...prev, [id]: current + 25 };
      });
    }, 1000);
  };

  const handleRequestMentor = (e) => {
    e.preventDefault();
    if (!mentorDesc) return;
    
    const newReq = {
      id: Date.now(),
      topic: mentorTopic,
      time: "Just now",
      status: "Matching (Volunteer expert from Al Ain)",
      farm: MY_FARM.name
    };
    
    setMentorRequests(prev => [newReq, ...prev]);
    setMentorSuccess("📚 Mentor request submitted successfully! We are matching you with an expert from ADAFSA Al Ain office.");
    setMentorDesc('');
  };

  const LESSONS = [
    { id: 1, title: "Modern Drip Irrigation Systems", desc: "Learn how sub-surface drip irrigation saves up to 50% water in arid environments.", icon: "💧", duration: "1:00 min", category: "Water Conservation", query: "subsurface drip irrigation desert farming", tags: ["heat", "drySoil"] },
    { id: 2, title: "Date Palm Fruit Quality Packaging", desc: "Step-by-step sorting, sanitization, and packaging to sell Khalas dates for double the price.", icon: "🌴", duration: "1:15 min", category: "Agri-Business", query: "date palm harvesting packaging", tags: ["default"] },
    { id: 3, title: "Solar Pump Weekly Maintenance", desc: "Simple techniques to clean sand and maximize solar panel energy conversion.", icon: "⚡", duration: "0:50 min", category: "Renewable Energy", query: "solar panel cleaning dust maintenance", tags: ["dust", "wind"] },
    { id: 4, title: "Hydroponic Fodder Cultivation", desc: "Grow nutritious green fodder for livestock in 7 days using minimal water inside a cabin.", icon: "🌾", duration: "1:05 min", category: "Feed & Livestock", query: "hydroponic fodder barley livestock", tags: ["uv"] },
    { id: 5, title: "Composting & Organic Fertiliser", desc: "Turn crop residue and manure into rich compost that boosts sandy-soil water retention.", icon: "🍂", duration: "1:10 min", category: "Soil Health", query: "composting organic fertilizer farm", tags: ["drySoil"] },
    { id: 6, title: "Greenhouse Climate Control", desc: "Cooling, shading and ventilation tactics to farm vegetables through the UAE summer.", icon: "🏠", duration: "1:20 min", category: "Protected Farming", query: "greenhouse climate control cooling", tags: ["heat", "uv"] },
    { id: 7, title: "Beekeeping & Sidr Honey", desc: "Set up hives near Sidr trees and harvest premium honey for extra farm revenue.", icon: "🐝", duration: "1:08 min", category: "Agri-Business", query: "beekeeping sidr honey harvest", tags: ["default"] },
    { id: 8, title: "Goat & Camel Health Basics", desc: "Heat-stress prevention, vaccination schedules and feeding for healthy desert livestock.", icon: "🐐", duration: "1:12 min", category: "Feed & Livestock", query: "goat camel health care desert", tags: ["heat"] },
  ];

  const LESSON_CATEGORIES = ['All', ...Array.from(new Set(LESSONS.map(l => l.category)))];

  const renderEcoLearn = () => {
    // Derive a smart course recommendation from the live field feed
    let recommendedId = 2;
    let recommendReason = 'Boost your harvest value with better packaging.';
    if (liveField) {
      if (liveField.temp >= 42 || (liveField.soilMoisture != null && liveField.soilMoisture < 0.12)) {
        recommendedId = 1;
        recommendReason = `It's ${Math.round(liveField.temp)}°C with dry soil — prioritise water-saving irrigation.`;
      } else if (liveField.wind >= 25 || liveField.code === 45 || liveField.code === 48 || liveField.code > 99) {
        recommendedId = 3;
        recommendReason = `Dusty / windy conditions — keep your solar pumps clean for full output.`;
      } else if (liveField.uv != null && liveField.uv >= 8) {
        recommendedId = 4;
        recommendReason = `Extreme UV (index ${Math.round(liveField.uv)}) — grow fodder indoors to protect livestock feed.`;
      }
    }
    const recommendedLesson = LESSONS.find(l => l.id === recommendedId);
    const w = liveField ? wmoInfo(liveField.code) : ['—', '🛰️'];
    const fmtTime = liveFieldUpdated
      ? liveFieldUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '—';

    // Learner progress derived from completed video lessons
    const completedCount = LESSONS.filter(l => (videoProgress[l.id] || 0) >= 100).length;
    const ecoPoints = completedCount * 10;
    const completionPct = Math.round((completedCount / LESSONS.length) * 100);
    const visibleLessons = lessonFilter === 'All' ? LESSONS : LESSONS.filter(l => l.category === lessonFilter);
    const ECO_TABS = [
      { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
      { id: 'courses', label: 'Courses', icon: '🎬' },
      { id: 'live', label: 'Live Field', icon: '🛰️' },
      { id: 'mentor', label: 'Mentorship', icon: '🤝' },
      { id: 'achievements', label: 'Achievements', icon: '🏆' },
    ];
    const BADGES = [
      { id: 'first', label: 'First Lesson', icon: '🌱', earned: completedCount >= 1 },
      { id: 'water', label: 'Water Saver', icon: '💧', earned: (videoProgress[1] || 0) >= 100 },
      { id: 'half', label: 'Halfway Hero', icon: '⭐', earned: completionPct >= 50 },
      { id: 'master', label: 'Eco Master', icon: '🏆', earned: completedCount === LESSONS.length },
    ];

    return (
      <div className="max-w-6xl mx-auto w-full space-y-6">
        <div className="mb-4 flex flex-wrap justify-between items-center bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <div>
              <h2 className="text-md font-bold text-zinc-100">Rural Community Academy</h2>
              <p className="text-[10px] text-zinc-400 font-mono">ECO-LEARN MICRO-LEARNING & MENTORSHIP</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-[#1b3d34] text-emerald-450 border border-emerald-900/50 px-3 py-1.5 rounded-full">
            ● Support Social Capital
          </span>
        </div>

        {/* Portal sub-navigation */}
        <div className="flex flex-wrap gap-1.5 bg-[#15171e] border border-zinc-800/60 rounded-2xl p-2">
          {ECO_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setEcoLearnTab(t.id)}
              className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${ecoLearnTab === t.id ? 'bg-[#1a2024] text-[#4ade80] border border-emerald-900/50' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 border border-transparent'}`}
            >
              <span className="opacity-80">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* DASHBOARD TAB */}
        {ecoLearnTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'EcoPoints', value: ecoPoints, icon: '🪙', tone: 'text-[#c2964b]' },
                { label: 'Courses Done', value: `${completedCount}/${LESSONS.length}`, icon: '🎓', tone: 'text-[#4ade80]' },
                { label: 'Completion', value: `${completionPct}%`, icon: '📈', tone: 'text-emerald-400' },
                { label: 'Mentor Sessions', value: mentorRequests.length, icon: '🤝', tone: 'text-blue-400' },
              ].map((s) => (
                <div key={s.label} className="bg-[#15171e] border border-zinc-800/60 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">{s.label}</span>
                    <span className="text-base">{s.icon}</span>
                  </div>
                  <p className={`text-2xl font-black mt-1 ${s.tone}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Learning progress */}
            <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2"><span>📚</span> Your Learning Journey</h3>
                <span className="text-[10px] font-bold text-emerald-400">{completionPct}% complete</span>
              </div>
              <div className="h-2.5 rounded-full bg-zinc-800 overflow-hidden mb-4"><div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${completionPct}%` }} /></div>
              <p className="text-xs text-zinc-400">You've completed {completedCount} of {LESSONS.length} micro-courses and earned <span className="text-[#c2964b] font-bold">{ecoPoints} EcoPoints</span>. Keep going to unlock your Eco Master badge!</p>
            </div>

            {/* Recommended right now */}
            {recommendedLesson && (
              <div className="flex items-center justify-between gap-3 flex-wrap bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{recommendedLesson.icon}</span>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Recommended for today</p>
                    <p className="text-sm font-bold text-zinc-100">{recommendedLesson.title}</p>
                    <p className="text-[11px] text-zinc-400">{recommendReason}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setEcoLearnTab('courses'); handlePlayVideo(recommendedLesson.id); }}
                  className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg px-4 py-2.5 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>▶</span> Start learning
                </button>
              </div>
            )}

            {/* Continue learning preview */}
            <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2"><span>🎬</span> Continue Learning</h3>
                <button onClick={() => setEcoLearnTab('courses')} className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300">View all courses →</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {LESSONS.slice(0, 4).map((l) => {
                  const done = (videoProgress[l.id] || 0) >= 100;
                  return (
                    <button
                      key={l.id}
                      onClick={() => { setEcoLearnTab('courses'); handlePlayVideo(l.id); }}
                      className="text-left bg-[#0a0a0a] border border-zinc-850 hover:border-emerald-500/30 rounded-xl p-4 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{l.icon}</span>
                        {done && <span className="text-[9px] font-bold text-emerald-400">✓ Done</span>}
                      </div>
                      <p className="text-xs font-bold text-zinc-200 leading-snug">{l.title}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">{l.duration}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* LIVE FIELD TAB */}
        {ecoLearnTab === 'live' && (
        <>
        {/* LIVE FIELD CONDITIONS — real-time Open-Meteo feed */}
        <div className="bg-gradient-to-br from-[#10231b] via-[#15171e] to-[#0f1720] border border-zinc-800/60 rounded-2xl p-5 md:p-6 shadow-lg">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${liveFieldError ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`} />
              <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2">
                <span>🛰️</span> Live Field Conditions — Hatta
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-500 font-mono">
                {liveFieldError ? liveFieldError : `Updated ${fmtTime} · auto every 60s`}
              </span>
              <button
                onClick={fetchLiveField}
                disabled={liveFieldLoading}
                className="text-[10px] font-bold text-zinc-300 bg-[#1f222d] hover:bg-zinc-700 border border-zinc-700/50 rounded-lg px-2.5 py-1.5 transition-all disabled:opacity-50"
              >
                {liveFieldLoading ? 'Syncing…' : 'Refresh 🔄'}
              </button>
            </div>
          </div>

          {liveFieldLoading && !liveField ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="bg-black/30 border border-zinc-800/60 rounded-xl p-3 h-[68px] animate-pulse" />
              ))}
            </div>
          ) : liveField ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { label: 'Condition', value: w[0], icon: w[1], tone: 'text-zinc-100' },
                  { label: 'Air Temp', value: liveField.temp != null ? `${liveField.temp.toFixed(1)}°C` : '—', icon: '🌡️', tone: liveField.temp >= 42 ? 'text-rose-400' : 'text-zinc-100' },
                  { label: 'Feels Like', value: liveField.feels != null ? `${liveField.feels.toFixed(1)}°C` : '—', icon: '🥵', tone: 'text-amber-400' },
                  { label: 'Humidity', value: liveField.humidity != null ? `${Math.round(liveField.humidity)}%` : '—', icon: '💧', tone: 'text-blue-400' },
                  { label: 'Wind', value: liveField.wind != null ? `${liveField.wind.toFixed(0)} km/h` : '—', icon: '🌬️', tone: liveField.wind >= 25 ? 'text-amber-400' : 'text-zinc-100' },
                  { label: 'UV Index', value: liveField.uv != null ? liveField.uv.toFixed(1) : '—', icon: '☀️', tone: liveField.uv >= 8 ? 'text-rose-400' : 'text-[#4ade80]' },
                  { label: 'Soil Moist.', value: liveField.soilMoisture != null ? `${Math.round(liveField.soilMoisture * 100)}%` : '—', icon: '🌱', tone: (liveField.soilMoisture != null && liveField.soilMoisture < 0.12) ? 'text-rose-400' : 'text-[#4ade80]' },
                ].map((s) => (
                  <div key={s.label} className="bg-black/30 backdrop-blur border border-zinc-800/60 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">{s.label}</span>
                      <span className="text-sm">{s.icon}</span>
                    </div>
                    <p className={`text-base font-black mt-1 ${s.tone}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Smart recommendation driven by live data */}
              {recommendedLesson && (
                <div className="mt-4 flex items-center justify-between gap-3 flex-wrap bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{recommendedLesson.icon}</span>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Recommended right now</p>
                      <p className="text-sm font-bold text-zinc-100">{recommendedLesson.title}</p>
                      <p className="text-[11px] text-zinc-400">{recommendReason}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePlayVideo(recommendedLesson.id)}
                    className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg px-4 py-2.5 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>▶</span> Watch now
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-xs text-zinc-500">
              Live feed unavailable. <button onClick={fetchLiveField} className="text-emerald-400 font-bold underline">Retry</button>
            </div>
          )}
        </div>
        </>
        )}

        {/* COURSES TAB */}
        {ecoLearnTab === 'courses' && (
        <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-md font-bold text-zinc-100 mb-2 flex items-center gap-2">
            <span>🎬</span> Interactive 1-Minute Agri-Skills
          </h3>
          <p className="text-xs text-zinc-400 mb-4 font-light">
            Quick, practical video courses designed for rural UAE environments. Earn EcoPoints for completing courses.
          </p>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {LESSON_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setLessonFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${lessonFilter === cat ? 'bg-emerald-600 text-white' : 'bg-[#0a0a0a] text-zinc-400 border border-zinc-800 hover:text-zinc-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleLessons.map(lesson => {
              const progress = videoProgress[lesson.id] || 0;
              const isPlaying = playingVideoId === lesson.id;
              const isCompleted = progress >= 100;
              const isRecommended = lesson.id === recommendedId;

              return (
                <div key={lesson.id} className={`bg-[#0a0a0a] border rounded-2xl p-5 flex flex-col justify-between transition-all ${isRecommended ? 'border-emerald-500/40' : 'border-zinc-850 hover:border-emerald-500/30'}`}>
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-2xl bg-[#15171e] border border-zinc-800 p-2.5 rounded-xl">{lesson.icon}</span>
                      <div className="flex items-center gap-1.5">
                        {isRecommended && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-1 rounded-full">★ For today</span>
                        )}
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                          {lesson.category}
                        </span>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-zinc-200 mb-1">{lesson.title}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed font-light mb-4">{lesson.desc}</p>
                  </div>

                  {/* Real embedded video player */}
                  {isPlaying && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-zinc-800 aspect-video bg-black">
                      <iframe
                        title={lesson.title}
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(lesson.query)}&autoplay=1&rel=0`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  <div className="mt-1 border-t border-zinc-900/60 pt-4">
                    {isPlaying && !isCompleted ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-zinc-550">
                          <span className="animate-pulse text-emerald-450">▶ Now playing — watch to earn points</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    ) : isCompleted ? (
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#4ade80] flex items-center gap-1.5">
                          <span>✓</span> Completed (+10 EcoPoints)
                        </span>
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(lesson.query)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-zinc-400 hover:text-zinc-200"
                          >
                            YouTube ↗
                          </a>
                          <button
                            onClick={() => handlePlayVideo(lesson.id)}
                            className="text-[10px] font-bold text-zinc-400 hover:text-zinc-250 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5"
                          >
                            Rewatch
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-550 font-mono">Duration: {lesson.duration}</span>
                        <button
                          onClick={() => handlePlayVideo(lesson.id)}
                          className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg px-3.5 py-2 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>▶</span> Watch Video
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* MENTORSHIP TAB */}
        {ecoLearnTab === 'mentor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg h-fit">
            <h3 className="text-md font-bold text-emerald-400 mb-2 flex items-center gap-2">
              <span>👨‍🌾</span> Request a Farm Mentor
            </h3>
            <p className="text-xs text-zinc-400 mb-6 font-light">
              Request a volunteer agricultural engineer from Al Ain to visit your farm and provide custom ecological advice.
            </p>

            {mentorSuccess && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl">
                {mentorSuccess}
              </div>
            )}

            <form onSubmit={handleRequestMentor} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Consultation Subject</label>
                <select 
                  value={mentorTopic} 
                  onChange={(e) => setMentorTopic(e.target.value)} 
                  className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none"
                >
                  <option value="Drip Irrigation Engineering">💧 Drip Irrigation Design</option>
                  <option value="Red Palm Weevil Control">🪲 Red Palm Weevil / Pest Treatment</option>
                  <option value="Soil Salinity Remediation">🌾 Soil Salinity Management</option>
                  <option value="Organic Certification Guide">📜 UAE Organic Certification Prep</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Problem & Request Details</label>
                <textarea 
                  value={mentorDesc} 
                  onChange={(e) => setMentorDesc(e.target.value)} 
                  rows="3" 
                  placeholder="Detail your request and preferred times for a visit..." 
                  className="w-full bg-[#0a0a0a] border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none" 
                  required 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-lg transition-all cursor-pointer"
              >
                🤝 Request Mentor Visit
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-md font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <span>📋</span> Mentorship Consultations
            </h3>

            <div className="space-y-4">
              {mentorRequests.map(req => (
                <div key={req.id} className="bg-[#0a0a0a] border border-zinc-850 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-semibold text-zinc-200">{req.topic}</h4>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                      req.status.startsWith('Mentor Assigned') 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-550 font-mono">
                    <span>Farm: {req.farm}</span>
                    <span>Requested: {req.time}</span>
                  </div>
                </div>
              ))}
              {mentorRequests.length === 0 && (
                <div className="text-center py-8 text-zinc-550 text-xs border border-dashed border-zinc-850 rounded-xl">
                  No mentor visits requested yet.
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {ecoLearnTab === 'achievements' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#1b3d34] via-[#15171e] to-[#0f1720] border border-emerald-900/40 rounded-2xl p-6 shadow-lg flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Total Reward</p>
                <p className="text-4xl font-black text-[#c2964b] mt-1">{ecoPoints} <span className="text-base text-zinc-500">EcoPoints</span></p>
                <p className="text-[11px] text-zinc-400 mt-1">Earned from {completedCount} completed micro-courses.</p>
              </div>
              <div className="text-6xl">🏆</div>
            </div>

            {/* Badges */}
            <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-md font-bold text-zinc-100 mb-4 flex items-center gap-2"><span>🎖️</span> Badges</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {BADGES.map((b) => (
                  <div key={b.id} className={`rounded-xl p-4 text-center border ${b.earned ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#0a0a0a] border-zinc-850 opacity-50'}`}>
                    <div className={`text-3xl mb-2 ${b.earned ? '' : 'grayscale'}`}>{b.icon}</div>
                    <p className={`text-xs font-bold ${b.earned ? 'text-emerald-400' : 'text-zinc-500'}`}>{b.label}</p>
                    <p className="text-[9px] text-zinc-600 mt-0.5">{b.earned ? 'Unlocked' : 'Locked'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Certificate */}
            <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-md font-bold text-zinc-100 mb-4 flex items-center gap-2"><span>📜</span> Eco-Learn Certificate</h3>
              {completionPct === 100 ? (
                <div className="border-2 border-emerald-500/30 rounded-2xl p-8 text-center bg-[#0a0a0a]">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Certificate of Completion</p>
                  <p className="text-2xl font-black text-[#4ade80] mt-3">{name || 'Farmer'}</p>
                  <p className="text-xs text-zinc-400 mt-2">has completed all {LESSONS.length} Eco-Learn micro-courses of the Rural Community Academy.</p>
                  <p className="text-[10px] text-zinc-600 mt-4 font-mono">UAE Ministry of Climate Change &amp; Environment · Eco Connect</p>
                  <button onClick={() => window.print()} className="mt-5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg px-4 py-2.5 transition-all">🖨️ Print certificate</button>
                </div>
              ) : (
                <div className="border border-dashed border-zinc-850 rounded-2xl p-8 text-center">
                  <p className="text-sm text-zinc-300 font-bold">{100 - completionPct}% to go</p>
                  <p className="text-xs text-zinc-500 mt-1">Complete all {LESSONS.length} courses to unlock your printable certificate.</p>
                  <button onClick={() => setEcoLearnTab('courses')} className="mt-4 text-xs font-bold text-emerald-400 hover:text-emerald-300">Go to courses →</button>
                </div>
              )}
            </div>

            {/* Community leaderboard (demo) */}
            <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-md font-bold text-zinc-100 mb-4 flex items-center gap-2"><span>📊</span> Community Leaderboard</h3>
              <div className="space-y-2">
                {[
                  { rank: 1, name: 'Khalid R. · Hatta', pts: 180 },
                  { rank: 2, name: 'Aisha M. · Al Ain', pts: 150 },
                  { rank: 3, name: name || 'You', pts: ecoPoints, you: true },
                  { rank: 4, name: 'Mariam S. · Liwa', pts: 60 },
                ].sort((a, b) => b.pts - a.pts).map((r, i) => (
                  <div key={i} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${r.you ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#0a0a0a] border-zinc-850'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-black w-6 ${i === 0 ? 'text-[#c2964b]' : 'text-zinc-500'}`}>#{i + 1}</span>
                      <span className={`text-sm ${r.you ? 'text-emerald-400 font-bold' : 'text-zinc-200'}`}>{r.name}</span>
                    </div>
                    <span className="text-xs font-bold text-[#c2964b]">{r.pts} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDonutChart = (percent, strokeColor, label, sublabel) => {
    const radius = 50;
    const circ = 2 * Math.PI * radius;
    const strokeDashoffset = circ - (percent / 100) * circ;

    let gradId = "blueGrad";
    let startColor = "#3b82f6";
    let endColor = "#1d4ed8";
    
    if (strokeColor === "#b45309" || strokeColor === "#a6802b") {
      gradId = "goldGrad";
      startColor = "#d49a43";
      endColor = "#a6802b";
    } else if (strokeColor === "#ef4444" || strokeColor === "#dc2626") {
      gradId = "redGrad";
      startColor = "#f87171";
      endColor = "#b91c1c";
    } else if (strokeColor === "#10b981" || strokeColor === "#0f7a54" || strokeColor === "#059669") {
      gradId = "greenGrad";
      startColor = "#34d399";
      endColor = "#047857";
    }

    return (
      <div className="flex flex-col items-center justify-center bg-[#0a0a0a] border border-zinc-850 p-6 rounded-2xl shadow-inner relative group hover:border-zinc-700 transition-all duration-300">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={startColor} />
                <stop offset="100%" stopColor={endColor} />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#1f2937" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-zinc-100">{Math.round(percent)}%</span>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm font-bold text-zinc-200">{label}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">{sublabel}</p>
        </div>
      </div>
    );
  };

  const renderToolsLibrary = () => {
    const handleBorrowTool = (id) => {
      setBorrowErr('');
      const tool = toolsList.find((t) => t.id === id);
      if (!tool) return;
      if (tool.status === 'Borrowed') {
        setBorrowErr(`"${tool.name}" is currently rented by another farmer. Join the waitlist or try later.`);
        setTimeout(() => setBorrowErr(''), 4000);
        return;
      }
      setToolsList((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'Borrowed' } : t)));
      setBorrowMsg(`✅ "${tool.name}" reserved successfully for ${tool.cost} Eco Credits. Pickup scheduled at the Hatta Hub.`);
      setTimeout(() => setBorrowMsg(''), 4000);
    };

    const handleReturnTool = (id) => {
      setToolsList((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'Available' } : t)));
      setBorrowMsg('🔄 Tool returned successfully to the Eco Souq catalog.');
      setTimeout(() => setBorrowMsg(''), 4000);
    };

    const handleAddTool = (e) => {
      e.preventDefault();
      setBorrowErr('');
      if (!newToolName.trim()) {
        setBorrowErr('Please enter a tool name to list it.');
        return;
      }
      const cost = Number(newToolCost);
      if (!newToolCost || Number.isNaN(cost) || cost < 0) {
        setBorrowErr('Please enter a valid Eco Credit cost.');
        return;
      }
      const newTool = {
        id: `TL-${Math.floor(10 + Math.random() * 90)}`,
        name: newToolName.trim(),
        icon: newToolIcon,
        owner: name || 'You',
        cost,
        status: 'Available',
        category: newToolCategory,
        type: newToolType
      };
      setToolsList((prev) => [newTool, ...prev]);
      setNewToolName('');
      setNewToolCost('');
      setNewToolIcon('🔧');
      setBorrowMsg(`✅ "${newTool.name}" listed under ${newToolCategory} in Eco Souq.`);
      setTimeout(() => setBorrowMsg(''), 4000);
    };

    const filteredTools = toolsList.filter((t) => {
      const matchCat = toolsCategoryFilter === 'All' || t.category === toolsCategoryFilter;
      const matchType = toolsTypeFilter === 'All' || t.type === toolsTypeFilter;
      return matchCat && matchType;
    });

    const availableCount = toolsList.filter((t) => t.status === 'Available').length;

    return (
      <div className="space-y-6 text-left animate-fadeIn">
        {/* Banner */}
        <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-center w-full mb-1">
              <h2 className="text-md font-bold text-[#4ade80] flex items-center gap-2">
                <span>🔧</span> Eco Souq — Circular Tools Exchange
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold bg-[#1b3d34] text-emerald-450 border border-emerald-900/50 px-2.5 py-1.5 rounded-full">
                ● Challenge 5 Circular Economy
              </span>
            </div>
            <p className="text-xs text-zinc-450 mt-1 font-light leading-relaxed max-w-xl">
              Borrow, list, and rent expensive machinery and precision farming tools with neighboring farmers using community Eco Credits.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <div className="bg-zinc-950 border border-zinc-850 rounded-2xl px-4 py-3 text-center">
              <span className="block text-xl font-black text-emerald-400">{availableCount}</span>
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Available</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-850 rounded-2xl px-4 py-3 text-center">
              <span className="block text-xl font-black text-amber-400">{toolsList.length}</span>
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Total Listings</span>
            </div>
          </div>
        </div>

        {borrowMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-350 text-xs p-3 rounded-xl font-semibold">
            {borrowMsg}
          </div>
        )}
        {borrowErr && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl font-semibold">
            ⚠️ {borrowErr}
          </div>
        )}

        {/* Filters Panel */}
        <div className="bg-[#111317] border border-zinc-850 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-550">Filter Category:</span>
            <div className="flex gap-1.5">
              {['All', 'Machinery', 'Sensors', 'Harvesting', 'Irrigation'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setToolsCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-0 cursor-pointer ${toolsCategoryFilter === cat ? 'bg-[#1b3d34] text-emerald-450 border border-emerald-900/50' : 'bg-zinc-950 text-zinc-450 hover:text-zinc-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-550">Type:</span>
            <div className="flex gap-1.5">
              {['All', 'Rent', 'Borrow'].map((tType) => (
                <button
                  key={tType}
                  onClick={() => setToolsTypeFilter(tType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-0 cursor-pointer ${toolsTypeFilter === tType ? 'bg-[#1b3d34] text-emerald-450 border border-emerald-900/50' : 'bg-zinc-950 text-zinc-450 hover:text-zinc-200'}`}
                >
                  {tType}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List a tool form */}
          <div className="bg-[#15171e] border border-zinc-800 p-5 rounded-2xl space-y-4 self-start">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <span>➕</span> List a Tool in Eco Souq
            </h3>
            <form onSubmit={handleAddTool} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500">Tool Name</label>
                <input
                  type="text"
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value)}
                  placeholder="e.g. Seed Broadcaster"
                  className="bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-xs text-zinc-300 p-2.5 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-zinc-500">Category</label>
                  <select
                    value={newToolCategory}
                    onChange={(e) => setNewToolCategory(e.target.value)}
                    className="bg-zinc-950 border border-zinc-850 text-xs text-zinc-350 p-2.5 rounded-xl outline-none"
                  >
                    <option value="Machinery">Machinery</option>
                    <option value="Sensors">Sensors</option>
                    <option value="Harvesting">Harvesting</option>
                    <option value="Irrigation">Irrigation</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-zinc-500">Listing Type</label>
                  <select
                    value={newToolType}
                    onChange={(e) => setNewToolType(e.target.value)}
                    className="bg-zinc-950 border border-zinc-850 text-xs text-zinc-350 p-2.5 rounded-xl outline-none"
                  >
                    <option value="Rent">Rent</option>
                    <option value="Borrow">Borrow</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500">Icon</label>
                <div className="flex flex-wrap gap-1.5">
                  {['🔧', '🚜', '🧪', '🪜', '💧', '🌱', '⚙️', '🔋'].map((ic) => (
                    <button
                      type="button"
                      key={ic}
                      onClick={() => setNewToolIcon(ic)}
                      className={`w-9 h-9 rounded-xl border text-lg transition-all border-0 cursor-pointer ${newToolIcon === ic ? 'bg-emerald-500/15 border-emerald-500/40' : 'bg-zinc-950 border-zinc-855 hover:border-zinc-700'}`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500">Borrow Cost (Eco Credits)</label>
                <input
                  type="number"
                  min="0"
                  value={newToolCost}
                  onChange={(e) => setNewToolCost(e.target.value)}
                  placeholder="e.g. 25"
                  className="bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-xs text-zinc-300 p-2.5 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#247055] hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer border-0 mt-1"
              >
                Publish Listing 📤
              </button>
            </form>
          </div>

          {/* Tools grid */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 self-start">
            {filteredTools.map((t) => (
              <div key={t.id} className="bg-[#15171e] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between gap-4 hover:border-zinc-750 transition-all">
                <div className="flex items-start gap-3">
                  <span className="text-3xl bg-zinc-950 border border-zinc-850 p-2.5 rounded-2xl">{t.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-sm font-bold text-zinc-200 leading-tight">{t.name}</h4>
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border shrink-0 ${t.status === 'Available' ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' : 'bg-amber-500/10 text-amber-450 border-amber-500/20'}`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-1.5">
                      <span className="text-[9px] uppercase font-bold text-zinc-550 bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded-full">{t.category}</span>
                      <span className="text-[9px] uppercase font-bold text-[#c2a14e] bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded-full">{t.type}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2">Listed by: <span className="text-zinc-350 font-semibold">{t.owner}</span></p>
                    <span className="inline-flex items-center gap-1.5 mt-2 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-bold">
                      🪙 {t.cost} Credits
                    </span>
                  </div>
                </div>
                {t.status === 'Available' ? (
                  <button
                    onClick={() => handleBorrowTool(t.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer border-0"
                  >
                    Borrow Tool
                  </button>
                ) : (
                  <button
                    onClick={() => handleReturnTool(t.id)}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer border-0"
                  >
                    Mark as Returned
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContracts = () => {
    const handleSignContract = (e) => {
      e.preventDefault();
      if (!signingName.trim() || !signingLicenseNum.trim()) {
        setSignErr('All fields are required to digitally bind this contract.');
        return;
      }
      setSignErr('');
      setSignSuccess('Contract digitally verified and signed! System is now synchronizing ledger...');
      
      setTimeout(() => {
        setContractsList(prev => prev.map(c => {
          if (c.id === selectedContract.id) {
            return {
              ...c,
              status: 'Signed & Active',
              signeeName: signingName,
              licenseRef: signingLicenseNum
            };
          }
          return c;
        }));
        setSignSuccess('');
        setSelectedContract(null);
        setSigningName('');
        setSigningLicenseNum('');
      }, 2500);
    };

    const handleProposeContract = (e) => {
      e.preventDefault();
      if (!propProduce.trim() || !propQuota.trim() || !propPrice.trim()) {
        setPropErr('Please fill in all details for the supply proposal.');
        return;
      }
      setPropErr('');
      setPropSuccess('Contract proposal dispatched! Awaiting corporate buyer approval...');

      const newId = `CTR-${Math.floor(1000 + Math.random() * 9000)}`;
      const newContract = {
        id: newId,
        buyerName: propBuyer,
        produceType: propProduce,
        quota: propQuota,
        priceAed: `${propPrice} AED/kg`,
        paymentTerms: propTerms,
        status: 'Awaiting Digital Signature',
        dateProposed: new Date().toISOString().split('T')[0],
        signeeName: '',
        licenseRef: ''
      };

      setTimeout(() => {
        setContractsList(prev => [newContract, ...prev]);
        setPropProduce('');
        setPropQuota('');
        setPropPrice('');
        setPropSuccess('');
      }, 2000);
    };

    return (
      <div className="space-y-6 text-left animate-fadeIn">
        {/* Banner */}
        <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl">
          <h2 className="text-md font-bold text-[#c2a14e] flex items-center gap-2">
            <span>📜</span> Corporate Supply Trade Contracts
          </h2>
          <p className="text-xs text-zinc-450 mt-1 font-light leading-relaxed">
            Review and digitally execute smart supply-chain trade contracts with regional wholesale clients, hotels, and hypermarket distributors.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Propose Form */}
          <div className="bg-[#15171e] border border-zinc-800 p-5 rounded-2xl space-y-4 self-start">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <span>✍️</span> Propose Supply Contract
            </h3>
            
            {propErr && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-2.5 rounded-xl">⚠️ {propErr}</div>}
            {propSuccess && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-350 text-xs p-2.5 rounded-xl">{propSuccess}</div>}

            <form onSubmit={handleProposeContract} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500">Corporate Buyer</label>
                <select
                  value={propBuyer}
                  onChange={(e) => setPropBuyer(e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-xs text-zinc-300 p-2.5 rounded-xl outline-none"
                >
                  <option value="LuLu Hypermarket Group HQ">LuLu Hypermarket Group HQ</option>
                  <option value="Jumeirah Luxury Resorts & Hotels">Jumeirah Luxury Resorts & Hotels</option>
                  <option value="Spinneys Dubai HQ">Spinneys Dubai HQ</option>
                  <option value="Hatta Heritage Village Souq">Hatta Heritage Village Souq</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500">Produce Type</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Medjool Dates"
                  value={propProduce}
                  onChange={(e) => setPropProduce(e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-xs text-zinc-300 p-2.5 rounded-xl outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500">Monthly Quota</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 800 kg / Month"
                  value={propQuota}
                  onChange={(e) => setPropQuota(e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-xs text-zinc-300 p-2.5 rounded-xl outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500">Price Offered (AED/kg)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 60"
                  value={propPrice}
                  onChange={(e) => setPropPrice(e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-xs text-zinc-300 p-2.5 rounded-xl outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500">Settlement Terms</label>
                <select
                  value={propTerms}
                  onChange={(e) => setPropTerms(e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-xs text-zinc-300 p-2.5 rounded-xl outline-none"
                >
                  <option value="Net-30 Days">Net-30 Days</option>
                  <option value="Net-15 Days">Net-15 Days</option>
                  <option value="Immediate Grant Release">Immediate Grant Release</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#c2a14e] hover:bg-[#c2a14e]/90 text-zinc-950 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer border-0 mt-2 font-sans"
              >
                Send Proposal ✉
              </button>
            </form>
          </div>

          {/* Contracts List Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {contractsList.map(contract => (
              <div key={contract.id} className="bg-zinc-900/35 border border-zinc-800/80 p-5 rounded-2xl space-y-4 hover:border-zinc-700/60 transition-all duration-300 relative flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono text-[#c2a14e] font-bold tracking-wider">{contract.id}</span>
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                      contract.status === 'Signed & Active'
                        ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-450 border-amber-500/20 animate-pulse'
                    }`}>
                      {contract.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">{contract.buyerName}</h3>
                    <p className="text-xs text-zinc-400 mt-1 font-medium">{contract.produceType}</p>
                  </div>

                  <div className="border-t border-zinc-850 pt-3 space-y-2 text-xs font-mono text-zinc-450">
                    <div className="flex justify-between">
                      <span>Supply Quota:</span>
                      <span className="text-zinc-300 font-semibold">{contract.quota}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Target Price:</span>
                      <span className="text-emerald-455 font-bold">{contract.priceAed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Terms:</span>
                      <span className="text-zinc-350">{contract.paymentTerms}</span>
                    </div>
                    {contract.signeeName && (
                      <div className="flex justify-between text-[11px] border-t border-dashed border-zinc-850 pt-2 text-[#c2a14e]">
                        <span>Signed by:</span>
                        <span className="font-semibold">{contract.signeeName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  {contract.status === 'Awaiting Digital Signature' ? (
                    <button
                      onClick={() => { setSelectedContract(contract); setSignErr(''); setSignSuccess(''); }}
                      className="w-full bg-[#c2a14e] hover:bg-[#c2a14e]/90 text-zinc-950 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer border-0 font-sans"
                    >
                      Review &amp; Sign Agreement
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        exportReportPdf({
                          title: 'Supply-Chain Trade Contract',
                          subtitle: 'Local Farmer Direct Wholesale Exchange',
                          kpis: [
                            { label: 'Contract Ref', value: contract.id },
                            { label: 'Corporate Buyer', value: contract.buyerName },
                            { label: 'Monthly Quota', value: contract.quota },
                            { label: 'Wholesale Price', value: contract.priceAed }
                          ],
                          sections: [
                            {
                              heading: 'Legal Covenant & Execution',
                              rows: [
                                ['Cottage Signee', contract.signeeName || 'Anwar Hossain'],
                                ['Cottage License Ref', contract.licenseRef || 'LIC-HATTA-881'],
                                ['Proposed Date', contract.dateProposed],
                                ['Payment Settlement', contract.paymentTerms],
                                ['Agreement Status', 'LEGALLY BINDING / ACTIVE']
                              ]
                            }
                          ],
                          footer: 'Authorized digitally via EcoConnect Rural Ledger.'
                        });
                      }}
                      className="w-full bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer border-0 font-sans"
                    >
                      Download Agreement (PDF) 📄
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
        </div>

        {/* Signing Modal */}
        {selectedContract && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#15171e] border border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative space-y-6 animate-zoomIn">
              <button
                onClick={() => setSelectedContract(null)}
                className="absolute top-4 right-4 text-zinc-550 hover:text-zinc-300 font-bold text-lg border-0 bg-transparent cursor-pointer"
              >
                ✕
              </button>

              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[#c2a14e] font-bold uppercase">Contract Review and Signing Desk</span>
                <h3 className="text-md font-bold text-zinc-100">{selectedContract.buyerName}</h3>
                <p className="text-xs text-zinc-400">Please verify the proposed wholesale terms and enter credentials to digitally bind the agreement.</p>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-3 font-mono text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Product Supply:</span>
                  <span className="text-zinc-200">{selectedContract.produceType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Quota:</span>
                  <span className="text-zinc-200">{selectedContract.quota}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price Offered:</span>
                  <span className="text-emerald-455 font-bold">{selectedContract.priceAed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Terms:</span>
                  <span className="text-zinc-200">{selectedContract.paymentTerms}</span>
                </div>
              </div>

              <form onSubmit={handleSignContract} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Signee Full Name (as per ID)</label>
                  <input
                    type="text"
                    value={signingName}
                    onChange={(e) => setSigningName(e.target.value)}
                    placeholder="e.g. Anwar Hossain"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-[#c2a14e]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Cottage Licensing Reference Number</label>
                  <input
                    type="text"
                    value={signingLicenseNum}
                    onChange={(e) => setSigningLicenseNum(e.target.value)}
                    placeholder="e.g. LIC-HATTA-881"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-[#c2a14e]"
                    required
                  />
                </div>

                {signErr && <p className="text-rose-450 text-xs font-mono">{signErr}</p>}
                {signSuccess && <p className="text-emerald-450 text-xs font-mono">{signSuccess}</p>}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedContract(null)}
                    className="flex-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 font-bold py-3 rounded-xl text-xs uppercase cursor-pointer border-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!!signSuccess}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold py-3 rounded-xl text-xs uppercase cursor-pointer border-0 disabled:opacity-40"
                  >
                    {signSuccess ? 'Signing...' : 'Authorize & Sign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEcoGrid = () => {
    const baseWater = 1200;
    const irrigationUsed = waterFlowRate * 22;
    const totalWaterUsed = baseWater + irrigationUsed;
    const waterQuota = 2000;
    const waterUsedPct = Math.min(100, Math.round((totalWaterUsed / waterQuota) * 100));
    const waterRemainingPct = Math.max(0, 100 - waterUsedPct);
    const isWaterCritical = totalWaterUsed > waterQuota;

    const weatherFactor = weatherCondition === 'sunny' ? 1.0 : weatherCondition === 'cloudy' ? 0.55 : 0.25;
    const tiltEfficiency = Math.max(0.1, 1 - Math.abs(solarPanelAngle - 40) / 55);
    const maxSolarOutput = 450;
    const solarGenerated = Math.round(maxSolarOutput * weatherFactor * tiltEfficiency);
    const solarPct = Math.min(100, Math.round((solarGenerated / maxSolarOutput) * 100));

    let solarMsg = "Optimal panel efficiency detected.";
    if (weatherCondition === 'dusty') solarMsg = "Dust alert: Solar output degraded. Panel washing advised.";
    else if (weatherCondition === 'cloudy') solarMsg = "Cloud cover: Solar output reduced.";
    else if (solarPanelAngle < 20 || solarPanelAngle > 65) solarMsg = "Sub-optimal panel angle. Adjust tilt to ~40°.";

    return (
      <div className="max-w-6xl mx-auto w-full space-y-6">
        <div className="mb-4 flex flex-wrap justify-between items-center bg-[#15171e] border border-zinc-800/60 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡💧</span>
            <div>
              <h2 className="text-md font-bold text-zinc-100">Eco-Grid Resource Index</h2>
              <p className="text-[10px] text-zinc-400 font-mono">ENERGY & WATER CONSUMPTION ALLOCATION</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-[#1b3d34] text-emerald-450 border border-emerald-900/50 px-3 py-1.5 rounded-full">
            ● Grid Sync Online
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
            <h3 className="text-sm font-bold text-zinc-200 mb-4 flex items-center justify-between">
              <span>💧 Water Quota remaining</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isWaterCritical ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                {isWaterCritical ? 'Quota Exceeded!' : 'Within Quota'}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              {renderDonutChart(
                waterRemainingPct, 
                isWaterCritical ? "#ef4444" : "#2563eb", 
                "Remaining Allocation", 
                `${Math.max(0, waterQuota - totalWaterUsed)} m³`
              )}

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block font-mono">Total Consumption</span>
                  <p className="text-2xl font-black text-zinc-100">{totalWaterUsed} m³ <span className="text-xs text-zinc-550">/ {waterQuota} m³</span></p>
                </div>
                <div className="space-y-1.5 text-xs text-zinc-450 font-light">
                  <div className="flex justify-between"><span>Base farm use:</span><span className="font-semibold text-zinc-200">{baseWater} m³</span></div>
                  <div className="flex justify-between"><span>Drip Irrigation use:</span><span className="font-semibold text-zinc-200">{irrigationUsed} m³</span></div>
                  <div className="flex justify-between"><span>Water Flow rate:</span><span className="font-mono text-zinc-200">{waterFlowRate} L/min</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
            <h3 className="text-sm font-bold text-zinc-200 mb-4 flex items-center justify-between">
              <span>⚡ Solar Panels Production</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-550 border border-amber-500/20">
                {weatherCondition.toUpperCase()}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              {renderDonutChart(
                solarPct, 
                "#b45309", 
                "Generation Efficiency", 
                `${solarGenerated} kWh`
              )}

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block font-mono">Current Output</span>
                  <p className="text-2xl font-black text-zinc-100">{solarGenerated} kWh <span className="text-xs text-zinc-550">/ {maxSolarOutput} kWh max</span></p>
                </div>
                <div className="space-y-1 text-xs text-zinc-450">
                  <p className="font-light text-zinc-500 leading-relaxed">{solarMsg}</p>
                  <div className="flex justify-between pt-2 border-t border-zinc-900/60 mt-2">
                    <span>Panel Tilt:</span><span className="font-mono text-zinc-200">{solarPanelAngle}°</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg lg:col-span-1">
            <h3 className="text-sm font-bold text-zinc-200 mb-4 flex items-center gap-2">
              <span>🔋</span> Battery Storage Bank
            </h3>
            <div className="flex flex-col items-center justify-center p-6 bg-[#0a0a0a] border border-zinc-850 rounded-xl">
              <div className="w-24 h-12 border-4 border-zinc-700 rounded-xl relative flex items-center p-1 mb-4">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-md transition-all duration-500" style={{ width: `${batteryStorage}%` }} />
                <div className="w-2 h-4 bg-zinc-700 absolute -right-2 top-3 rounded-r" />
              </div>
              <p className="text-3xl font-black text-zinc-100">{batteryStorage}%</p>
              <p className="text-[10px] text-zinc-500 uppercase font-mono mt-1">7.2 kWh Capacity Remaining</p>
            </div>
          </div>

          <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-200 mb-1 flex items-center gap-2">
                <span>🎛️</span> Eco-Grid Interactive Simulation Control
              </h3>
              <p className="text-xs text-zinc-450 font-light">
                Drag sliders and change variables to simulate desert weather factors and observe grid calculations instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-300">Drip Irrigation Flow Rate</span>
                    <span className="text-blue-450 font-mono">{waterFlowRate} L/min</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="45" 
                    value={waterFlowRate} 
                    onChange={(e) => setWaterFlowRate(parseInt(e.target.value))} 
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <p className="text-[9px] text-zinc-550">Simulates open valves. Higher flow increases used quota.</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-300">Solar Panel Tilt Angle</span>
                    <span className="text-amber-550 font-mono">{solarPanelAngle}°</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="90" 
                    value={solarPanelAngle} 
                    onChange={(e) => setSolarPanelAngle(parseInt(e.target.value))} 
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#a6802b]"
                  />
                  <p className="text-[9px] text-zinc-550">Optimal angle for Al Ain latitude is ~35° - 40°.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-300 block">Weather Environment Simulator</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['sunny', 'cloudy', 'dusty'].map(cond => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setWeatherCondition(cond)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border uppercase ${
                          weatherCondition === cond 
                            ? 'bg-[#1b3d34] text-emerald-450 border-emerald-900/50' 
                            : 'bg-[#0a0a0a] text-zinc-450 border-zinc-850 hover:text-zinc-200'
                        }`}
                      >
                        {cond === 'sunny' ? '☀️ Sunny' : cond === 'cloudy' ? '☁️ Cloudy' : '🌪️ Dusty'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-300">Battery Storage Charge</span>
                    <span className="text-[#4ade80] font-mono">{batteryStorage}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={batteryStorage} 
                    onChange={(e) => setBatteryStorage(parseInt(e.target.value))} 
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#0f7a54]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carbon Offset & Water Recycling Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Carbon Credit offset Card */}
          <div className="bg-gradient-to-br from-emerald-950/20 to-[#15171e] border border-emerald-900/30 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <span>🍃</span> Carbon Credits Ticker
              </h3>
              <span className="text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase">Verified CER</span>
            </div>
            <div className="py-4">
              <p className="text-[10px] uppercase font-bold text-zinc-550 tracking-wider">Estimated Carbon Offset</p>
              <p className="text-4xl font-black text-emerald-300 mt-1 animate-pulse">
                {((solarGenerated * 0.43) + (waterFlowRate * 0.08) + (batteryStorage * 0.02)).toFixed(3)} <span className="text-sm text-zinc-450 font-normal font-sans">kg CO₂eq</span>
              </p>
            </div>
            <p className="text-[10px] text-zinc-500 leading-normal font-light">Accumulating credit offsets directly aligned with Dubai Clean Energy Strategy 2050 targets.</p>
          </div>

          {/* Water Recycling Index Card */}
          <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                <span>♻️</span> Greywater Recycling System
              </h3>
              <span className="text-[9px] font-mono bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase">Dewa Standards</span>
            </div>
            <div className="py-4">
              <p className="text-[10px] uppercase font-bold text-zinc-550 tracking-wider">Recycling Efficiency Index</p>
              <p className="text-4xl font-black text-blue-300 mt-1">
                {(88.5 - (waterFlowRate * 0.25)).toFixed(1)}%
              </p>
            </div>
            <p className="text-[10px] text-zinc-500 leading-normal font-light">Sub-surface drain water recycled back for landscaping and livestock cleaning.</p>
          </div>
        </div>

        {/* Smart Alerts Center Row */}
        <div className="bg-[#1c1410] border border-amber-900/30 p-5 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
            <span>🚨</span> Grid Smart Alerts &amp; Resource Advisories
          </h4>
          <div className="space-y-2">
            {solarPanelAngle < 35 || solarPanelAngle > 45 ? (
              <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <span>⚠️</span> <span>Sub-optimal Solar angle ({solarPanelAngle}°). Setting panel angle to 40° will improve generation by +{(Math.abs(solarPanelAngle - 40) * 1.2).toFixed(1)}%.</span>
              </div>
            ) : null}
            {weatherCondition === 'dusty' ? (
              <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <span>🌪️</span> <span>Severe dust accumulation warning. Wash panels to restore 100% capacity.</span>
              </div>
            ) : null}
            {waterFlowRate > 35 ? (
              <div className="bg-rose-500/10 border border-rose-500/25 p-3 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <span>💧</span> <span>High water flow anomaly detected ({waterFlowRate} L/min). Check field valves for leakage.</span>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                <span>✓</span> <span>Grid pressure and water flow rates normal. No leaks detected.</span>
              </div>
            )}
          </div>
        </div>

        {/* Solar Net-Metering & Grid Feed-in Simulator */}
        <div className="bg-[#15171e] border border-amber-900/40 rounded-2xl p-6 shadow-lg">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>🔌</span> Solar Net-Metering & Battery Grid Feed-in
              </h3>
              <p className="text-xs text-zinc-450 mt-0.5">Export excess generated green energy to the national grid and earn feed-in credits.</p>
            </div>
            <div className="bg-[#0a0a0a] border border-zinc-850 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[9px] uppercase font-bold text-zinc-550 block">Cumulative Grid Credit</span>
              <span className="text-md font-black text-amber-500">{netExportAed.toFixed(2)} AED</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Battery Simulation Column */}
            <div className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-5 flex flex-col justify-between items-center text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-3">Live Storage Status</span>
                <div className="w-28 h-14 border-4 border-zinc-800 rounded-2xl relative flex items-center p-1 bg-zinc-950/60 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-lg transition-all duration-1000" 
                    style={{ 
                      width: `${batteryStorage}%`,
                      animation: weatherCondition === 'sunny' ? 'ecoBatteryCharge 2s infinite linear' : 'none'
                    }} 
                  />
                  <div className="w-2.5 h-5 bg-zinc-800 absolute -right-3 top-3.5 rounded-r" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-zinc-100">{batteryStorage}%</p>
                <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                  {((batteryStorage / 100) * batteryCapacity).toFixed(1)} kWh / {batteryCapacity} kWh Cap
                </p>
              </div>
            </div>

            {/* Config Input Form Column */}
            <div className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">
                  Daily Generation Limit (kWh)
                </label>
                <input 
                  type="number"
                  value={dailySolarGen}
                  onChange={(e) => setDailySolarGen(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-full bg-[#15171e] border border-zinc-800 focus:border-amber-500 rounded-xl p-2.5 text-xs text-zinc-350 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">
                  Battery Bank Capacity (kWh)
                </label>
                <input 
                  type="number"
                  value={batteryCapacity}
                  onChange={(e) => setBatteryCapacity(Math.max(20, parseInt(e.target.value) || 20))}
                  className="w-full bg-[#15171e] border border-zinc-800 focus:border-amber-500 rounded-xl p-2.5 text-xs text-zinc-350 outline-none"
                />
              </div>
            </div>

            {/* Calculations and Live Feed-in Grid stats */}
            <div className="bg-[#0a0a0a] border border-zinc-850 rounded-xl p-5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Hourly Solar Output:</span>
                  <span className="text-zinc-200 font-mono font-bold">{(solarGenerated).toFixed(1)} kW</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Average Farm Demand:</span>
                  <span className="text-zinc-200 font-mono font-bold">{(waterFlowRate * 0.4 + 2.5).toFixed(1)} kW</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-zinc-900">
                  <span className="text-zinc-400 font-medium">Power Net Export Rate:</span>
                  <span className="text-emerald-450 font-mono font-bold">
                    {Math.max(0, solarGenerated - (waterFlowRate * 0.4 + 2.5)).toFixed(1)} kW
                  </span>
                </div>
              </div>

              <div className="bg-[#15171e] border border-amber-900/30 p-2.5 rounded-xl text-center mt-4">
                <span className="text-[8.5px] uppercase font-bold text-amber-500/80 block">UAE Feed-in Rate</span>
                <span className="text-[10px] text-zinc-300 font-mono">0.15 AED per exported kWh</span>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes ecoBatteryCharge {
              0% { opacity: 0.8; }
              50% { opacity: 0.5; }
              100% { opacity: 0.8; }
            }
          `}</style>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 hidden md:flex flex-col border-r border-zinc-800/60 bg-[#0f1115] h-screen sticky top-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-zinc-800/60 shrink-0">
          <img src="/logo.svg" alt="Eco Connect logo" className="w-9 h-9" />
          <span className="text-lg font-black tracking-wide"><span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">ECO </span><span className="text-blue-400">CONNECT</span></span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group} className="space-y-1">
              <p className="px-4 pt-1 pb-1 text-[9px] font-bold uppercase tracking-wider text-zinc-600">{group}</p>
              {NAV_ITEMS.filter((item) => item.group === group).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 transform ${activeTab === item.id ? 'bg-[#1a2024] text-[#4ade80] border border-emerald-900/50 translate-x-1 shadow-inner' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 border border-transparent hover:translate-x-0.5'}`}
                >
                  <span className="text-base opacity-90">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-zinc-800/60 p-3 shrink-0">
          <div className="flex items-center justify-between gap-2 px-2 py-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-[10px] uppercase">{name ? name.substring(0, 2) : 'UA'}</div>
              <div className="leading-tight min-w-0">
                <p className="text-[11px] font-bold text-zinc-200 truncate">{name || 'UAE Resident'}</p>
                <p className="text-[9px] text-zinc-550">Farmer Account</p>
              </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-black rounded-lg px-2 py-1 shrink-0 flex items-center gap-1">
              <span>🪙</span>
              <span>{ecoCredits}</span>
            </div>
          </div>
          <button onClick={logout} className="w-full text-xs font-semibold text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/40 rounded-xl px-3 py-2 transition-all">Logout 🚪</button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-40 border-b border-zinc-800/60 bg-[#0f1115]/95 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 h-14">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Eco Connect logo" className="w-7 h-7" />
              <span className="text-sm font-black"><span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">ECO </span><span className="text-blue-400">CONNECT</span></span>
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === item.id ? 'bg-[#1a2024] text-[#4ade80] border border-emerald-900/50' : 'text-zinc-400 hover:bg-zinc-800/40 border border-transparent'}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Top Live Emergency Alert Banners */}
          {liveAlerts.length > 0 && activeTab !== 'eco-shield' && (
            <div className="max-w-6xl mx-auto w-full mb-6 space-y-2">
              {liveAlerts.filter(a => a.severity === 'high').map(alert => (
                <div key={alert.id} className="bg-red-650/90 border border-red-750 text-white px-4 py-3 rounded-2xl flex items-center justify-between shadow-lg shadow-red-950/20 animate-pulse">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🚨</span>
                    <span className="text-xs md:text-sm font-bold tracking-wide">{alert.text}</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('eco-shield')}
                    className="bg-[#faf8f2] text-red-700 hover:bg-[#ece8dd] text-[10px] md:text-xs font-black uppercase px-3 py-1.5 rounded-xl shrink-0 ml-4 shadow transition-all cursor-pointer border border-red-200 active:scale-95"
                  >
                    View Shield →
                  </button>
                </div>
              ))}
            </div>
          )}

         {activeTab === 'marketplace' && renderMarketplace()}
         {activeTab === 'eco-tourism' && renderEcoTourism()}
         {activeTab === 'my-farm' && renderMyFarm()}
         {activeTab === 'employees' && renderEmployees()}
         {activeTab === 'falcon' && <FalconAgent onVoiceCommand={handleVoiceCommand} />}
         {activeTab === 'compare' && <CropCompare />}
         {activeTab === 'subsidy-check' && <SubsidyEligibility />}
         {activeTab === 'community' && renderCommunity()}
         {activeTab === 'eco-shield' && <SosBeacon name={name} />}
         {activeTab === 'eco-learn' && renderEcoLearn()}
         {activeTab === 'eco-grid' && renderEcoGrid()}
         {activeTab === 'eco-launch' && <EntrepreneurHub />}
         {activeTab === 'eco-credits' && <EcoCreditsPanel />}
         {activeTab === 'scan' && <DocumentScanner />}
         {activeTab === 'my-vault' && <SmartDocumentVerification token={token} userName={name} vaultOnly />}
         {activeTab === 'tools-library' && renderToolsLibrary()}
         {activeTab === 'contracts' && renderContracts()}
         {activeTab === 'gov-connect' && (
           <div className="max-w-6xl mx-auto w-full space-y-6">
             {/* Gov-Connect unified header + sub-tabs */}
             <div className="bg-[#15171e] border border-zinc-800/60 rounded-2xl p-4">
               <div className="flex items-center gap-3 mb-4">
                 <span className="text-2xl">🏛️</span>
                 <div>
                   <h2 className="text-md font-bold text-zinc-100">Gov-Connect</h2>
                   <p className="text-[10px] text-zinc-400 font-mono">UNIFIED CITIZEN &amp; GOVERNMENT SERVICES HUB</p>
                 </div>
               </div>
               <div className="flex flex-wrap gap-1.5">
                 {GOV_CONNECT_TABS.map((sub) => (
                   <button
                     key={sub.id}
                     onClick={() => setGovConnectTab(sub.id)}
                     className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${govConnectTab === sub.id ? 'bg-[#1a2024] text-[#4ade80] border border-emerald-900/50' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 border border-transparent'}`}
                   >
                     <span className="opacity-80">{sub.icon}</span>
                     <span>{sub.label}</span>
                   </button>
                 ))}
               </div>
             </div>

             {govConnectTab === 'ai-care' && renderAiCare()}
             {govConnectTab === 'civic' && <GovConnect />}
             {govConnectTab === 'gov-requests' && renderGovRequests()}
           </div>
         )}
         {activeTab === 'earnings' && renderEarnings()}

         <GovFooter />
        </div>
      </div>

      {/* Post Resource Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-[#15171e] border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-zinc-100">Post New Resource</h3>
              <button onClick={() => setIsPostModalOpen(false)} className="text-zinc-500 hover:text-zinc-300">✕</button>
            </div>
            
            {newlyCreatedProduct ? (
              <div className="space-y-5 text-center py-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl mx-auto text-emerald-400">
                  🎉
                </div>
                <div>
                  <h4 className="text-base font-black text-zinc-150">Resource Published!</h4>
                  <p className="text-xs text-zinc-400 mt-1">Here is your product's QR code. Attach it to your items so buyers can instantly scan and trace origin details.</p>
                </div>
                <div className="bg-white p-3 rounded-2xl inline-block shadow-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/#/trace/' + newlyCreatedProduct.item_id)}`}
                    alt="New Product QR"
                    className="w-[150px] h-[150px]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewlyCreatedProduct(null);
                    setIsPostModalOpen(false);
                  }}
                  className="w-full bg-[#1b3d34] hover:bg-emerald-900/60 border border-emerald-500/20 text-[#4ade80] font-bold py-3 rounded-xl text-xs uppercase transition-all cursor-pointer"
                >
                  Close & Done
                </button>
              </div>
            ) : (
              <form onSubmit={handlePostResource} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col gap-1.5">
                     <label className="text-[10px] uppercase font-bold text-zinc-500">Resource Type</label>
                     <select value={postType} onChange={(e) => setPostType(e.target.value)} className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none">
                       <option value="sell">Local Sale</option>
                       <option value="donate">Donation (Free)</option>
                     </select>
                   </div>
                   <div className="flex flex-col gap-1.5">
                     <label className="text-[10px] uppercase font-bold text-zinc-500">Price (AED)</label>
                     <input type="number" min="0" value={postPrice} onChange={(e) => setPostPrice(e.target.value)} disabled={postType === 'donate'} className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none disabled:opacity-50" />
                   </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">Title</label>
                  <input type="text" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="e.g. Organic Dates Batch" className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none" required />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">Description</label>
                  <textarea value={postDesc} onChange={(e) => setPostDesc(e.target.value)} rows="3" placeholder="Provide details about the resource..." className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none" required />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">Stock Quantity</label>
                  <input type="number" min="1" value={postStock} onChange={(e) => setPostStock(e.target.value)} className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none" required />
                </div>

                <button type="submit" className="w-full bg-[#247055] hover:bg-emerald-600 text-white font-bold py-3 rounded-xl mt-4 transition-all shadow-lg cursor-pointer">
                  Submit Listing
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      {isServiceModalOpen && (
        <DynamicServiceModal
          isOpen={isServiceModalOpen}
          onClose={() => {
            setIsServiceModalOpen(false);
            fetchMyGovRequests();
          }}
          serviceId={selectedServiceId}
          farmerId="farmer_ahmed"
        />
      )}
      {qrModalItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setQrModalItem(null)}>
          <div className="bg-[#15171e] border border-zinc-800 rounded-2xl p-6 w-full max-w-sm text-center space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-zinc-100">{qrModalItem.title}</h3>
            <p className="text-xs text-[#a89060] font-light leading-relaxed">Scan this QR Code to trace agricultural holding information, local water use efficiency, and soil certificates on-chain.</p>
            <div className="bg-white p-3 rounded-2xl inline-block">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/#/trace/' + qrModalItem.id)}`} alt="Product QR Code" className="w-[150px] h-[150px]" />
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">TRACEABILITY CODE: TRACE-{qrModalItem.id}</div>
            <button onClick={() => setQrModalItem(null)} className="w-full bg-[#1b3d34] text-[#4ade80] py-2.5 rounded-xl text-xs font-bold hover:brightness-110 cursor-pointer">Close</button>
          </div>
        </div>
      )}
      <EcoCopilotChat role="farmer" />
    </div>
  );
}
