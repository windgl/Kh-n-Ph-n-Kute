/* ============================================
   GIFT SECTION - ENHANCED JAVASCRIPT
   ============================================
   Version 2.0 - Premium Features:
   - Advanced animation system
   - Multiple trigger methods
   - Confetti particle engine
   - Countdown timer with visualization
   - State persistence
   - Particle effects
   - Memory optimization
   - Touch & keyboard support
   ============================================ */

// ============================================
// 1. GIFT CONFIGURATION
// ============================================

const GIFT_CONFIG = {
  // Animation settings
  autoOpenDelay: 5000,
  countdownDuration: 5,
  animationDuration: 600,
  
  // Visual settings
  confettiCount: 50,
  confettiDuration: 3500,
  particleSize: 10,
  
  // Interaction
  maxTriggerMethods: 7,
  
  // Colors for confetti
  confettiColors: {
    ocean: '#4A90E2',
    green: '#2ECC71',
    accent: '#A8E6CF',
    coral: '#FF7F50',
    pink: '#FF6B9D'
  }
};

// ============================================
// 2. GIFT STATE MANAGER
// ============================================

class GiftStateManager {
  constructor() {
    this.state = {
      isOpened: false,
      isAnimating: false,
      hasTriggered: false,
      autoOpenTimer: null,
      countdownInterval: null,
      countdown: GIFT_CONFIG.countdownDuration,
      triggerMethods: new Set(),
      openTime: null,
      sessionStart: Date.now()
    };
    
    this.observers = new Map();
    this.eventLog = [];
  }

  // Get state
  getState() {
    return {
      ...this.state,
      triggerMethods: Array.from(this.state.triggerMethods)
    };
  }

  // Update state
  setState(updates) {
    const oldState = { ...this.state };
    
    try {
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'triggerMethods' && Array.isArray(value)) {
          this.state[key] = new Set(value);
        } else {
          this.state[key] = value;
        }
      }

      // Log event
      this.eventLog.push({
        timestamp: Date.now(),
        changes: updates,
        oldState,
        newState: { ...this.state }
      });

      this.notifyObservers(updates);
      return true;
    } catch (error) {
      console.error('State update error:', error);
      this.state = oldState;
      return false;
    }
  }

  // Subscribe to changes
  subscribe(key, callback) {
    if (!this.observers.has(key)) {
      this.observers.set(key, []);
    }
    this.observers.get(key).push(callback);
    
    return () => {
      const callbacks = this.observers.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  // Notify observers
  notifyObservers(changes) {
    for (const [key, callbacks] of this.observers) {
      if (key in changes) {
        callbacks.forEach(callback => {
          try {
            callback(changes[key], this.getState());
          } catch (error) {
            console.error(`Observer error for ${key}:`, error);
          }
        });
      }
    }
  }

  // Log trigger
  logTrigger(method) {
    const newMethods = new Set(this.state.triggerMethods);
    newMethods.add(method);
    this.setState({ triggerMethods: newMethods });
    
    console.log(`📍 Trigger method: ${method}`);
  }

  // Get event log
  getEventLog() {
    return [...this.eventLog];
  }

  // Clear event log
  clearEventLog() {
    this.eventLog = [];
  }

  // Reset state
  reset() {
    this.clearCountdown();
    this.state = {
      isOpened: false,
      isAnimating: false,
      hasTriggered: false,
      autoOpenTimer: null,
      countdownInterval: null,
      countdown: GIFT_CONFIG.countdownDuration,
      triggerMethods: new Set(),
      openTime: null,
      sessionStart: Date.now()
    };
  }

  // Clear countdown
  clearCountdown() {
    if (this.state.autoOpenTimer) {
      clearTimeout(this.state.autoOpenTimer);
      this.state.autoOpenTimer = null;
    }
    if (this.state.countdownInterval) {
      clearInterval(this.state.countdownInterval);
      this.state.countdownInterval = null;
    }
  }
}

// ============================================
// 3. CONFETTI PARTICLE ENGINE
// ============================================

class ConfettiEngine {
  constructor() {
    this.container = null;
    this.particles = [];
    this.animationId = null;
  }

  // Initialize engine
  init() {
    this.container = document.getElementById('confettiContainer');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'confettiContainer';
      this.container.className = 'confetti-container';
      document.body.appendChild(this.container);
    }
    return true;
  }

  // Create confetti
  createConfetti() {
    this.init();

    const colors = Object.values(GIFT_CONFIG.confettiColors);
    const confettiCount = GIFT_CONFIG.confettiCount;

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.background = color;
      
      const startX = Math.random() * window.innerWidth;
      const startY = window.innerHeight / 2 - 100;
      const tx = (Math.random() - 0.5) * 500;
      const ty = (Math.random() - 0.5) * 800;
      const delay = Math.random() * 0.3;
      const duration = GIFT_CONFIG.confettiDuration + delay * 1000;

      confetti.style.left = startX + 'px';
      confetti.style.top = startY + 'px';
      confetti.style.setProperty('--tx', tx + 'px');
      confetti.style.setProperty('--ty', ty + 'px');
      confetti.style.animationDelay = delay + 's';
      confetti.style.animationDuration = (GIFT_CONFIG.confettiDuration / 1000) + 's';

      this.container.appendChild(confetti);
      this.particles.push({
        element: confetti,
        startTime: Date.now() + delay * 1000,
        duration
      });

      // Auto cleanup
      setTimeout(() => {
        if (confetti.parentElement) {
          confetti.remove();
        }
        this.particles = this.particles.filter(p => p.element !== confetti);
      }, duration);
    }

    console.log(`🎉 ${confettiCount} confetti created`);
  }

  // Clear all confetti
  clear() {
    this.particles.forEach(p => {
      if (p.element.parentElement) {
        p.element.remove();
      }
    });
    this.particles = [];
  }

  // Get particle count
  getParticleCount() {
    return this.particles.length;
  }
}

