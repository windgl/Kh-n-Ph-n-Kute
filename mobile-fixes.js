/* ============================================
   MOBILE OPTIMIZATION FIXES - JAVASCRIPT
   ============================================
   Khắc phục các vấn đề hành vi trên mobile
   ============================================ */

// ============================================
// 1. PREVENT ZOOM ON INPUT FOCUS (iOS)
// ============================================

if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
  document.addEventListener('touchstart', function(e) {
    if (e.target.tagName.toLowerCase() === 'input' || 
        e.target.tagName.toLowerCase() === 'textarea') {
      e.target.style.fontSize = '16px';
    }
  }, false);
}

// ============================================
// 2. FIX VIEWPORT HEIGHT (Mobile viewport bug)
// ============================================

function fixViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  
  // Use 100vh alternative
  document.documentElement.style.setProperty('--100vh', `${window.innerHeight}px`);
}

fixViewportHeight();
window.addEventListener('resize', fixViewportHeight);
window.addEventListener('orientationchange', fixViewportHeight);

// ============================================
// 3. PREVENT ACCIDENTAL DOUBLE-TAP ZOOM
// ============================================

let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// ============================================
// 4. FIX SAFE AREA FOR NOTCH PHONES
// ============================================

function updateSafeArea() {
  const top = CSS.env('safe-area-inset-top');
  const bottom = CSS.env('safe-area-inset-bottom');
  const left = CSS.env('safe-area-inset-left');
  const right = CSS.env('safe-area-inset-right');
  
  if (top) document.documentElement.style.setProperty('--safe-top', top);
  if (bottom) document.documentElement.style.setProperty('--safe-bottom', bottom);
  if (left) document.documentElement.style.setProperty('--safe-left', left);
  if (right) document.documentElement.style.setProperty('--safe-right', right);
}

updateSafeArea();
window.addEventListener('orientationchange', updateSafeArea);

// ============================================
// 5. OPTIMIZE TOUCH EVENTS
// ============================================

class TouchOptimizer {
  constructor() {
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isScrolling = false;
  }

  init() {
    document.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.isScrolling = false;
    }, false);

    document.addEventListener('touchmove', (e) => {
      const deltaX = Math.abs(e.touches[0].clientX - this.touchStartX);
      const deltaY = Math.abs(e.touches[0].clientY - this.touchStartY);
      
      if (deltaY > 10) {
        this.isScrolling = true;
      }
    }, false);

    document.addEventListener('touchend', (e) => {
      if (!this.isScrolling) {
        const touch = e.changedTouches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Trigger click on non-scrolling touch
        if (element && !this.isScrolling) {
          element.click?.();
        }
      }
    }, false);
  }
}

const touchOptimizer = new TouchOptimizer();
touchOptimizer.init();

// ============================================
// 6. FIX OVERFLOW SCROLL
// ============================================

function preventOverflow() {
  document.addEventListener('touchmove', function(e) {
    if (e.target.closest('.piano-keys')) {
      // Allow scrolling in piano-keys
      return;
    }
    if (e.target.closest('.message-form')) {
      // Allow scrolling in form
      return;
    }
    
    // Prevent default for everything else
    if (e.scale !== 1) {
      e.preventDefault();
    }
  }, { passive: false });
}

preventOverflow();

// ============================================
// 7. OPTIMIZE ANIMATIONS FOR MOBILE
// ============================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = /iPhone|iPad|iPod|Android/.test(navigator.userAgent);

