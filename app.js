// ===== Campaign Configuration =====
const CAMPAIGN = {
  goal: 134900, // ₹1,34,900
  daysLeft: 30,
  storageKey: 'fundmyphone_data',

  // ──────────────────────────────────────────────────
  // 🔧 UPDATE THIS WITH YOUR REAL UPI ID
  // ──────────────────────────────────────────────────
  upiId: 'yourname@upi',          // e.g. 'sayan@okaxis', 'sayan@ybl', '9876543210@paytm'
  upiPayeeName: 'Sayan',          // Your name (shown in UPI apps)
  upiTransactionNote: 'FundMyPhone - iPhone 17 Crowdfunding',
};

// ===== State Management =====
function loadState() {
  try {
    const raw = localStorage.getItem(CAMPAIGN.storageKey);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load state:', e);
  }
  return getDefaultState();
}

function getDefaultState() {
  return {
    raised: 2350,
    backers: 8,
    supporters: [
      { name: 'Aarav M.', amount: 1000, message: 'Go get that iPhone! 🔥', time: '2 hours ago', color: '#3b82f6' },
      { name: 'Priya S.', amount: 500, message: 'Best of luck with the campaign!', time: '5 hours ago', color: '#8b5cf6' },
      { name: 'Rahul K.', amount: 100, message: 'Happy to help a fellow dev 💻', time: '1 day ago', color: '#06b6d4' },
      { name: 'Sneha D.', amount: 50, message: 'Small contribution, big dreams!', time: '1 day ago', color: '#10b981' },
      { name: 'Vikram P.', amount: 500, message: 'You deserve it! Keep creating.', time: '2 days ago', color: '#f59e0b' },
      { name: 'Ananya R.', amount: 100, message: 'Legend tier! Make it count 🎯', time: '3 days ago', color: '#f43f5e' },
      { name: 'Dev T.', amount: 50, message: 'Coffee on me ☕', time: '3 days ago', color: '#ec4899' },
      { name: 'Meera L.', amount: 50, message: 'Good luck! 🍀', time: '4 days ago', color: '#06b6d4' },
    ]
  };
}

function saveState(state) {
  try {
    localStorage.setItem(CAMPAIGN.storageKey, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state:', e);
  }
}

let state = loadState();

// ===== DOM Helpers =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ===== Format Currency =====
function formatCurrency(num) {
  return num.toLocaleString('en-IN');
}

// ===== HTML Escaping =====
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== Update UI =====
function updateUI() {
  const percent = Math.min(100, (state.raised / CAMPAIGN.goal) * 100);

  // Hero stats
  if ($('#statBackers')) $('#statBackers').textContent = state.backers;
  if ($('#statPercent')) $('#statPercent').textContent = Math.round(percent) + '%';
  if ($('#statDays')) $('#statDays').textContent = CAMPAIGN.daysLeft;

  // Progress section
  if ($('#raisedAmount')) $('#raisedAmount').textContent = formatCurrency(state.raised);
  if ($('#metaBackers')) $('#metaBackers').textContent = state.backers;
  if ($('#metaPercent')) $('#metaPercent').textContent = Math.round(percent) + '%';

  // Progress bar
  setTimeout(() => {
    if ($('#progressBar')) $('#progressBar').style.width = percent + '%';
  }, 300);

  // Supporters list
  renderSupporters();
}

// ===== Render Supporters =====
function renderSupporters() {
  const container = $('#supportersList');
  if (!container) return;

  container.innerHTML = state.supporters.map((s, i) => `
    <div class="supporter-card" style="animation: fadeSlideUp 0.5s ease-out ${i * 0.1}s both">
      <div class="supporter-avatar" style="background: ${s.color}">
        ${s.name.charAt(0)}
      </div>
      <div class="supporter-info">
        <div class="supporter-name">${escapeHTML(s.name)}</div>
        <div class="supporter-message">${escapeHTML(s.message)}</div>
      </div>
      <div class="supporter-amount">₹${formatCurrency(s.amount)}</div>
      <div class="supporter-time">${escapeHTML(s.time)}</div>
    </div>
  `).join('');
}


// =============================================
//  MULTI-STEP MODAL & UPI PAYMENT FLOW
// =============================================

let selectedAmount = null;
let currentStep = 1;
let pendingDonation = {};   // holds name, amount, message between steps

// ===== Step Navigation =====
function goToStep(step) {
  currentStep = step;
  $('#modalStep1').style.display = step === 1 ? 'block' : 'none';
  $('#modalStep2').style.display = step === 2 ? 'block' : 'none';
  $('#modalStep3').style.display = step === 3 ? 'block' : 'none';
}

// ===== Open Modal =====
function openModal(presetAmount) {
  const modal = $('#donationModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Reset to Step 1
  goToStep(1);
  selectedAmount = presetAmount || null;
  $('#customAmount').value = presetAmount || '';
  $('#donorName').value = '';
  $('#donorMessage').value = '';

  // Highlight preset
  $$('.amount-preset').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.amount) === presetAmount);
  });
}

