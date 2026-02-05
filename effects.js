/* ============================================
   EFFECTS.JS - CURSOR & RIPPLE EFFECTS
   ============================================
   Version 3.0 - Interactive Effects System
   - Custom cursor with trail
   - Click ripple effects
   - Mouse parallax
   - Performance optimized
   ============================================ */

// ============================================
// CONFIGURATION
// ============================================

const EFFECTS_CONFIG = {
  cursor: {
    enabled: true,
    trailCount: 5,
    trailDelay: 50,
    smoothing: 0.15
  },
  ripple: {
    enabled: true,
    maxRipples: 10,
    duration: 600,
    size: 300
  },
  parallax: {
    enabled: true,
    strength: 20,
    smoothing: 0.1
  }
};

// Detect mobile
const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const IS_TOUCH_DEVICE = 'ontouchstart' in window;

// Disable effects on mobile for performance
if (IS_MOBILE || IS_TOUCH_DEVICE) {
  EFFECTS_CONFIG.cursor.enabled = false;
  EFFECTS_CONFIG.parallax.strength = 5; // Reduce parallax on mobile
}

// ============================================
// CUSTOM CURSOR SYSTEM
// ============================================

class CustomCursor {
  constructor() {
    this.cursor = null;
    this.cursorX = 0;
    this.cursorY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.trails = [];
    this.animationId = null;
    this.isActive = false;
  }

  init() {
    if (!EFFECTS_CONFIG.cursor.enabled) {
      document.body.classList.add('cursor-disabled');
      return false;
    }

    // Create cursor element
    this.cursor = document.createElement('div');
    this.cursor.id = 'customCursor';
    document.body.appendChild(this.cursor);

    // Setup event listeners
    this.setupEvents();

    // Start animation loop
    this.animate();

    console.log('✅ Custom cursor initialized');
    return true;
  }

  setupEvents() {
    // Mouse move
    document.addEventListener('mousemove', (e) => {
      this.targetX = e.clientX;
      this.targetY = e.clientY;
      
      if (!this.isActive) {
        this.isActive = true;
        this.cursor.classList.add('active');
      }

      // Create trail
      this.createTrail(e.clientX, e.clientY);
    });

    // Mouse down
    document.addEventListener('mousedown', () => {
      this.cursor.classList.add('clicking');
    });

    // Mouse up
    document.addEventListener('mouseup', () => {
      this.cursor.classList.remove('clicking');
    });

    // Hover over interactive elements
    const interactiveElements = 'a, button, .piano-key, .gift-box, input, textarea, .btn';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactiveElements)) {
        this.cursor.classList.add('hovering');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactiveElements)) {
        this.cursor.classList.remove('hovering');
      }
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
      this.isActive = false;
      this.cursor.classList.remove('active');
    });
  }

  createTrail(x, y) {
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    trail.style.left = x + 'px';
    trail.style.top = y + 'px';
    document.body.appendChild(trail);

    // Auto remove after animation
    setTimeout(() => {
      trail.remove();
    }, 500);

    // Limit trail elements
    this.trails.push(trail);
    if (this.trails.length > EFFECTS_CONFIG.cursor.trailCount) {
      const oldTrail = this.trails.shift();
      if (oldTrail.parentElement) {
        oldTrail.remove();
      }
    }
  }

  animate() {
    // Smooth cursor movement
    const smoothing = EFFECTS_CONFIG.cursor.smoothing;
    this.cursorX += (this.targetX - this.cursorX) * smoothing;
    this.cursorY += (this.targetY - this.cursorY) * smoothing;

    // Update cursor position
    if (this.cursor) {
      this.cursor.style.left = this.cursorX + 'px';
      this.cursor.style.top = this.cursorY + 'px';
    }

    // Continue animation
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.cursor) {
      this.cursor.remove();
    }
    this.trails.forEach(trail => trail.remove());
  }
}

// ============================================
// RIPPLE EFFECT SYSTEM
// ============================================

class RippleEffect {
  constructor() {
    this.container = null;
    this.ripples = [];
  }

  init() {
    if (!EFFECTS_CONFIG.ripple.enabled) {
      return false;
    }

    // Create ripple container
    this.container = document.createElement('div');
    this.container.className = 'ripple-container';
    document.body.appendChild(this.container);

    // Setup event listeners
    this.setupEvents();

    console.log('✅ Ripple effects initialized');
    return true;
  }

