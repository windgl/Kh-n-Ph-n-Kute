/* ============================================
   PIANO SECTION - ENHANCED WITH PARTICLES & HAPTICS
   ============================================
   Version 3.0 - Upgraded Features:
   - Particle effects when pressing keys
   - Haptic feedback on mobile
   - Optimized performance
   - All existing features preserved
   ============================================ */

// ============================================
// 1. PIANO CONFIGURATION
// ============================================

const PIANO_CONFIG = {
  // Audio settings
  audioVolume: 0.7,
  audioPreload: true,
  
  // Interaction settings
  requiredKeysForUnlock: 3,
  minNoteDuration: 100,
  maxConcurrentNotes: 12,
  
  // Visual feedback
  activationDelay: 100,
  animationDuration: 300,
  glowDuration: 400,
  
  // 🆕 NEW: Particle settings per key type
  particles: {
    white: {
      count: 8,
      color: '#4A90E2',
      size: 5,
      lifetime: 1500
    },
    black: {
      count: 10,
      color: '#2ECC71',
      size: 6,
      lifetime: 1500
    }
  },
  
  // Accessibility
  keyboardMappings: {
    'a': 'C',
    'q': 'C#',
    's': 'D',
    'w': 'D#',
    'd': 'E',
    'f': 'F',
    'r': 'F#',
    'g': 'G',
    't': 'G#',
    'h': 'A',
    'y': 'A#',
    'j': 'B'
  },
  
  // Note to file mapping
  noteFiles: {
    'C': 'audio/piano-C.mp3',
    'C#': 'audio/piano-Cs.mp3',
    'D': 'audio/piano-D.mp3',
    'D#': 'audio/piano-Ds.mp3',
    'E': 'audio/piano-E.mp3',
    'F': 'audio/piano-F.mp3',
    'F#': 'audio/piano-Fs.mp3',
    'G': 'audio/piano-G.mp3',
    'G#': 'audio/piano-Gs.mp3',
    'A': 'audio/piano-A.mp3',
    'A#': 'audio/piano-As.mp3',
    'B': 'audio/piano-B.mp3'
  }
};

// ============================================
// 2. AUDIO ENGINE
// ============================================

class PianoAudioEngine {
  constructor() {
    this.audioElements = new Map();
    this.activeNotes = new Set();
    this.audioContext = null;
    this.isInitialized = false;
    this.preloadedAudios = new Map();
    this.playbackHistory = [];
  }

  // Initialize audio engine
  async init() {
    try {
      // Preload all audio files
      for (const [note, filePath] of Object.entries(PIANO_CONFIG.noteFiles)) {
        const audio = new Audio();
        audio.src = filePath;
        audio.preload = 'auto';
        audio.volume = PIANO_CONFIG.audioVolume;
        
        // Add event listeners
        audio.addEventListener('ended', () => this.onAudioEnded(note));
        audio.addEventListener('error', (e) => this.onAudioError(note, e));
        
        this.audioElements.set(note, audio);
      }

      // Try to create audio context for advanced features
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('🎵 Web Audio API initialized');
      } catch (error) {
        console.warn('⚠️ Web Audio API not available:', error.message);
      }

      this.isInitialized = true;
      console.log('✅ Audio engine initialized');
      return true;
    } catch (error) {
      console.error('❌ Audio engine initialization failed:', error);
      return false;
    }
  }

  // Play note
  async playNote(note, options = {}) {
    const {
      volume = PIANO_CONFIG.audioVolume,
      startTime = 0,
      duration = null
    } = options;

    if (!this.isInitialized) {
      console.warn('⚠️ Audio engine not initialized');
      return false;
    }

    if (this.activeNotes.size >= PIANO_CONFIG.maxConcurrentNotes) {
      console.warn('⚠️ Maximum concurrent notes reached');
      return false;
    }

    try {
      const audio = this.audioElements.get(note);
      if (!audio) {
        console.error(`Note not found: ${note}`);
        return false;
      }

      // Set up audio
      audio.currentTime = startTime;
      audio.volume = Math.max(0, Math.min(1, volume));
      
      // Track playback
      this.activeNotes.add(note);
      this.playbackHistory.push({
        note,
        timestamp: Date.now(),
        volume,
        duration: duration || audio.duration
      });

      // Play audio
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise.catch(error => {
          console.warn(`Play error for ${note}:`, error.message);
          this.activeNotes.delete(note);
        });
      }

      return true;
    } catch (error) {
      console.error(`Error playing note ${note}:`, error);
      this.activeNotes.delete(note);
      return false;
    }
  }

  // Stop note
  stopNote(note) {
    const audio = this.audioElements.get(note);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      this.activeNotes.delete(note);
      return true;
    }
    return false;
  }

  // Stop all notes
  stopAll() {
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.activeNotes.clear();
  }

  // Set volume
  setVolume(volume) {
    const vol = Math.max(0, Math.min(1, volume));
    this.audioElements.forEach(audio => {
      audio.volume = vol;
    });
    return vol;
  }

  // Audio ended callback
  onAudioEnded(note) {
    this.activeNotes.delete(note);
  }

  // Audio error callback
  onAudioError(note, error) {
    console.error(`Audio error for note ${note}:`, error);
    this.activeNotes.delete(note);
  }

  // Resume audio context
  resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        console.log('🎵 Audio context resumed');
      });
    }
  }
}

