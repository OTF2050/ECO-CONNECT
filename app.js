// ==========================================================================
// ECO CONNECT - CORE APPLICATION SCRIPT
// ==========================================================================

// Global Application State
const state = {
  currentTab: 'marketplace',
  currentLocation: 'Hatta',
  searchQuery: '',
  filterType: 'all',
  
  // Simulated Location Coordinates & Elevation
  locations: {
    Hatta: { lat: '24.8151° N', lng: '56.1264° E', alt: '310m', region: 'Dubai Region', authority: 'Dubai Municipality' },
    Liwa: { lat: '20.1294° N', lng: '53.7381° E', alt: '115m', region: 'Al Dhafra (Abu Dhabi)', authority: 'Abu Dhabi Municipality (Al Dhafra Branch)' },
    'Al Ain': { lat: '24.2075° N', lng: '55.7447° E', alt: '290m', region: 'Eastern Region (Abu Dhabi)', authority: 'Al Ain Municipality' },
    'Madinat Zayed': { lat: '23.6543° N', lng: '53.7052° E', alt: '125m', region: 'Al Dhafra (Abu Dhabi)', authority: 'Abu Dhabi Municipality' },
    Dubai: { lat: '25.2048° N', lng: '55.2708° E', alt: '8m', region: 'Dubai Metro', authority: 'Dubai Municipality' },
    'Abu Dhabi': { lat: '24.4539° N', lng: '54.3773° E', alt: '5m', region: 'Abu Dhabi Metro', authority: 'Abu Dhabi Environment Agency' }
  },

  // Dual Marketplace Mock Database
  marketplaceItems: [
    {
      id: 'm1',
      title: 'Premium Khalas Dates (Fresh Harvest)',
      type: 'sell', // local sale
      price: 65,
      description: 'Grown sustainably in the organic soils of Hatta Oasis. Rich in fiber, iron, and natural sugars. Harvested manually.',
      image: 'dates',
      origin: 'Hatta',
      stock: 12,
      seller: 'Amna Al Mansouri (Local Resident)'
    },
    {
      id: 'm2',
      title: 'Hand-woven Sadu Sitting Rug',
      type: 'sell',
      price: 450,
      description: 'Traditional Emirati geometric patterns hand-woven using locally sourced sheep wool. Takes 3 weeks of master craftsmanship to create.',
      image: 'craft',
      origin: 'Liwa',
      stock: 2,
      seller: 'Mariam Al Shehhi (Heritage Craftsman)'
    },
    {
      id: 'm3',
      title: 'Refurbished Lenovo ThinkPads',
      type: 'donate', // corporate support
      price: 0, // claimed for free
      description: 'Donated by UAE TechCorp. Fully refurbished with 8GB RAM, SSD, and preloaded with educational software to support remote student learning.',
      image: 'electronics',
      origin: 'Dubai',
      stock: 4,
      seller: 'TechCorp Corporate Responsibility'
    },
    {
      id: 'm4',
      title: 'Solar-Powered Drip Irrigation Pump',
      type: 'donate',
      price: 0,
      description: 'Smart irrigation pump suitable for small remote farms. Pumps up to 1000L/day using solar panels. Reduces water wastage by 40%.',
      image: 'tools',
      origin: 'Abu Dhabi',
      stock: 1,
      seller: 'EcoAgriculture Agency UAE'
    },
    {
      id: 'm5',
      title: 'Pure Sidr Sidr Honey (Al Hajar)',
      type: 'sell',
      price: 180,
      description: 'Wild bee Sidr honey harvested from the valleys of Al Ain. Known for high medicinal value and organic purity.',
      image: 'craft',
      origin: 'Al Ain',
      stock: 8,
      seller: 'Rashed Al Kaabi (Bee Keeper)'
    },
    {
      id: 'm6',
      title: 'Refurbished Agricultural Soil Hydrometer',
      type: 'donate',
      price: 0,
      description: 'Digital soil moisture sensors to prevent excessive water run-off. Donated to remote farmers to promote soil health conservation.',
      image: 'tools',
      origin: 'Dubai',
      stock: 5,
      seller: 'Sustainable Farms Co.'
    }
  ],

  // Ecotourism Destinations Database
  tours: [
    {
      id: 't1',
      title: 'Liwa Desert Sunset Trek & Stargazing',
      location: 'Liwa Oasis (Moreeb Dune)',
      duration: '6 Hours',
      difficulty: 'Medium',
      price: 320,
      description: 'Explore the highest dunes in the UAE. Walk through historic palm groves, learn about desert flora survival, and experience stargazing in clear desert skies with zero light pollution.',
      image: 'liwa'
    },
    {
      id: 't2',
      title: 'Hatta Heritage Trails & Kayaking',
      location: 'Hatta Hajar Mountains',
      duration: '8 Hours',
      difficulty: 'Hard',
      price: 250,
      description: 'Hike through rocky canyons in the Al Hajar mountain range, visit the 16th-century Hatta Heritage Village, and kayak in the green waters of Hatta Dam reservoir.',
      image: 'hatta'
    },
    {
      id: 't3',
      title: 'Sir Bani Yas Island Wildlife Tracking',
      location: 'Sir Bani Yas Island (Al Dhafra)',
      duration: '4 Hours',
      difficulty: 'Easy',
      price: 400,
      description: 'Drive through the Arabian Wildlife Park containing over 17,000 free-roaming animals, including Arabian Oryx, cheetahs, gazelles, and giraffes. Tour guided by local rangers.',
      image: 'wildlife'
    },
    {
      id: 't4',
      title: 'Al Ain Oasis Traditional Aflaj Tour',
      location: 'Al Ain Oasis',
      duration: '3 Hours',
      difficulty: 'Easy',
      price: 150,
      description: 'Stroll through UAE’s first UNESCO World Heritage site. See the ancient Aflaj irrigation channel system in action and learn about date farming practices dating back 3,000 years.',
      image: 'alain'
    }
  ],

  // Local Guides registry
  guides: [
    { id: 'g1', name: 'Saeed Al Mansouri', location: 'Liwa Oasis', rating: 4.9, tours: 142, bio: 'Desert survival expert & astronomy specialist.', initial: 'SM' },
    { id: 'g2', name: 'Fatima Al Mazrouei', location: 'Hatta & Al Ain', rating: 5.0, tours: 98, bio: 'Emirati heritage scholar & traditional farming guide.', initial: 'FM' },
    { id: 'g3', name: 'Salem Al Hattawi', location: 'Hatta Range', rating: 4.8, tours: 215, bio: 'Avid mountain climber, rescue professional, and kayaker.', initial: 'SH' }
  ],

  activeDiagnosticMode: 'vitals',
  isCameraActive: false,
  cameraStream: null,
  isScanning: false,
  diagnosticResults: null
};