  setupEvents() {
    // Click ripple
    document.addEventListener('click', (e) => {
      this.createRipple(e.clientX, e.clientY);
    });

    // Touch ripple
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        this.createRipple(touch.clientX, touch.clientY);
      }
    }, { passive: true });
  }

  createRipple(x, y, color = 'blue') {
    if (!this.container) return;

    // Limit number of ripples
    if (this.ripples.length >= EFFECTS_CONFIG.ripple.maxRipples) {
      const oldRipple = this.ripples.shift();
      if (oldRipple.parentElement) {
        oldRipple.remove();
      }
    }

    const ripple = document.createElement('div');
    ripple.className = `ripple ${color}`;
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.transform = 'translate(-50%, -50%)';

    this.container.appendChild(ripple);
    this.ripples.push(ripple);

    // Auto remove
    setTimeout(() => {
      ripple.remove();
      this.ripples = this.ripples.filter(r => r !== ripple);
    }, EFFECTS_CONFIG.ripple.duration);
  }

  destroy() {
    if (this.container) {
      this.container.remove();
    }
    this.ripples = [];
  }
}

// ============================================
// PARALLAX SYSTEM
// ============================================

class ParallaxEffect {
  constructor() {
    this.mouseX = 0;
    this.mouseY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.layers = [];
    this.animationId = null;
  }

  init() {
    if (!EFFECTS_CONFIG.parallax.enabled) {
      return false;
    }

    // Find parallax layers
    this.layers = document.querySelectorAll('.parallax-layer');

    if (this.layers.length === 0) {
      console.warn('⚠️ No parallax layers found');
      return false;
    }

    // Setup events
    this.setupEvents();

    // Start animation
    this.animate();

    console.log(`✅ Parallax initialized with ${this.layers.length} layers`);
    return true;
  }

  setupEvents() {
    document.addEventListener('mousemove', (e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      this.mouseX = (e.clientX - centerX) / centerX;
      this.mouseY = (e.clientY - centerY) / centerY;
    });
  }

  animate() {
    // Smooth movement
    const smoothing = EFFECTS_CONFIG.parallax.smoothing;
    this.currentX += (this.mouseX - this.currentX) * smoothing;
    this.currentY += (this.mouseY - this.currentY) * smoothing;

    // Apply to layers with different speeds
    this.layers.forEach((layer, index) => {
      const speed = (index + 1) * 0.5;
      const strength = EFFECTS_CONFIG.parallax.strength;
      
      const x = this.currentX * strength * speed;
      const y = this.currentY * strength * speed;
      
      layer.style.transform = `translate(${x}px, ${y}px)`;
    });

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.layers.forEach(layer => {
      layer.style.transform = '';
    });
  }
}

// ============================================
// TILT EFFECT ON HOVER
// ============================================

class TiltEffect {
  constructor() {
    this.cards = [];
  }

  init() {
    // Find tilt cards
    this.cards = document.querySelectorAll('.tilt-card');

    if (this.cards.length === 0) {
      return false;
    }

    // Setup events for each card
    this.cards.forEach(card => {
      this.setupCard(card);
    });

    console.log(`✅ Tilt effect initialized on ${this.cards.length} cards`);
    return true;
  }

  setupCard(card) {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * 10;
      const rotateY = ((x - centerX) / centerX) * 10;
      
      card.style.setProperty('--tilt-x', `${-rotateX}deg`);
      card.style.setProperty('--tilt-y', `${rotateY}deg`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  }
}

// ============================================
// EFFECTS MANAGER
// ============================================

class EffectsManager {
  constructor() {
    this.cursor = new CustomCursor();
    this.ripple = new RippleEffect();
    this.parallax = new ParallaxEffect();
    this.tilt = new TiltEffect();
  }

  init() {
    console.log('🎨 Initializing effects system...');

    this.cursor.init();
    this.ripple.init();
    
    // Delay parallax init for performance
    setTimeout(() => {
      this.parallax.init();
      this.tilt.init();
    }, 500);

    console.log('✅ Effects system ready');
  }

  destroy() {
    this.cursor.destroy();
    this.ripple.destroy();
    this.parallax.destroy();
  }

  // Utility methods
  createRipple(x, y, color) {
    this.ripple.createRipple(x, y, color);
  }

  getConfig() {
    return EFFECTS_CONFIG;
  }
}

// ============================================
// GLOBAL INSTANCE
// ============================================

let effectsManager;

function initEffects() {
  if (effectsManager) {
    console.warn('⚠️ Effects already initialized');
    return;
  }

  effectsManager = new EffectsManager();
  effectsManager.init();
}

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEffects);
} else {
  initEffects();
}

// Global exports
window.effectsManager = effectsManager;
window.createRipple = (x, y, color) => {
  if (effectsManager) {
    effectsManager.createRipple(x, y, color);
  }
};

// Debug helpers
window.effectsDebug = {
  config: () => EFFECTS_CONFIG,
  disable: () => {
    if (effectsManager) {
      effectsManager.destroy();
    }
  },
  enable: () => {
    initEffects();
  }
};

console.log('✨ Effects script loaded');