// ============================================
// 4. COUNTDOWN TIMER
// ============================================

class CountdownTimer {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.display = null;
  }

  // Start countdown
  start() {
    const container = this.getContainer();
    if (!container) return false;

    this.stateManager.setState({
      countdown: GIFT_CONFIG.countdownDuration
    });

    // Create display
    this.display = document.createElement('div');
    this.display.id = 'giftCountdown';
    this.display.className = 'gift-countdown';
    this.display.innerHTML = `
      <p class="countdown-text">Tự động mở trong <span class="countdown-number">${GIFT_CONFIG.countdownDuration}</span>s</p>
      <div class="countdown-bar">
        <div class="countdown-fill"></div>
      </div>
    `;

    // Find button parent
    const button = document.getElementById('btnOpenGift');
    if (button && button.parentElement) {
      button.parentElement.insertBefore(this.display, button.nextSibling);
    } else {
      container.appendChild(this.display);
    }

    // Countdown interval
    this.stateManager.state.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);

    // Auto-open timeout
    this.stateManager.state.autoOpenTimer = setTimeout(() => {
      this.onComplete();
    }, GIFT_CONFIG.autoOpenDelay);

    console.log('⏱️ Countdown started');
    return true;
  }

  // Update countdown display
  updateCountdown() {
    if (!this.display) return;

    this.stateManager.state.countdown--;
    
    const numberEl = this.display.querySelector('.countdown-number');
    if (numberEl) {
      numberEl.textContent = this.stateManager.state.countdown;
    }

    const fillEl = this.display.querySelector('.countdown-fill');
    if (fillEl) {
      const progress = ((GIFT_CONFIG.countdownDuration - this.stateManager.state.countdown) / GIFT_CONFIG.countdownDuration) * 100;
      fillEl.style.width = progress + '%';
    }

    console.log(`⏱️ Countdown: ${this.stateManager.state.countdown}s`);

    if (this.stateManager.state.countdown <= 0) {
      clearInterval(this.stateManager.state.countdownInterval);
      this.onComplete();
    }
  }

  // Countdown complete
  onComplete() {
    console.log('⏱️ Auto-opening gift...');
    if (window.openGift) {
      window.openGift('auto-timer');
    }
  }

  // Stop countdown
  stop() {
    if (this.stateManager.state.countdownInterval) {
      clearInterval(this.stateManager.state.countdownInterval);
      this.stateManager.state.countdownInterval = null;
    }
    
    if (this.display) {
      this.display.style.opacity = '0';
      setTimeout(() => {
        if (this.display && this.display.parentElement) {
          this.display.remove();
        }
      }, 300);
    }
  }

  // Get container
  getContainer() {
    return document.querySelector('.gift-box-container') || document.getElementById('section-gift');
  }
}