// ==========================================================================
// CORE APP ROUTING & TAB NAVIGATION
// ==========================================================================
function launchDashboard() {
  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('dashboard-page').style.display = 'flex';
  
  // Set default view on launch
  setActiveTab('marketplace');
  showToast('Welcome to Eco Connect System', 'info');
  
  // Start HUD time updater
  startHudTelemetry();
}

function scrollToStats() {
  document.getElementById('stats-section').scrollIntoView({ behavior: 'smooth' });
}

function setActiveTab(tabId) {
  state.currentTab = tabId;
  
  // Toggle sections
  document.querySelectorAll('.tab-section').forEach(section => {
    section.classList.remove('active');
  });
  const activeSection = document.getElementById(`tab-${tabId}`);
  if (activeSection) activeSection.classList.add('active');
  
  // Update nav buttons active classes
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeNavItem = document.getElementById(`nav-${tabId}`);
  if (activeNavItem) activeNavItem.classList.add('active');
  
  // Update page title
  const titles = {
    marketplace: 'Eco Shop & Circular Hub',
    tourism: 'Eco Tour - Responsible Ecotourism',
    care: 'Eco Care - AI Tele-Health & Environment'
  };
  document.getElementById('current-tab-title').textContent = titles[tabId];
  
  // Stop camera feed if moving away from Care
  if (tabId !== 'care' && state.isCameraActive) {
    stopCamera();
  }
  
  // Run specific initializations
  if (tabId === 'marketplace') {
    renderMarketplace();
  } else if (tabId === 'tourism') {
    renderTours();
    renderBookingDropdowns();
    renderGuides();
  } else if (tabId === 'care') {
    selectDiagnosticMode(state.activeDiagnosticMode);
    startNeuralVisualOverlay();
  }
}

// Location Dropdown Selector Event handler
function onLocationChange() {
  const select = document.getElementById('user-location-selector');
  state.currentLocation = select.value;
  
  // Update origin placeholder in Add Listing form
  document.getElementById('list-origin').value = state.currentLocation;
  
  // Update active HUD telemetry values
  updateHudLocationInfo();
  
  showToast(`Current base set to: ${state.currentLocation}`, 'info');
}

// Update HUD texts dynamically based on Location Selection
function updateHudLocationInfo() {
  const locationData = state.locations[state.currentLocation];
  const latLongEl = document.getElementById('hud-latlong');
  if (latLongEl && locationData) {
    latLongEl.textContent = `GPS: ${locationData.lat}, ${locationData.lng} | ALT: ${locationData.alt}`;
  }
}

// Simulated real-time clock in HUD
function startHudTelemetry() {
  setInterval(() => {
    const timestampEl = document.getElementById('hud-timestamp');
    if (timestampEl) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      timestampEl.textContent = `UTC+4: ${timeStr}`;
    }
  }, 1000);
  updateHudLocationInfo();
}

function showNotificationPanel() {
  showToast('You have 2 new notifications: "Donation claimed" & "Eco-tour inquiry"', 'info');
}

// ==========================================================================
// DUAL MARKETPLACE LOGIC (ECO SHOP & CIRCULAR HUB)
// ==========================================================================

