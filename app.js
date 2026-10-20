const dialog = document.getElementById('photo-dialog');
const largePhoto = document.getElementById('large-photo');
const caption = document.getElementById('photo-caption');
let lastPhotoButton;
document.querySelectorAll('[data-photo]').forEach(button => {
  button.addEventListener('click', () => {
    lastPhotoButton = button;
    largePhoto.src = button.dataset.photo;
    largePhoto.alt = button.querySelector('img').alt;
    caption.textContent = button.dataset.caption;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  });
});
document.getElementById('close-photo').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.style.overflow = '';
  lastPhotoButton?.focus({preventScroll:true});
});
document.getElementById('share').addEventListener('click', async () => {
  const status = document.getElementById('share-status');
  const url = new URL(location.href);
  url.hash = '';
  const data = {title:'우주하의 첫 생일 파티',text:'2026년 10월 24일 토요일 오전 11시 · 도담헌 · 가회저택',url:url.href};
  status.textContent = '';
  try {
    if (navigator.share) {
      await navigator.share(data);
    } else if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url.href);
      status.textContent = '초대장 링크를 복사했어요. 카카오톡에 붙여넣어 주세요.';
    } else {
      status.textContent = '주소창의 링크를 복사해 공유해 주세요.';
    }
  } catch (error) {
    if (error.name !== 'AbortError') status.textContent = '주소창의 링크를 복사해 공유해 주세요.';
  }
});

document.querySelectorAll('.copy-address').forEach(button => {
  button.addEventListener('click', async () => {
    const status = document.getElementById(button.dataset.status || 'address-status');
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(button.dataset.address);
      status.textContent = '주소를 복사했어요.';
    } catch {
      status.textContent = '위 주소를 길게 눌러 복사해 주세요.';
    }
  });
});

// Official NAVER Maps scheme; desktop visitors retain the regular web link.
function naverMapAppURL(details, android) {
  const action = details.mapAction === 'place' ? 'place' : 'search';
  const parameters = action === 'place'
    ? {lat: details.lat, lng: details.lng, name: details.name}
    : {query: details.query};
  parameters.appname = 'https://woosunghyeon.github.io/juha-first-birthday-2026/';
  // URL schemes use percent-encoded spaces; do not rely on app parsers treating "+" as a space.
  const query = new URLSearchParams(parameters).toString().replace(/\+/g, '%20');
  const destination = `${action}?${query}`;
  if (!android) return `nmap://${destination}`;
  const store = 'https://play.google.com/store/apps/details?id=com.nhn.android.nmap';
  return `intent://${destination}#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;S.browser_fallback_url=${encodeURIComponent(store)};end`;
}

function configureNaverMapLinks() {
  const android = /Android/i.test(navigator.userAgent);
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  if (!android && !ios) return;
  document.querySelectorAll('.naver-app-link').forEach(link => {
    const webURL = link.href;
    link.href = naverMapAppURL(link.dataset, android);
    link.removeAttribute('target');
    const help = document.createElement('p');
    help.className = 'map-help';
    help.hidden = true;
    help.append('앱이 열리지 않나요? ');
    const webLink = document.createElement('a');
    webLink.href = webURL;
    webLink.target = '_blank';
    webLink.rel = 'noopener noreferrer';
    webLink.textContent = '웹 지도';
    const installLink = document.createElement('a');
    installLink.href = android
      ? 'https://play.google.com/store/apps/details?id=com.nhn.android.nmap'
      : 'https://apps.apple.com/app/id311867728';
    installLink.textContent = '앱 설치';
    help.append(webLink, installLink);
    (link.closest('.venue-map-actions') || link).insertAdjacentElement('afterend', help);
    let timer;
    function clearFallback() {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', clearFallback);
    }
    function onVisibility() {
      if (document.hidden) clearFallback();
    }
    link.addEventListener('click', () => {
      clearFallback();
      help.hidden = true;
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('pagehide', clearFallback, {once: true});
      timer = setTimeout(() => {
        if (!document.hidden) help.hidden = false;
        clearFallback();
      }, 2500);
      // The anchor's default action opens the app directly from this user tap.
    });
  });
}

