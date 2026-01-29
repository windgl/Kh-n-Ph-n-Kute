/* ============================================
   MESSAGE SECTION - EMAILJS CONFIGURED
   ============================================
   Email: buiminhphu0@gmail.com
   Character limit: 2000
   With Chiikawa rain images
   ============================================ */

// ============================================
// CONFIGURATION - YOUR EMAILJS CREDENTIALS
// ============================================

console.log("Kiểm tra EmailJS:", window.emailjs);

if (!window.emailjs) {
    alert("Lỗi: Thư viện EmailJS chưa được tải! Hãy kiểm tra kết nối mạng hoặc tắt chặn quảng cáo.");
}

const MESSAGE_CONFIG = {
  // Form limits
  maxChars: 2000,  // ✅ 2000 ký tự
  minChars: 5,
  
  // Email settings
  enableEmailSending: true,
  emailBackend: 'emailjs',
  
  // ✅ YOUR EMAILJS CREDENTIALS
  emailJs: {
    publicKey: 'j-6LlihUH6GNu_ZZC',      // ✅ Your Public Key
    serviceId: 'service_ctkp9x8',         // ✅ Your Service ID
    templateId: 'template_wutqkit'        // ✅ Your Template ID
  },
  
  // ✅ EMAIL RECIPIENT
  recipientEmail: 'buiminhphu0@gmail.com',  // ✅ Your email
  
  // ✅ Chiikawa rain images paths
  chikawaImages: [
    'images/chiikawa-falling-1.png',
    'images/chiikawa-falling-2.png'
  ],
  
  // Animation
  rainDuration: 4,
  rainBurstInterval: 500,
  rainEmojis: ['🎉', '✨', '💚', '🎁', '⭐'],
  
  // API settings
  apiTimeout: 5000,
  maxRetries: 3
};

// ============================================
// FORM STATE MANAGER
// ============================================

class FormStateManager {
  constructor() {
    this.state = {
      message: '',
      name: '',
      email: '',
      isValid: false,
      isSubmitting: false,
      submitCount: 0,
      emailSent: false,
      timestamp: Date.now()
    };
    this.history = [];
  }

  getState() {
    return { ...this.state };
  }

  setState(updates) {
    const old = { ...this.state };
    Object.assign(this.state, updates);
    this.history.push({ timestamp: Date.now(), old, new: { ...this.state } });
    return true;
  }

  reset() {
    this.state = {
      message: '',
      name: '',
      email: '',
      isValid: false,
      isSubmitting: false,
      submitCount: 0,
      emailSent: false,
      timestamp: Date.now()
    };
  }
}

// ============================================
// FORM VALIDATOR
// ============================================

class FormValidator {
  constructor() {
    this.errors = {};
  }

  validateMessage(message) {
    this.errors = {};

    if (!message || message.trim().length === 0) {
      this.errors.message = 'Lời nhắn không được bỏ trống';
      return false;
    }

    if (message.trim().length < MESSAGE_CONFIG.minChars) {
      this.errors.message = `Tối thiểu ${MESSAGE_CONFIG.minChars} ký tự`;
      return false;
    }

    if (message.length > MESSAGE_CONFIG.maxChars) {
      this.errors.message = `Tối đa ${MESSAGE_CONFIG.maxChars} ký tự`;
      return false;
    }

    const spam = /(.)\1{10,}/.test(message);
    if (spam) {
      this.errors.message = 'Không được lặp ký tự quá nhiều';
      return false;
    }

    return true;
  }

  validateEmail(email) {
    if (!email) return true;

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      this.errors.email = 'Email không hợp lệ';
      return false;
    }

    return true;
  }

  validateName(name) {
    if (!name) return true;

    if (name.trim().length < 2) {
      this.errors.name = 'Tên phải ít nhất 2 ký tự';
      return false;
    }

    return true;
  }

  validate(message, name, email) {
    this.errors = {};
    
    const msgValid = this.validateMessage(message);
    const emailValid = this.validateEmail(email);
    const nameValid = this.validateName(name);

    return msgValid && emailValid && nameValid;
  }

  getErrors() {
    return this.errors;
  }
}