// ===== Close Modal =====
function closeModal() {
  const modal = $('#donationModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
  // Reset to step 1 for next open
  setTimeout(() => goToStep(1), 300);
}

// Close on overlay click or Escape
document.addEventListener('click', (e) => {
  if (e.target.id === 'donationModal') closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ===== Amount Presets =====
$$('.amount-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedAmount = parseInt(btn.dataset.amount);
    $('#customAmount').value = selectedAmount;
    $$('.amount-preset').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

$('#customAmount')?.addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  selectedAmount = isNaN(val) ? null : val;
  $$('.amount-preset').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.amount) === val);
  });
});


// =============================================
//  STEP 1 → STEP 2: Go to Payment
// =============================================

function goToPaymentStep() {
  const amount = parseInt($('#customAmount').value);
  const name = $('#donorName').value.trim() || 'Anonymous';
  const message = $('#donorMessage').value.trim() || 'No message';

  if (!amount || amount < 1) {
    showToast('⚠️ Please enter a valid amount!');
    return;
  }

  // Save pending donation info
  pendingDonation = { amount, name, message };

  // Update payment step UI
  const formattedAmount = formatCurrency(amount);
  if ($('#payAmountDisplay')) $('#payAmountDisplay').textContent = '₹' + formattedAmount;
  if ($('#qrAmount'))         $('#qrAmount').textContent = formattedAmount;
  if ($('#upiIdAmount'))      $('#upiIdAmount').textContent = formattedAmount;

  // Set UPI ID display
  if ($('#upiIdDisplay')) $('#upiIdDisplay').textContent = CAMPAIGN.upiId;

  // Build UPI deep links
  buildUpiLinks(amount);

  // Switch to payment step
  goToStep(2);
  switchPayTab('qr'); // default to QR tab
}


// =============================================
//  UPI DEEP LINKS
// =============================================

function buildUpiLinks(amount) {
  const pa = encodeURIComponent(CAMPAIGN.upiId);
  const pn = encodeURIComponent(CAMPAIGN.upiPayeeName);
  const tn = encodeURIComponent(CAMPAIGN.upiTransactionNote);
  const am = amount.toFixed(2);
  const cu = 'INR';

  // Standard UPI intent URI (works with most apps)
  const upiUri = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}&tn=${tn}`;

  // Google Pay specific
  const gpayUri = `tez://upi/pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}&tn=${tn}`;

  // PhonePe specific
  const phonepeUri = `phonepe://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}&tn=${tn}`;

  // Paytm specific
  const paytmUri = `paytmmp://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}&tn=${tn}`;

  // Set href on link buttons
  if ($('#upiLinkGpay'))    $('#upiLinkGpay').href = gpayUri;
  if ($('#upiLinkPhonepe')) $('#upiLinkPhonepe').href = phonepeUri;
  if ($('#upiLinkPaytm'))   $('#upiLinkPaytm').href = paytmUri;
  if ($('#upiLinkGeneric')) $('#upiLinkGeneric').href = upiUri;
}


// =============================================
//  PAYMENT TABS
// =============================================

function switchPayTab(tabName) {
  // Update tab buttons
  $$('.payment-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Map tab name to content ID
  const tabMap = {
    'qr': 'tabQr',
    'upi-app': 'tabUpiApp',
    'upi-id': 'tabUpiId'
  };

  // Show/hide content
  $$('.payment-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  const targetContent = $('#' + tabMap[tabName]);
  if (targetContent) targetContent.classList.add('active');
}


// =============================================
//  COPY UPI ID TO CLIPBOARD
// =============================================

function copyUpiId() {
  const upiId = CAMPAIGN.upiId;

  navigator.clipboard.writeText(upiId).then(() => {
    const btn = $('#copyBtnText');
    const original = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.textContent = original; }, 2000);
    showToast('📋 UPI ID copied to clipboard!');
  }).catch(() => {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = upiId;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    const btn = $('#copyBtnText');
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.textContent = '📋 Copy UPI ID'; }, 2000);
    showToast('📋 UPI ID copied to clipboard!');
  });
}