// ============================================
// 5. ANIMATION SYSTEM
// ============================================

class GiftAnimationSystem {
  constructor() {
    this.animations = new Map();
  }

  // Register animation
  registerAnimation(name, keyframes, options = {}) {
    this.animations.set(name, {
      keyframes,
      options: {
        duration: 600,
        easing: 'ease',
        ...options
      }
    });
  }

  // Play animation
  async playAnimation(element, animationName) {
    const animation = this.animations.get(animationName);
    if (!animation) {
      console.warn(`Animation not found: ${animationName}`);
      return false;
    }

    return new Promise(resolve => {
      const anim = element.animate(
        animation.keyframes,
        animation.options
      );
      
      anim.onfinish = () => resolve(true);
      anim.onerror = () => resolve(false);
    });
  }
}

// ============================================
// 6. GIFT CONTROLLER
// ============================================

class GiftController {
  constructor() {
    this.stateManager = new GiftStateManager();
    this.confettiEngine = new ConfettiEngine();
    this.countdownTimer = new CountdownTimer(this.stateManager);
    this.animationSystem = new GiftAnimationSystem();
    this.isInitialized = false;
  }

  // Initialize
  async init() {
    try {
      console.log('🎁 Initializing gift section...');

      // Initialize confetti engine
      this.confettiEngine.init();

      // Setup animations
      this.setupAnimations();

      // Setup event listeners
      this.setupEventListeners();

      // Start countdown
      this.countdownTimer.start();

      this.isInitialized = true;
      console.log('✅ Gift section initialized');
      return true;
    } catch (error) {
      console.error('❌ Gift initialization failed:', error);
      return false;
    }
  }

