// State Management
let leads = [];
let selectedLeadId = null;
let currentTab = 'whatsapp';

// DOM Elements
const leadsGrid = document.getElementById('leads-grid');
const leadsCountEl = document.getElementById('leads-count');
const searchInput = document.getElementById('search-input');
const regionChips = document.getElementById('region-chips');
const categoryFilter = document.getElementById('category-filter');
const statusFilter = document.getElementById('status-filter');
const sortBySelect = document.getElementById('sort-by');

// Dashboard Stats Elements
const statTotalLeads = document.getElementById('stat-total-leads');
const statContactedLeads = document.getElementById('stat-contacted');
const statDemosSent = document.getElementById('stat-demos');
const statWonLeads = document.getElementById('stat-won');
const statRevenue = document.getElementById('stat-revenue');

// Detail Panel Elements
const detailPanel = document.getElementById('detail-panel');
const detailName = document.getElementById('detail-name');
const detailSub = document.getElementById('detail-sub');
const detailStatusSelect = document.getElementById('detail-status-select');
const detailPhone = document.getElementById('detail-phone');
const detailRating = document.getElementById('detail-rating');
const detailReviews = document.getElementById('detail-reviews');
const detailNotes = document.getElementById('detail-notes');
const detailRevenue = document.getElementById('detail-revenue-val');

// Tabs & Script elements
const tabButtons = document.querySelectorAll('.tab-btn');
const scriptBox = document.getElementById('script-box');
const copyScriptBtn = document.getElementById('copy-script-btn');
const whatsappBtn = document.getElementById('whatsapp-btn');