// ============================================
// EMAIL SERVICE - EMAILJS
// ============================================

class EmailService {
  constructor(config) {
    this.config = config;
  }

  async send(formData, retryCount = 0) {
    if (!MESSAGE_CONFIG.enableEmailSending) {
      console.log('📧 Email sending disabled');
      return { success: true };
    }

    try {
      return await this.sendEmailJS(formData);
    } catch (error) {
      if (retryCount < MESSAGE_CONFIG.maxRetries) {
        console.log(`🔄 Retrying (${retryCount + 1}/${MESSAGE_CONFIG.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.send(formData, retryCount + 1);
      }
      throw error;
    }
  }

  async sendEmailJS(formData) {
    // Load EmailJS library
    if (!window.emailjs) {
      console.log('📧 Loading EmailJS library...');
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/index.min.js';
      script.async = true;
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // Initialize EmailJS
    emailjs.init(MESSAGE_CONFIG.emailJs.publicKey);

    // Send email
    const response = await emailjs.send(
      MESSAGE_CONFIG.emailJs.serviceId,
      MESSAGE_CONFIG.emailJs.templateId,
      {
        to_email: MESSAGE_CONFIG.recipientEmail,
        from_name: formData.name || 'Anonymous',
        from_email: formData.email || 'no-reply@giftwebsite.com',
        message: formData.message,
        timestamp: new Date().toLocaleString('vi-VN')
      }
    );

    console.log('✅ Email sent successfully!');
    return { success: true };
  }
}

// ============================================
// RAIN PARTICLE ENGINE - WITH CHIIKAWA
// ============================================

class RainEngine {
  constructor() {
    this.container = null;
    this.isActive = false;
    this.particles = [];
  }

  init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.id = 'rainContainer';
    this.container.className = 'rain-container';
    document.body.appendChild(this.container);
  }

  start() {
    if (!this.container) this.init();
    this.isActive = true;

    const burst = () => {
      if (!this.isActive) return;
      
      // Mix of chiikawa images and emojis
      for (let i = 0; i < 6; i++) {
        if (Math.random() > 0.3) {
          this.createChiikawaParticle();
        } else {
          this.createEmojiParticle();
        }
      }
      
      this.createSparkles();
      setTimeout(burst, MESSAGE_CONFIG.rainBurstInterval);
    };

    burst();
    console.log('🌧️ Rain started with Chiikawa');
  }

  // ✅ Create Chiikawa image particle
  createChiikawaParticle() {
    const images = MESSAGE_CONFIG.chikawaImages;
    const image = images[Math.floor(Math.random() * images.length)];

    const particle = document.createElement('div');
    particle.className = 'rain-particle chiikawa-particle';
    particle.style.width = '80px';
    particle.style.height = '80px';
    particle.style.position = 'fixed';
    particle.style.overflow = 'hidden';
    
    const img = document.createElement('img');
    img.src = image;
    img.alt = 'chiikawa falling';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.imageRendering = 'auto';
    
    particle.appendChild(img);
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.top = '-120px';

    const duration = MESSAGE_CONFIG.rainDuration + Math.random() * 2;
    particle.style.animation = `rainFall ${duration}s linear forwards`;

    this.container.appendChild(particle);
    this.particles.push(particle);

    setTimeout(() => {
      if (particle.parentElement) particle.remove();
      this.particles = this.particles.filter(p => p !== particle);
    }, duration * 1000);
  }

  // ✅ Create Emoji particle
  createEmojiParticle() {
    const emojis = MESSAGE_CONFIG.rainEmojis;
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    const particle = document.createElement('div');
    particle.className = 'rain-particle emoji-particle';
    particle.innerHTML = `<span class="rain-char">${emoji}</span>`;
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.top = '-120px';

    const duration = MESSAGE_CONFIG.rainDuration + Math.random() * 2;
    particle.style.animation = `rainFall ${duration}s linear forwards`;

    this.container.appendChild(particle);
    this.particles.push(particle);

    setTimeout(() => {
      if (particle.parentElement) particle.remove();
      this.particles = this.particles.filter(p => p !== particle);
    }, duration * 1000);
  }

  // ✅ Create sparkles (stars)
  createSparkles() {
    for (let i = 0; i < 5; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle-particle';
      sparkle.innerHTML = '⭐';
      sparkle.style.left = Math.random() * window.innerWidth + 'px';
      sparkle.style.top = Math.random() * (window.innerHeight / 2) + 'px';

      const duration = 2 + Math.random();
      sparkle.style.animation = `sparkleFloat ${duration}s ease-in-out forwards`;

      this.container.appendChild(sparkle);

      setTimeout(() => {
        if (sparkle.parentElement) sparkle.remove();
      }, duration * 1000);
    }
  }

  stop() {
    this.isActive = false;
    console.log('🌧️ Rain stopped');
  }

  clear() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.particles = [];
  }
}

// ============================================
// MESSAGE FORM CONTROLLER
// ============================================

class MessageFormController {
  constructor() {
    this.stateManager = new FormStateManager();
    this.validator = new FormValidator();
    this.emailService = new EmailService(MESSAGE_CONFIG);
    this.rainEngine = new RainEngine();

    this.form = null;
    this.messageInput = null;
    this.nameInput = null;
    this.emailInput = null;
    this.submitBtn = null;
    this.successMsg = null;
    this.charCount = null;
    this.isSubmitted = false;
  }

  init() {
    console.log('💬 Initializing message form...');

    this.form = document.getElementById('messageForm');
    this.messageInput = document.getElementById('messageInput');
    this.nameInput = document.getElementById('nameInput');
    this.emailInput = document.getElementById('emailInput');
    this.submitBtn = this.form?.querySelector('button[type="submit"]');
    this.successMsg = document.getElementById('successMessage');
    this.charCount = document.getElementById('charCountValue');

    if (!this.form || !this.messageInput) {
      console.error('❌ Form elements not found');
      return false;
    }

    this.rainEngine.init();
    this.setupListeners();
    this.playBackgroundMusic();

    console.log('✅ Message form ready');
    console.log('📧 Emails will be sent to: buiminhphu0@gmail.com');
    console.log('🌧️ Rain animation with Chiikawa images enabled');
    return true;
  }

  setupListeners() {
    this.messageInput.addEventListener('input', (e) => this.onMessageInput(e));
    this.messageInput.addEventListener('blur', () => this.validateMessage());
    this.messageInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.submitForm();
      }
    });

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitForm();
    });
  }

  onMessageInput(e) {
    const message = e.target.value;
    const max = MESSAGE_CONFIG.maxChars;

    if (message.length > max) {
      e.target.value = message.substring(0, max);
      return;
    }

    if (this.charCount) {
      this.charCount.textContent = message.length;
    }

    const charBar = document.querySelector('.char-bar-fill');
    if (charBar) {
      const percentage = (message.length / max) * 100;
      charBar.style.width = percentage + '%';
      charBar.classList.remove('warning', 'error');

      if (message.length > max * 0.8) {
        charBar.classList.add('warning');
      }
      if (message.length >= max) {
        charBar.classList.add('error');
      }
    }

    this.validateMessage();
  }

  validateMessage() {
    const message = this.messageInput.value;
    const name = this.nameInput?.value || '';
    const email = this.emailInput?.value || '';

    const isValid = this.validator.validate(message, name, email);

    this.messageInput.classList.remove('valid', 'error');
    if (message.length > 0) {
      this.messageInput.classList.add(isValid ? 'valid' : 'error');
    }

    this.stateManager.setState({
      message,
      name,
      email,
      isValid
    });

    this.updateSubmitButton();
  }

  updateSubmitButton() {
    if (!this.submitBtn) return;
    const state = this.stateManager.getState();
    const isDisabled = !state.isValid || state.isSubmitting;
    this.submitBtn.disabled = isDisabled;
    this.submitBtn.style.opacity = isDisabled ? '0.5' : '1';
  }

  async submitForm() {
    if (this.isSubmitted) return;

    const state = this.stateManager.getState();
    if (!state.isValid) {
      alert('❌ Vui lòng kiểm tra lại thông tin');
      return;
    }

    console.log('📤 Submitting form...');
    this.isSubmitted = true;

    this.stateManager.setState({
      isSubmitting: true,
      submitCount: state.submitCount + 1
    });

    this.disableForm();

    if (window.playUnlockSound) {
      window.playUnlockSound();
    }

    try {
      const formData = {
        message: state.message.trim(),
        name: state.name.trim() || 'Anonymous',
        email: state.email.trim() || '',
        timestamp: new Date().toISOString()
      };

      this.saveToStorage(formData);

      if (MESSAGE_CONFIG.enableEmailSending) {
        console.log('📧 Sending email to buiminhphu0@gmail.com...');
        await this.emailService.send(formData);
        this.stateManager.setState({ emailSent: true });
      }

      setTimeout(() => {
        this.rainEngine.start();
      }, 500);

      setTimeout(() => {
        this.showSuccess();
      }, 500);

      console.log('✅ Form submitted successfully');
    } catch (error) {
      console.error('❌ Error:', error);
      alert(`❌ Lỗi: ${error.message}`);
      this.isSubmitted = false;
      this.enableForm();
    }
  }

  saveToStorage(formData) {
    try {
      const key = `msg_${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(formData));
      console.log('✅ Data saved to localStorage');
    } catch (error) {
      console.warn('⚠️ Storage error:', error);
    }
  }

  disableForm() {
    const elements = this.form.querySelectorAll('input, textarea, button');
    elements.forEach(el => {
      el.disabled = true;
      el.style.opacity = '0.6';
    });
  }

  enableForm() {
    const elements = this.form.querySelectorAll('input, textarea, button');
    elements.forEach(el => {
      el.disabled = false;
      el.style.opacity = '1';
    });
  }

  showSuccess() {
    if (this.form) {
      this.form.style.opacity = '0';
      this.form.style.pointerEvents = 'none';
      setTimeout(() => {
        this.form.style.display = 'none';
      }, 400);
    }

    if (this.successMsg) {
      this.successMsg.classList.remove('hidden');
    }
  }

  playBackgroundMusic() {
    const bgMusic = document.getElementById('backgroundMusic');
    if (bgMusic && bgMusic.paused) {
      bgMusic.volume = 0.3;
      bgMusic.play().catch(() => {});
    }
  }

  getState() {
    return this.stateManager.getState();
  }

  getStats() {
    return {
      isSubmitted: this.isSubmitted,
      emailSent: this.stateManager.state.emailSent,
      messageLength: this.stateManager.state.message.length,
      maxChars: MESSAGE_CONFIG.maxChars,
      rainParticles: this.rainEngine.particles.length
    };
  }
}

// ============================================
// GLOBAL INSTANCE
// ============================================

let messageFormController;

function initMessageSection() {
  messageFormController = new MessageFormController();
  messageFormController.init();
}

window.initMessageSection = initMessageSection;

// Utilities
function getAllMessages() {
  const messages = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('msg_')) {
      try {
        messages.push(JSON.parse(localStorage.getItem(key)));
      } catch (e) {
        console.error('Parse error:', key);
      }
    }
  }
  return messages;
}

function clearAllMessages() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('msg_')) {
      keys.push(key);
    }
  }
  keys.forEach(key => localStorage.removeItem(key));
  console.log(`✅ Cleared ${keys.length} messages`);
}

window.messageDebug = {
  getState: () => messageFormController?.getState(),
  getStats: () => messageFormController?.getStats(),
  getAllMessages,
  clearAllMessages,
  config: () => console.log('MESSAGE_CONFIG:', MESSAGE_CONFIG),
  startRain: () => messageFormController?.rainEngine.start(),
  stopRain: () => messageFormController?.rainEngine.stop(),
  clearRain: () => messageFormController?.rainEngine.clear()
};

window.getAllMessages = getAllMessages;
window.clearAllMessages = clearAllMessages;

console.log('✨ Message script loaded!');
console.log('✅ EmailJS configured');
console.log('📧 Recipient: buiminhphu0@gmail.com');
console.log('📝 Character limit: 2000');
console.log('🌧️ Rain animation with Chiikawa images');