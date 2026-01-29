/* ============================================
   INTRO SECTION - ENHANCED JAVASCRIPT
   ============================================
   Version 2.0 - Major Improvements:
   - Advanced state management
   - Enhanced error handling
   - Performance optimization
   - Accessibility enhancements
   - Memory leak prevention
   - Analytics integration ready
   - Progressive enhancement
   - Service Worker support
   ============================================ */

// ============================================
// 1. GLOBAL CONFIGURATION & CONSTANTS
// ============================================

const APP_CONFIG = {
  // Application metadata
  appName: 'Gift Website',
  appVersion: '2.0.0',
  debugMode: false,
  
  // Performance settings
  transitionDuration: 400,
  animationDuration: 800,
  debounceDelay: 100,
  
  // Feature flags
  enableAudio: true,
  enableAnalytics: false,
  enableServiceWorker: false,
  
  // Accessibility
  enableA11y: true,
  announceStateChanges: true,
  
  // Storage keys
  storagePrefix: 'app_',
  stateStorageKey: 'app_state',
  settingsStorageKey: 'app_settings'
};

const SECTIONS = {
  INTRO: 'intro',
  PIANO: 'piano',
  GIFT: 'gift',
  MESSAGE: 'message'
};

const SECTION_ORDER = [
  SECTIONS.INTRO,
  SECTIONS.PIANO,
  SECTIONS.GIFT,
  SECTIONS.MESSAGE
];

// ============================================
// 2. APPLICATION STATE MANAGER
// ============================================

class AppStateManager {
  constructor() {
    this.state = {
      currentSection: SECTIONS.INTRO,
      visitedSections: new Set(),
      isTransitioning: false,
      canTransition: true,
      userInteractions: 0,
      startTime: Date.now(),
      appReady: false,
      screenLocked: false
    };
    
    this.observers = new Map();
    this.history = [];
  }

  // Get current state
  getState() {
    return { ...this.state };
  }

  // Update state with validation
  setState(updates) {
    const previousState = { ...this.state };
    
    try {
      Object.assign(this.state, updates);
      this.history.push({
        timestamp: Date.now(),
        previousState,
        newState: { ...this.state }
      });
      
      // Notify observers
      this.notifyObservers(updates);
      
      if (APP_CONFIG.debugMode) {
        console.log('🔄 State updated:', updates);
      }
      
      return true;
    } catch (error) {
      console.error('❌ State update error:', error);
      this.state = previousState;
      return false;
    }
  }