// ============================================
// 3. PIANO STATE MANAGER
// ============================================

class PianoStateManager {
  constructor() {
    this.state = {
      isInitialized: false,
      isUnlocked: false,
      keysPressed: 0,
      uniqueKeys: new Set(),
      totalNotesPlayed: 0,
      activeKeys: new Set(),
      isAnimating: false,
      sessionStart: Date.now(),
      lastNoteTime: null
    };
    
    this.listeners = new Map();
  }

  // Get state
  getState() {
    return {
      ...this.state,
      uniqueKeys: Array.from(this.state.uniqueKeys),
      activeKeys: Array.from(this.state.activeKeys)
    };
  }

  // Update state
  setState(updates) {
    const previousState = { ...this.state };
    
    try {
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'uniqueKeys' || key === 'activeKeys') {
          if (Array.isArray(value)) {
            this.state[key] = new Set(value);
          } else {
            this.state[key] = value;
          }
        } else {
          this.state[key] = value;
        }
      }

      this.notifyListeners(updates);
      return true;
    } catch (error) {
      console.error('State update error:', error);
      this.state = previousState;
      return false;
    }
  }

  // Subscribe to changes
  subscribe(callback) {
    const id = Math.random();
    this.listeners.set(id, callback);
    return () => this.listeners.delete(id);
  }

  // Notify listeners
  notifyListeners(changes) {
    this.listeners.forEach(callback => {
      try {
        callback(changes, this.getState());
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  // Get progress
  getProgress() {
    const required = PIANO_CONFIG.requiredKeysForUnlock;
    const pressed = this.state.uniqueKeys.size;
    return {
      pressed,
      required,
      percentage: (pressed / required) * 100,
      isComplete: pressed >= required
    };
  }

  // Reset state
  reset() {
    this.state = {
      isInitialized: false,
      isUnlocked: false,
      keysPressed: 0,
      uniqueKeys: new Set(),
      totalNotesPlayed: 0,
      activeKeys: new Set(),
      isAnimating: false,
      sessionStart: Date.now(),
      lastNoteTime: null
    };
  }
}

// ============================================
// 4. PIANO KEY HANDLER (WITH PARTICLES & HAPTICS)
// ============================================

class PianoKeyHandler {
  constructor(audioEngine, stateManager) {
    this.audioEngine = audioEngine;
    this.stateManager = stateManager;
    this.keyElements = new Map();
    this.touchIdentifiers = new Map();
  }

  // Initialize key handlers
  init() {
    const keys = document.querySelectorAll('.piano-key');
    
    keys.forEach(keyElement => {
      const note = keyElement.dataset.note;
      if (!note) return;

      this.keyElements.set(note, keyElement);

      // Mouse events
      keyElement.addEventListener('mousedown', (e) => this.handleKeyDown(e, note));
      keyElement.addEventListener('mouseup', (e) => this.handleKeyUp(e, note));
      keyElement.addEventListener('mouseleave', (e) => this.handleKeyUp(e, note));
      keyElement.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, note));

      // Touch events
      keyElement.addEventListener('touchstart', (e) => this.handleTouchStart(e, note), false);
      keyElement.addEventListener('touchend', (e) => this.handleTouchEnd(e, note), false);
      keyElement.addEventListener('touchmove', (e) => this.handleTouchMove(e, note), false);

      // Keyboard events
      keyElement.addEventListener('keydown', (e) => this.handleKeyboardDown(e, note));
      keyElement.addEventListener('keyup', (e) => this.handleKeyboardUp(e, note));

      // Accessibility
      keyElement.setAttribute('role', 'button');
      keyElement.setAttribute('tabindex', '0');
      keyElement.setAttribute('aria-label', `Phím ${note}`);
    });

    // Global keyboard support
    document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));

    console.log('✅ Piano keys initialized with particles & haptics');
  }

  // Handle key down
  async handleKeyDown(e, note) {
    e.preventDefault();
    
    if (this.stateManager.state.activeKeys.has(note)) {
      return;
    }

    await this.activateKey(note);
  }

  // Handle key up
  handleKeyUp(e, note) {
    e.preventDefault();
    this.deactivateKey(note);
  }

  // Handle mouse enter (for slide effect)
  handleMouseEnter(e, note) {
    if (e.buttons === 1) {
      this.handleKeyDown(e, note);
    }
  }

  // Handle touch start
  handleTouchStart(e, note) {
    e.preventDefault();
    
    const touch = e.touches[0];
    this.touchIdentifiers.set(note, touch.identifier);
    this.activateKey(note);
  }

  // Handle touch end
  handleTouchEnd(e, note) {
    e.preventDefault();
    
    if (this.touchIdentifiers.has(note)) {
      this.touchIdentifiers.delete(note);
    }
    this.deactivateKey(note);
  }

  // Handle touch move
  handleTouchMove(e, note) {
    e.preventDefault();
  }

  // Handle keyboard down
  handleKeyboardDown(e, note) {
    if (e.repeat) return;
    this.activateKey(note);
  }

  // Handle keyboard up
  handleKeyboardUp(e, note) {
    this.deactivateKey(note);
  }

  // Handle global keyboard
  handleGlobalKeydown(e) {
    const note = PIANO_CONFIG.keyboardMappings[e.key.toLowerCase()];
    if (note) {
      e.preventDefault();
      this.activateKey(note);
    }
  }

  // 🆕 UPGRADED: Activate key with particles & haptics
  async activateKey(note) {
    const keyElement = this.keyElements.get(note);
    if (!keyElement) return;

    // Add to active keys
    const previousActiveKeys = new Set(this.stateManager.state.activeKeys);
    const newActiveKeys = new Set(previousActiveKeys);
    newActiveKeys.add(note);

    this.stateManager.setState({
      activeKeys: newActiveKeys,
      keysPressed: this.stateManager.state.keysPressed + 1,
      lastNoteTime: Date.now()
    });

    // Add unique key
    if (!this.stateManager.state.uniqueKeys.has(note)) {
      const newUniqueKeys = new Set(this.stateManager.state.uniqueKeys);
      newUniqueKeys.add(note);
      
      this.stateManager.setState({
        uniqueKeys: newUniqueKeys,
        totalNotesPlayed: this.stateManager.state.totalNotesPlayed + 1
      });
    }

    // Visual feedback
    keyElement.classList.add('active');
    
    // 🆕 NEW: Spawn particles when key pressed
    if (window.particleEngine) {
      const rect = keyElement.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      const isBlack = keyElement.classList.contains('black');
      const particleConfig = isBlack ? PIANO_CONFIG.particles.black : PIANO_CONFIG.particles.white;
      
      window.particleEngine.spawnBurst(x, y, particleConfig.count, {
        color: particleConfig.color,
        size: particleConfig.size,
        lifetime: particleConfig.lifetime
      });
    }
    
    // 🆕 NEW: Haptic feedback
    if (window.hapticController) {
      const isBlack = keyElement.classList.contains('black');
      window.hapticController.pianoKeyPress(isBlack);
    }
    
    // 🆕 NEW: Create ripple effect
    if (window.createRipple) {
      const rect = keyElement.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const color = keyElement.classList.contains('black') ? 'green' : 'blue';
      window.createRipple(x, y, color);
    }
    
    // Play sound
    await this.audioEngine.playNote(note);

    // Play click sound
    if (window.playClickSound) {
      window.playClickSound();
    }

    // Update progress
    this.updateProgress();

    // Check if unlocked
    const progress = this.stateManager.getProgress();
    if (!this.stateManager.state.isUnlocked && progress.isComplete) {
      this.unlockPiano();
    }
  }

  // Deactivate key
  deactivateKey(note) {
    const keyElement = this.keyElements.get(note);
    if (!keyElement) return;

    const activeKeys = new Set(this.stateManager.state.activeKeys);
    activeKeys.delete(note);
    this.stateManager.setState({ activeKeys });

    // Remove visual feedback after animation
    setTimeout(() => {
      keyElement.classList.remove('active');
    }, PIANO_CONFIG.animationDuration);
  }

  // Update progress display
  updateProgress() {
    const progressText = document.getElementById('pianoProgress');
    if (!progressText) return;

    const progress = this.stateManager.getProgress();
    const remaining = progress.required - progress.pressed;

    if (this.stateManager.state.isUnlocked) {
      progressText.textContent = '✨ Chúc bạn một ngày thật vui vẻ nhé! ✨';
    } else if (remaining > 0) {
      progressText.textContent = `🚗 Bíp Bíp 🚗`;
    } else {
      progressText.textContent = '✨ Chúc bạn một ngày thật vui vẻ nhé! ✨';
    }
  }

  // Unlock piano
  unlockPiano() {
    this.stateManager.setState({ isUnlocked: true });

    const button = document.getElementById('btnPianoNext');
    if (button) {
      button.disabled = false;
      button.style.cursor = 'pointer';
      button.style.opacity = '1';
      button.classList.add('animate-glow');
    }

    // 🆕 NEW: Unlock haptic + particles celebration
    if (window.hapticController) {
      window.hapticController.success();
    }
    
    if (window.particleEngine) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      window.particleEngine.spawnExplosion(centerX, centerY, 30, {
        speed: 5
      });
    }

    // Play unlock sound
    if (window.playUnlockSound) {
      window.playUnlockSound();
    }

    console.log('✅ Piano unlocked!');
  }
}