// Render Grid Cards
function renderMarketplace() {
  const container = document.getElementById('market-grid-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Filter search matches
  const filtered = state.marketplaceItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(state.searchQuery.toLowerCase());
    
    if (state.filterType === 'all') return matchesSearch;
    return matchesSearch && item.type === state.filterType;
  });
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 50px 0; color:var(--text-muted);">
        <p>No resources found matching "${state.searchQuery}".</p>
      </div>
    `;
    return;
  }
  
  filtered.forEach(item => {
    const isFree = item.price === 0;
    const itemBadgeClass = item.type === 'sell' ? 'badge-sell' : 'badge-donate';
    const itemBadgeText = item.type === 'sell' ? 'Local Sale' : 'Corporate Donation';
    
    // Choose appropriate inline SVG for card category image
    let cardSvg = '';
    if (item.image === 'dates') {
      cardSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-sand)" stroke-width="1.5"><circle cx="12" cy="12" r="9"></circle><path d="M12 8c1.5 0 2 1.5 2 2.5s-.5 2.5-2 2.5-2-1.5-2-2.5S10.5 8 12 8z"></path></svg>`;
    } else if (item.image === 'craft') {
      cardSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>`;
    } else if (item.image === 'electronics') {
      cardSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;
    } else { // tools
      cardSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`;
    }
    
    const cardHtml = `
      <div class="market-card glass-panel" id="market-item-${item.id}">
        <div class="card-image-box">
          <span class="badge-tag ${itemBadgeClass}">${itemBadgeText}</span>
          ${cardSvg}
        </div>
        <div class="card-body">
          <div class="card-origin">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            </svg>
            ${item.origin}
          </div>
          <h4 class="card-title">${item.title}</h4>
          <p class="card-description">${item.description}</p>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom: 12px; font-style:italic;">
            Posted by: ${item.seller}
          </div>
          <div class="card-footer">
            <div class="card-price ${isFree ? 'free' : ''}">
              ${isFree ? 'FREE' : item.price + ' <span style="font-size:0.8rem; font-weight:normal;">AED</span>'}
            </div>
            <button class="card-btn" onclick="buyOrClaimItem('${item.id}')">
              ${item.type === 'sell' ? 'Purchase' : 'Claim Item'}
            </button>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += cardHtml;
  });
}

function filterMarketType(type) {
  state.filterType = type;
  
  // Toggle active pill button
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.classList.remove('active');
  });
  document.getElementById(`pill-${type}`).classList.add('active');
  
  renderMarketplace();
}

function filterMarketplace() {
  state.searchQuery = document.getElementById('market-search').value;
  renderMarketplace();
}

// Purchase and Claim Actions (Invoice generation)
function buyOrClaimItem(itemId) {
  const item = state.marketplaceItems.find(i => i.id === itemId);
  if (!item) return;
  
  const isFree = item.price === 0;
  const transactionId = 'ECO-TX-' + Math.floor(100000 + Math.random() * 900000);
  
  // Populate the receipt modal details
  const modalTitle = document.getElementById('receipt-modal-title');
  const invoiceDetails = document.getElementById('receipt-invoice-details');
  const successHeading = document.getElementById('receipt-success-heading');
  const successMsg = document.getElementById('receipt-success-msg');
  
  modalTitle.textContent = item.type === 'sell' ? 'Receipt of Purchase' : 'Receipt of Donation Claim';
  successHeading.textContent = item.type === 'sell' ? 'Payment Completed Successfully' : 'Donation Allocation Certified';
  successMsg.textContent = item.type === 'sell' 
    ? 'Economic connection confirmed. Funds will be deposited directly to local seller.' 
    : 'Social circular support ticket issued. Item has been reserved for collection.';
    
  invoiceDetails.innerHTML = `
    <div class="invoice-row">
      <span>TRANSACTION REF:</span>
      <span>${transactionId}</span>
    </div>
    <div class="invoice-row">
      <span>DATE & TIME:</span>
      <span>${new Date().toLocaleString('en-US', { hour12: false })}</span>
    </div>
    <div class="invoice-row">
      <span>ITEM NAME:</span>
      <span>${item.title}</span>
    </div>
    <div class="invoice-row">
      <span>SELLER/DONOR:</span>
      <span>${item.seller}</span>
    </div>
    <div class="invoice-row">
      <span>ORIGIN AREA:</span>
      <span>${item.origin}</span>
    </div>
    <div class="invoice-row">
      <span>FULFILLMENT TYPE:</span>
      <span>${item.type === 'sell' ? 'Direct Delivery' : 'Collect from Local Hub'}</span>
    </div>
    <div class="invoice-divider"></div>
    <div class="invoice-row invoice-total">
      <span>TOTAL AMOUNT:</span>
      <span>${isFree ? 'FREE (0.00 AED)' : item.price.toFixed(2) + ' AED'}</span>
    </div>
  `;
  
  // Deduct stock or remove item representation
  if (item.stock > 1) {
    item.stock -= 1;
  } else {
    state.marketplaceItems = state.marketplaceItems.filter(i => i.id !== itemId);
  }
  
  // Show modal
  document.getElementById('receipt-modal').classList.add('active');
  
  showToast(item.type === 'sell' ? 'Purchase completed' : 'Donation claimed', 'success');
  renderMarketplace();
}

function closeReceiptModal() {
  document.getElementById('receipt-modal').classList.remove('active');
}

// Add listing Modal controls
function openAddListingModal() {
  document.getElementById('add-listing-modal').classList.add('active');
}

function closeAddListingModal() {
  document.getElementById('add-listing-modal').classList.remove('active');
}

function toggleListingPriceInput() {
  const typeSelect = document.getElementById('list-type');
  const priceInput = document.getElementById('list-price');
  
  if (typeSelect.value === 'donate') {
    priceInput.value = 0;
    priceInput.disabled = true;
    priceInput.style.opacity = 0.5;
  } else {
    priceInput.value = 50;
    priceInput.disabled = false;
    priceInput.style.opacity = 1;
  }
}

// Posting Form Submit handler
function handlePostListing(e) {
  e.preventDefault();
  
  const title = document.getElementById('list-title').value;
  const type = document.getElementById('list-type').value;
  const price = parseFloat(document.getElementById('list-price').value);
  const desc = document.getElementById('list-desc').value;
  const image = document.getElementById('list-image').value;
  const origin = document.getElementById('list-origin').value;
  
  const newItem = {
    id: 'm_' + Date.now(),
    title: title,
    type: type,
    price: price,
    description: desc,
    image: image,
    origin: origin,
    stock: 1,
    seller: 'User Account (Self)'
  };
  
  state.marketplaceItems.unshift(newItem);
  
  closeAddListingModal();
  document.getElementById('add-listing-form').reset();
  
  showToast('Your resource listing is now live!', 'success');
  renderMarketplace();
}


// ==========================================================================
// ECO-TOURISM LOGIC (ECO TOUR)
// ==========================================================================

function renderTours() {
  const container = document.getElementById('tour-cards-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  state.tours.forEach(tour => {
    // Svg selector for ecotour illustration icon box
    let tourIcon = '';
    if (tour.image === 'liwa') {
      tourIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-sand)" stroke-width="1.5"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.39.18.04.33-.06.33-.24v-2.07c0-.5-.19-1-1.07-1-1.5 0-3-1-3-3 0-1.5 1.5-2 1.5-2s-.5-1 .5-2 1.5.5 1.5.5 0-1.5 1-1.5 1.5 1.5 1.5 1.5S10 8 11.5 8s1.5 1.5 1.5 1.5.5-1.5 1.5-1.5 1 1 1 2c0 2-1.5 3-3 3-.88 0-1.07.5-1.07 1v2.07c0 .18.15.28.33.24C19.13 20.17 22 16.42 22 12c0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>`;
    } else if (tour.image === 'hatta') {
      tourIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
    } else if (tour.image === 'wildlife') {
      tourIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>`;
    } else { // alain
      tourIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
    }
    
    const cardHtml = `
      <div class="tour-card glass-panel" id="tour-item-${tour.id}">
        <div class="tour-card-image">
          <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.01);">
            ${tourIcon}
          </div>
        </div>
        <div class="tour-card-body">
          <span class="tour-location">${tour.location}</span>
          <h4 class="tour-title">${tour.title}</h4>
          
          <div class="tour-details-row">
            <div class="tour-detail-item">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>${tour.duration}</span>
            </div>
            <div class="tour-detail-item">
              <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span>Difficulty: ${tour.difficulty}</span>
            </div>
          </div>
          
          <p class="tour-description">${tour.description}</p>
          
          <div class="tour-card-footer">
            <div class="tour-price">
              ${tour.price} AED <span>/ person</span>
            </div>
            <button class="card-btn" onclick="selectTourForBooking('${tour.id}')" style="background:var(--accent-sand); border-color:var(--accent-sand); color:var(--text-dark);">
              Select Expedition
            </button>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += cardHtml;
  });
}