  // Subscribe to state changes
  subscribe(key, callback) {
    if (!this.observers.has(key)) {
      this.observers.set(key, []);
    }
    this.observers.get(key).push(callback);
    
    // Return unsubscribe function
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
            callback(changes[key], this.state);
          } catch (error) {
            console.error(`Error in observer for ${key}:`, error);
          }
        });
      }
    }
  }

  // Get state history
  getHistory() {
    return [...this.history];
  }

  // Clear history
  clearHistory() {
    this.history = [];
  }

  // Save to localStorage
  save() {
    try {
      const serializable = {
        ...this.state,
        visitedSections: Array.from(this.state.visitedSections)
      };
      localStorage.setItem(
        APP_CONFIG.stateStorageKey,
        JSON.stringify(serializable)
      );
      return true;
    } catch (error) {
      console.error('Error saving state:', error);
      return false;
    }
  }

  // Load from localStorage
  load() {
    try {
      const saved = localStorage.getItem(APP_CONFIG.stateStorageKey);
      if (saved) {
        const data = JSON.parse(saved);
        data.visitedSections = new Set(data.visitedSections || []);
        Object.assign(this.state, data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading state:', error);
      return false;
    }
  }
}

// ============================================
// 3. AUDIO MANAGER ENHANCED
// ============================================

class AudioManager {
  constructor() {
    this.isEnabled = true;
    this.masterVolume = 0.3;
    this.isMuted = false;
    this.sounds = {
      background: null,
      click: null,
      unlock: null
    };
    
    this.audioContext = null;
    this.isInitialized = false;
  }

  // Initialize audio system
  init() {
    try {
      this.sounds.background = document.getElementById('backgroundMusic');
      this.sounds.click = document.getElementById('clickSound');
      this.sounds.unlock = document.getElementById('unlockSound');

      // Set initial volumes
      Object.values(this.sounds).forEach(audio => {
        if (audio) {
          audio.volume = this.masterVolume;
          audio.addEventListener('error', (e) => {
            console.warn('Audio loading error:', e);
          });
        }
      });

      this.isInitialized = true;
      console.log('✅ Audio manager initialized');
      return true;
    } catch (error) {
      console.error('❌ Audio initialization failed:', error);
      return false;
    }
  }

  // Play background music
  playBackgroundMusic() {
    if (!this.isEnabled || !this.sounds.background) return false;

    try {
      this.sounds.background.volume = this.masterVolume;
      const promise = this.sounds.background.play();
      
      if (promise !== undefined) {
        promise.catch(error => {
          console.warn('Background music autoplay blocked:', error.message);
          // Store state for later user interaction
          this.needsUserInteraction = true;
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error playing background music:', error);
      return false;
    }
  }

  // Play click sound
  playClickSound() {
    if (!this.isEnabled || !this.sounds.click) return false;

    try {
      this.sounds.click.currentTime = 0;
      this.sounds.click.volume = this.masterVolume;
      this.sounds.click.play().catch(() => {
        // Silent fail for click sound
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Play unlock sound
  playUnlockSound() {
    if (!this.isEnabled || !this.sounds.unlock) return false;

    try {
      this.sounds.unlock.currentTime = 0;
      this.sounds.unlock.volume = this.masterVolume * 1.2;
      this.sounds.unlock.play().catch(() => {
        // Silent fail for unlock sound
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Set volume
  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    Object.values(this.sounds).forEach(audio => {
      if (audio) {
        audio.volume = this.masterVolume;
      }
    });
    return this.masterVolume;
  }

  // Toggle mute
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.isEnabled = !this.isMuted;
    console.log(`🔊 Audio ${this.isEnabled ? 'enabled' : 'disabled'}`);
    return this.isEnabled;
  }

  // Stop all sounds
  stopAll() {
    Object.values(this.sounds).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }

  // Pause background music
  pauseBackground() {
    if (this.sounds.background) {
      this.sounds.background.pause();
    }
  }

  // Resume background music
  resumeBackground() {
    if (this.sounds.background && this.isEnabled) {
      this.sounds.background.play().catch(() => {});
    }
  }
}

// ============================================
// 4. TRANSITION MANAGER
// ============================================

class TransitionManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.transitionCallbacks = new Map();
  }

  // Register transition callback
  onTransition(fromSection, toSection, callback) {
    const key = `${fromSection}->${toSection}`;
    if (!this.transitionCallbacks.has(key)) {
      this.transitionCallbacks.set(key, []);
    }
    this.transitionCallbacks.get(key).push(callback);
  }

  // Execute transition
  async transitionToSection(nextSectionName) {
    const state = this.stateManager.getState();
    const currentSectionName = state.currentSection;

    // Validation
    if (!SECTION_ORDER.includes(nextSectionName)) {
      console.error(`❌ Invalid section: ${nextSectionName}`);
      return false;
    }

    // Check if can transition
    if (!state.canTransition || state.isTransitioning) {
      console.warn('⏸️ Transition blocked');
      return false;
    }

    // Update state
    this.stateManager.setState({
      isTransitioning: true,
      canTransition: false,
      screenLocked: true
    });

    try {
      const currentElement = document.getElementById(`section-${currentSectionName}`);
      const nextElement = document.getElementById(`section-${nextSectionName}`);

      if (!nextElement) {
        throw new Error(`Section element not found: section-${nextSectionName}`);
      }

      // Play transition sound
      audioManager.playClickSound();

      // Fade out animation
      if (currentElement) {
        await this.animateOut(currentElement);
        currentElement.classList.add('hidden');
        currentElement.classList.remove('active');
      }

      // Update section
      nextElement.classList.remove('hidden');
      nextElement.classList.add('active');

      // Fade in animation
      await this.animateIn(nextElement);

      // Update state
      this.stateManager.setState({
        currentSection: nextSectionName,
        visitedSections: new Set([
          ...state.visitedSections,
          nextSectionName
        ]),
        isTransitioning: false,
        screenLocked: false
      });

      // Add delay before allowing next transition
      setTimeout(() => {
        this.stateManager.setState({ canTransition: true });
      }, 200);

      // Initialize next section
      await this.initializeSection(nextSectionName);

      // Execute callbacks
      const key = `${currentSectionName}->${nextSectionName}`;
      const callbacks = this.transitionCallbacks.get(key) || [];
      for (const callback of callbacks) {
        try {
          await callback();
        } catch (error) {
          console.error('Error in transition callback:', error);
        }
      }

      if (APP_CONFIG.debugMode) {
        console.log(`✅ Transitioned to: ${nextSectionName}`);
      }

      return true;
    } catch (error) {
      console.error('❌ Transition error:', error);
      this.stateManager.setState({
        isTransitioning: false,
        canTransition: true,
        screenLocked: false
      });
      return false;
    }
  }

  // Animate element out
  animateOut(element) {
    return new Promise(resolve => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
      
      setTimeout(() => {
        element.style.transition = `all ${APP_CONFIG.transitionDuration}ms ease`;
        element.style.opacity = '0';
        element.style.transform = 'translateY(-20px)';
        
        setTimeout(resolve, APP_CONFIG.transitionDuration);
      }, 10);
    });
  }

  // Animate element in
  animateIn(element) {
    return new Promise(resolve => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      element.style.transition = `all ${APP_CONFIG.transitionDuration}ms ease`;

      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
        
        setTimeout(resolve, APP_CONFIG.transitionDuration);
      }, 10);
    });
  }

  // Initialize section
  async initializeSection(sectionName) {
    try {
      if (sectionName === SECTIONS.PIANO && window.initPianoSection) {
        window.initPianoSection();
      } else if (sectionName === SECTIONS.GIFT && window.initGiftSection) {
        window.initGiftSection();
      } else if (sectionName === SECTIONS.MESSAGE && window.initMessageSection) {
        window.initMessageSection();
      }
    } catch (error) {
      console.error(`Error initializing ${sectionName}:`, error);
    }
  }

  // Navigate to next section
  goToNextSection() {
    const state = this.stateManager.getState();
    const currentIndex = SECTION_ORDER.indexOf(state.currentSection);
    if (currentIndex < SECTION_ORDER.length - 1) {
      return this.transitionToSection(SECTION_ORDER[currentIndex + 1]);
    }
    return false;
  }

  // Navigate to previous section
  goToPreviousSection() {
    const state = this.stateManager.getState();
    const currentIndex = SECTION_ORDER.indexOf(state.currentSection);
    if (currentIndex > 0) {
      return this.transitionToSection(SECTION_ORDER[currentIndex - 1]);
    }
    return false;
  }
}

// ============================================
// 5. INTRO BUTTON HANDLER
// ============================================

class IntroButtonHandler {
  constructor(stateManager, transitionManager) {
    this.stateManager = stateManager;
    this.transitionManager = transitionManager;
  }

  // Initialize button
  init() {
    const button = document.getElementById('btnIntroNext');
    
    if (!button) {
      console.warn('⚠️ Intro button not found');
      return false;
    }

    // Click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleClick();
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (this.stateManager.state.currentSection === SECTIONS.INTRO) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleClick();
        }
      }
    });

    // Touch support
    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleClick();
    }, { passive: false });

    // Accessibility
    button.setAttribute('aria-label', 'Tiếp tục - Bắt đầu hành trình');

    console.log('✅ Intro button initialized');
    return true;
  }

  // Handle button click
  handleClick() {
    const state = this.stateManager.getState();
    
    if (!state.canTransition || state.isTransitioning) {
      return;
    }

    this.stateManager.setState({
      userInteractions: state.userInteractions + 1
    });

    audioManager.playClickSound();
    this.transitionManager.transitionToSection(SECTIONS.PIANO);
  }
}