// =============================================
//  STEP 2 → STEP 3: Confirm Payment
// =============================================

function confirmPayment() {
  const { amount, name, message } = pendingDonation;

  if (!amount) return;

  // Random avatar color
  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#ec4899'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  // Update state
  state.raised += amount;
  state.backers += 1;
  state.supporters.unshift({
    name, amount, message,
    time: 'Just now',
    color
  });

  // Persist
  saveState(state);

  // Fill confirmation screen
  if ($('#confirmAmount')) $('#confirmAmount').textContent = '₹' + formatCurrency(amount);
  if ($('#confirmName'))   $('#confirmName').textContent = escapeHTML(name);
  if ($('#confirmationMessage')) {
    $('#confirmationMessage').textContent = `Thank you, ${name}! Your ₹${formatCurrency(amount)} contribution has been recorded.`;
  }

  // Go to confirmation step
  goToStep(3);

  // Update main UI
  updateUI();

  // Show toast & confetti
  showToast(`🎉 Thank you, ${escapeHTML(name)}! ₹${formatCurrency(amount)} contributed!`);
  launchConfetti();
}


// =============================================
//  SUBMIT DONATION (kept for backwards compat)
// =============================================

function submitDonation() {
  goToPaymentStep();
}


// =============================================
//  TOAST NOTIFICATION
// =============================================

function showToast(msg) {
  const toast = $('#toast');
  if (!toast) return;
  $('#toastMessage').innerHTML = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 4000);
}


// =============================================
//  CONFETTI EFFECT
// =============================================

function launchConfetti() {
  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];
  const count = 80;

  for (let i = 0; i < count; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      width: ${Math.random() * 8 + 4}px;
      height: ${Math.random() * 8 + 4}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      pointer-events: none;
      z-index: 3000;
      animation: confettiFall ${Math.random() * 2 + 1.5}s ease-out forwards;
      transform: translate(${(Math.random() - 0.5) * 600}px, ${(Math.random() - 0.5) * 600}px) rotate(${Math.random() * 360}deg);
    `;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 3500);
  }

  // Inject confetti keyframe if not already present
  if (!document.getElementById('confetti-style')) {
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = `
      @keyframes confettiFall {
        0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
        100% { opacity: 0; transform: translate(var(--tx, 200px), var(--ty, 400px)) rotate(720deg) scale(0); }
      }
    `;
    document.head.appendChild(style);
  }
}


// =============================================
//  NAVBAR SCROLL EFFECT
// =============================================

window.addEventListener('scroll', () => {
  const navbar = $('#navbar');
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }
});


// =============================================
//  SCROLL REVEAL
// =============================================

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  $$('.reveal').forEach(el => observer.observe(el));
}


// =============================================
//  COUNTER ANIMATION
// =============================================

function animateCounters() {
  animateValue('#statBackers', 0, state.backers, 1500);
  animateValue('#raisedAmount', 0, state.raised, 2000, true);
  animateValue('#metaBackers', 0, state.backers, 1500);

  const percent = Math.min(100, (state.raised / CAMPAIGN.goal) * 100);
  setTimeout(() => {
    const pctStr = Math.round(percent) + '%';
    if ($('#statPercent')) $('#statPercent').textContent = pctStr;
    if ($('#metaPercent')) $('#metaPercent').textContent = pctStr;
  }, 2000);
}

function animateValue(selector, start, end, duration, isCurrency = false) {
  const el = $(selector);
  if (!el) return;

  const range = end - start;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + range * eased);

    el.textContent = isCurrency ? formatCurrency(current) : current;

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}


// =============================================
//  MOBILE NAV TOGGLE
// =============================================

$('#navToggle')?.addEventListener('click', () => {
  const links = $('#navLinks');
  if (links) {
    const isVisible = links.style.display === 'flex';
    links.style.display = isVisible ? 'none' : 'flex';
    links.style.flexDirection = 'column';
    links.style.position = 'absolute';
    links.style.top = '100%';
    links.style.left = '0';
    links.style.right = '0';
    links.style.background = 'rgba(6, 8, 15, 0.95)';
    links.style.padding = '24px';
    links.style.gap = '16px';
    links.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
  }
});


// =============================================
//  INITIALIZE
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  updateUI();
  initReveal();
  animateCounters();
});
