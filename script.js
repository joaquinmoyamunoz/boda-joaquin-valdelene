/* ============================================================
   INTERACTIVIDAD DE LA INVITACIÓN DE BODA
   Joaquín Moya & Valdelene De Souza — 22 de Mayo de 2027
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  // 1. SELECTORES DE ELEMENTOS
  // ============================================================
  const envelope = document.getElementById('envelope');
  const waxSeal = document.getElementById('wax-seal');
  const envelopeWrapper = document.getElementById('envelope-wrapper');
  const envelopeHero = document.getElementById('envelope-hero');
  const mainContent = document.getElementById('main-invitation-content');
  const openScrollHint = document.getElementById('open-scroll-hint');
  const reopenEnvelopeBtn = document.getElementById('reopen-envelope-btn');

  const musicBtn = document.getElementById('music-btn');
  const musicStatus = document.getElementById('music-status');

  const rsvpForm = document.getElementById('rsvp-form');
  const rsvpWhatsAppBtn = document.getElementById('rsvp-whatsapp-btn');
  const rsvpStatus = document.getElementById('rsvp-status-message');

  const wishesForm = document.getElementById('wishes-form');
  const wishesList = document.getElementById('wishes-list');

  const toast = document.getElementById('toast');
  const googleCalendarBtn = document.getElementById('add-google-calendar-btn');
  const invitationPeekCard = document.getElementById('invitation-peek-card');

  let isEnvelopeOpen = false;

  // ============================================================
  // 1.1 INVITACIONES PERSONALIZADAS (Nombre del invitado por URL)
  // Uso: index.html?nombre=Familia+Pérez
  //      index.html?nombre=María+y+Carlos
  // ============================================================
  const urlParams = new URLSearchParams(window.location.search);
  const guestName = urlParams.get('nombre');
  const guestNameEls = document.querySelectorAll('.personalized-guest-name');
  const guestSectionEl = document.getElementById('guest-greeting-section');

  if (guestName && guestName.trim()) {
    const decodedName = decodeURIComponent(guestName.trim());
    // Rellenar todos los elementos de nombre personalizado
    guestNameEls.forEach(el => {
      el.textContent = decodedName;
    });
    // Mostrar la sección de saludo personalizado
    if (guestSectionEl) {
      guestSectionEl.style.display = 'block';
    }
    // Mostrar la dedicatoria dentro de la portada hero
    const heroDedication = document.getElementById('hero-guest-dedication');
    if (heroDedication) {
      heroDedication.style.display = 'flex';
    }
    // Personalizar el texto de invitación
    const heroInviteText = document.getElementById('hero-invite-text');
    if (heroInviteText) {
      heroInviteText.textContent = `Nos gustaría compartir este día tan especial contigo`;
    }
    // Pre-rellenar el campo de nombre en el RSVP
    const rsvpNameInput = document.getElementById('guest-name');
    if (rsvpNameInput && !rsvpNameInput.value) {
      rsvpNameInput.value = decodedName;
    }
  } else {
    // Sin nombre personalizado, ocultar la sección
    if (guestSectionEl) {
      guestSectionEl.style.display = 'none';
    }
  }

  // ============================================================
  // 1.2 AUTOPLAY DE MÚSICA AL PRIMER TOQUE EN CUALQUIER PARTE
  // Los navegadores bloquean autoplay sin interacción, así que
  // arrancamos la música en el primer click/toque del usuario.
  // ============================================================
  let autoplayTriggered = false;
  function tryAutoplayMusic() {
    if (autoplayTriggered) return;
    autoplayTriggered = true;
    // Pequeño delay para que se sienta natural
    setTimeout(() => {
      if (!isMusicPlaying) {
        playMusic();
      }
    }, 300);
    // Quitar los listeners una vez activado
    document.removeEventListener('click', tryAutoplayMusic);
    document.removeEventListener('touchstart', tryAutoplayMusic);
    document.removeEventListener('scroll', tryAutoplayMusic);
  }
  document.addEventListener('click', tryAutoplayMusic, { once: false });
  document.addEventListener('touchstart', tryAutoplayMusic, { once: false });
  document.addEventListener('scroll', tryAutoplayMusic, { once: false });

  // ============================================================
  // 2. MOTOR DE SONIDO ROMÁNTICO (Web Audio API Synthesizer Fallback)
  // Genera notas arpegiadas de arpa/caja musical sin dependencias externas
  // ============================================================
  class RomanticAudioEngine {
    constructor() {
      this.ctx = null;
      this.isPlaying = false;
      this.timerId = null;
      this.notes = [
        261.63, 329.63, 392.00, 523.25, // C4, E4, G4, C5
        220.00, 261.63, 329.63, 440.00, // A3, C4, E4, A4
        174.61, 220.00, 261.63, 349.23, // F3, A3, C4, F4
        196.00, 246.94, 293.66, 392.00  // G3, B3, D4, G4
      ];
      this.noteIndex = 0;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playPluck(freq, time = 0, duration = 1.6) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime + time);
      filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + time + duration);

      gain.gain.setValueAtTime(0.0001, this.ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + time);
      osc.stop(this.ctx.currentTime + time + duration);
    }

    playSealChime() {
      this.init();
      // Campana dorada al romper el lacre
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        this.playPluck(freq, i * 0.08, 2.0);
      });
    }

    startMelody() {
      this.init();
      if (this.isPlaying) return;
      this.isPlaying = true;
      
      const step = () => {
        if (!this.isPlaying) return;
        const currentFreq = this.notes[this.noteIndex % this.notes.length];
        this.playPluck(currentFreq, 0, 1.8);
        this.noteIndex++;
        this.timerId = setTimeout(step, 450);
      };
      step();
    }

    stopMelody() {
      this.isPlaying = false;
      if (this.timerId) {
        clearTimeout(this.timerId);
      }
    }

    toggle() {
      if (this.isPlaying) {
        this.stopMelody();
        return false;
      } else {
        this.startMelody();
        return true;
      }
    }
  }

  const audio = new RomanticAudioEngine();

  // ============================================================
  // 2.1 REPRODUCTOR OFICIAL YOUTUBE: "Solo Tú" (Vals Boda) - Samuel Adrián
  // Video: https://www.youtube.com/watch?v=oug7i8HlEn8
  // ============================================================
  const YOUTUBE_VIDEO_ID = 'oug7i8HlEn8';
  let ytPlayer = null;
  let ytReady = false;
  let isMusicPlaying = false;
  let userWantsMusic = false;
  const localAudio = document.getElementById('wedding-local-audio');

  window.onYouTubeIframeAPIReady = function() {
    try {
      ytPlayer = new YT.Player('yt-audio-player', {
        height: '200',
        width: '200',
        videoId: YOUTUBE_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          loop: 1,
          playlist: YOUTUBE_VIDEO_ID,
          modestbranding: 1,
          playsinline: 1,
          rel: 0
        },
        events: {
          onReady: (event) => {
            ytReady = true;
            if (userWantsMusic) {
              playMusic();
            }
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              setMusicUIState(true);
            } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
              setMusicUIState(false);
            }
          },
          onError: (e) => {
            console.warn('YouTube error o bloqueo de origen, pasando a reproductor de audio:', e);
            if (userWantsMusic) {
              playLocalOrSynth();
            }
          }
        }
      });
    } catch (e) {
      console.warn('Error inicializando YouTube API:', e);
    }
  };

  function setMusicUIState(playing) {
    isMusicPlaying = playing;
    if (playing) {
      musicBtn.classList.add('playing');
      if (musicStatus) musicStatus.textContent = 'Pausa';
    } else {
      musicBtn.classList.remove('playing');
      if (musicStatus) musicStatus.textContent = 'Play';
    }
  }

  function playLocalOrSynth() {
    audio.startMelody();
    setMusicUIState(true);
    showToast('Música activada 🎵');
  }

  function playMusic() {
    userWantsMusic = true;
    
    // 1. Prioridad: Archivo local boda.mp3
    if (localAudio) {
      localAudio.play().then(() => {
        setMusicUIState(true);
        showToast('Reproduciendo: "Solo Tú" — Samuel Adrián 🎵');
      }).catch((err) => {
        console.warn('Error al reproducir audio local:', err);
        // 2. Si falla el audio local, intentar YouTube
        if (ytReady && ytPlayer && typeof ytPlayer.playVideo === 'function') {
          try {
            ytPlayer.playVideo();
            setMusicUIState(true);
            showToast('Reproduciendo: "Solo Tú" — Samuel Adrián 🎵');
          } catch (e) {
            playLocalOrSynth();
          }
        } else {
          playLocalOrSynth();
        }
      });
      return;
    }

    if (ytReady && ytPlayer && typeof ytPlayer.playVideo === 'function') {
      try {
        ytPlayer.playVideo();
        setMusicUIState(true);
        showToast('Reproduciendo: "Solo Tú" — Samuel Adrián 🎵');
        return;
      } catch (err) {
        console.warn('No se pudo reproducir video de YouTube:', err);
      }
    }
    
    playLocalOrSynth();
  }

  function pauseMusic() {
    userWantsMusic = false;
    if (ytReady && ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
      try {
        ytPlayer.pauseVideo();
      } catch (e) {}
    }
    if (localAudio) {
      try { localAudio.pause(); } catch(e) {}
    }
    audio.stopMelody();
    setMusicUIState(false);
    showToast('Música pausada 🔇');
  }

  function toggleMusic() {
    if (isMusicPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  }

  // Control del botón flotante de música
  musicBtn.addEventListener('click', toggleMusic);


  // ============================================================
  // 3. CANVAS DE PARTÍCULAS AMBIENTALES (Hojas de Eucalipto y Polvo Dorado)
  // ============================================================
  const canvas = document.getElementById('ambient-canvas');
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let burstParticles = [];

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class LeafParticle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = -20 - Math.random() * 50;
      this.size = 8 + Math.random() * 14;
      this.speedY = 0.5 + Math.random() * 1.2;
      this.speedX = (Math.random() - 0.5) * 0.8;
      this.angle = Math.random() * Math.PI * 2;
      this.angularSpeed = (Math.random() - 0.5) * 0.02;
      this.opacity = 0.25 + Math.random() * 0.45;
      this.isGold = Math.random() > 0.65;
    }

    update() {
      this.y += this.speedY;
      this.x += Math.sin(this.angle) * 0.7 + this.speedX;
      this.angle += this.angularSpeed;

      if (this.y > height + 20) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.globalAlpha = this.opacity;

      if (this.isGold) {
        // Polvo dorado o pequeña chispa
        ctx.fillStyle = '#c5a059';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Hoja estilizada de eucalipto en verde salvia
        ctx.fillStyle = '#6b8a73';
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.quadraticCurveTo(this.size * 0.45, 0, 0, this.size);
        ctx.quadraticCurveTo(-this.size * 0.45, 0, 0, -this.size);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Inicializar hojas ambientales
  const particleCount = window.innerWidth < 600 ? 20 : 35;
  for (let i = 0; i < particleCount; i++) {
    const p = new LeafParticle();
    p.y = Math.random() * height; // dispersar al inicio
    particles.push(p);
  }

  // Explosión de partículas al romper el sello de lacre
  function triggerSealBurst(originX, originY) {
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      burstParticles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 3 + Math.random() * 5,
        color: Math.random() > 0.5 ? '#d8b46d' : '#3d6c4e',
        alpha: 1,
        life: 0.9 + Math.random() * 0.4,
        decay: 0.02 + Math.random() * 0.02
      });
    }
  }

  function renderParticles() {
    ctx.clearRect(0, 0, width, height);

    // Partículas ambientales de fondo
    particles.forEach(p => {
      p.update();
      p.draw();
    });

    // Partículas de estallido del sello
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const bp = burstParticles[i];
      bp.x += bp.vx;
      bp.y += bp.vy;
      bp.vy += 0.12; // gravedad suave
      bp.alpha -= bp.decay;

      if (bp.alpha <= 0) {
        burstParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = bp.alpha;
      ctx.fillStyle = bp.color;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, bp.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(renderParticles);
  }
  requestAnimationFrame(renderParticles);


  // ============================================================
  // 4. ANIMACIÓN Y MECÁNICA DE APERTURA DEL SOBRE
  // ============================================================
  function openEnvelope() {
    if (isEnvelopeOpen) return;
    isEnvelopeOpen = true;

    // Calcular coordenadas del sello para el efecto de chispas
    const sealRect = waxSeal.getBoundingClientRect();
    const sealCenterX = sealRect.left + sealRect.width / 2;
    const sealCenterY = sealRect.top + sealRect.height / 2;

    // Sonido campana y partículas del sello
    audio.playSealChime();
    triggerSealBurst(sealCenterX, sealCenterY);

    // Si la música no está sonando aún, iniciarla ahora
    if (!isMusicPlaying && !autoplayTriggered) {
      autoplayTriggered = true;
      document.removeEventListener('click', tryAutoplayMusic);
      document.removeEventListener('touchstart', tryAutoplayMusic);
      document.removeEventListener('scroll', tryAutoplayMusic);
      setTimeout(() => {
        if (!isMusicPlaying) {
          playMusic();
        }
      }, 450);
    }

    // Activar estados en el sobre
    envelope.classList.add('opening');

    setTimeout(() => {
      envelope.classList.add('open');
      openScrollHint.classList.add('visible');
      reopenEnvelopeBtn.classList.add('visible');
    }, 550);

    // Revelar la invitación completa y hacer scroll suave
    setTimeout(() => {
      mainContent.classList.add('revealed');
      
      // Auto-desplazamiento sutil hacia la portada
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 1300);
  }

  // Cerrar y volver a guardar el sobre para volver a vivir la experiencia
  function resetEnvelope() {
    isEnvelopeOpen = false;
    envelope.classList.remove('opening', 'open');
    openScrollHint.classList.remove('visible');
    mainContent.classList.remove('revealed');
    reopenEnvelopeBtn.classList.remove('visible');

    // Desplazar a la cima suavemente
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Sobre guardado nuevamente ✉️');
  }

  // Asignar eventos de apertura al sello y al sobre
  waxSeal.addEventListener('click', (e) => {
    e.stopPropagation();
    openEnvelope();
  });
  waxSeal.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openEnvelope();
    }
  });

  envelopeWrapper.addEventListener('click', () => {
    if (!isEnvelopeOpen) {
      openEnvelope();
    }
  });

  // Al hacer clic en la tarjeta asomada dentro del sobre abierto, deslizar a los detalles
  if (invitationPeekCard) {
    invitationPeekCard.addEventListener('click', (e) => {
      if (isEnvelopeOpen) {
        e.stopPropagation();
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Evento al indicador de deslizar
  openScrollHint.addEventListener('click', () => {
    mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Reabrir / reiniciar sobre
  reopenEnvelopeBtn.addEventListener('click', resetEnvelope);


  // ============================================================
  // 5. CUENTA REGRESIVA EN TIEMPO REAL (22 de Mayo de 2027)
  // ============================================================
  const weddingDate = new Date('2027-05-22T16:30:00-03:00').getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = weddingDate - now;

    if (distance <= 0) {
      document.getElementById('days').textContent = '00';
      document.getElementById('hours').textContent = '00';
      document.getElementById('minutes').textContent = '00';
      document.getElementById('seconds').textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);


  // ============================================================
  // 6. ENLACE A GOOGLE CALENDAR
  // ============================================================
  if (googleCalendarBtn) {
    const title = encodeURIComponent("Matrimonio Joaquín Moya & Valdelene De Souza");
    const details = encodeURIComponent("Celebración del matrimonio de Joaquín y Valdelene. ¡Nos vemos en este día tan especial!");
    const location = encodeURIComponent("CASA TEEC Tu Espacio Ecológico, Condominio Miraflores de Lipangue 0732, Lampa, Región Metropolitana");
    // Formato UTC: 20270522T193000Z hasta 20270523T080000Z
    const dates = "20270522T193000Z/20270523T080000Z";
    
    googleCalendarBtn.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  }


  // ============================================================
  // 7. COPIAR DATOS BANCARIOS AL PORTAPAPELES
  // ============================================================
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        const textToCopy = targetElement.textContent.trim();
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`¡Copiado con éxito! (${textToCopy}) ✨`);
          
          const originalText = btn.textContent;
          btn.textContent = '¡Copiado!';
          btn.style.background = '#2d4d3a';
          btn.style.color = '#ffffff';

          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            btn.style.color = '';
          }, 2000);
        }).catch(() => {
          showToast('No se pudo copiar automáticamente');
        });
      }
    });
  });


  // ============================================================
  // 8. FORMULARIO RSVP Y ENVÍO POR WHATSAPP
  // ============================================================
  // Lógica si asiste o no para ocultar campos no relevantes
  const attendanceRadios = document.querySelectorAll('input[name="attendance"]');
  const guestsCountGroup = document.getElementById('guests-count-group');

  attendanceRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'no') {
        if (guestsCountGroup) guestsCountGroup.style.display = 'none';
      } else {
        if (guestsCountGroup) guestsCountGroup.style.display = 'flex';
      }
    });
  });

  // Generador de mensaje para WhatsApp
  rsvpWhatsAppBtn.addEventListener('click', () => {
    const name = document.getElementById('guest-name').value.trim();
    if (!name) {
      showToast('Por favor escribe tu nombre primero');
      document.getElementById('guest-name').focus();
      return;
    }

    const attendance = document.querySelector('input[name="attendance"]:checked').value;
    const guestsCount = document.getElementById('guests-count').value;
    const dietary = document.getElementById('dietary-needs').value.trim();

    let message = `💍 *CONFIRMACIÓN DE ASISTENCIA - BODA JOAQUÍN & VALDELENE* 🌿\n\n`;
    message += `👤 *Invitado(s):* ${name}\n`;
    
    if (attendance === 'si') {
      message += `✨ *Asistencia:* ¡SÍ, ASISTIRÉ CON ALEGRÍA!\n`;
      message += `👥 *Total de pases:* ${guestsCount} persona(s)\n`;
      if (dietary) message += `🍽️ *Restricción alimentaria:* ${dietary}\n`;
      message += `\n¡Con muchas ganas de celebrar este día con ustedes! 🥂`;
    } else {
      message += `🤍 *Asistencia:* Lo siento mucho, no podré asistir en esta ocasión.\n`;
      message += `\n¡Les deseo todo el amor y la felicidad del mundo en su matrimonio! 🕊️`;
    }

    // Abre WhatsApp directamente con el teléfono de los novios (+56 9 7301 9072)
    const weddingPhone = '56973019072';
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${weddingPhone}&text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    showToast('Abriendo WhatsApp (+56 9 7301 9072) con tu confirmación 💬');
  });

  // Guardado local de confirmación
  rsvpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('guest-name').value.trim();
    if (!name) return;

    const attendance = document.querySelector('input[name="attendance"]:checked').value;
    const guestsCount = document.getElementById('guests-count').value;

    const confirmationData = {
      name,
      attendance,
      guestsCount,
      date: new Date().toLocaleDateString()
    };

    // Guardar en localStorage
    let rsvpList = JSON.parse(localStorage.getItem('wedding_rsvp_list') || '[]');
    rsvpList.push(confirmationData);
    localStorage.setItem('wedding_rsvp_list', JSON.stringify(rsvpList));

    rsvpStatus.className = 'rsvp-status-message success';
    rsvpStatus.textContent = `¡Muchas gracias ${name}! Tu respuesta ha quedado registrada. Esperamos verte pronto 🤍`;

    showToast('¡Respuesta guardada con éxito! ✨');
  });


  // ============================================================
  // 9. LIBRO DE FIRMAS Y BUENOS DESEOS (Guestbook)
  // ============================================================
  const defaultWishes = [
    {
      author: "Familia Moya",
      message: "¡Qué emoción tan grande verlos dar este paso! Que Dios colme su nuevo hogar de bendiciones y amor eterno. Los amamos con todo el corazón.",
      date: "09/10/2026"
    },
    {
      author: "Mariana & Lucas",
      message: "¡La pareja más linda y auténtica! No tenemos dudas de que será una boda inolvidable y llena de momentos mágicos. ¡A preparar los zapatos de baile! 🥂✨",
      date: "09/10/2026"
    }
  ];

  function loadWishes() {
    let wishes = defaultWishes;
    try {
      const saved = localStorage.getItem('wedding_wishes_list');
      if (saved) {
        wishes = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error leyendo localStorage de deseos:', e);
    }

    if (!wishesList) return;
    wishesList.innerHTML = '';
    wishes.forEach(w => {
      const item = document.createElement('div');
      item.className = 'wish-item';
      item.innerHTML = `
        <div class="wish-header">
          <span class="wish-author">${escapeHtml(w.author)}</span>
          <span class="wish-date">${escapeHtml(w.date)}</span>
        </div>
        <p class="wish-body">“${escapeHtml(w.message)}”</p>
      `;
      wishesList.appendChild(item);
    });
  }

  if (wishesForm) {
    wishesForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const authorInput = document.getElementById('wish-author');
      const messageInput = document.getElementById('wish-message');

      const author = authorInput ? authorInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      if (!author || !message) {
        showToast('Por favor completa tu nombre y mensaje');
        return;
      }

      const newWish = {
        author,
        message,
        date: new Date().toLocaleDateString('es-CL')
      };

      try {
        let wishes = [];
        const saved = localStorage.getItem('wedding_wishes_list');
        if (saved) {
          wishes = JSON.parse(saved);
        } else {
          wishes = [...defaultWishes];
        }
        wishes.unshift(newWish);
        localStorage.setItem('wedding_wishes_list', JSON.stringify(wishes));
      } catch (err) {
        console.warn('Error guardando en localStorage:', err);
      }

      wishesForm.reset();
      loadWishes();
      showToast('¡Tu mensaje ha sido publicado en el mural! 🕊️');
    });
  }

  loadWishes();


  // ============================================================
  // 10. NOTIFICACIÓN TOAST FLOTANTE
  // ============================================================
  let toastTimer;
  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  function escapeHtml(string) {
    const div = document.createElement('div');
    div.textContent = string;
    return div.innerHTML;
  }

});