// ============================================
// 5. PIANO NEXT BUTTON
// ============================================

class PianoNextButton {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.button = null;
  }

  // Initialize button
  init() {
    this.button = document.getElementById('btnPianoNext');
    
    if (!this.button) {
      console.warn('⚠️ Next button not found');
      return false;
    }

    // Initially disabled
    this.button.disabled = true;
    this.button.style.cursor = 'not-allowed';
    this.button.style.opacity = '0.5';

    // Click handler
    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      
      // 🆕 NEW: Haptic on navigation
      if (window.hapticController) {
        window.hapticController.buttonNavigation();
      }
      
      if (this.stateManager.state.isUnlocked && window.transitionToSection) {
        window.transitionToSection('gift');
      }
    });

    // Keyboard support
    this.button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.button.click();
      }
    });

    console.log('✅ Next button initialized');
    return true;
  }
}

// ============================================
// 6. PIANO CONTROLLER
// ============================================

class PianoController {
  constructor() {
    this.audioEngine = new PianoAudioEngine();
    this.stateManager = new PianoStateManager();
    this.keyHandler = new PianoKeyHandler(this.audioEngine, this.stateManager);
    this.nextButton = new PianoNextButton(this.stateManager);
    this.isInitialized = false;
  }

  // Initialize piano
  async init() {
    try {
      console.log('🎹 Initializing piano with v3.0 features...');

      // Initialize audio engine
      await this.audioEngine.init();

      // Mark as initialized
      this.stateManager.setState({ isInitialized: true });

      // Initialize key handlers
      this.keyHandler.init();

      // Initialize next button
      this.nextButton.init();

      // Play background music
      this.playBackgroundMusic();

      this.isInitialized = true;
      console.log('✅ Piano initialized with particles & haptics');
      return true;
    } catch (error) {
      console.error('❌ Piano initialization failed:', error);
      return false;
    }
  }

