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

const copyAddress = document.getElementById('copy-address');
copyAddress.addEventListener('click', async () => {
  const status = document.getElementById('address-status');
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(copyAddress.dataset.address);
    status.textContent = '주소를 복사했어요.';
  } catch {
    status.textContent = '위 주소를 길게 눌러 복사해 주세요.';
  }
});

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