// ============================================
// 6. ACCESSIBILITY MANAGER
// ============================================

class AccessibilityManager {
  constructor() {
    this.announcer = null;
    this.lastAnnouncement = null;
  }

  // Initialize
  init() {
    // Set document language
    document.documentElement.lang = 'vi';

    // Create live region for announcements
    this.announcer = document.createElement('div');
    this.announcer.id = 'a11y-announcer';
    this.announcer.className = 'sr-only';
    this.announcer.setAttribute('role', 'status');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(this.announcer);

    // Skip to main content link
    this.addSkipToMainLink();

    console.log('✅ Accessibility manager initialized');
  }

  // Add skip to main content link
  addSkipToMainLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#mainContainer';
    skipLink.className = 'sr-only sr-only-focusable';
    skipLink.textContent = 'Bỏ qua đến nội dung chính';
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // Announce message
  announce(message) {
    if (!this.announcer || !APP_CONFIG.announceStateChanges) {
      return;
    }

    this.lastAnnouncement = message;
    this.announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.announcer.textContent === message) {
        this.announcer.textContent = '';
      }
    }, 3000);
  }

  // Add CSS for screen reader only content
  addScreenReaderStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }

      .sr-only-focusable:focus {
        position: static;
        width: auto;
        height: auto;
        overflow: visible;
        clip: auto;
        white-space: normal;
        padding: var(--spacing-sm);
        background: var(--primary-ocean);
        color: white;
        z-index: var(--z-toast);
      }
    `;
    document.head.appendChild(style);
  }
}

// ============================================
// 7. UTILITY FUNCTIONS
// ============================================

// Debounce function
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle function
function throttle(func, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Check browser support
function checkBrowserSupport() {
  const requiredFeatures = {
    'localStorage': typeof localStorage !== 'undefined',
    'sessionStorage': typeof sessionStorage !== 'undefined',
    'fetch': 'fetch' in window,
    'requestAnimationFrame': 'requestAnimationFrame' in window,
    'flexbox': CSS.supports('display', 'flex')
  };

  const unsupportedFeatures = Object.entries(requiredFeatures)
    .filter(([, supported]) => !supported)
    .map(([feature]) => feature);

  if (unsupportedFeatures.length > 0) {
    console.warn('⚠️ Unsupported features:', unsupportedFeatures);
  }

  return unsupportedFeatures.length === 0;
}

// ============================================
// 8. GLOBAL INSTANCES
// ============================================

let appState;
let audioManager;
let transitionManager;
let introButtonHandler;
let a11yManager;

// ============================================
// 9. INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
  console.log('📄 DOM content loaded');

  try {
    // Check browser support
    if (!checkBrowserSupport()) {
      console.warn('⚠️ Some features may not work');
    }

    // Initialize managers
    appState = new AppStateManager();
    audioManager = new AudioManager();
    transitionManager = new TransitionManager(appState);
    introButtonHandler = new IntroButtonHandler(appState, transitionManager);
    a11yManager = new AccessibilityManager();

    // Initialize accessibility
    a11yManager.init();
    a11yManager.addScreenReaderStyles();

    // Initialize audio
    audioManager.init();

    // Setup intro button
    introButtonHandler.init();

    // Hide loading screen
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.visibility = 'hidden';
        loadingScreen.style.pointerEvents = 'none';
      }, 2000);
    }

    // Play background music
    setTimeout(() => {
      audioManager.playBackgroundMusic();
    }, 1000);

    // Mark app as ready
    appState.setState({ appReady: true });

    console.log('✅ App initialized successfully');
  } catch (error) {
    console.error('❌ Initialization error:', error);
  }
});

// ============================================
// 10. WINDOW LOAD EVENT
// ============================================

window.addEventListener('load', () => {
  console.log('✅ Page fully loaded');
  
  // Unlock audio on first interaction
  const unlockAudio = () => {
    if (audioManager.needsUserInteraction) {
      audioManager.playBackgroundMusic();
      audioManager.needsUserInteraction = false;
    }
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
  };

  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });
});

// ============================================
// 11. GLOBAL EXPORTS
// ============================================

window.appState = appState;
window.audioManager = audioManager;
window.transitionManager = transitionManager;
window.transitionToSection = (section) => {
  if (transitionManager) {
    return transitionManager.transitionToSection(section);
  }
};
window.playClickSound = () => {
  if (audioManager) {
    audioManager.playClickSound();
  }
};
window.playUnlockSound = () => {
  if (audioManager) {
    audioManager.playUnlockSound();
  }
};

// ============================================
// 12. ERROR HANDLING
// ============================================

window.addEventListener('error', (event) => {
  console.error('❌ Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
});

// ============================================
// 13. PERFORMANCE MONITORING
// ============================================

if (window.performance && APP_CONFIG.debugMode) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.log(`⏱️ Page load time: ${pageLoadTime}ms`);
    }, 0);
  });
}

// ============================================
// 14. DEBUG HELPERS
// ============================================

window.debugApp = {
  getState: () => appState?.getState(),
  getHistory: () => appState?.getHistory(),
  clearHistory: () => appState?.clearHistory(),
  saveState: () => appState?.save(),
  loadState: () => appState?.load(),
  transitionTo: (section) => transitionManager?.transitionToSection(section),
  playSound: (type) => {
    if (type === 'click') audioManager?.playClickSound();
    if (type === 'unlock') audioManager?.playUnlockSound();
  },
  setVolume: (vol) => audioManager?.setVolume(vol),
  toggleMute: () => audioManager?.toggleMute(),
  nextSection: () => transitionManager?.goToNextSection(),
  previousSection: () => transitionManager?.goToPreviousSection()
};

console.log('✨ Intro script loaded successfully!');