function renderGuides() {
  const container = document.getElementById('guides-list-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  state.guides.forEach(guide => {
    const itemHtml = `
      <div class="guide-item">
        <div class="guide-avatar">${guide.initial}</div>
        <div class="guide-details">
          <div class="guide-name">${guide.name}</div>
          <div class="guide-location">${guide.location}</div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${guide.bio}</div>
        </div>
        <div class="guide-rating">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <span>${guide.rating}</span>
        </div>
      </div>
    `;
    container.innerHTML += itemHtml;
  });
}

function renderBookingDropdowns() {
  const tourSelect = document.getElementById('booking-select-tour');
  const guideSelect = document.getElementById('booking-select-guide');
  
  if (!tourSelect || !guideSelect) return;
  
  tourSelect.innerHTML = '';
  guideSelect.innerHTML = '';
  
  // Populate tours
  state.tours.forEach(tour => {
    const opt = document.createElement('option');
    opt.value = tour.id;
    opt.textContent = `${tour.title} (${tour.price} AED)`;
    tourSelect.appendChild(opt);
  });
  
  // Populate guides
  state.guides.forEach(guide => {
    const opt = document.createElement('option');
    opt.value = guide.id;
    opt.textContent = `${guide.name} (${guide.location})`;
    guideSelect.appendChild(opt);
  });
  
  calculateBookingPrice();
}

function selectTourForBooking(tourId) {
  const select = document.getElementById('booking-select-tour');
  if (select) {
    select.value = tourId;
    calculateBookingPrice();
    // Scroll dynamic booking card into view
    document.getElementById('booking-form').scrollIntoView({ behavior: 'smooth' });
    showToast('Tour selected. Set guests count and guide to finalize.', 'info');
  }
}

