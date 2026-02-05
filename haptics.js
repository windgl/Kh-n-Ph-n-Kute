/* ============================================
   HAPTICS.JS - VIBRATION FEEDBACK SYSTEM
   ============================================
   Version 3.0 - Tactile Feedback
   - Piano key vibration
   - Gift box vibration
   - Button vibration
   - Mobile-only feature
   - Battery-friendly
   ============================================ */

// ============================================
// CONFIGURATION
// ============================================

const HAPTIC_CONFIG = {
  // Enable/disable
  enabled: true,
  
  // Vibration patterns (in milliseconds)
  patterns: {
    light: 10,
    medium: 20,
    strong: 50,
    double: [10, 50, 10],
    success: [20, 50, 20, 50, 20],
    error: [50, 100, 50],
    pulse: [10, 20, 10, 20, 10]
  },
  
  // Context-specific durations
  piano: {
    white: 10,    // White key press
    black: 15,    // Black key press (slightly stronger)
    chord: 20     // Multiple keys
  },
  
  gift: {
    open: 50,     // Opening gift box
    confetti: 20  // Confetti burst
  },
  
  button: {
    click: 10,
    submit: 30,
    navigation: 15
  },
  
  interaction: {
    hover: 5,
    drag: 8,
    drop: 15
  },
  
  // Safety limits
  maxDuration: 200,
  minInterval: 50, // Minimum time between vibrations
  
  // Battery saving
  reducedMotion: false, // Respect system preferences
  lowBattery: false     // Auto-detect low battery
};

// ============================================
// DEVICE DETECTION
// ============================================

const DEVICE_INFO = {
  isSupported: 'vibrate' in navigator,
  isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
  isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
  isAndroid: /Android/i.test(navigator.userAgent),
  hasHaptics: false
};

// Check for Haptic Feedback API (iOS)
if ('vibrate' in navigator) {
  DEVICE_INFO.hasHaptics = true;
}

// ============================================
// HAPTIC CONTROLLER
// ============================================

class HapticController {
  constructor() {
    this.isEnabled = HAPTIC_CONFIG.enabled && DEVICE_INFO.hasHaptics;
    this.lastVibration = 0;
    this.vibrationQueue = [];
    this.isVibrating = false;
  }

  init() {
    if (!DEVICE_INFO.isSupported) {
      console.warn('⚠️ Vibration API not supported');
      this.isEnabled = false;
      return false;
    }

    if (!DEVICE_INFO.isMobile) {
      console.log('ℹ️ Haptics disabled - not a mobile device');
      this.isEnabled = false;
      return false;
    }

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      HAPTIC_CONFIG.reducedMotion = true;
      console.log('ℹ️ Reduced motion detected - haptics adjusted');
    }

    // Monitor battery level
    this.monitorBattery();

