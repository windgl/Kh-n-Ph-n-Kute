/* ============================================
   PARTICLES.JS - OPTIMIZED PARTICLE ENGINE
   ============================================
   Version 3.0 - High Performance System
   - Canvas-based rendering
   - Object pooling
   - RequestAnimationFrame
   - Mobile optimized
   - Piano key particles
   - Click/touch particles
   ============================================ */

// ============================================
// CONFIGURATION
// ============================================

const PARTICLE_CONFIG = {
  // Performance
  maxParticles: 200,
  poolSize: 300,
  targetFPS: 60,
  
  // Particle properties
  lifetime: 2000, // ms
  speed: {
    min: 1,
    max: 4
  },
  size: {
    min: 4,
    max: 10
  },
  
  // Colors
  colors: [
    '#4A90E2', // Ocean blue
    '#2ECC71', // Green
    '#A8E6CF', // Accent
    '#FF7F50', // Coral
    '#FF6B9D'  // Pink
  ],
  
  // Effects
  gravity: 0.05,
  friction: 0.98,
  fadeOut: true,
  
  // Mobile optimization
  mobile: {
    maxParticles: 100,
    lifetime: 1500,
    spawnRate: 0.5 // 50% spawn rate
  }
};

// Detect mobile
const IS_MOBILE_DEVICE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Apply mobile config
if (IS_MOBILE_DEVICE) {
  Object.assign(PARTICLE_CONFIG, PARTICLE_CONFIG.mobile);
}

// ============================================
// PARTICLE CLASS
// ============================================

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.size = 5;
    this.color = '#4A90E2';
    this.life = 1.0;
    this.maxLife = PARTICLE_CONFIG.lifetime;
    this.birthTime = 0;
    this.rotation = 0;
    this.rotationSpeed = 0;
  }

  spawn(x, y, options = {}) {
    this.active = true;
    this.x = x;
    this.y = y;
    
    // Velocity
    const angle = options.angle ?? Math.random() * Math.PI * 2;
    const speed = options.speed ?? (
      Math.random() * (PARTICLE_CONFIG.speed.max - PARTICLE_CONFIG.speed.min) +
      PARTICLE_CONFIG.speed.min
    );
    
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    
    // Properties
    this.size = options.size ?? (
      Math.random() * (PARTICLE_CONFIG.size.max - PARTICLE_CONFIG.size.min) +
      PARTICLE_CONFIG.size.min
    );
    
    this.color = options.color ?? 
      PARTICLE_CONFIG.colors[Math.floor(Math.random() * PARTICLE_CONFIG.colors.length)];
    
    this.life = 1.0;
    this.maxLife = options.lifetime ?? PARTICLE_CONFIG.lifetime;
    this.birthTime = Date.now();
    
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
  }

  update(deltaTime) {
    if (!this.active) return;

    // Apply physics
    this.vy += PARTICLE_CONFIG.gravity;
    this.vx *= PARTICLE_CONFIG.friction;
    this.vy *= PARTICLE_CONFIG.friction;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Update rotation
    this.rotation += this.rotationSpeed;
    
    // Update life
    const age = Date.now() - this.birthTime;
    this.life = 1 - (age / this.maxLife);
    
    // Deactivate if dead
    if (this.life <= 0) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active || this.life <= 0) return;

    ctx.save();
    
    // Translate and rotate
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    // Set opacity based on life
    const alpha = PARTICLE_CONFIG.fadeOut ? this.life : 1;
    ctx.globalAlpha = alpha;
    
    // Draw particle
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    
    ctx.restore();
  }
}

// ============================================
// PARTICLE POOL (OBJECT POOLING)
// ============================================

class ParticlePool {
  constructor(size) {
    this.pool = [];
    this.active = [];
    
    // Pre-create particles
    for (let i = 0; i < size; i++) {
      this.pool.push(new Particle());
    }
    
    console.log(`✅ Particle pool created: ${size} particles`);
  }

  get() {
    // Reuse inactive particle
    let particle = this.pool.pop();
    
    // Create new if pool empty
    if (!particle) {
      particle = new Particle();
    }
    
    this.active.push(particle);
    return particle;
  }

  release(particle) {
    particle.reset();
    
    // Remove from active
    const index = this.active.indexOf(particle);
    if (index > -1) {
      this.active.splice(index, 1);
    }
    
    // Return to pool
    if (this.pool.length < PARTICLE_CONFIG.poolSize) {
      this.pool.push(particle);
    }
  }

  getActiveCount() {
    return this.active.length;
  }

  update(deltaTime) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const particle = this.active[i];
      particle.update(deltaTime);
      
      // Release if dead
      if (!particle.active) {
        this.release(particle);
      }
    }
  }

  draw(ctx) {
    this.active.forEach(particle => particle.draw(ctx));
  }

  clear() {
    this.active.forEach(particle => this.release(particle));
  }
}

// ============================================
// PARTICLE ENGINE
// ============================================

class ParticleEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.pool = null;
    this.animationId = null;
    this.lastTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsUpdateTime = 0;
  }

  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'particleCanvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9997';
    document.body.appendChild(this.canvas);

    // Get context
    this.ctx = this.canvas.getContext('2d', {
      alpha: true,
      desynchronized: true // Better performance
    });

    // Set size
    this.resize();

    // Create particle pool
    this.pool = new ParticlePool(PARTICLE_CONFIG.poolSize);

    // Setup events
    this.setupEvents();

    // Start animation loop
    this.start();

    console.log('✅ Particle engine initialized');
    return true;
  }

  setupEvents() {
    // Resize
    window.addEventListener('resize', () => this.resize());

    // Visibility change (pause when hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  resize() {
    // Use device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
    
    // Store logical dimensions
    this.width = rect.width;
    this.height = rect.height;
  }

  start() {
    if (this.animationId) return;
    this.lastTime = performance.now();
    this.animate();
  }

  pause() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resume() {
    if (!this.animationId) {
      this.lastTime = performance.now();
      this.animate();
    }
  }

  animate(currentTime) {
    this.animationId = requestAnimationFrame((time) => this.animate(time));

    // Calculate delta time
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update FPS counter
    this.updateFPS(currentTime);

    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Update and draw particles
    this.pool.update(deltaTime);
    this.pool.draw(this.ctx);
  }

  updateFPS(currentTime) {
    this.frameCount++;
    
    if (currentTime >= this.fpsUpdateTime + 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.fpsUpdateTime));
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }
  }

  // ============================================
  // PARTICLE SPAWNING METHODS
  // ============================================

  spawnBurst(x, y, count, options = {}) {
    // Check particle limit
    if (this.pool.getActiveCount() >= PARTICLE_CONFIG.maxParticles) {
      return;
    }

    // Mobile optimization
    if (IS_MOBILE_DEVICE) {
      count = Math.ceil(count * PARTICLE_CONFIG.mobile.spawnRate);
    }

    // Spawn particles in circle
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const particle = this.pool.get();
      
      particle.spawn(x, y, {
        angle,
        ...options
      });
    }
  }

  spawnExplosion(x, y, count, options = {}) {
    if (this.pool.getActiveCount() >= PARTICLE_CONFIG.maxParticles) {
      return;
    }

    if (IS_MOBILE_DEVICE) {
      count = Math.ceil(count * PARTICLE_CONFIG.mobile.spawnRate);
    }

    for (let i = 0; i < count; i++) {
      const particle = this.pool.get();
      particle.spawn(x, y, {
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 6 + 2,
        ...options
      });
    }
  }

  spawnFountain(x, y, count, options = {}) {
    if (this.pool.getActiveCount() >= PARTICLE_CONFIG.maxParticles) {
      return;
    }

    if (IS_MOBILE_DEVICE) {
      count = Math.ceil(count * PARTICLE_CONFIG.mobile.spawnRate);
    }

    for (let i = 0; i < count; i++) {
      const particle = this.pool.get();
      const spread = 0.5;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
      
      particle.spawn(x, y, {
        angle,
        speed: Math.random() * 5 + 3,
        ...options
      });
    }
  }

  spawnTrail(x, y, count = 3, options = {}) {
    if (this.pool.getActiveCount() >= PARTICLE_CONFIG.maxParticles) {
      return;
    }

    for (let i = 0; i < count; i++) {
      const particle = this.pool.get();
      particle.spawn(x, y, {
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 2,
        size: Math.random() * 4 + 2,
        lifetime: 1000,
        ...options
      });
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  clear() {
    this.pool.clear();
  }

  getStats() {
    return {
      activeParticles: this.pool.getActiveCount(),
      maxParticles: PARTICLE_CONFIG.maxParticles,
      poolSize: PARTICLE_CONFIG.poolSize,
      fps: this.fps,
      canvasSize: {
        width: this.width,
        height: this.height
      }
    };
  }

  destroy() {
    this.pause();
    if (this.canvas) {
      this.canvas.remove();
    }
    this.pool.clear();
  }
}

// ============================================
// GLOBAL INSTANCE
// ============================================

let particleEngine;

function initParticles() {
  if (particleEngine) {
    console.warn('⚠️ Particles already initialized');
    return particleEngine;
  }

  particleEngine = new ParticleEngine();
  particleEngine.init();
  return particleEngine;
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initParticles);
} else {
  initParticles();
}

// Global exports
window.particleEngine = particleEngine;
window.spawnParticles = (x, y, count, options) => {
  if (particleEngine) {
    particleEngine.spawnBurst(x, y, count, options);
  }
};

// Debug helpers
window.particlesDebug = {
  stats: () => particleEngine?.getStats(),
  clear: () => particleEngine?.clear(),
  burst: (x, y) => particleEngine?.spawnBurst(x || window.innerWidth / 2, y || window.innerHeight / 2, 20),
  explosion: (x, y) => particleEngine?.spawnExplosion(x || window.innerWidth / 2, y || window.innerHeight / 2, 30),
  config: () => PARTICLE_CONFIG
};

console.log('✨ Particles script loaded');