function revealSectionsOnScroll() {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;
  const targets = document.querySelectorAll(
    '#invitation > *, .section-heading, .memory, #party > *, ' +
    '.location-heading, .venue-card, .entrance-guide, .meal-guide, ' +
    '.parking-guide, .arrival-details, .ending > p, .ending > strong, .footer-actions'
  );
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.replace('reveal-pending', 'is-revealed');
      observer.unobserve(entry.target);
    });
  }, {threshold: 0.08, rootMargin: '0px 0px -24px 0px'});
  targets.forEach(target => {
    if (target.getBoundingClientRect().top < window.innerHeight - 24) return;
    target.classList.add('reveal-pending');
    observer.observe(target);
  });
  motion.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    targets.forEach(target => target.classList.replace('reveal-pending', 'is-revealed'));
  });
}

configureNaverMapLinks();
revealSectionsOnScroll();

const music = document.getElementById('background-music');
const musicToggle = document.getElementById('music-toggle');
const musicLabel = document.getElementById('music-label');
const musicStatus = document.getElementById('music-status');
let musicRequested = true;
let musicRequestId = 0;
let musicPlayPending = false;
let waitingForMusicGesture = false;
const musicGestureEvents = ['touchend', 'click', 'keydown'];
music.volume = 0.25;

function showMusicState(state) {
  musicToggle.dataset.state = state;
  musicToggle.setAttribute('aria-pressed', String(musicRequested));
  musicLabel.textContent = musicRequested ? '음악 끄기' : '음악 켜기';
  musicToggle.setAttribute('aria-label', musicRequested ? '배경음악 끄기' : '배경음악 켜기');
}

function removeMusicGestureListeners() {
  musicGestureEvents.forEach(type => document.removeEventListener(type, startMusicOnGesture, true));
  waitingForMusicGesture = false;
}

function waitForMusicGesture() {
  if (waitingForMusicGesture || !musicRequested) return;
  musicGestureEvents.forEach(type => document.addEventListener(type, startMusicOnGesture, {capture: true, passive: true}));
  waitingForMusicGesture = true;
}

function startMusicOnGesture(event) {
  // A first tap on the off button must never start the music, including its icon.
  if (!musicRequested || musicToggle.contains(event.target) || !music.paused) return;
  if (event.type === 'keydown' && ['Tab', 'Escape', 'Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return;
  startMusic();
}

function stopMusic() {
  musicRequested = false;
  musicRequestId += 1;
  musicPlayPending = false;
  music.autoplay = false;
  removeMusicGestureListeners();
  music.pause();
  showMusicState('paused');
  musicStatus.textContent = '';
}

function handleMusicFailure(error, requestId) {
  if (requestId !== musicRequestId || !musicRequested) return;
  musicPlayPending = false;
  if (error?.name === 'NotAllowedError' || error?.name === 'AbortError') {
    showMusicState('waiting-gesture');
    musicStatus.textContent = '화면을 터치하면 음악이 시작돼요.';
    waitForMusicGesture();
    return;
  }
  stopMusic();
  musicStatus.textContent = '음악을 재생하지 못했어요. 다시 눌러 주세요.';
}

function startMusic() {
  if (!musicRequested) return;
  const requestId = ++musicRequestId;
  musicPlayPending = true;
  music.autoplay = true;
  musicStatus.textContent = '';
  showMusicState('loading');
  try {
    if (music.error) music.load();
    // Gesture retries call play() synchronously to retain mobile user activation.
    const playback = music.play();
    playback?.then(() => {
      if (requestId !== musicRequestId || !musicRequested) return;
      musicPlayPending = false;
      if (!music.paused) {
        showMusicState('playing');
        removeMusicGestureListeners();
      }
    }).catch(error => {
      handleMusicFailure(error, requestId);
    });
  } catch (error) {
    handleMusicFailure(error, requestId);
  }
}

musicToggle.addEventListener('click', () => {
  if (musicRequested) {
    stopMusic();
  } else {
    musicRequested = true;
    waitForMusicGesture();
    startMusic();
  }
});

music.addEventListener('playing', () => {
  if (!musicRequested) {
    music.pause();
    return;
  }
  musicPlayPending = false;
  musicStatus.textContent = '';
  showMusicState('playing');
  removeMusicGestureListeners();
});
music.addEventListener('waiting', () => {
  if (musicRequested) showMusicState('loading');
});
music.addEventListener('pause', () => {
  // Ignore a blocked start or an older pause event during a new play request.
  if (!music.paused) return;
  if (musicPlayPending || musicToggle.dataset.state === 'waiting-gesture') return;
  stopMusic();
});
music.addEventListener('error', () => {
  if (musicRequested) handleMusicFailure(music.error, musicRequestId);
});

waitForMusicGesture();
startMusic();