    console.log('✅ Haptic controller initialized');
    console.log('📱 Device:', DEVICE_INFO.isIOS ? 'iOS' : 'Android');
    return true;
  }

  // ============================================
  // CORE VIBRATION METHODS
  // ============================================

  vibrate(duration) {
    if (!this.canVibrate()) {
      return false;
    }

    // Validate duration
    if (typeof duration === 'number') {
      duration = Math.min(duration, HAPTIC_CONFIG.maxDuration);
    }

    // Check minimum interval
    const now = Date.now();
    if (now - this.lastVibration < HAPTIC_CONFIG.minInterval) {
      return false;
    }

    // Execute vibration
    try {
      navigator.vibrate(duration);
      this.lastVibration = now;
      return true;
    } catch (error) {
      console.error('Vibration error:', error);
      return false;
    }
  }

  vibratePattern(pattern) {
    if (!this.canVibrate()) {
      return false;
    }

    if (!Array.isArray(pattern)) {
      return this.vibrate(pattern);
    }

    try {
      navigator.vibrate(pattern);
      this.lastVibration = Date.now();
      return true;
    } catch (error) {
      console.error('Pattern vibration error:', error);
      return false;
    }
  }

  // ============================================
  // PRESET HAPTIC PATTERNS
  // ============================================

  light() {
    return this.vibrate(HAPTIC_CONFIG.patterns.light);
  }

  medium() {
    return this.vibrate(HAPTIC_CONFIG.patterns.medium);
  }

  strong() {
    return this.vibrate(HAPTIC_CONFIG.patterns.strong);
  }

  double() {
    return this.vibratePattern(HAPTIC_CONFIG.patterns.double);
  }

  success() {
    return this.vibratePattern(HAPTIC_CONFIG.patterns.success);
  }

  error() {
    return this.vibratePattern(HAPTIC_CONFIG.patterns.error);
  }

  pulse() {
    return this.vibratePattern(HAPTIC_CONFIG.patterns.pulse);
  }

  // ============================================
  // CONTEXT-SPECIFIC HAPTICS
  // ============================================

  // Piano interactions
  pianoKeyPress(isBlack = false) {
    const duration = isBlack ? 
      HAPTIC_CONFIG.piano.black : 
      HAPTIC_CONFIG.piano.white;
    return this.vibrate(duration);
  }

  pianoChord() {
    return this.vibrate(HAPTIC_CONFIG.piano.chord);
  }

  // Gift interactions
  giftOpen() {
    return this.vibrate(HAPTIC_CONFIG.gift.open);
  }

  giftConfetti() {
    return this.vibrate(HAPTIC_CONFIG.gift.confetti);
  }

  // Button interactions
  buttonClick() {
    return this.vibrate(HAPTIC_CONFIG.button.click);
  }

  buttonSubmit() {
    return this.vibrate(HAPTIC_CONFIG.button.submit);
  }

  buttonNavigation() {
    return this.vibrate(HAPTIC_CONFIG.button.navigation);
  }

  // General interactions
  hover() {
    return this.vibrate(HAPTIC_CONFIG.interaction.hover);
  }

  drag() {
    return this.vibrate(HAPTIC_CONFIG.interaction.drag);
  }

  drop() {
    return this.vibrate(HAPTIC_CONFIG.interaction.drop);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  canVibrate() {
    if (!this.isEnabled) {
      return false;
    }

    if (HAPTIC_CONFIG.reducedMotion) {
      return false;
    }

    if (HAPTIC_CONFIG.lowBattery) {
      return false;
    }

    return true;
  }

  enable() {
    if (DEVICE_INFO.hasHaptics) {
      this.isEnabled = true;
      console.log('✅ Haptics enabled');
    }
  }

  disable() {
    this.isEnabled = false;
    navigator.vibrate(0); // Stop any ongoing vibration
    console.log('⏸️ Haptics disabled');
  }

  toggle() {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.isEnabled;
  }

  stop() {
    try {
      navigator.vibrate(0);
      return true;
    } catch (error) {
      console.error('Stop vibration error:', error);
      return false;
    }
  }

  // ============================================
  // BATTERY MONITORING
  // ============================================

  async monitorBattery() {
    if (!('getBattery' in navigator)) {
      return;
    }

    try {
      const battery = await navigator.getBattery();
      
      // Check initial level
      this.updateBatteryStatus(battery);
      
      // Monitor changes
      battery.addEventListener('levelchange', () => {
        this.updateBatteryStatus(battery);
      });
      
      battery.addEventListener('chargingchange', () => {
        this.updateBatteryStatus(battery);
      });
    } catch (error) {
      console.warn('Battery monitoring not available:', error);
    }
  }

  updateBatteryStatus(battery) {
    // Disable haptics if battery is low and not charging
    const isLowBattery = battery.level < 0.15 && !battery.charging;
    
    if (isLowBattery !== HAPTIC_CONFIG.lowBattery) {
      HAPTIC_CONFIG.lowBattery = isLowBattery;
      
      if (isLowBattery) {
        console.log('🔋 Low battery detected - haptics reduced');
      } else {
        console.log('🔋 Battery OK - haptics restored');
      }
    }
  }

  // ============================================
  // DIAGNOSTICS
  // ============================================

  test(duration = 50) {
    console.log('Testing vibration...');
    return this.vibrate(duration);
  }

  testAll() {
    console.log('Testing all haptic patterns...');
    
    setTimeout(() => {
      console.log('Light...');
      this.light();
    }, 500);
    
    setTimeout(() => {
      console.log('Medium...');
      this.medium();
    }, 1500);
    
    setTimeout(() => {
      console.log('Strong...');
      this.strong();
    }, 2500);
    
    setTimeout(() => {
      console.log('Double...');
      this.double();
    }, 3500);
    
    setTimeout(() => {
      console.log('Success...');
      this.success();
    }, 4500);
  }

  getStatus() {
    return {
      enabled: this.isEnabled,
      supported: DEVICE_INFO.isSupported,
      isMobile: DEVICE_INFO.isMobile,
      isIOS: DEVICE_INFO.isIOS,
      isAndroid: DEVICE_INFO.isAndroid,
      hasHaptics: DEVICE_INFO.hasHaptics,
      reducedMotion: HAPTIC_CONFIG.reducedMotion,
      lowBattery: HAPTIC_CONFIG.lowBattery,
      lastVibration: this.lastVibration
    };
  }
}

// ============================================
// GLOBAL INSTANCE
// ============================================

let hapticController;

function initHaptics() {
  if (hapticController) {
    console.warn('⚠️ Haptics already initialized');
    return hapticController;
  }

  hapticController = new HapticController();
  hapticController.init();
  return hapticController;
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHaptics);
} else {
  initHaptics();
}

// Global exports
window.hapticController = hapticController;
window.haptics = hapticController; // Shorthand

// Convenience functions
window.vibrate = (duration) => {
  if (hapticController) {
    hapticController.vibrate(duration);
  }
};

window.vibratePattern = (pattern) => {
  if (hapticController) {
    hapticController.vibratePattern(pattern);
  }
};

// Debug helpers
window.hapticsDebug = {
  status: () => hapticController?.getStatus(),
  test: (duration) => hapticController?.test(duration),
  testAll: () => hapticController?.testAll(),
  enable: () => hapticController?.enable(),
  disable: () => hapticController?.disable(),
  toggle: () => hapticController?.toggle(),
  config: () => HAPTIC_CONFIG
};

console.log('✨ Haptics script loaded');