function calculateBookingPrice() {
  const tourSelect = document.getElementById('booking-select-tour');
  const guestsInput = document.getElementById('booking-guests');
  const priceDisplay = document.getElementById('booking-price-calc');
  
  if (!tourSelect || !guestsInput || !priceDisplay) return;
  
  const tourId = tourSelect.value;
  const tour = state.tours.find(t => t.id === tourId);
  const guests = parseInt(guestsInput.value) || 1;
  
  if (tour) {
    const total = tour.price * guests;
    priceDisplay.textContent = `${total} AED`;
  }
}

function handleTourBooking(e) {
  e.preventDefault();
  
  const tourSelect = document.getElementById('booking-select-tour');
  const guideSelect = document.getElementById('booking-select-guide');
  const dateVal = document.getElementById('booking-date').value;
  const guestsVal = parseInt(document.getElementById('booking-guests').value) || 1;
  
  const selectedTour = state.tours.find(t => t.id === tourSelect.value);
  const selectedGuide = state.guides.find(g => g.id === guideSelect.value);
  
  if (!selectedTour || !selectedGuide) return;
  
  const bookingId = 'ECO-TOUR-' + Math.floor(1000 + Math.random() * 9000);
  const totalCost = selectedTour.price * guestsVal;
  
  // Show confirmation receipt modal
  const modalTitle = document.getElementById('receipt-modal-title');
  const invoiceDetails = document.getElementById('receipt-invoice-details');
  const successHeading = document.getElementById('receipt-success-heading');
  const successMsg = document.getElementById('receipt-success-msg');
  
  modalTitle.textContent = 'Ecotourism Booking Pass';
  successHeading.textContent = 'Expedition Booked Successfully';
  successMsg.textContent = 'Booking credentials recorded. 100% tourism fees allocated directly to local guides community fund.';
  
  invoiceDetails.innerHTML = `
    <div class="invoice-row">
      <span>BOOKING REF:</span>
      <span>${bookingId}</span>
    </div>
    <div class="invoice-row">
      <span>DESTINATION:</span>
      <span>${selectedTour.title}</span>
    </div>
    <div class="invoice-row">
      <span>LOCAL GUIDE:</span>
      <span>${selectedGuide.name}</span>
    </div>
    <div class="invoice-row">
      <span>EXPEDITION DATE:</span>
      <span>${dateVal}</span>
    </div>
    <div class="invoice-row">
      <span>GUESTS:</span>
      <span>${guestsVal} Person(s)</span>
    </div>
    <div class="invoice-divider"></div>
    <div class="invoice-row invoice-total">
      <span>TOTAL PAID:</span>
      <span>${totalCost} AED</span>
    </div>
  `;
  
  document.getElementById('receipt-modal').classList.add('active');
  document.getElementById('booking-form').reset();
  calculateBookingPrice();
  
  showToast('Eco-Tourism reservation confirmed', 'success');
}


// ==========================================================================
// AI TELE-HEALTH & ENVIRONMENT LOGIC (ECO CARE)
// ==========================================================================

function selectDiagnosticMode(mode) {
  state.activeDiagnosticMode = mode;
  
  // Toggle UI active button selection state
  document.querySelectorAll('.btn-scan-option').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = document.getElementById(`btn-scan-${mode}`);
  if (activeBtn) activeBtn.classList.add('active');
  
  // Configure text titles
  const scanTitle = document.getElementById('viewport-active-scan-type');
  
  // Results details display resets
  document.getElementById('diagnostic-placeholder-msg').style.display = 'flex';
  document.getElementById('diagnostic-details-content').classList.remove('active');
  document.getElementById('env-report-submission-box').style.display = 'none';
  
  if (mode === 'vitals') {
    scanTitle.textContent = 'Telemedicine - Vitals Diagnostic';
  } else if (mode === 'skin') {
    scanTitle.textContent = 'Telemedicine - Dermatology AI Scan';
  } else if (mode === 'soil') {
    scanTitle.textContent = 'Environment - Agricultural Soil Analyzer';
  } else if (mode === 'water') {
    scanTitle.textContent = 'Environment - Water Purity Telemetry';
  }
}

// Request actual camera or stop it
function toggleRealCamera() {
  if (state.isCameraActive) {
    stopCamera();
  } else {
    initCamera();
  }
}

function initCamera() {
  const videoEl = document.getElementById('viewport-video-stream');
  const placeholderEl = document.getElementById('viewport-placeholder-hud');
  const badgeEl = document.getElementById('viewport-status-badge');
  
  if (!videoEl) return;
  
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
    .then(stream => {
      state.cameraStream = stream;
      state.isCameraActive = true;
      videoEl.srcObject = stream;
      videoEl.style.display = 'block';
      placeholderEl.style.display = 'none';
      
      badgeEl.textContent = 'LIVE CAMERA';
      badgeEl.className = 'status-badge live';
      showToast('Device webcam linked successfully', 'success');
    })
    .catch(err => {
      console.warn('Webcam permission error or missing hardware. Falling back to synthetic simulation mode.', err);
      showToast('Camera hardware error. Simulation mode active.', 'info');
      
      // Keep standard indicator but label as simulator
      badgeEl.textContent = 'SIMULATOR MODE';
      badgeEl.className = 'status-badge live';
      
      // Style changes to mock a dynamic HUD background instead
      state.isCameraActive = true;
    });
}

