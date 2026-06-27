import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import EcoCopilotChat from '../components/EcoCopilotChat';
import { API_BASE } from '../config';
import StatCard from '../components/StatCard';
import GovFooter from '../components/GovFooter';
import Logo from '../components/Logo';

export default function AdminPortal() {
  const { token, name, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('reports');
  const [aiMode, setAiMode] = useState('cloud');
  const [aiKey, setAiKey] = useState('');
  const [aiUrl, setAiUrl] = useState('');
  const [aiModel, setAiModel] = useState('');

  const fetchAiConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai-config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAiMode(data.ai_mode);
        setAiKey(data.ai_key || '');
        setAiUrl(data.ai_url || '');
        setAiModel(data.ai_model || '');
      }
    } catch (err) {
      console.error('Error fetching AI config:', err);
    }
  };

  const handleToggleAiMode = async (mode) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai-config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ai_mode: mode })
      });
      if (res.ok) {
        setAiMode(mode);
      }
    } catch (err) {
      console.error('Error setting AI config:', err);
    }
  };

  const handleSaveAiCredentials = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai-config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ai_mode: aiMode,
          ai_key: aiKey,
          ai_url: aiUrl,
          ai_model: aiModel
        })
      });
      if (res.ok) {
        alert('AI credentials updated successfully!');
      } else {
        alert('Failed to update AI credentials.');
      }
    } catch (err) {
      console.error('Error saving AI config:', err);
      alert('Error updating AI credentials.');
    }
  };

  useEffect(() => {
    fetchAiConfig();
  }, []);

  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // User Management State
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersErr, setUsersErr] = useState('');
  const [usersSearch, setUsersSearch] = useState('');
  const [adjustingUserId, setAdjustingUserId] = useState(null);
  const [adjustCreditsVal, setAdjustCreditsVal] = useState('');
  const [adjustCreditsType, setAdjustCreditsType] = useState('add');
  const [usersTab, setUsersTab] = useState('all'); // 'all' | 'pending'

  // Government Requests state
  const [govRequests, setGovRequests] = useState([]);
  const [govSuccessMsg, setGovSuccessMsg] = useState('');
  const [govErrorMsg, setGovErrorMsg] = useState('');

  // EcoConnect Data Analytics Agent state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsErr, setAnalyticsErr] = useState('');

  // Shared Challenge States synced with LocalStorage
  const [startups, setStartups] = useState(() => {
    const saved = localStorage.getItem('eco_startups');
    return saved ? JSON.parse(saved) : [
      { id: 1, owner: "Salem Al Hattawi", name: "Sidr Palm Dates Shop", idea: "Selling organic dates packaged with local honey.", skill: "Dates Sorting & Packaging", stage: "Approved License", status: "Approved", funding: 150, costs: 350 },
      { id: 2, owner: "Fatima Al-Dhaheri", name: "Al-Qaw'ah Heritage Sadu Weaving", idea: "Traditional handmade camel-wool weaving craft rugs.", skill: "Sadu Weaving", stage: "Idea Phase", status: "Pending", funding: 0, costs: 300 }
    ];
  });
  const [sosFeed, setSosFeed] = useState(() => {
    const saved = localStorage.getItem('eco_sos_feed');
    return saved ? JSON.parse(saved) : [
      { id: 1, sender: "Ahmed Al-Mansoori", type: "Stuck in Sand", description: "My patrol car is stuck in deep dunes behind farm block 12. Need pull assistance.", lat: 24.1205, lng: 55.4512, time: "5m ago", responders: ["Salem (You)"], region: "Al-Qaw'ah South", status: "Pending" },
      { id: 2, sender: "Fatima Al-Dhaheri", type: "Tractor Failure", description: "Drip feeder pump belt snapped, need spare or agricultural mechanic help.", lat: 24.1561, lng: 55.4891, time: "25m ago", responders: [], region: "Al-Qaw'ah East", status: "Pending" }
    ];
  });
  const [opportunities, setOpportunities] = useState(() => {
    const saved = localStorage.getItem('eco_opportunities');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: "Annual Hatta Date Palm Festival", desc: "Exhibit your crops to over 10,005 visitors. Free booths for local farmers.", type: "event", date: "Jul 15" },
      { id: 2, title: "Subsidized Solar Water Pump Installation", desc: "Ministry of Climate Change grants covering 60% of off-grid solar equipment.", type: "grant", date: "Deadline: Aug 01" }
    ];
  });
  const [surveys, setSurveys] = useState(() => {
    const saved = localStorage.getItem('eco_surveys');
    return saved ? JSON.parse(saved) : { honey: 14, dates: 28, rugs: 9, tours: 17 };
  });
  const [liveAlerts, setLiveAlerts] = useState(() => {
    const saved = localStorage.getItem('eco_live_alerts');
    return saved ? JSON.parse(saved) : [
      { id: 1, text: "🚨 Warning: Sandstorm approaching the southern sector (Al-Qaw'ah), please cover crops.", severity: "high", time: "10m ago" },
      { id: 2, text: "🌾 Dune Alert: Sand dunes encroaching on Sector 4 road, tractor clearance requested.", severity: "medium", time: "1h ago" },
      { id: 3, text: "💧 Flash Flood Advisory: Low-lying wadi channels around Al Ain / Al-Qaw'ah are filling up.", severity: "medium", time: "2h ago" }
    ];
  });

  // Local Form / Action States
  const [alertText, setAlertText] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('high');
  const [alertSuccess, setAlertSuccess] = useState('');

  const [oppTitle, setOppTitle] = useState('');
  const [oppDesc, setOppDesc] = useState('');
  const [oppType, setOppType] = useState('event');
  const [oppDate, setOppDate] = useState('');
  const [oppSuccess, setOppSuccess] = useState('');

  const [permitSuccessMsg, setPermitSuccessMsg] = useState('');
  const [crisisSuccessMsg, setCrisisSuccessMsg] = useState('');

  // Policy Modeler States
  const [policyWaterSubsidy, setPolicyWaterSubsidy] = useState(40); // percentage
  const [policyAgriGrant, setPolicyAgriGrant] = useState(20000); // AED value

  const runAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsErr('');
    try {
      const res = await fetch(`${API_BASE}/api/analytics/trends`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAnalytics(await res.json());
      } else {
        setAnalyticsErr('The analytics agent could not be reached.');
      }
    } catch (err) {
      setAnalyticsErr('Error contacting the EcoConnect Analytics Agent.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersErr('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsersList(await res.json());
      } else {
        setUsersErr('Failed to fetch users list from server.');
      }
    } catch {
      setUsersErr('Network error. Could not reach Admin User Management API.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleToggleStatus = async (user_id, currentStatus) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${user_id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchUsers();
        setSuccessMsg(`User status updated to ${nextStatus.toUpperCase()}`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg('Failed to update user status.');
        setTimeout(() => setErrorMsg(''), 4000);
      }
    } catch {
      setErrorMsg('Network error updating user status.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleApproveUser = async (user_id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${user_id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'active' })
      });
      if (res.ok) {
        fetchUsers();
        setSuccessMsg(`User approved successfully!`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg('Failed to approve user.');
        setTimeout(() => setErrorMsg(''), 4000);
      }
    } catch {
      setErrorMsg('Network error during user approval.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleAdjustCreditsSubmit = async (e, user_id) => {
    e.preventDefault();
    const amt = parseFloat(adjustCreditsVal) || 0;
    if (amt <= 0) return;
    const finalCredits = amt * (adjustCreditsType === 'deduct' ? -1 : 1);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${user_id}/credits`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ credits: finalCredits })
      });
      if (res.ok) {
        fetchUsers();
        setAdjustingUserId(null);
        setAdjustCreditsVal('');
        setSuccessMsg(`Successfully adjusted user credits by ${finalCredits}`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg('Failed to adjust credits.');
        setTimeout(() => setErrorMsg(''), 4000);
      }
    } catch {
      setErrorMsg('Network error adjusting credits.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleAlterRole = async (user_id, nextRole) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${user_id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: nextRole })
      });
      if (res.ok) {
        fetchUsers();
        setSuccessMsg(`Successfully altered user authorization group to ${nextRole.toUpperCase()}`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg('Failed to alter user role.');
        setTimeout(() => setErrorMsg(''), 4000);
      }
    } catch {
      setErrorMsg('Network error altering user role.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const fetchAllReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Error fetching admin reports:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/audit-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const fetchGovRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/government-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGovRequests(data);
      }
    } catch (err) {
      console.error('Error fetching admin government requests:', err);
    }
  };

  useEffect(() => {
    fetchAllReports();
    fetchAuditLogs();
    fetchGovRequests();
    fetchUsers();

    // Periodically sync localStorage items to reflect live updates
    const interval = setInterval(() => {
      const savedStartups = localStorage.getItem('eco_startups');
      if (savedStartups) setStartups(JSON.parse(savedStartups));

      const savedSos = localStorage.getItem('eco_sos_feed');
      if (savedSos) setSosFeed(JSON.parse(savedSos));

      const savedOpps = localStorage.getItem('eco_opportunities');
      if (savedOpps) setOpportunities(JSON.parse(savedOpps));

      const savedSurveys = localStorage.getItem('eco_surveys');
      if (savedSurveys) setSurveys(JSON.parse(savedSurveys));

      const savedAlerts = localStorage.getItem('eco_live_alerts');
      if (savedAlerts) setLiveAlerts(JSON.parse(savedAlerts));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdateGovRequestStatus = async (requestId, newStatus) => {
    setGovSuccessMsg('');
    setGovErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/government-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setGovSuccessMsg(`Government request status updated to "${newStatus}" successfully.`);
        fetchGovRequests();
      } else {
        setGovErrorMsg('Failed to update request status.');
      }
    } catch (err) {
      setGovErrorMsg('Error contacting backend.');
    }
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setSuccessMsg(`Ticket status updated to "${newStatus}". Database trigger activated.`);
        fetchAllReports();
        fetchAuditLogs(); // Refresh logs to show triggered audit update!
      } else {
        setErrorMsg('Failed to update status.');
      }
    } catch (err) {
      setErrorMsg('Error contacting backend.');
    }
  };

  // Compile heatmap counts dynamically from current report database
  const getHeatmapCounts = () => {
    const counts = { Hatta: 0, Liwa: 0, AlAin: 0, Zayed: 0 };
    reports.forEach(r => {
      // Crude coordinate-region approximation for demonstration
      if (r.latitude > 24.5 && r.longitude > 55.8) counts.Hatta++;
      else if (r.latitude < 21.0) counts.Liwa++;
      else if (r.latitude > 24.0 && r.longitude > 55.5) counts.AlAin++;
      else counts.Zayed++;
    });
    return counts;
  };

  const heatmap = getHeatmapCounts();

  // Executive KPI metrics
  const getKpis = () => {
    const totalReports = reports.length;
    const pendingReports = reports.filter(r => r.status === 'Pending').length;
    const resolvedReports = reports.filter(r => r.status === 'Resolved').length;
    const criticalReports = reports.filter(r => r.severity === 'Critical').length;
    const pendingRequests = govRequests.filter(r => r.status === 'Pending').length;
    const approvedSubsidyValue = govRequests
      .filter(r => r.status === 'Approved' && r.amount_requested)
      .reduce((sum, r) => sum + (r.amount_requested || 0), 0);
    const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;
    return { totalReports, pendingReports, resolvedReports, criticalReports, pendingRequests, approvedSubsidyValue, resolutionRate };
  };

  const kpis = getKpis();

  // Startup Permits Handlers
  const handleApproveLicense = (id, owner) => {
    const updated = startups.map(s => {
      if (s.id === id) {
        return { ...s, status: 'Approved', stage: 'Approved License' };
      }
      return s;
    });
    setStartups(updated);
    localStorage.setItem('eco_startups', JSON.stringify(updated));
    setPermitSuccessMsg(`Micro-license approved successfully for ${owner}!`);
    setTimeout(() => setPermitSuccessMsg(''), 4500);
  };

  const handleRejectLicense = (id, owner) => {
    const updated = startups.map(s => {
      if (s.id === id) {
        return { ...s, status: 'Rejected', stage: 'Rejected' };
      }
      return s;
    });
    setStartups(updated);
    localStorage.setItem('eco_startups', JSON.stringify(updated));
    setPermitSuccessMsg(`Micro-license application rejected for ${owner}.`);
    setTimeout(() => setPermitSuccessMsg(''), 4500);
  };

  // Crisis Center Handlers
  const handleBroadcastAlert = (e) => {
    e.preventDefault();
    if (!alertText.trim()) return;

    const newAlert = {
      id: Date.now(),
      text: `🚨 Warning: ${alertText}`,
      severity: alertSeverity,
      time: "Just now"
    };
    const updated = [newAlert, ...liveAlerts];
    setLiveAlerts(updated);
    localStorage.setItem('eco_live_alerts', JSON.stringify(updated));
    setAlertSuccess("Emergency sandstorm/weather alert broadcasted successfully to all resident portals!");
    setAlertText('');
    setTimeout(() => setAlertSuccess(''), 4500);
  };

  const handleRecallAlert = (id) => {
    const updated = liveAlerts.filter(a => a.id !== id);
    setLiveAlerts(updated);
    localStorage.setItem('eco_live_alerts', JSON.stringify(updated));
  };

  const handleDispatchOfficial = (sosId, sender) => {
    const updated = sosFeed.map(item => {
      if (item.id === sosId) {
        const resp = item.responders.includes("AD Municipality Dispatch")
          ? item.responders
          : [...item.responders, "AD Municipality Dispatch"];
        return { ...item, status: 'Dispatched (Official)', responders: resp };
      }
      return item;
    });
    setSosFeed(updated);
    localStorage.setItem('eco_sos_feed', JSON.stringify(updated));
    setCrisisSuccessMsg(`Official Municipal rescue dispatch successfully routed to ${sender}!`);
    setTimeout(() => setCrisisSuccessMsg(''), 4500);
  };

  const handleUpdateSosStatus = (sosId, newStatus) => {
    const updated = sosFeed.map(item => {
      if (item.id === sosId) {
        return { ...item, status: newStatus };
      }
      return item;
    });
    setSosFeed(updated);
    localStorage.setItem('eco_sos_feed', JSON.stringify(updated));
  };

  // Opportunity Board Handlers
  const handlePublishOpportunity = (e) => {
    e.preventDefault();
    if (!oppTitle || !oppDesc) return;

    const newOpp = {
      id: Date.now(),
      title: oppTitle,
      desc: oppDesc,
      type: oppType,
      date: oppDate || "Immediate"
    };
    const updated = [newOpp, ...opportunities];
    setOpportunities(updated);
    localStorage.setItem('eco_opportunities', JSON.stringify(updated));
    setOppSuccess(`Opportunity "${oppTitle}" successfully published to community bulletin!`);
    setOppTitle('');
    setOppDesc('');
    setOppDate('');
    setTimeout(() => setOppSuccess(''), 4500);
  };

  const handleRetireOpportunity = (id) => {
    const updated = opportunities.filter(o => o.id !== id);
    setOpportunities(updated);
    localStorage.setItem('eco_opportunities', JSON.stringify(updated));
  };

  // --- Sub-View Renderers ---

  const renderStartupPermits = () => {
    const totalApps = startups.length;
    const pendingApps = startups.filter(s => s.status === 'Pending').length;
    const approvedApps = startups.filter(s => s.status === 'Approved').length;
    const totalSeedValue = startups.reduce((sum, s) => sum + (s.funding || 0), 0);

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Startup stats banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Applications', value: totalApps, icon: '🚀', tone: 'text-zinc-100', glow: 'hover:border-emerald-500/30' },
            { label: 'Pending Review', value: pendingApps, icon: '⏳', tone: 'text-amber-500', glow: 'hover:border-amber-500/30' },
            { label: 'Approved Licenses', value: approvedApps, icon: '📜', tone: 'text-emerald-500', glow: 'hover:border-emerald-500/30' },
            { label: 'Community Seed Capital', value: `${totalSeedValue} AED`, icon: '💵', tone: 'text-teal-400', glow: 'hover:border-teal-500/30' },
          ].map((s) => (
            <div key={s.label} className={`bg-zinc-900/30 border border-zinc-800/80 p-4 rounded-2xl backdrop-blur-xl transition-all duration-300 transform hover:-translate-y-0.5 ${s.glow}`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-zinc-500">{s.label}</span>
                <span className="text-base">{s.icon}</span>
              </div>
              <p className={`text-xl font-black mt-1 ${s.tone}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* License permit list */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-zinc-700/50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2">
                <span>📜</span> Resident Entrepreneur License Approvals
              </h3>
              <p className="text-xs text-zinc-550 mt-1 leading-normal font-light">
                Accelerate community micro-ventures. Instant digital license permits automatically authorize farmers to list goods on the marketplace.
              </p>
            </div>
          </div>

          {permitSuccessMsg && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs p-3 rounded-xl transition-all duration-300 animate-pulse">
              {permitSuccessMsg}
            </div>
          )}

          {startups.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center text-zinc-500 text-xs font-light">
              📂 No resident startup license requests logged in local storage.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="py-3.5 px-3 uppercase tracking-wider font-mono text-[9px] font-extrabold text-zinc-500">Founder</th>
                    <th className="py-3.5 px-3 uppercase tracking-wider font-mono text-[9px] font-extrabold text-zinc-500">Business Name</th>
                    <th className="py-3.5 px-3 uppercase tracking-wider font-mono text-[9px] font-extrabold text-zinc-500">Idea &amp; Skills</th>
                    <th className="py-3.5 px-3 uppercase tracking-wider font-mono text-[9px] font-extrabold text-zinc-500">Funding Goal</th>
                    <th className="py-3.5 px-3 uppercase tracking-wider font-mono text-[9px] font-extrabold text-zinc-500">Status</th>
                    <th className="py-3.5 px-3 uppercase tracking-wider font-mono text-[9px] font-extrabold text-zinc-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {startups.map((s) => {
                    const progressPct = s.costs > 0 ? Math.min(100, Math.round(((s.funding || 0) / s.costs) * 100)) : 0;
                    return (
                      <tr key={s.id} className="hover:bg-zinc-900/30 text-zinc-350 transition-all duration-200">
                        <td className="py-4 px-3">
                          <span className="font-bold text-zinc-200 block text-sm">{s.owner}</span>
                          <span className="text-[8px] font-mono bg-zinc-850 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-800 inline-block mt-0.5">ID: #{s.id}</span>
                        </td>
                        <td className="py-4 px-3">
                          <span className="font-black text-emerald-500 block text-xs">{s.name}</span>
                        </td>
                        <td className="py-4 px-3 max-w-xs">
                          <span className="text-zinc-200 block font-medium">{s.idea}</span>
                          <span className="text-[10px] text-zinc-550 block mt-1 font-mono">Expertise: {s.skill}</span>
                        </td>
                        <td className="py-4 px-3 min-w-[140px]">
                          <div className="flex justify-between font-mono text-[9px] mb-1">
                            <span className="text-zinc-500">{s.funding || 0} / {s.costs} AED</span>
                            <span className="font-bold text-teal-400">{progressPct}%</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-850 border border-zinc-800 p-[1px] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                          </div>
                        </td>
                        <td className="py-4 px-3">
                          <span className={`px-2.5 py-1 rounded-full font-mono font-bold text-[9px] uppercase tracking-wider ${
                            s.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            s.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                            'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-right space-x-1.5 whitespace-nowrap">
                          {s.status === 'Pending' ? (
                            <>
                              <button
                                onClick={() => handleApproveLicense(s.id, s.owner)}
                                className="bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-500 hover:text-zinc-950 text-emerald-500 hover:-translate-y-0.5 active:translate-y-0 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-sm shadow-emerald-950/10"
                              >
                                Approve License ✓
                              </button>
                              <button
                                onClick={() => handleRejectLicense(s.id, s.owner)}
                                className="bg-rose-600/10 border border-rose-500/30 hover:bg-rose-500 hover:text-zinc-950 text-rose-500 hover:-translate-y-0.5 active:translate-y-0 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-sm shadow-rose-950/10"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-zinc-500 italic font-mono bg-zinc-850 border border-zinc-800 px-2 py-1 rounded-lg">{s.stage}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCrisisCenter = () => {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="bg-gradient-to-r from-rose-905/15 via-zinc-900/30 to-zinc-950 border border-rose-500/30 p-6 rounded-2xl backdrop-blur-xl shadow-lg hover:border-rose-500/50 transition-all duration-300">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-pulse">🚨</span>
            <div>
              <h2 className="text-md font-bold text-zinc-100">Eco-Shield Crisis Command &amp; Emergency Dispatch</h2>
              <p className="text-[10px] text-rose-500 font-mono uppercase tracking-wider font-semibold">Early Warning Broadcasting &amp; Citizen SOS Coordination</p>
            </div>
          </div>
        </div>

        {crisisSuccessMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs p-3 rounded-xl animate-pulse">
            {crisisSuccessMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Emergency Alert Broadcast Form */}
          <div className="lg:col-span-1 bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg h-fit space-y-6 hover:border-zinc-700/50 transition-all duration-300">
            <div>
              <h3 className="text-sm font-bold text-rose-500 mb-1 flex items-center gap-2">
                <span>📡</span> Broadcast Emergency Shield Warnings
              </h3>
              <p className="text-[11px] text-zinc-450 leading-relaxed font-light">
                Instantly push critical alerts (sandstorms, floods, blocked roads) to the top of all farmer dashboards.
              </p>
            </div>

            {alertSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs p-3 rounded-xl">
                {alertSuccess}
              </div>
            )}

            <form onSubmit={handleBroadcastAlert} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-zinc-500">Warning Message</label>
                <textarea
                  value={alertText}
                  onChange={(e) => setAlertText(e.target.value)}
                  placeholder="e.g., Heavy sandstorm in southern sector Al-Qaw'ah. Cover crops immediately."
                  rows="3"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 rounded-xl p-3 text-xs text-zinc-300 outline-none transition-all duration-200 font-light"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-zinc-500">Alert Severity</label>
                <select
                  value={alertSeverity}
                  onChange={(e) => setAlertSeverity(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 rounded-xl p-3 text-xs text-zinc-300 outline-none transition-all duration-200"
                >
                  <option value="high">🚨 Critical Severity (Red Alert)</option>
                  <option value="medium">⚠️ Medium Severity (Amber Alert)</option>
                  <option value="low">💡 Low/Informational Severity</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl text-xs shadow-lg shadow-rose-950/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>📣</span> Broadcast Warning Alert
              </button>
            </form>

            {/* Active alerts review list */}
            <div className="pt-4 border-t border-zinc-850/60">
              <h4 className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-zinc-500 mb-3">Current Active Broadcasts</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {liveAlerts.length === 0 ? (
                  <p className="text-[10px] text-zinc-500 italic">No warnings currently broadcasted.</p>
                ) : (
                  liveAlerts.map(alert => (
                    <div key={alert.id} className="bg-zinc-950/80 border border-zinc-800 p-2.5 rounded-lg text-[10px] flex justify-between items-start gap-2 hover:border-zinc-700 transition-colors">
                      <span className="text-zinc-300 leading-normal font-light">{alert.text}</span>
                      <button
                        onClick={() => handleRecallAlert(alert.id)}
                        className="text-rose-500 hover:text-rose-400 cursor-pointer font-bold px-2 py-1 bg-zinc-900 border border-zinc-800 transition-colors text-[9px]"
                        title="Recall warning"
                      >
                        Recall
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Active Citizen SOS Beacons Queue */}
          <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg hover:border-zinc-700/50 transition-all duration-300">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                Active Community SOS Distress Radar
              </h3>
            </div>
            <p className="text-xs text-zinc-555 mb-6 font-light leading-normal font-light">
              Desert SOS distress calls submitted by farmers or tourist vehicles in remote dunes. Dispatch official response units or track volunteer rescue efforts.
            </p>

            <div className="space-y-4">
              {sosFeed.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-xl text-xs font-light">
                  🟢 Clear Radar. No active citizen or visitor distress pings.
                </div>
              ) : (
                sosFeed.map((sos) => (
                  <div key={sos.id} className="bg-zinc-950/70 border border-zinc-850 p-5 rounded-xl space-y-4 hover:border-rose-500/35 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold text-xs flex items-center justify-center">
                          {sos.sender.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-200">{sos.sender}</h4>
                          <p className="text-[10px] text-zinc-505 font-mono">📍 {sos.region} · {sos.time}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2.5 py-1 rounded-full">
                        {sos.type}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-350 leading-relaxed font-light">{sos.description}</p>

                    {/* Dynamic Emergency Dispatch Progress Tracker Timeline */}
                    <div className="py-3 px-1 border-t border-zinc-900 border-b border-zinc-900 my-2">
                      <div className="relative flex items-center justify-between">
                        {/* Connecting Line Background */}
                        <div className="absolute left-0 right-0 top-4 h-0.5 bg-zinc-850 rounded-full z-0" />
                        {/* Connecting Line Active */}
                        <div 
                          className="absolute left-0 top-4 h-0.5 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-500 z-0"
                          style={{
                            width: `${
                              sos.status === 'Pending' ? '0%' :
                              (sos.status === 'Dispatched' || sos.status === 'Dispatched (Official)') ? '33.33%' :
                              sos.status === 'Rescue Active' ? '66.66%' :
                              sos.status === 'Resolved' ? '100%' : '0%'
                            }`
                          }}
                        />

                        {/* Timeline Steps */}
                        {[
                          { key: 'Pending', label: 'Signal Logged', icon: '📡' },
                          { key: 'Dispatched', label: 'Dispatched', icon: '🚜' },
                          { key: 'Rescue Active', label: 'On Site Rescue', icon: '📍' },
                          { key: 'Resolved', label: 'Resolved', icon: '✓' }
                        ].map((phase, idx) => {
                          const getStatusIndex = (status) => {
                            if (status === 'Pending') return 0;
                            if (status === 'Dispatched' || status === 'Dispatched (Official)') return 1;
                            if (status === 'Rescue Active') return 2;
                            if (status === 'Resolved') return 3;
                            return 0;
                          };
                          const currentIdx = getStatusIndex(sos.status);
                          const isActive = idx <= currentIdx;
                          const isCurrent = idx === currentIdx;

                          return (
                            <div key={phase.key} className="flex flex-col items-center z-10 relative">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-mono text-xs transition-all duration-300 ${
                                isActive 
                                  ? 'bg-zinc-950 border-rose-500 text-rose-450 shadow-md shadow-rose-950/20 scale-105' 
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                              } ${isCurrent ? 'ring-2 ring-rose-500/50 scale-110' : ''}`}>
                                <span>{phase.icon}</span>
                              </div>
                              <span className={`text-[9px] font-bold mt-1.5 uppercase font-mono tracking-wider transition-colors ${
                                isActive ? 'text-zinc-200' : 'text-zinc-650'
                              }`}>
                                {phase.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 flex flex-wrap justify-between items-center gap-3">
                      <div className="text-[9px] text-zinc-500 font-mono space-y-0.5">
                        <span className="block font-bold">📡 GPS COORDS: {sos.lat.toFixed(4)}°N, {sos.lng.toFixed(4)}°E</span>
                        {sos.responders && sos.responders.length > 0 && (
                          <span className="text-[#4ade80] font-bold block mt-1">
                            Dispatched Responders: {sos.responders.join(", ")}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded font-mono text-[9px] font-bold uppercase tracking-wider border ${
                          sos.status === 'Resolved' 
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                            : sos.status === 'Rescue Active'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                            : sos.status.startsWith('Dispatched')
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/20'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/20'
                        }`}>
                          {sos.status}
                        </span>
                        
                        {sos.status === 'Pending' && (
                          <button
                            onClick={() => handleDispatchOfficial(sos.id, sos.sender)}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-1.5 px-3 rounded-xl text-[10px] transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-sm shadow-rose-950/20"
                          >
                            🚜 Dispatch Official Help
                          </button>
                        )}

                        {(sos.status === 'Dispatched' || sos.status === 'Dispatched (Official)') && (
                          <button
                            onClick={() => handleUpdateSosStatus(sos.id, 'Rescue Active')}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-1.5 px-3 rounded-xl text-[10px] transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-sm shadow-amber-950/20"
                          >
                            📍 Confirm On-Site Arrival
                          </button>
                        )}

                        {sos.status === 'Rescue Active' && (
                          <button
                            onClick={() => handleUpdateSosStatus(sos.id, 'Resolved')}
                            className="bg-emerald-600 hover:bg-emerald-505 text-white font-bold py-1.5 px-3 rounded-xl text-[10px] transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-sm shadow-emerald-950/20"
                          >
                            ✓ Mark as Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCommunityBoard = () => {
    return (
      <div className="space-y-6">
        <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg">
          <div>
            <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2">
              <span>📅</span> Community Opportunity &amp; Service Publisher
            </h3>
            <p className="text-xs text-zinc-500 mt-1 leading-normal font-light">
              Connect residents, farmers, and students to municipal grants, localized heritage events, and educational agricultural training programs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Publish Opportunity Form */}
          <div className="lg:col-span-1 bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg h-fit space-y-5">
            <h3 className="text-sm font-bold text-teal-450 flex items-center gap-2 mb-1">
              <span>✍️</span> Publish Support Opportunity
            </h3>

            {oppSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl">
                {oppSuccess}
              </div>
            )}

            <form onSubmit={handlePublishOpportunity} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Opportunity Title</label>
                <input
                  type="text"
                  value={oppTitle}
                  onChange={(e) => setOppTitle(e.target.value)}
                  placeholder="e.g. Organic Produce Fertilizer Grant"
                  className="w-full bg-zinc-950 border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Category Type</label>
                <select
                  value={oppType}
                  onChange={(e) => setOppType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none"
                >
                  <option value="event">🎪 Community / Festival Event</option>
                  <option value="grant">💵 Financial Grant / Equipment Subsidy</option>
                  <option value="training">📚 Agricultural Training / Academy</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Date / Deadline Description</label>
                <input
                  type="text"
                  value={oppDate}
                  onChange={(e) => setOppDate(e.target.value)}
                  placeholder="e.g., Jul 15 or Deadline: Aug 01"
                  className="w-full bg-zinc-950 border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-350 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Description / Scope Details</label>
                <textarea
                  value={oppDesc}
                  onChange={(e) => setOppDesc(e.target.value)}
                  placeholder="Provide registration links, criteria guidelines, or location info..."
                  rows="4"
                  className="w-full bg-zinc-950 border border-zinc-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/20"
              >
                <span>📢</span> Publish Live Bulletin
              </button>
            </form>
          </div>

          {/* Active Listings Grid */}
          <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg">
            <h3 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
              <span>📋</span> Active Published Bulletin Board
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.map(opp => (
                <div key={opp.id} className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase ${
                        opp.type === 'grant' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                        opp.type === 'training' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {opp.type}
                      </span>
                      <span className="text-[10px] text-zinc-550 font-mono">{opp.date}</span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-200">{opp.title}</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-light">{opp.desc}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-zinc-900/50">
                    <span className="text-[9px] text-zinc-650 font-mono">ID: #{opp.id}</span>
                    <button
                      onClick={() => handleRetireOpportunity(opp.id)}
                      className="text-xs text-rose-500 hover:text-rose-400 bg-transparent cursor-pointer font-bold"
                    >
                      Retire Posting ❌
                    </button>
                  </div>
                </div>
              ))}
              {opportunities.length === 0 && (
                <p className="text-center text-zinc-500 text-xs py-8 col-span-2">No active support board opportunities posted.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    const totalVotes = (surveys.honey || 0) + (surveys.dates || 0) + (surveys.rugs || 0) + (surveys.tours || 0) || 1;
    const honeyPct = Math.round(((surveys.honey || 0) / totalVotes) * 100);
    const datesPct = Math.round(((surveys.dates || 0) / totalVotes) * 100);
    const rugsPct = Math.round(((surveys.rugs || 0) / totalVotes) * 100);
    const toursPct = Math.round(((surveys.tours || 0) / totalVotes) * 100);

    const surveyItems = [
      { key: 'dates', label: 'Organic Khalas Dates', count: surveys.dates || 0, pct: datesPct, icon: '🌴', color: 'from-emerald-600 to-teal-400' },
      { key: 'tours', label: 'Heritage Desert Tours', count: surveys.tours || 0, pct: toursPct, icon: '⛺', color: 'from-blue-600 to-indigo-500' },
      { key: 'honey', label: 'Pure Sidr Honey', count: surveys.honey || 0, pct: honeyPct, icon: '🍯', color: 'from-amber-500 to-yellow-400' },
      { key: 'rugs', label: 'Handwoven Sadu Rugs', count: surveys.rugs || 0, pct: rugsPct, icon: '🧶', color: 'from-rose-500 to-orange-400' }
    ];

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-emerald-950/15 via-zinc-900/30 to-zinc-950 border border-emerald-500/20 p-6 rounded-2xl backdrop-blur-xl shadow-lg hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧠</span>
            <div>
              <h2 className="text-md font-bold text-zinc-100">EcoConnect AI Intelligence &amp; Market Insights</h2>
              <p className="text-[10px] text-emerald-500 font-mono uppercase tracking-wider font-semibold">Predictive Trend Detection &amp; Rural Demand Mapping</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Tourist Demand Chart */}
          <div className="lg:col-span-1 bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg h-fit space-y-6 hover:border-zinc-700/50 transition-all duration-300">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 mb-1">
                <span>📊</span> Tourist Demand Intent Index
              </h3>
              <p className="text-[11px] text-zinc-450 leading-relaxed font-light">
                Aggregated real-time interest from visiting tourists. Local entrepreneurs use this index to align date harvesting, Sadu weaving, and desert tours with current demand.
              </p>
            </div>

            <div className="space-y-5">
              {surveyItems.map((item) => (
                <div key={item.key} className="space-y-2 group">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-200 flex items-center gap-2">
                      <span className="text-base group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                      {item.label}
                    </span>
                    <span className="font-mono text-zinc-500 font-bold">
                      {item.count} votes ({item.pct}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-zinc-950 border border-zinc-800 p-[2px] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-700 ease-out`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-zinc-850/60 text-[10px] text-zinc-500 font-mono space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>Total Surveys Processed: {totalVotes}</span>
              </div>
              <p className="leading-normal font-light">
                *Updates automatically when tourists submit feedback in the Tourist Portal.
              </p>
            </div>
          </div>

          {/* Right Column: AI Analytics Agent */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg hover:border-zinc-700/50 transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <span>🤖</span> Eco Data Analytics Agent
                </h3>
                <button 
                  onClick={runAnalytics}
                  disabled={analyticsLoading}
                  className="bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-500 hover:text-zinc-950 text-emerald-500 px-3.5 py-1.5 rounded-xl text-[10px] font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {analyticsLoading ? (
                    <>
                      <span className="animate-spin inline-block">🔄</span> Scanning...
                    </>
                  ) : (
                    <>
                      <span>🧠</span> Run AI Trends Scan
                    </>
                  )}
                </button>
              </div>

              {analyticsErr && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs p-3 rounded-xl mb-4">
                  ⚠️ {analyticsErr}
                </div>
              )}

              {!analytics && !analyticsLoading && (
                <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center text-zinc-500 space-y-4">
                  <span className="text-4xl block">🔍</span>
                  <p className="text-xs max-w-md mx-auto leading-relaxed font-light">
                    No scan has been performed yet. Run the EcoConnect AI scan to analyze recent environment tickets, highlight desert anomalies, and forecast sector crop risks.
                  </p>
                  <button
                    onClick={runAnalytics}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-950/20 transition-all cursor-pointer"
                  >
                    Initiate AI System Scan
                  </button>
                </div>
              )}

              {analyticsLoading && (
                <div className="border border-zinc-800 bg-zinc-950/40 rounded-xl p-12 text-center text-zinc-500 space-y-4">
                  <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-mono animate-pulse">
                    Querying local models to parse report database, cluster geolocations, and compile risk parameters...
                  </p>
                </div>
              )}

              {analytics && !analyticsLoading && (
                <div className="space-y-6">
                  {/* AI Executive Summary */}
                  <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-5 space-y-4">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Overall Risk Matrix:</span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                          analytics.overall_risk_level === 'Critical' ? 'bg-red-500/20 text-red-500 border border-red-500/30 animate-pulse' :
                          analytics.overall_risk_level === 'High' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                          analytics.overall_risk_level === 'Medium' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {analytics.overall_risk_level || 'Low'} Risk
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Reports Analyzed: <strong className="text-zinc-355">{analytics.reports_analyzed || 0}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-light">
                      {analytics.summary}
                    </p>
                  </div>

                  {/* Trends & Anomalies Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Trends Card */}
                    <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 pb-2 border-b border-zinc-900">
                        📈 Identified Regional Clusters
                      </h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {(!analytics.trends || analytics.trends.length === 0) ? (
                          <p className="text-[11px] text-zinc-500 italic">No clusters found in this batch.</p>
                        ) : (
                          analytics.trends.map((t, idx) => (
                            <div key={idx} className="bg-zinc-950/70 border border-zinc-800 p-3 rounded-lg space-y-1.5 hover:border-zinc-700 transition-colors">
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-semibold text-zinc-200 text-xs">{t.pattern}</span>
                                <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                                  t.severity === 'Critical' ? 'bg-red-500/10 text-red-500' :
                                  t.severity === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-500 border border-zinc-800'
                                }`}>
                                  {t.severity}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                                <span>Dept: {t.category}</span>
                                <span>Sector: {t.sector} (x{t.count})</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Anomalies & Risks Card */}
                    <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 pb-2 border-b border-zinc-900">
                        ⚠️ Anomalies &amp; Crisis Risk Mitigation
                      </h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {/* Anomalies */}
                        {analytics.anomalies && analytics.anomalies.map((anom, idx) => (
                          <div key={`anom-${idx}`} className="bg-zinc-950/70 border border-zinc-800 p-3 rounded-lg space-y-1 hover:border-zinc-700 transition-colors">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Anomaly Detected</span>
                              <span className="text-[9px] font-mono text-zinc-500">{anom.severity} Severity</span>
                            </div>
                            <p className="text-[11px] text-zinc-300 leading-normal font-light">{anom.description}</p>
                          </div>
                        ))}

                        {/* Potential Crises */}
                        {analytics.potential_crises && analytics.potential_crises.map((pc, idx) => (
                          <div key={`pc-${idx}`} className="bg-rose-500/5 border border-rose-550/20 p-3 rounded-lg space-y-2 hover:border-rose-500/30 transition-all duration-300">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">⚠️ Impending Risk</span>
                              <span className="text-[9px] font-mono text-rose-550 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">Urgency: {pc.urgency}</span>
                            </div>
                            <p className="text-[11px] text-zinc-200 font-medium">{pc.risk}</p>
                            <div className="bg-zinc-950/60 p-2 rounded border border-zinc-800 text-[10px] text-zinc-400 leading-relaxed font-light">
                              <strong className="text-emerald-500 font-bold">Recommended action:</strong> {pc.recommended_action}
                            </div>
                          </div>
                        ))}

                        {(!analytics.anomalies || analytics.anomalies.length === 0) && 
                         (!analytics.potential_crises || analytics.potential_crises.length === 0) && (
                          <p className="text-[11px] text-zinc-500 italic">No anomalies or risks flagged.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Policy Modeler & Scenario Simulator */}
        <div className="bg-zinc-900/30 border border-emerald-900/40 p-6 rounded-2xl backdrop-blur-xl shadow-lg mt-8">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
            <div>
              <h3 className="text-md font-bold text-[#c2964b] flex items-center gap-2">
                <span>🏛️</span> Interactive Policy Scenario Modeler &amp; Simulator
              </h3>
              <p className="text-xs text-zinc-450 mt-0.5">Adjust rural subsidies and grants to simulate economic impact vs. water aquifer depletion metrics.</p>
            </div>
            <span className="text-[10px] text-emerald-450 font-mono font-bold bg-[#1b3d34]/60 border border-emerald-900/50 rounded-full px-2.5 py-1 uppercase">
              ● Policy Sandbox Active
            </span>
          </div>

          {/* Calculations */}
          {(() => {
            const simulatedProfit = 12400 + (policyAgriGrant * 0.15) + (policyWaterSubsidy * 95);
            const simulatedDepletion = Math.max(2, Math.min(95, 6 + (policyWaterSubsidy * 0.5) - (policyAgriGrant * 0.00015)));
            const simulatedBudget = ((250 * (policyAgriGrant + (policyWaterSubsidy * 240))) / 1000000);
            
            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inputs Column */}
                <div className="space-y-5 bg-zinc-950/40 p-5 rounded-xl border border-zinc-850">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-350">Water Subsidy Rate</span>
                      <span className="text-emerald-450 font-mono">{policyWaterSubsidy}%</span>
                    </div>
                    <input 
                      type="range"
                      min="10"
                      max="90"
                      value={policyWaterSubsidy}
                      onChange={(e) => setPolicyWaterSubsidy(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <p className="text-[9px] text-zinc-550">Subsidy covering local farm water meters.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-350">Agri Grant Cap (AED)</span>
                      <span className="text-amber-550 font-mono">{policyAgriGrant.toLocaleString()} AED</span>
                    </div>
                    <input 
                      type="range"
                      min="5000"
                      max="50000"
                      step="5000"
                      value={policyAgriGrant}
                      onChange={(e) => setPolicyAgriGrant(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#a6802b]"
                    />
                    <p className="text-[9px] text-zinc-550">Principal grant supporting off-grid infrastructure.</p>
                  </div>
                </div>

                {/* Outputs Column */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Avg Farmer Profit */}
                  <div className="bg-[#0a0a0a]/60 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-[9.5px] uppercase font-bold text-zinc-500 font-mono block">Avg Farmer Profit</span>
                      <span className="text-xs">💰</span>
                    </div>
                    <span className="text-2xl font-black text-emerald-450 mt-2">{simulatedProfit.toFixed(0)} AED</span>
                    
                    {/* Visual bar showing relative to high-end profit */}
                    <div className="mt-3 space-y-1">
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden p-[1px] border border-zinc-800">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, Math.max(0, ((simulatedProfit - 14100) / (28450 - 14100)) * 100))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-zinc-550 font-mono">
                        <span>Min (14.1k)</span>
                        <span>Max (28.4k)</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-zinc-500 mt-2 block">Monthly net take-home</span>
                  </div>

                  {/* Aquifer Recharge Health */}
                  <div className="bg-[#0a0a0a]/60 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-[9.5px] uppercase font-bold text-zinc-500 font-mono block">Aquifer Recharge Health</span>
                      <span className="text-xs">💧</span>
                    </div>
                    <span className={`text-2xl font-black mt-2 ${simulatedDepletion > 30 ? 'text-rose-500' : 'text-blue-450'}`}>
                      {(100 - simulatedDepletion).toFixed(1)}%
                    </span>

                    {/* Visual gauge bar */}
                    <div className="mt-3 space-y-1">
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden p-[1px] border border-zinc-800">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${simulatedDepletion > 30 ? 'bg-rose-500' : 'bg-blue-450'}`} 
                          style={{ width: `${100 - simulatedDepletion}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-zinc-550 font-mono">
                        <span>Depleted</span>
                        <span>Full (100%)</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-zinc-500 mt-2 block">Estimated water table status</span>
                  </div>

                  {/* Gov Budget Spent */}
                  <div className="bg-[#0a0a0a]/60 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-[9.5px] uppercase font-bold text-zinc-500 font-mono block">Gov Budget Spent</span>
                      <span className="text-xs">🏛️</span>
                    </div>
                    <span className={`text-2xl font-black mt-2 ${simulatedBudget > 10 ? 'text-rose-500' : 'text-amber-500'}`}>
                      {simulatedBudget.toFixed(2)} M
                    </span>

                    {/* Visual gauge bar */}
                    <div className="mt-3 space-y-1">
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden p-[1px] border border-zinc-800">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${simulatedBudget > 10 ? 'bg-rose-500' : 'bg-amber-500'}`} 
                          style={{ width: `${Math.min(100, (simulatedBudget / 15) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-zinc-550 font-mono">
                        <span>0M</span>
                        <span>Ceiling (15M)</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-zinc-550 mt-2 block">AED principal spent / yr</span>
                  </div>
                </div>

                {/* Policy Alert / Arabic translation warnings */}
                <div className="lg:col-span-3">
                  {simulatedDepletion > 30 && (
                    <div className="bg-rose-500/10 border border-rose-500/25 text-rose-450 p-3 rounded-xl text-xs space-y-1 animate-pulse">
                      <p className="font-semibold">⚠️ Warning: High aquifer depletion rate detected!</p>
                      <p className="text-[11px] text-rose-550/80 font-light leading-relaxed">
                        تنبيه: معدل استنزاف المياه الجوفية يتجاوز الحد الآمن! نوصي بتوجيه الدعم المالي نحو تركيب أجهزة استشعار الرطوبة الذكية لترشيد الاستهلاك.
                      </p>
                    </div>
                  )}

                  {simulatedBudget > 10 && (
                    <div className="bg-rose-500/10 border border-rose-500/25 text-rose-455 p-3 rounded-xl text-xs space-y-1 mt-3 animate-pulse">
                      <p className="font-semibold">⚠️ Warning: Ministry budget ceiling exceeded!</p>
                      <p className="text-[11px] text-rose-550/80 font-light leading-relaxed">
                        تنبيه: تم تجاوز ميزانية الدعم المخصصة للقطاع الريفي! يرجى تحسين قيم الدعم أو تحديد سقف أعلى لتغطية التكاليف الإجمالية.
                      </p>
                    </div>
                  )}

                  {simulatedDepletion <= 30 && simulatedBudget <= 10 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-450 p-3 rounded-xl text-xs space-y-1">
                      <p className="font-semibold">✓ Safe Policy Configuration Approved</p>
                      <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                        موازنة سياسة الدعم ناجحة ومستدامة. معدلات الاستهلاك الجوفي والميزانية المالية ضمن الحدود البيئية والتنظيمية المسموح بها.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  const renderAiConfig = () => {
    return (
      <div className="bg-[#111317] border border-zinc-800 rounded-3xl p-8 max-w-2xl mx-auto space-y-6 font-sans mt-4">
        <div>
          <span className="inline-block text-[9px] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/20 rounded-full px-2.5 py-1 bg-emerald-500/5 mb-3">
            Federal AI Integration
          </span>
          <h3 className="text-lg font-bold text-zinc-100">LLM Engine Configurations</h3>
          <p className="text-xs text-zinc-500 mt-1">Configure global routing models, OpenAI-compatible API URLs, and secrets for the Eco Connect sovereign assistant.</p>
        </div>

        <form onSubmit={handleSaveAiCredentials} className="space-y-4 text-left">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">AI Routing Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAiMode('cloud')}
                className={`py-3 px-4 rounded-xl border font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2 ${aiMode === 'cloud' ? 'bg-[#1b3d34] border-emerald-500/50 text-[#4ade80]' : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-350'}`}
              >
                ☁️ Generative Cloud AI
              </button>
              <button
                type="button"
                onClick={() => setAiMode('local')}
                className={`py-3 px-4 rounded-xl border font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2 ${aiMode === 'local' ? 'bg-[#1b3d34] border-emerald-500/50 text-[#4ade80]' : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-350'}`}
              >
                💻 Local AI Model
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-400">Cloud API Base URL</label>
            <input
              type="text"
              value={aiUrl}
              onChange={(e) => setAiUrl(e.target.value)}
              placeholder="e.g. https://api.groq.com/openai/v1/chat/completions"
              className="bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-xs text-zinc-300 p-3.5 rounded-xl outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-400">Cloud API Key (Bearer Secret)</label>
            <input
              type="password"
              value={aiKey}
              onChange={(e) => setAiKey(e.target.value)}
              placeholder="Enter your Cloud API Secret / Bearer Token"
              className="bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-xs text-zinc-300 p-3.5 rounded-xl outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-400">Cloud Model Name</label>
            <input
              type="text"
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              placeholder="e.g. llama-3.3-70b-versatile"
              className="bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-xs text-zinc-300 p-3.5 rounded-xl outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-550 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border-0 active:scale-95 transition-all mt-4 font-sans"
          >
            Apply Configurations 🚀
          </button>
        </form>
      </div>
    );
  };

  const renderUserManagement = () => {
    const activeList = usersList.filter(u => u.status !== 'pending_onboarding' && u.status !== 'pending_approval');
    const pendingList = usersList.filter(u => u.status === 'pending_onboarding' || u.status === 'pending_approval');

    const filtered = (usersTab === 'all' ? activeList : pendingList).filter(u => 
      (u.name || '').toLowerCase().includes(usersSearch.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(usersSearch.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(usersSearch.toLowerCase())
    );

    return (
      <div className="space-y-6 animate-fadeIn text-left mt-6">
        {/* Banner */}
        <div className="bg-[#15171e] border border-zinc-800 p-6 rounded-2xl flex justify-between items-center">
          <div>
            <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2">
              <span>👥</span> Regional Users Registry &amp; Role Governance
            </h3>
            <p className="text-xs text-zinc-450 mt-1 font-light">
              Monitor registration status, toggle suspension access-control gates, distribute community seed credits, and modify security clearance roles.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-[#1b3d34] text-emerald-455 border border-emerald-900/50 px-2.5 py-1 rounded-full uppercase">
            Onboarding approvals
          </span>
        </div>

        {/* Sub-tab Selectors */}
        <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-850 w-fit">
          <button
            onClick={() => setUsersTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border-0 cursor-pointer ${usersTab === 'all' ? 'bg-[#1a2024] text-[#4ade80] border border-emerald-900/50' : 'bg-transparent text-zinc-450 hover:text-zinc-200'}`}
          >
            Active Users Registry ({activeList.length})
          </button>
          <button
            onClick={() => setUsersTab('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border-0 cursor-pointer flex items-center gap-1.5 ${usersTab === 'pending' ? 'bg-[#1a2024] text-[#4ade80] border border-emerald-900/50' : 'bg-transparent text-zinc-450 hover:text-zinc-200'}`}
          >
            Onboarding Approvals ({pendingList.length})
            {pendingList.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Action search bar */}
        <div className="bg-[#111317] border border-zinc-850 p-4 rounded-xl flex items-center justify-between gap-4">
          <input
            type="text"
            value={usersSearch}
            onChange={(e) => setUsersSearch(e.target.value)}
            placeholder={usersTab === 'all' ? "Search by name, email or role..." : "Search pending approvals..."}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-350 outline-none focus:border-emerald-500"
          />
          <button
            onClick={fetchUsers}
            disabled={usersLoading}
            className="bg-zinc-850 hover:bg-zinc-800 text-zinc-200 text-xs font-bold py-3 px-5 rounded-xl uppercase tracking-wider cursor-pointer border-0 font-sans"
          >
            {usersLoading ? 'Refreshing...' : 'Refresh List'}
          </button>
        </div>

        {usersErr && <p className="text-rose-455 text-xs font-mono">{usersErr}</p>}

        {usersTab === 'all' ? (
          /* Users Table */
          <div className="bg-[#111317] border border-zinc-855 rounded-2xl overflow-hidden shadow-lg animate-fadeIn">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs font-light font-mono text-zinc-400">
                <thead className="bg-zinc-950 border-b border-zinc-850 text-zinc-500 font-bold uppercase text-[9px] tracking-wider">
                  <tr>
                    <th className="p-4">User Details</th>
                    <th className="p-4">Clearance Role</th>
                    <th className="p-4 text-right">Credit Balance</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/60">
                  {filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-900/25">
                      <td className="p-4">
                        <div className="text-zinc-200 font-bold text-xs">{user.name}</div>
                        <div className="text-[10px] text-zinc-550 font-mono mt-0.5">{user.email} (ID: {user.id})</div>
                      </td>
                      <td className="p-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleAlterRole(user.id, e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-xs text-zinc-300 outline-none font-sans"
                        >
                          <option value="farmer">Farmer (Seller)</option>
                          <option value="buyer">Buyer (Tourist)</option>
                          <option value="employee">Employee</option>
                          <option value="investor">Investor</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        {adjustingUserId === user.id ? (
                          <form onSubmit={(e) => handleAdjustCreditsSubmit(e, user.id)} className="flex items-center gap-1.5 justify-end">
                            <select
                              value={adjustCreditsType}
                              onChange={(e) => setAdjustCreditsType(e.target.value)}
                              className="bg-zinc-950 border border-zinc-800 rounded p-1 text-[10px] outline-none text-zinc-300 font-sans"
                            >
                              <option value="add">Add</option>
                              <option value="deduct">Deduct</option>
                            </select>
                            <input
                              type="number"
                              value={adjustCreditsVal}
                              onChange={(e) => setAdjustCreditsVal(e.target.value)}
                              placeholder="AED"
                              className="bg-zinc-950 border border-zinc-800 rounded p-1 text-[10px] w-14 outline-none text-zinc-350"
                              required
                            />
                            <button type="submit" className="bg-emerald-600 text-white font-bold px-1.5 py-1 rounded text-[9px] border-0 cursor-pointer font-sans">Go</button>
                            <button type="button" onClick={() => setAdjustingUserId(null)} className="bg-zinc-800 text-zinc-400 px-1.5 py-1 rounded text-[9px] border-0 cursor-pointer font-sans">X</button>
                          </form>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-bold text-emerald-455">{(user.credits || 0).toLocaleString()} AED</span>
                            <button
                              onClick={() => { setAdjustingUserId(user.id); setAdjustCreditsVal(''); }}
                              className="text-[9px] bg-zinc-800 hover:bg-zinc-750 text-[#c2a14e] border border-zinc-700 px-2 py-0.5 rounded cursor-pointer border-0 font-sans font-bold"
                            >
                              Adjust
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                          user.status === 'suspended'
                            ? 'bg-rose-500/10 text-rose-455 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20'
                        }`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase transition-all cursor-pointer border-0 font-sans ${
                            user.status === 'suspended'
                              ? 'bg-[#1b3d34] text-[#4ade80] hover:brightness-110'
                              : 'bg-rose-900/25 text-rose-450 border border-rose-900/50 hover:bg-rose-900/35'
                          }`}
                        >
                          {user.status === 'suspended' ? 'Unsuspend 🟢' : 'Suspend 🚫'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-zinc-550 italic font-sans">No users found matching query.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Onboarding approvals cards */
          <div className="grid grid-cols-1 gap-6 animate-fadeIn font-sans">
            {filtered.map((user) => {
              let investorProfile = null;
              try {
                if (user.investor_profile_json) {
                  investorProfile = JSON.parse(user.investor_profile_json);
                }
              } catch {}
              
              return (
                <div key={user.id} className="bg-[#111317] border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200">{user.name}</h4>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">{user.email} (ID: {user.id})</p>
                      <div className="flex gap-2 mt-2">
                        <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${user.role === 'farmer' ? 'bg-emerald-950/40 text-emerald-450 border-emerald-900/50' : 'bg-purple-950/40 text-purple-450 border-purple-900/50'}`}>
                          {user.role === 'farmer' ? '🌾 Farmer Supplier' : '💼 ESG Investor'}
                        </span>
                        <span className="inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-950/40 text-amber-450 border border-amber-900/50">
                          {user.status === 'pending_onboarding' ? 'Documents Pending' : 'Review Required ⏳'}
                        </span>
                      </div>
                    </div>
                    {user.status === 'pending_approval' && (
                      <button
                        onClick={() => handleApproveUser(user.id)}
                        className="bg-emerald-600 hover:bg-emerald-550 text-white text-xs font-bold py-2.5 px-5 rounded-xl uppercase tracking-wider cursor-pointer border-0 font-sans active:scale-95 transition-all shadow-md"
                      >
                        Approve Account ✅
                      </button>
                    )}
                  </div>

                  {/* Uploaded Documents */}
                  <div className="border-t border-zinc-850 pt-4 space-y-3">
                    <span className="text-[10px] uppercase font-bold text-zinc-550 tracking-wider block">Uploaded Documents Vault</span>
                    {user.documents && user.documents.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                        {user.documents.map((doc, idx) => (
                          <div key={idx} className="bg-zinc-950 border border-zinc-850 rounded-xl p-3 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-zinc-300 block font-sans">{doc.doc_type}</span>
                              <span className="text-[10px] text-zinc-550 font-mono">Serial: {doc.extracted_id_number || 'N/A'}</span>
                            </div>
                            <a
                              href={`${API_BASE}${doc.file_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#c2a14e] hover:text-[#e0c37c] font-bold text-[10px] uppercase cursor-pointer no-underline"
                            >
                              View File 📄
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-650 italic font-sans">No verification documents uploaded yet.</p>
                    )}
                  </div>

                  {/* Investor Onboarding Questionnaire answers */}
                  {user.role === 'investor' && investorProfile && (
                    <div className="border-t border-zinc-850 pt-4 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-zinc-550 tracking-wider block">Investor Profile Answers</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-zinc-400 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-zinc-600 block">Investment Capacity</span>
                          <span className="text-zinc-200 mt-1 block font-sans">{investorProfile.investment_capacity}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-zinc-600 block">Sectors of Interest</span>
                          <span className="text-zinc-200 mt-1 block font-sans">
                            {Array.isArray(investorProfile.sectors_of_interest)
                              ? investorProfile.sectors_of_interest.join(', ')
                              : investorProfile.sectors_of_interest || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-zinc-600 block">Venture Class</span>
                          <span className="text-zinc-200 mt-1 block font-sans">{investorProfile.investor_type}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-zinc-600 italic text-xs border border-dashed border-zinc-850 rounded-2xl">
                No pending registrations found.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // --- End Sub-View Renderers ---

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      {/* Navbar Header */}
      <nav className="mb-8 flex justify-between items-center bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Logo size="md" />
          <span className="hidden sm:block w-px h-8 bg-zinc-800" />
          <div className="hidden sm:block">
            <h2 className="text-md font-bold text-zinc-100">Government Administration</h2>
            <p className="text-[10px] text-zinc-405 font-mono">FEDERAL ENVIRONMENTAL PORTAL</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-850 gap-1 text-[10px] font-bold">
            <button
              onClick={() => handleToggleAiMode('cloud')}
              className={`px-2.5 py-1.5 rounded-lg border-0 cursor-pointer transition-all ${aiMode === 'cloud' ? 'bg-[#1b3d34] text-emerald-450 font-extrabold' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
              title="Route AI queries to Cloud Generative AI model"
            >
              ☁️ Cloud AI
            </button>
            <button
              onClick={() => handleToggleAiMode('local')}
              className={`px-2.5 py-1.5 rounded-lg border-0 cursor-pointer transition-all ${aiMode === 'local' ? 'bg-[#1b3d34] text-emerald-450 font-extrabold' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
              title="Route AI queries to Local LLM model"
            >
              💻 Local AI
            </button>
          </div>

          <span className="text-xs text-zinc-405 hidden sm:inline">Admin: <strong className="text-emerald-400">{name}</strong></span>
          <button 
            onClick={logout}
            className="text-xs bg-zinc-800/80 hover:bg-zinc-700/85 border border-zinc-700/50 px-4 py-2 rounded-xl text-zinc-300 transition-all cursor-pointer"
          >
            Logout 🚪
          </button>
        </div>
      </nav>

      {/* Navigation Tabs */}
      <div className="mb-8 flex flex-wrap border-b border-zinc-850 gap-y-2">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-4 px-5 font-bold text-xs tracking-wider transition-all border-b-2 uppercase flex items-center gap-2 outline-none ${
            activeTab === 'reports'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-550 hover:text-zinc-350'
          }`}
        >
          <span>🚨</span> Environmental Alerts
        </button>
        <button
          onClick={() => setActiveTab('gov-requests')}
          className={`pb-4 px-5 font-bold text-xs tracking-wider transition-all border-b-2 uppercase flex items-center gap-2 outline-none ${
            activeTab === 'gov-requests'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-550 hover:text-zinc-355'
          }`}
        >
          <span>🏛️</span> Governmental Requests
        </button>
        <button
          onClick={() => { setActiveTab('analytics'); if (!analytics) runAnalytics(); }}
          className={`pb-4 px-5 font-bold text-xs tracking-wider transition-all border-b-2 uppercase flex items-center gap-2 outline-none ${
            activeTab === 'analytics'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-550 hover:text-zinc-350'
          }`}
        >
          <span>🧠</span> Data Analytics Agent
        </button>
        <button
          onClick={() => setActiveTab('startup-permits')}
          className={`pb-4 px-5 font-bold text-xs tracking-wider transition-all border-b-2 uppercase flex items-center gap-2 outline-none ${
            activeTab === 'startup-permits'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-550 hover:text-zinc-350'
          }`}
        >
          <span>🚀</span> Startup Permits
        </button>
        <button
          onClick={() => setActiveTab('crisis-center')}
          className={`pb-4 px-5 font-bold text-xs tracking-wider transition-all border-b-2 uppercase flex items-center gap-2 outline-none ${
            activeTab === 'crisis-center'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-550 hover:text-zinc-350'
          }`}
        >
          <span>🛡️</span> Crisis Command
        </button>
        <button
          onClick={() => setActiveTab('community-board')}
          className={`pb-4 px-5 font-bold text-xs tracking-wider transition-all border-b-2 uppercase flex items-center gap-2 outline-none ${
            activeTab === 'community-board'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-550 hover:text-zinc-350'
          }`}
        >
          <span>📅</span> Opportunity Board
        </button>
        <button
          onClick={() => { setActiveTab('users'); fetchUsers(); }}
          className={`pb-4 px-5 font-bold text-xs tracking-wider transition-all border-b-2 uppercase flex items-center gap-2 outline-none ${
            activeTab === 'users'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-550 hover:text-zinc-355'
          }`}
        >
          <span>👥</span> User Management
        </button>
        <button
          onClick={() => setActiveTab('ai-config')}
          className={`pb-4 px-5 font-bold text-xs tracking-wider transition-all border-b-2 uppercase flex items-center gap-2 outline-none ${
            activeTab === 'ai-config'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-550 hover:text-zinc-355'
          }`}
        >
          <span>⚙️</span> AI Config
        </button>
      </div>

      {/* Executive KPI Intelligence Dashboard */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard label="Total Reports" value={kpis.totalReports} sublabel="All environmental tickets" icon="📨" tone="blue" />
          <StatCard label="Pending" value={kpis.pendingReports} sublabel="Awaiting dispatch" icon="⏳" tone="amber" />
          <StatCard label="Critical" value={kpis.criticalReports} sublabel="High-severity alerts" icon="🚨" tone="rose" />
          <StatCard label="Resolved" value={kpis.resolvedReports} sublabel="Closed tickets" icon="✓" tone="emerald" trend={{ direction: kpis.resolutionRate >= 50 ? 'up' : 'flat', text: `${kpis.resolutionRate}%` }} />
          <StatCard label="Pending Requests" value={kpis.pendingRequests} sublabel="Farmer support queue" icon="🏛️" tone="teal" />
          <StatCard label="Approved Subsidies" value={`${kpis.approvedSubsidyValue.toLocaleString()} AED`} sublabel="Disbursed value" icon="💵" tone="emerald" />
        </div>
      )}

      {/* Render Main Content depending on Active Tab */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
        
        {/* Left Columns: Ticket Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2">
                <span>📨</span> Incoming Report Dispatch Queue
              </h3>
              <button 
                onClick={fetchAllReports}
                className="text-[10px] uppercase font-bold text-emerald-400 hover:text-emerald-350 cursor-pointer bg-transparent border-0"
              >
                Sync Data 🔄
              </button>
            </div>

            {successMsg && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl">
                {errorMsg}
              </div>
            )}

            {reports.length === 0 ? (
              <div className="border border-dashed border-zinc-850 rounded-xl p-12 text-center text-zinc-500 text-xs">
                📡 No active environmental reports logged in federal queue.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-850 text-zinc-400">
                      <th className="py-3 px-2">ID</th>
                      <th className="py-3 px-2">Title</th>
                      <th className="py-3 px-2">Department</th>
                      <th className="py-3 px-2">Severity</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-zinc-900/40 text-zinc-300">
                        <td className="py-4 px-2 font-mono">#{report.id}</td>
                        <td className="py-4 px-2">
                          <span className="font-semibold text-zinc-200 block">{report.title}</span>
                          <span className="text-[10px] text-zinc-505">{report.description.substring(0, 45)}...</span>
                        </td>
                        <td className="py-4 px-2 text-teal-400">{report.assigned_dept}</td>
                        <td className="py-4 px-2">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                            report.severity === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                            report.severity === 'Medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            'bg-zinc-800 text-zinc-400'
                          }`}>
                            {report.severity}
                          </span>
                        </td>
                        <td className="py-4 px-2 font-semibold">{report.status}</td>
                        <td className="py-4 px-2 text-right space-x-1.5 whitespace-nowrap">
                          {report.status === 'Pending' && (
                            <button
                              onClick={() => handleUpdateStatus(report.id, 'Dispatched')}
                              className="bg-blue-600/10 border border-blue-500/30 hover:bg-blue-505 hover:text-zinc-950 text-blue-400 px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer border-0"
                            >
                              Dispatch 🚀
                            </button>
                          )}
                          {report.status !== 'Resolved' && (
                            <button
                              onClick={() => handleUpdateStatus(report.id, 'Resolved')}
                              className="bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-500 hover:text-zinc-950 text-emerald-400 px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer border-0"
                            >
                              Resolve ✓
                            </button>
                          )}
                          <a
                            href={`${API_BASE}/api/reports/${report.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-emerald-400 px-2 py-1 rounded text-[10px] inline-block font-semibold transition-all"
                          >
                            PDF 📄
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Heatmap and Trigger Audits */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Heatmap Grid widget */}
          <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg">
            <h3 className="text-md font-bold text-zinc-100 mb-4 flex items-center gap-2">
              <span>🗺️</span> Incident Regional Density Heatmap
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl text-center">
                <span className="text-zinc-550 text-[10px] block font-mono">HATTA REGION</span>
                <span className={`text-xl font-bold block mt-1 ${heatmap.Hatta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {heatmap.Hatta} Reports
                </span>
              </div>
              <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl text-center">
                <span className="text-zinc-555 text-[10px] block font-mono">LIWA OASIS</span>
                <span className={`text-xl font-bold block mt-1 ${heatmap.Liwa > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {heatmap.Liwa} Reports
                </span>
              </div>
              <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl text-center">
                <span className="text-zinc-550 text-[10px] block font-mono">AL AIN EASTERN</span>
                <span className={`text-xl font-bold block mt-1 ${heatmap.AlAin > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {heatmap.AlAin} Reports
                </span>
              </div>
              <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl text-center">
                <span className="text-zinc-555 text-[10px] block font-mono">MADINAT ZAYED</span>
                <span className={`text-xl font-bold block mt-1 ${heatmap.Zayed > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {heatmap.Zayed} Reports
                </span>
              </div>
            </div>
          </div>

          {/* Database Trigger Audit logs widget */}
          <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>🔄</span> SQL Trigger Audit Log
              </h3>
              <button 
                onClick={fetchAuditLogs}
                className="text-[9px] uppercase font-bold text-teal-400 hover:text-teal-350 cursor-pointer bg-transparent border-0"
              >
                Refresh Log 🔄
              </button>
            </div>
            <p className="text-[10px] text-zinc-555 mb-4 leading-normal">
              These records are generated and catalogued automatically by direct database triggers inside SQLite when report statuses are updated.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <div className="text-center py-6 text-zinc-650 text-[11px]">
                  No status audits recorded yet.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-[10px] font-mono flex justify-between items-center">
                    <div>
                      <span className="text-emerald-500">TKT #{log.report_id}</span>
                      <span className="text-zinc-400 block mt-0.5">
                        {log.old_status} ➔ <strong className="text-teal-400">{log.new_status}</strong>
                      </span>
                    </div>
                    <span className="text-[9px] text-zinc-650">{log.changed_at}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
      )}

      {activeTab === 'gov-requests' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2">
                <span>🏛️</span> Incoming Farmer Support Requests
              </h3>
              <button 
                onClick={fetchGovRequests}
                className="text-[10px] uppercase font-bold text-emerald-400 hover:text-emerald-350 cursor-pointer bg-transparent border-0"
              >
                Sync Requests 🔄
              </button>
            </div>

            {govSuccessMsg && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl">
                {govSuccessMsg}
              </div>
            )}
            {govErrorMsg && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl">
                {govErrorMsg}
              </div>
            )}

            {govRequests.length === 0 ? (
              <div className="border border-dashed border-zinc-850 rounded-xl p-12 text-center text-zinc-550 text-xs">
                📡 No governmental requests submitted yet in federal queue.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-850 text-zinc-400">
                      <th className="py-3 px-2">ID</th>
                      <th className="py-3 px-2">Farmer</th>
                      <th className="py-3 px-2">Request Type</th>
                      <th className="py-3 px-2">Title / Description</th>
                      <th className="py-3 px-2">Requested Amount</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {govRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-zinc-900/40 text-zinc-300">
                        <td className="py-4 px-2 font-mono">#{req.id}</td>
                        <td className="py-4 px-2 font-semibold text-zinc-200">{req.farmer_name}</td>
                        <td className="py-4 px-2">
                          <span className="px-2 py-0.5 rounded font-bold text-[9px] bg-zinc-800 text-zinc-400 uppercase font-mono">
                            {req.request_type === 'water_quota' ? '💧 Water' :
                             req.request_type === 'subsidy' ? '💵 Subsidy' :
                             req.request_type === 'equipment' ? '🚜 Equipment' : '📜 Permit'}
                          </span>
                        </td>
                        <td className="py-4 px-2 max-w-xs">
                          <span className="font-semibold text-zinc-200 block">{req.title}</span>
                          <span className="text-[10px] text-zinc-505 block mt-1 font-light leading-normal">{req.description}</span>
                        </td>
                        <td className="py-4 px-2 font-bold text-[#4ade80]">
                          {req.amount_requested !== null ? `${req.amount_requested} AED` : 'N/A'}
                        </td>
                        <td className="py-4 px-2">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                            req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            req.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right space-x-1.5 whitespace-nowrap">
                          {req.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateGovRequestStatus(req.id, 'Approved')}
                                className="bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-500 hover:text-zinc-950 text-emerald-400 px-3 py-1.5 rounded text-[10px] font-semibold transition-all cursor-pointer border-0"
                              >
                                Approve ✓
                              </button>
                              <button
                                onClick={() => handleUpdateGovRequestStatus(req.id, 'Rejected')}
                                className="bg-rose-600/10 border border-rose-500/30 hover:bg-rose-550 hover:text-zinc-950 text-rose-455 px-3 py-1.5 rounded text-[10px] font-semibold transition-all cursor-pointer border-0"
                              >
                                Reject ✕
                              </button>
                            </>
                          )}
                          {req.status !== 'Pending' && (
                            <span className="text-zinc-550 text-[10px] italic">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'startup-permits' && renderStartupPermits()}
      {activeTab === 'crisis-center' && renderCrisisCenter()}
      {activeTab === 'community-board' && renderCommunityBoard()}
      {activeTab === 'users' && renderUserManagement()}
      {activeTab === 'ai-config' && renderAiConfig()}

      <GovFooter />
      <EcoCopilotChat />
    </div>
  );
}