// Add Lead Modal Elements
const addLeadBtn = document.getElementById('add-lead-btn');
const addLeadModal = document.getElementById('add-lead-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelModalBtn = document.getElementById('cancel-modal');
const addLeadForm = document.getElementById('add-lead-form');

// Toast Notification Element
const toast = document.getElementById('toast');

// Initialize App
function init() {
  // Load from localStorage or seed data
  const storedLeads = localStorage.getItem('website_leads');
  if (storedLeads) {
    leads = JSON.parse(storedLeads);
    // Auto-merge any new seed leads added to data.js
    let updated = false;
    INITIAL_LEADS.forEach(seedLead => {
      if (!leads.some(l => l.id === seedLead.id)) {
        leads.push(seedLead);
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem('website_leads', JSON.stringify(leads));
    }
  } else {
    leads = INITIAL_LEADS;
    localStorage.setItem('website_leads', JSON.stringify(leads));
  }
  
  // Render filters and statistics
  renderStats();
  renderLeads();
  setupEventListeners();
}

// Recalculate and update dashboard metrics
function renderStats() {
  const total = leads.length;
  const contacted = leads.filter(l => l.status === 'Contacted').length;
  const demos = leads.filter(l => l.status === 'Demo Sent').length;
  const won = leads.filter(l => l.status === 'Closed - Won').length;
  
  // Calculate won revenue & active pipeline potential
  const totalWonRevenue = leads
    .filter(l => l.status === 'Closed - Won')
    .reduce((sum, l) => sum + (l.revenuePotential || 0), 0);
  
  // Update UI values
  statTotalLeads.textContent = total;
  statContactedLeads.textContent = contacted;
  statDemosSent.textContent = demos;
  statWonLeads.textContent = won;
  
  // Format revenue (Indian Rupee format)
  statRevenue.innerHTML = `<span class="currency">₹</span>${totalWonRevenue.toLocaleString('en-IN')}`;
}

// Generate the color variables dynamically for styling based on category
function getCategoryColor(type) {
  switch (type) {
    case 'Café': return 'var(--cat-cafe)';
    case 'Gym': return 'var(--cat-gym)';
    case 'Electrician': return 'var(--cat-electrician)';
    case 'Salon/Spa': return 'var(--cat-salon)';
    case 'Tailor/Boutique': return 'var(--cat-tailor)';
    case 'Dentist': return 'var(--cat-dentist)';
    case 'Adventure/Tour': return 'var(--cat-adventure)';
    case 'Real Estate': return 'var(--cat-realestate)';
    default: return 'var(--cat-other)';
  }
}

// Filter and Sort leads before rendering
function getFilteredAndSortedLeads() {
  let filtered = [...leads];
  
  // 1. Filter by Search Query
  const query = searchInput.value.toLowerCase().trim();
  if (query) {
    filtered = filtered.filter(l => 
      l.name.toLowerCase().includes(query) ||
      (l.location && l.location.toLowerCase().includes(query)) ||
      (l.phone && l.phone.toLowerCase().includes(query)) ||
      (l.notes && l.notes.toLowerCase().includes(query))
    );
  }
  
  // 2. Filter by Region
  const activeRegionChip = regionChips.querySelector('.filter-chip.active');
  const selectedRegion = activeRegionChip ? activeRegionChip.getAttribute('data-region') : 'All';
  if (selectedRegion !== 'All') {
    filtered = filtered.filter(l => l.region === selectedRegion);
  }
  
  // 3. Filter by Category
  const selectedCat = categoryFilter.value;
  if (selectedCat !== 'All') {
    filtered = filtered.filter(l => l.type === selectedCat);
  }
  
  // 4. Filter by Status
  const selectedStatus = statusFilter.value;
  if (selectedStatus !== 'All') {
    filtered = filtered.filter(l => l.status === selectedStatus);
  }
  
  // 5. Sort Leads
  const sortBy = sortBySelect.value;
  filtered.sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    } else if (sortBy === 'reviews') {
      return (b.reviewsCount || 0) - (a.reviewsCount || 0);
    } else if (sortBy === 'revenue') {
      return (b.revenuePotential || 0) - (a.revenuePotential || 0);
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });
  
  return filtered;
}

// Render the grid of leads
function renderLeads() {
  const list = getFilteredAndSortedLeads();
  leadsCountEl.textContent = `${list.length} prospect${list.length !== 1 ? 's' : ''}`;
  
  leadsGrid.innerHTML = '';
  
  if (list.length === 0) {
    leadsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🔍</div>
        <h3>No prospects match your search/filters</h3>
        <p style="margin-top: 4px;">Try loosening your filter metrics or add a custom lead.</p>
      </div>
    `;
    return;
  }
  
  list.forEach(lead => {
    const card = document.createElement('div');
    card.className = `lead-card ${selectedLeadId === lead.id ? 'active-selected' : ''}`;
    card.setAttribute('data-id', lead.id);
    card.setAttribute('data-status', lead.status);
    
    // Set custom CSS variable for category badge color
    card.style.setProperty('--cat-color', getCategoryColor(lead.type));
    
    // Status CSS Class mapping
    let statusClass = 'status-tocontact';
    if (lead.status === 'Contacted') statusClass = 'status-contacted';
    else if (lead.status === 'Demo Sent') statusClass = 'status-demo';
    else if (lead.status === 'Closed - Won') statusClass = 'status-won';
    else if (lead.status === 'Closed - Lost') statusClass = 'status-lost';
    else if (lead.status === 'Disqualified') statusClass = 'status-disq';
    
    // Display phone content
    const phoneDisplay = lead.phone ? lead.phone : 'No Phone on Maps';
    const phoneClass = lead.phone ? 'card-phone' : 'card-phone no-number';
    
    // Rating star layout
    const ratingDisplay = lead.rating ? `${lead.rating} ★` : 'No rating';
    
    card.innerHTML = `
      <div class="card-top">
        <div class="tags-row">
          <span class="tag tag-cat">${lead.type}</span>
          <span class="tag tag-loc">${lead.location}</span>
        </div>
        <span class="card-status-badge ${statusClass}">
          <span class="card-status-dot"></span>
          ${lead.status}
        </span>
      </div>
      <h3 class="card-name" title="${lead.name}">${lead.name}</h3>
      <div class="card-meta-row">
        <span class="card-rating">${ratingDisplay}</span>
        <span class="card-reviews">(${lead.reviewsCount || 0} reviews)</span>
        <span style="color: var(--text-muted)">•</span>
        <span>${lead.region}</span>
      </div>
      <div class="${phoneClass}">
        <span>📞</span> ${phoneDisplay}
      </div>
      <p class="card-notes">${lead.notes || 'No custom notes yet.'}</p>
      <div class="card-footer">
        <div class="card-rev-est">
          <div>Est. Revenue</div>
          <div class="card-rev-val">₹${(lead.revenuePotential || 0).toLocaleString('en-IN')}</div>
        </div>
        <button class="card-action-btn">
          Open Pitch Workspace &rarr;
        </button>
      </div>
    `;
    
    // Click Event
    card.addEventListener('click', (e) => {
      // Avoid firing card click when hitting specific button elements if nested (though currently fine)
      selectLead(lead.id);
    });
    
    leadsGrid.appendChild(card);
  });
}

// Select a lead and render the details sidebar panel
function selectLead(id) {
  selectedLeadId = id;
  const lead = leads.find(l => l.id === id);
  if (!lead) return;
  
  // Toggle selection state in CSS grid
  document.querySelectorAll('.lead-card').forEach(c => {
    c.classList.remove('active-selected');
  });
  const selectedCard = document.querySelector(`.lead-card[data-id="${id}"]`);
  if (selectedCard) selectedCard.classList.add('active-selected');
  
  // Fill sidebar detail view
  detailPanel.classList.remove('closed');
  document.getElementById('detail-overlay').classList.add('show');
  detailName.textContent = lead.name;
  detailName.title = lead.name;
  detailSub.innerHTML = `
    <span class="tag tag-cat" style="--cat-color: ${getCategoryColor(lead.type)}">${lead.type}</span>
    <span class="tag tag-loc">${lead.location}</span>
    <span style="color: var(--text-muted)">•</span>
    <span>${lead.region}</span>
  `;
  
  detailStatusSelect.value = lead.status;
  detailPhone.value = lead.phone || '';
  detailRating.value = lead.rating || '';
  detailReviews.value = lead.reviewsCount || 0;
  detailNotes.value = lead.notes || '';
  detailRevenue.value = lead.revenuePotential || 0;
  
  // Close mobile sidebar if open
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
  }

  // Render scripts
  renderScriptTemplate();
}

// Close Detail Panel
function closeDetailPanel() {
  detailPanel.classList.add('closed');
  document.getElementById('detail-overlay').classList.remove('show');
  selectedLeadId = null;
  document.querySelectorAll('.lead-card').forEach(c => {
    c.classList.remove('active-selected');
  });
}

// Helper to format WhatsApp number for API
function formatWhatsAppNumber(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = '91' + cleaned.substring(1);
  } else if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

// Process and compile templates dynamically
function renderScriptTemplate() {
  const lead = leads.find(l => l.id === selectedLeadId);
  if (!lead) return;
  
  let rawTemplate = OUTREACH_TEMPLATES[currentTab] || '';
  
  // Replace variables
  let compiled = rawTemplate
    .replace(/{name}/g, lead.name)
    .replace(/{source}/g, lead.source || 'Google Maps')
    .replace(/{rating}/g, lead.rating || '4.8')
    .replace(/{reviewsCount}/g, lead.reviewsCount || '100')
    .replace(/{location}/g, lead.location || 'Mumbai');
    
  scriptBox.textContent = compiled;
  
  // Configure action buttons
  const formattedPhone = formatWhatsAppNumber(lead.phone);
  if (formattedPhone) {
    whatsappBtn.style.display = 'flex';
    whatsappBtn.onclick = () => {
      const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(compiled)}`;
      window.open(url, '_blank');
      // Mark lead status as Contacted if it was "To contact"
      if (lead.status === 'To contact') {
        updateLeadStatus(lead.id, 'Contacted');
      }
    };
  } else {
    // Hide or disable whatsapp launcher if no number
    whatsappBtn.style.display = 'none';
  }
}