function stopCamera() {
  const videoEl = document.getElementById('viewport-video-stream');
  const placeholderEl = document.getElementById('viewport-placeholder-hud');
  const badgeEl = document.getElementById('viewport-status-badge');
  
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(track => track.stop());
  }
  
  state.cameraStream = null;
  state.isCameraActive = false;
  if (videoEl) {
    videoEl.srcObject = null;
    videoEl.style.display = 'none';
  }
  if (placeholderEl) {
    placeholderEl.style.display = 'flex';
  }
  if (badgeEl) {
    badgeEl.textContent = 'CAMERA OFFLINE';
    badgeEl.className = 'status-badge live';
    badgeEl.style.background = 'rgba(239, 68, 68, 0.1)';
    badgeEl.style.color = '#ef4444';
  }
}

// Running neural overlay loops inside Canvas (simulate AI reading face/hand/soil coordinates)
let canvasInterval = null;
function startNeuralVisualOverlay() {
  const canvas = document.getElementById('neural-overlay-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Set dimensions
  const resizeCanvas = () => {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  let frame = 0;
  
  if (canvasInterval) clearInterval(canvasInterval);
  
  canvasInterval = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // FPS computation mock
    const fpsEl = document.getElementById('hud-fps');
    if (fpsEl && frame % 10 === 0) {
      const activeFps = state.isScanning ? 24 : 30;
      fpsEl.textContent = `STREAM: ${activeFps}FPS | STABLE`;
    }
    
    if (state.isCameraActive) {
      ctx.strokeStyle = 'rgba(212, 154, 67, 0.3)';
      ctx.lineWidth = 1;
      
      // Dynamic scanning box coordinates center
      const boxWidth = canvas.width * 0.45;
      const boxHeight = canvas.height * 0.6;
      const x = (canvas.width - boxWidth) / 2;
      const y = (canvas.height - boxHeight) / 2;
      
      // Draw target scanning overlay container
      ctx.strokeRect(x, y, boxWidth, boxHeight);
      
      // Draw simulated AI nodes tracking elements
      ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
      const points = [
        { px: 0.35, py: 0.3 }, { px: 0.65, py: 0.3 }, 
        { px: 0.5, py: 0.5 }, 
        { px: 0.4, py: 0.7 }, { px: 0.6, py: 0.7 }
      ];
      
      points.forEach((pt, i) => {
        const offsetVal = Math.sin(frame * 0.15 + i) * 3;
        const finalX = x + boxWidth * pt.px + offsetVal;
        const finalY = y + boxHeight * pt.py + offsetVal;
        
        ctx.beginPath();
        ctx.arc(finalX, finalY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw coordinate text strings
        if (state.isScanning) {
          ctx.font = '8px monospace';
          ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
          ctx.fillText(`P_${i}:[${Math.round(finalX)},${Math.round(finalY)}]`, finalX + 6, finalY + 3);
        }
      });
      
      // Connect points with thin bounding lines if scanning
      if (state.isScanning) {
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.beginPath();
        ctx.moveTo(x + boxWidth * 0.35, y + boxHeight * 0.3);
        ctx.lineTo(x + boxWidth * 0.65, y + boxHeight * 0.3);
        ctx.lineTo(x + boxWidth * 0.5, y + boxHeight * 0.5);
        ctx.closePath();
        ctx.stroke();
      }
    }
    
    frame++;
  }, 100);
}

// Trigger diagnostic scan calculations
function triggerAiScan() {
  if (state.isScanning) return;
  
  state.isScanning = true;
  
  // Set UI state
  const laserEl = document.getElementById('scanline-laser');
  const badgeEl = document.getElementById('viewport-status-badge');
  const placeholderMsg = document.getElementById('diagnostic-placeholder-msg');
  const detailsContent = document.getElementById('diagnostic-details-content');
  const envFormPanel = document.getElementById('env-report-submission-box');
  
  laserEl.classList.add('scanning');
  badgeEl.textContent = 'SCANNING IN PROGRESS...';
  badgeEl.className = 'status-badge scanning';
  
  placeholderMsg.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap: 15px;">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-sand)" stroke-width="2" style="animation: spin 1.5s infinite linear;">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6l4 2"></path>
      </svg>
      <p style="font-weight:600; color:var(--accent-sand);">Analyzing sensor array data telemetry...</p>
      <p style="font-size:0.8rem; color:var(--text-muted);">Parsing raw spectrum pixels through Eco AI Engine v2.4</p>
    </div>
  `;
  
  // Setup CSS spin rule on the fly
  if (!document.getElementById('spin-keyframe-css')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'spin-keyframe-css';
    styleSheet.innerText = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(styleSheet);
  }
  
  // Delay diagnostic completion
  setTimeout(() => {
    state.isScanning = false;
    laserEl.classList.remove('scanning');
    
    // Update badge status
    badgeEl.textContent = state.cameraStream ? 'LIVE CAMERA' : 'SIMULATOR MODE';
    badgeEl.className = 'status-badge live';
    
    // Load calculations details
    generateDiagnosticReadouts();
    
    placeholderMsg.style.display = 'none';
    detailsContent.classList.add('active');
    
    // Display environmental report submission form if agricultural soil or water is active
    if (state.activeDiagnosticMode === 'soil' || state.activeDiagnosticMode === 'water') {
      envFormPanel.style.display = 'block';
      setupMunicipalFormParameters();
    } else {
      envFormPanel.style.display = 'none';
    }
    
    showToast('AI analysis completed successfully', 'success');
  }, 3500);
}

// Populate Diagnosis panel contents
function generateDiagnosticReadouts() {
  const mode = state.activeDiagnosticMode;
  
  const mLabel1 = document.getElementById('metric-l1');
  const mVal1 = document.getElementById('metric-v1');
  const mLabel2 = document.getElementById('metric-l2');
  const mVal2 = document.getElementById('metric-v2');
  const severityPill = document.getElementById('metric-severity-pill');
  const summaryText = document.getElementById('diagnostic-summary-text');
  const recommendationsList = document.getElementById('diagnostic-recommendations-list');
  const ctaContainer = document.getElementById('diagnostic-cta-button-container');
  
  recommendationsList.innerHTML = '';
  ctaContainer.innerHTML = '';
  
  if (mode === 'vitals') {
    mLabel1.textContent = 'HEART BEAT RATE';
    mVal1.textContent = '72 BPM';
    mLabel2.textContent = 'BLOOD OXYGEN (SPO2)';
    mVal2.textContent = '98%';
    
    severityPill.textContent = 'HEALTHY';
    severityPill.className = 'severity-pill severity-low';
    
    summaryText.textContent = 'Cardiovascular metrics and respiratory indexes are in optimal thresholds. Face camera micro-vessel scanning indicates regular heart rhythms.';
    
    const recs = [
      'Maintain adequate fluid intake under high temperatures.',
      'Perform light cardiovascular exercise in cooling environments.',
      'Check vital signs bi-weekly to sustain local health tracking.'
    ];
    recs.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r;
      recommendationsList.appendChild(li);
    });
    
    ctaContainer.innerHTML = `
      <button class="btn-primary" onclick="showToast('Connecting with Health Authority Doctor in Abu Dhabi...', 'info')" style="width:100%; justify-content:center; padding:12px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
        Tele-Consult Urban Doctor (Video Call)
      </button>
    `;
    
  } else if (mode === 'skin') {
    mLabel1.textContent = 'SKIN EPIDERMIS CHECK';
    mVal1.textContent = 'UV Sunburn Detected';
    mLabel2.textContent = 'MELANIN CONCENTRATION';
    mVal2.textContent = 'Slight Elevation';
    
    severityPill.textContent = 'MODERATE';
    severityPill.className = 'severity-pill severity-medium';
    
    summaryText.textContent = 'Computer vision identifies minor localized heat rash and epidermal sunburn on user face. Dermis heat levels indicate sun exposure irritation.';
    
    const recs = [
      'Apply Broad Spectrum SPF 50+ sunscreen prior to outdoor work.',
      'Apply soothing organic Aloe Vera gel to calm irritated spots.',
      'Schedule a remote consultation with clinical dermatology if irritation persists.'
    ];
    recs.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r;
      recommendationsList.appendChild(li);
    });
    
    ctaContainer.innerHTML = `
      <button class="btn-primary" onclick="showToast('Scheduling digital consultation with Cleveland Clinic Abu Dhabi...', 'info')" style="width:100%; justify-content:center; padding:12px;">
        Book Dermatology Call
      </button>
    `;
    
  } else if (mode === 'soil') {
    mLabel1.textContent = 'SOIL MOISTURE SCALE';
    mVal1.textContent = '11.4% (CRITICAL)';
    mLabel2.textContent = 'N-P-K BALANCING';
    mVal2.textContent = 'Nitrogen Deficit';
    
    severityPill.textContent = 'CRITICAL ALERT';
    severityPill.className = 'severity-pill severity-high';
    
    summaryText.textContent = 'Spectral camera telemetry detects high salinity and severe moisture depletion in agricultural soil coordinates. Nitrogen quantities are insufficient for crop vegetation.';
    
    const recs = [
      'Initiate sub-surface drip irrigation schedule to combat water loss.',
      'Blend composted organic matter to raise Nitrogen holding capacity.',
      'Request modern environmental water pumps from Eco Circular Hub.'
    ];
    recs.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r;
      recommendationsList.appendChild(li);
    });
    
    ctaContainer.innerHTML = `
      <button class="btn-book" onclick="document.getElementById('env-report-submission-box').scrollIntoView({ behavior: 'smooth' });" style="width:100%; background:var(--primary-eco); color:var(--text-main); font-size:0.9rem; padding:12px;">
        Submit Soil Telemetry to Municipality
      </button>
    `;
    
  } else if (mode === 'water') {
    mLabel1.textContent = 'WATER HYDROGEN (PH)';
    mVal1.textContent = '7.3 (NEUTRAL)';
    mLabel2.textContent = 'TOTAL DISSOLVED SOLIDS';
    mVal2.textContent = '310 PPM (SAFE)';
    
    severityPill.textContent = 'POTABLE & STABLE';
    severityPill.className = 'severity-pill severity-low';
    
    summaryText.textContent = 'Tested groundwater coordinates indicate good purity indexes. pH scale and organic density satisfy UAE environment safety guidelines.';
    
    const recs = [
      'Safe for agricultural crop feeding and livestock usage.',
      'Routinely examine wells to detect mineral changes.',
      'Purity stats automatically saved to federal conservation telemetry.'
    ];
    recs.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r;
      recommendationsList.appendChild(li);
    });
    
    ctaContainer.innerHTML = `
      <button class="btn-book" onclick="document.getElementById('env-report-submission-box').scrollIntoView({ behavior: 'smooth' });" style="width:100%; background:var(--primary-eco); color:var(--text-main); font-size:0.9rem; padding:12px;">
        Send Purity Certification to Municipal Hub
      </button>
    `;
  }
}

// Pre-fill municipal form parameters when environment scans occur
function setupMunicipalFormParameters() {
  const mode = state.activeDiagnosticMode;
  const locationData = state.locations[state.currentLocation];
  
  const reportTypeInput = document.getElementById('municipal-rep-type');
  const telemetryInput = document.getElementById('municipal-telemetry');
  const authorityInput = document.getElementById('municipal-authority');
  
  if (mode === 'soil') {
    reportTypeInput.value = 'Agricultural Soil Desiccation Alert';
    telemetryInput.value = 'Moisture: 11.4% | Salinity: High | N-PK: deficit';
  } else if (mode === 'water') {
    reportTypeInput.value = 'Water Source Purity Certification';
    telemetryInput.value = 'pH: 7.3 | TDS: 310 PPM | Safety: Potable';
  }
  
  if (locationData) {
    authorityInput.value = locationData.authority;
  }
}

// Submit environment report to municipality (Digital ledger receipt)
function handleMunicipalReport(e) {
  e.preventDefault();
  
  const reportType = document.getElementById('municipal-rep-type').value;
  const telemetry = document.getElementById('municipal-telemetry').value;
  const authority = document.getElementById('municipal-authority').value;
  const userNotes = document.getElementById('municipal-notes').value;
  
  const ticketId = 'MUNI-TKT-' + Math.floor(100000 + Math.random() * 900000);
  
  // Show formal ticket receipt
  const modalTitle = document.getElementById('receipt-modal-title');
  const invoiceDetails = document.getElementById('receipt-invoice-details');
  const successHeading = document.getElementById('receipt-success-heading');
  const successMsg = document.getElementById('receipt-success-msg');
  
  modalTitle.textContent = 'Municipal Filing Receipt';
  successHeading.textContent = 'Report Dispatched Successfully';
  successMsg.textContent = 'Environmental statistics entered into government blockchain telemetry. Dispatch crews notified.';
  
  invoiceDetails.innerHTML = `
    <div class="invoice-row">
      <span>TICKET REF:</span>
      <span>${ticketId}</span>
    </div>
    <div class="invoice-row">
      <span>SUBMISSION DATE:</span>
      <span>${new Date().toLocaleString('en-US', { hour12: false })}</span>
    </div>
    <div class="invoice-row">
      <span>MUNICIPAL AUTHORITY:</span>
      <span>${authority}</span>
    </div>
    <div class="invoice-row">
      <span>ORIGIN AREA:</span>
      <span>${state.currentLocation}</span>
    </div>
    <div class="invoice-row" style="margin-top:5px; flex-direction:column; gap:4px;">
      <span style="font-size:0.75rem; text-decoration:underline;">MAPPED TELEMETRY DATA:</span>
      <span style="color:var(--accent-sand); font-size:0.8rem;">${telemetry}</span>
    </div>
    <div class="invoice-divider"></div>
    <div class="invoice-row" style="flex-direction:column; gap:4px;">
      <span>OBSERVATIONS FILED:</span>
      <span style="font-size:0.8rem; font-style:italic;">"${userNotes}"</span>
    </div>
  `;
  
  document.getElementById('receipt-modal').classList.add('active');
  document.getElementById('municipal-report-form').reset();
  document.getElementById('env-report-submission-box').style.display = 'none';
  
  showToast('Environmental report submitted to authority', 'success');
}


// ==========================================================================
// TOAST NOTIFICATIONS HELPER SYSTEM
// ==========================================================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container-stack');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Assign simple SVGs based on toast types
  let toastSvg = '';
  if (type === 'success') {
    toastSvg = `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else {
    toastSvg = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }
  
  toast.innerHTML = `
    ${toastSvg}
    <span style="font-size:0.85rem; font-weight:500;">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Auto remove toast
  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s ease reverse forwards';
    setTimeout(() => {
      if (toast.parentNode) {
        container.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

// ==========================================================================
// APP INITIALIZATION
// ==========================================================================

window.addEventListener('DOMContentLoaded', () => {
  // Application stands ready, waiting for landing page launch trigger
});