  // Setup animations
  setupAnimations() {
    // Box open animation
    this.animationSystem.registerAnimation('boxOpen', [
      { transform: 'rotateX(0deg) rotateY(0deg) scale(1)', opacity: 1 },
      { transform: 'rotateX(90deg) rotateY(-30deg) scale(0.8)', opacity: 0 }
    ], {
      duration: GIFT_CONFIG.animationDuration,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    });

    // Message reveal animation
    this.animationSystem.registerAnimation('messageReveal', [
      { opacity: 0, transform: 'translateY(20px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], {
      duration: 800,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    });

    // Button reveal animation
    this.animationSystem.registerAnimation('buttonReveal', [
      { opacity: 0, transform: 'scale(0.9) translateY(10px)' },
      { opacity: 1, transform: 'scale(1) translateY(0)' }
    ], {
      duration: 600,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    });
  }

  // Setup event listeners
  setupEventListeners() {
    const giftBox = document.getElementById('giftBox');
    const btnOpenGift = document.getElementById('btnOpenGift');

    if (giftBox) {
      // Click on gift box
      giftBox.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openGift('gift-box-click');
      });

      // Touch on gift box
      giftBox.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openGift('gift-box-touch');
      }, { passive: false });

      // Keyboard on gift box
      giftBox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openGift('gift-box-keyboard');
        }
      });
    }

    if (btnOpenGift) {
      // Button click
      btnOpenGift.addEventListener('click', (e) => {
        e.preventDefault();
        this.openGift('button-click');
      });

      // Button keyboard
      btnOpenGift.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openGift('button-keyboard');
        }
      });
    }

    // Global keyboard support
    document.addEventListener('keydown', (e) => {
      if (!this.stateManager.state.isOpened && !this.stateManager.state.isAnimating) {
        if (e.key === 'Enter' || e.key === ' ') {
          const activeTag = document.activeElement.tagName;
          if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
            e.preventDefault();
            this.openGift('global-keyboard');
          }
        }
      }
    });

    // Global click support
    document.addEventListener('click', (e) => {
      if (!this.stateManager.state.isOpened && !this.stateManager.state.isAnimating) {
        if (e.target !== btnOpenGift && !e.target.closest('button')) {
          this.openGift('screen-click');
        }
      }
    });

    // Setup next button
    const btnGiftNext = document.getElementById('btnGiftNext');
    if (btnGiftNext) {
      btnGiftNext.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.transitionToSection) {
          window.transitionToSection('message');
        }
      });
    }
  }

  // Open gift
  async openGift(source = 'unknown') {
    if (this.stateManager.state.isOpened || this.stateManager.state.isAnimating) {
      console.log('⏸️ Gift already opened or animating');
      return false;
    }

    console.log(`🎁 Opening gift (triggered by: ${source})`);

    this.stateManager.setState({
      isAnimating: true,
      isOpened: true,
      openTime: Date.now()
    });

    this.stateManager.logTrigger(source);

    // Clear timers
    this.countdownTimer.stop();

    const giftBox = document.getElementById('giftBox');
    const btnOpenGift = document.getElementById('btnOpenGift');
    const giftMessage = document.getElementById('giftMessage');
    const btnGiftNext = document.getElementById('btnGiftNext');

    // Hide button
    if (btnOpenGift) {
      btnOpenGift.style.opacity = '0';
      btnOpenGift.style.pointerEvents = 'none';
      setTimeout(() => {
        btnOpenGift.style.display = 'none';
      }, 300);
    }

    // Hide countdown
    const countdownEl = document.getElementById('giftCountdown');
    if (countdownEl) {
      countdownEl.style.opacity = '0';
      countdownEl.style.pointerEvents = 'none';
    }

    // Hide hint
    if (giftBox) {
      const hintEl = giftBox.querySelector('.gift-hint');
      if (hintEl) {
        hintEl.style.opacity = '0';
        hintEl.style.pointerEvents = 'none';
      }
    }

    // Play sound
if (window.playUnlockSound) {
  window.playUnlockSound();
}

// 🆕 NEW: Haptic feedback khi mở quà
if (window.hapticController) {
  window.hapticController.giftOpen();
}

    // Animate box
    if (giftBox) {
      giftBox.classList.add('opened');
      console.log('✨ Gift box animation started');
    }

    setTimeout(() => {
  this.confettiEngine.createConfetti();
  console.log('🎉 Confetti created');
  
  // 🆕 NEW: Extra haptic for confetti
  if (window.hapticController) {
    setTimeout(() => {
      window.hapticController.giftConfetti();
    }, 200);
  }
}, 300);

    // Reveal message
    setTimeout(() => {
      if (giftMessage) {
        giftMessage.classList.remove('hidden');
        giftMessage.classList.add('show-message');
        console.log('📝 Message revealed');
      }
    }, 700);

    // Show next button
    setTimeout(() => {
      if (btnGiftNext) {
        btnGiftNext.classList.remove('hidden');
        btnGiftNext.classList.add('show-button');
        console.log('✅ Continue button shown');
      }
      this.stateManager.setState({ isAnimating: false });
    }, 1000);

    return true;
  }

  // Get state
  getState() {
    return this.stateManager.getState();
  }

  // Reset
  reset() {
    this.countdownTimer.stop();
    this.confettiEngine.clear();
    this.stateManager.reset();
    console.log('✅ Gift reset');
  }

  // Get statistics
  getStatistics() {
    const state = this.stateManager.getState();
    const eventLog = this.stateManager.getEventLog();
    const sessionDuration = Date.now() - state.sessionStart;
    const openDuration = state.openTime ? Date.now() - state.openTime : 0;

    return {
      isOpened: state.isOpened,
      openTime: state.openTime,
      triggerMethod: Array.from(state.triggerMethods),
      sessionDuration,
      openDuration,
      eventCount: eventLog.length,
      eventLog
    };
  }
}

// ============================================
// 7. GLOBAL INSTANCE & EXPORTS
// ============================================

let giftController;

function initGiftSection() {
  console.log('🎁 Initializing gift section...');
  
  giftController = new GiftController();
  giftController.init().then(success => {
    if (success) {
      console.log('✅ Gift section ready');
    } else {
      console.error('❌ Gift section failed to initialize');
    }
  });
}

// Open gift function
function openGift(source = 'unknown') {
  if (giftController) {
    return giftController.openGift(source);
  }
  return false;
}

// Global exports
window.initGiftSection = initGiftSection;
window.openGift = openGift;
window.giftController = giftController;

// Debug helpers
window.giftDebug = {
  getState: () => giftController?.getState(),
  getStats: () => giftController?.getStatistics(),
  reset: () => giftController?.reset(),
  openGift: (source) => giftController?.openGift(source),
  createConfetti: () => giftController?.confettiEngine.createConfetti(),
  clearConfetti: () => giftController?.confettiEngine.clear()
};

console.log('✨ Gift script loaded!');