  // Play background music
  playBackgroundMusic() {
    const bgMusic = document.getElementById('backgroundMusic');
    if (bgMusic && bgMusic.paused) {
      bgMusic.volume = 0.3;
      bgMusic.play().catch(err => console.log('BG music error:', err));
    }
  }

  // Stop all sounds
  stopAll() {
    this.audioEngine.stopAll();
  }

  // Get state
  getState() {
    return this.stateManager.getState();
  }

  // Reset piano
  reset() {
    this.audioEngine.stopAll();
    this.stateManager.reset();
    
    // Remove active class from all keys
    document.querySelectorAll('.piano-key.active').forEach(key => {
      key.classList.remove('active');
    });

    console.log('✅ Piano reset');
  }

  // Get statistics
  getStatistics() {
    const state = this.stateManager.getState();
    const sessionDuration = Date.now() - state.sessionStart;

    return {
      totalNotesPlayed: state.totalNotesPlayed,
      uniqueKeysPressed: state.uniqueKeys.length,
      sessionDuration,
      averageNotesPerSecond: state.totalNotesPlayed / (sessionDuration / 1000)
    };
  }
}

// ============================================
// 7. GLOBAL INSTANCE & EXPORTS
// ============================================

let pianoController;

function initPianoSection() {
  console.log('🎵 Initializing piano section...');
  
  pianoController = new PianoController();
  pianoController.init().then(success => {
    if (success) {
      console.log('✅ Piano section ready (v3.0 with particles & haptics)');
    } else {
      console.error('❌ Piano section failed to initialize');
    }
  });
}

// Global exports
window.initPianoSection = initPianoSection;
window.pianoController = pianoController;

// Debug helpers
window.pianoDebug = {
  getState: () => pianoController?.getState(),
  getStats: () => pianoController?.getStatistics(),
  reset: () => pianoController?.reset(),
  stopAll: () => pianoController?.stopAll(),
  playNote: (note) => pianoController?.audioEngine.playNote(note),
  setVolume: (vol) => pianoController?.audioEngine.setVolume(vol)
};

console.log('✨ Piano script loaded (v3.0 - Particles & Haptics)!');