// Update single lead status
function updateLeadStatus(id, newStatus) {
  const leadIndex = leads.findIndex(l => l.id === id);
  if (leadIndex === -1) return;
  
  leads[leadIndex].status = newStatus;
  localStorage.setItem('website_leads', JSON.stringify(leads));
  
  // Refresh UI
  renderStats();
  renderLeads();
  
  // If editing current selection, keep sidebar dropdown value updated
  if (selectedLeadId === id) {
    detailStatusSelect.value = newStatus;
  }
  
  showToast(`Status updated to "${newStatus}"`);
}

// Show temporary toast notification
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// Set up UI Event listeners
function setupEventListeners() {
  // Search text input
  searchInput.addEventListener('input', () => {
    renderLeads();
  });
  
  // Region chips filter click
  regionChips.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-chip')) {
      regionChips.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      renderLeads();
    }
  });
  
  // Category dropdown change
  categoryFilter.addEventListener('change', () => {
    renderLeads();
  });
  
  // Status filter change
  statusFilter.addEventListener('change', () => {
    renderLeads();
  });
  
  // Sorting options change
  sortBySelect.addEventListener('change', () => {
    renderLeads();
  });
  
  // Sidebar Detail Panel field updates
  detailStatusSelect.addEventListener('change', (e) => {
    if (selectedLeadId) {
      updateLeadStatus(selectedLeadId, e.target.value);
    }
  });
  
  detailPhone.addEventListener('blur', (e) => {
    if (selectedLeadId) {
      const idx = leads.findIndex(l => l.id === selectedLeadId);
      leads[idx].phone = e.target.value;
      localStorage.setItem('website_leads', JSON.stringify(leads));
      renderLeads();
      renderScriptTemplate(); // Redo script launcher link
    }
  });
  
  detailRating.addEventListener('blur', (e) => {
    if (selectedLeadId) {
      const idx = leads.findIndex(l => l.id === selectedLeadId);
      leads[idx].rating = parseFloat(e.target.value) || 0;
      localStorage.setItem('website_leads', JSON.stringify(leads));
      renderLeads();
      renderScriptTemplate();
    }
  });
  
  detailReviews.addEventListener('blur', (e) => {
    if (selectedLeadId) {
      const idx = leads.findIndex(l => l.id === selectedLeadId);
      leads[idx].reviewsCount = parseInt(e.target.value) || 0;
      localStorage.setItem('website_leads', JSON.stringify(leads));
      renderLeads();
      renderScriptTemplate();
    }
  });
  
  detailRevenue.addEventListener('blur', (e) => {
    if (selectedLeadId) {
      const idx = leads.findIndex(l => l.id === selectedLeadId);
      leads[idx].revenuePotential = parseInt(e.target.value) || 0;
      localStorage.setItem('website_leads', JSON.stringify(leads));
      renderStats();
      renderLeads();
    }
  });
  
  detailNotes.addEventListener('input', (e) => {
    if (selectedLeadId) {
      const idx = leads.findIndex(l => l.id === selectedLeadId);
      leads[idx].notes = e.target.value;
      localStorage.setItem('website_leads', JSON.stringify(leads));
      // Render lead card notes snippet
      const cardNotesText = document.querySelector(`.lead-card[data-id="${selectedLeadId}"] .card-notes`);
      if (cardNotesText) cardNotesText.textContent = e.target.value || 'No custom notes yet.';
    }
  });
  
  // Scripts Workspace Tab switcher
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.getAttribute('data-tab');
      renderScriptTemplate();
    });
  });
  
  // Copy Script Workspace button
  copyScriptBtn.addEventListener('click', () => {
    const textToCopy = scriptBox.textContent;
    navigator.clipboard.writeText(textToCopy)
      .then(() => showToast('Pitch script copied to clipboard!'))
      .catch(err => console.error('Could not copy text: ', err));
  });
  
  // Add Lead Modal actions
  addLeadBtn.addEventListener('click', () => {
    addLeadModal.classList.add('open');
  });
  
  const closeModal = () => {
    addLeadModal.classList.remove('open');
    addLeadForm.reset();
  };
  
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);
  
  addLeadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newLead = {
      id: 'custom-' + Date.now(),
      name: document.getElementById('add-name').value,
      type: document.getElementById('add-type').value,
      location: document.getElementById('add-location').value,
      region: document.getElementById('add-region').value,
      rating: parseFloat(document.getElementById('add-rating').value) || 0,
      reviewsCount: parseInt(document.getElementById('add-reviews').value) || 0,
      phone: document.getElementById('add-phone').value || '',
      status: 'To contact',
      notes: document.getElementById('add-notes').value || '',
      source: 'Custom Entry',
      revenuePotential: parseInt(document.getElementById('add-revenue').value) || 10000
    };
    
    leads.push(newLead);
    localStorage.setItem('website_leads', JSON.stringify(leads));
    
    // Refresh GUI
    renderStats();
    renderLeads();
    closeModal();
    selectLead(newLead.id); // View the new lead immediately
    
    showToast('New lead successfully added!');
  });

  // Mobile UI Sidebar Toggle
  const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const closeSidebarMobile = document.getElementById('close-sidebar-mobile');
  const detailOverlay = document.getElementById('detail-overlay');

  if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      sidebarOverlay.classList.add('show');
    });
  }

  const closeSidebar = () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
  };

  if (closeSidebarMobile) {
    closeSidebarMobile.addEventListener('click', closeSidebar);
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  if (detailOverlay) {
    detailOverlay.addEventListener('click', () => {
      closeDetailPanel();
    });
  }
}

// Run Initialization on DOM load
document.addEventListener('DOMContentLoaded', init);