if (isMobile && !prefersReducedMotion) {
  // Reduce animation complexity on mobile
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      .confetti { animation-duration: 2s !important; }
      .rain-particle { animation-duration: 2s !important; }
      @keyframes wave { 0%, 100% { d: path("M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z"); } }
    }
  `;
  document.head.appendChild(style);
}

// ============================================
// 8. FIX KEYBOARD HANDLING
// ============================================

// Prevent keyboard from pushing content up on iOS
if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
  const metaViewport = document.querySelector('meta[name="viewport"]');
  
  // Store original viewport height
  let originalHeight = window.innerHeight;
  
  window.addEventListener('focus', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      setTimeout(() => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, true);

  window.addEventListener('blur', (e) => {
    // Reset position when keyboard closes
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      window.scrollTo(0, 0);
    }
  }, true);
}

// ============================================
// 9. MOBILE GESTURE SUPPORT
// ============================================

class GestureHandler {
  constructor() {
    this.lastScale = 1;
  }

  init() {
    // Handle pinch zoom
    document.addEventListener('gesturestart', (e) => {
      e.preventDefault();
    }, false);

    document.addEventListener('gesturechange', (e) => {
      e.preventDefault();
      this.lastScale = e.scale;
    }, false);

    // Handle long press
    this.setupLongPress();
  }

  setupLongPress() {
    let timeout;
    document.addEventListener('touchstart', (e) => {
      timeout = setTimeout(() => {
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element?.classList.contains('piano-key')) {
          element.classList.add('long-press');
        }
      }, 500);
    }, false);

    document.addEventListener('touchend', () => {
      clearTimeout(timeout);
      document.querySelectorAll('.long-press').forEach(el => {
        el.classList.remove('long-press');
      });
    }, false);

    document.addEventListener('touchmove', () => {
      clearTimeout(timeout);
    }, false);
  }
}

const gestureHandler = new GestureHandler();
gestureHandler.init();

// ============================================
// 10. PERFORMANCE OPTIMIZATION
// ============================================

// Lazy load non-critical resources
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// ============================================
// 11. DETECT MOBILE AND ADD CLASS
// ============================================

function detectMobile() {
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTablet = /iPad|Android/.test(navigator.userAgent) && !/Phone|Mobile/.test(navigator.userAgent);
  
  document.documentElement.classList.add(isMobile ? 'is-mobile' : 'is-desktop');
  if (isTablet) document.documentElement.classList.add('is-tablet');
  
  return { isMobile, isTablet };
}

const device = detectMobile();

// ============================================
// 12. FIX AUDIO ON MOBILE (iOS requirement)
// ============================================

function setupMobileAudio() {
  if (device.isMobile) {
    const audioElements = document.querySelectorAll('audio');
    
    // Allow audio to play without user interaction on iOS
    document.addEventListener('touchstart', () => {
      audioElements.forEach(audio => {
        if (audio.paused) {
          audio.play().catch(err => {
            console.log('Audio autoplay failed:', err);
          });
        }
      });
    }, { once: true });
  }
}

setupMobileAudio();

// ============================================
// 13. SMOOTH SCROLL ALTERNATIVE
// ============================================

if (!CSS.supports('scroll-behavior: smooth')) {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a[href^="#"]');
    if (target) {
      e.preventDefault();
      const el = document.querySelector(target.hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
}

// ============================================
// 14. BUTTON RIPPLE EFFECT (MOBILE FRIENDLY)
// ============================================

class RippleEffect {
  init() {
    document.addEventListener('touchstart', (e) => {
      const button = e.target.closest('button, .btn');
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.left = (e.touches[0].clientX - rect.left) + 'px';
      ripple.style.top = (e.touches[0].clientY - rect.top) + 'px';
      
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }, false);
  }
}

const rippleEffect = new RippleEffect();
rippleEffect.init();

// ============================================
// 15. ORIENTATION CHANGE HANDLER
// ============================================

window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    window.scrollTo(0, 0);
    fixViewportHeight();
  }, 100);
});

// ============================================
// 16. DEBUG INFO (Console)
// ============================================

if (true) { // Set to false in production
  console.log('📱 Mobile Optimization Loaded');
  console.log(`Device: ${device.isMobile ? 'Mobile' : 'Desktop'} ${device.isTablet ? '(Tablet)' : ''}`);
  console.log(`Viewport: ${window.innerWidth}x${window.innerHeight}`);
  console.log(`User Agent: ${navigator.userAgent}`);
}

// ============================================
// Export for global access
// ============================================

window.mobileOptimization = {
  fixViewportHeight,
  updateSafeArea,
  detectMobile,
  device
};
