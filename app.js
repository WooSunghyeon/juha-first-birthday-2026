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
let musicRequested = false;
let musicRequestId = 0;
music.volume = 0.25;

function showMusicState(state) {
  musicToggle.dataset.state = state;
  musicToggle.setAttribute('aria-pressed', String(state === 'playing'));
  musicLabel.textContent = state === 'playing' ? '음악 끄기' : state === 'loading' ? '불러오는 중' : '음악 듣기';
  musicToggle.setAttribute('aria-label', state === 'playing' ? '배경음악 일시정지' : state === 'loading' ? '배경음악 불러오기 취소' : '배경음악 듣기');
}

function stopMusicWithError(error) {
  musicRequested = false;
  musicRequestId += 1;
  music.pause();
  showMusicState('paused');
  if (error?.name !== 'AbortError') {
    musicStatus.textContent = '음악을 재생하지 못했어요. 다시 눌러 주세요.';
  }
}

musicToggle.addEventListener('click', () => {
  const requestId = ++musicRequestId;
  musicRequested = !musicRequested;
  musicStatus.textContent = '';
  if (!musicRequested) {
    music.pause();
    showMusicState('paused');
    return;
  }

  showMusicState('loading');
  try {
    if (music.error) music.load();
    // Keep play() inside this tap handler so mobile browsers retain the user gesture.
    const playback = music.play();
    playback?.then(() => {
      if (requestId !== musicRequestId || !musicRequested) return;
      if (!music.paused) showMusicState('playing');
    }).catch(error => {
      // A later tap may have intentionally cancelled this play request.
      if (requestId === musicRequestId && musicRequested) stopMusicWithError(error);
    });
  } catch (error) {
    if (requestId === musicRequestId) stopMusicWithError(error);
  }
});

music.addEventListener('playing', () => {
  if (musicRequested) showMusicState('playing');
  else music.pause();
});
music.addEventListener('waiting', () => {
  if (musicRequested) showMusicState('loading');
});
music.addEventListener('pause', () => {
  // Ignore an older queued pause event when a new tap has already resumed playback.
  if (!music.paused) return;
  musicRequested = false;
  musicRequestId += 1;
  showMusicState('paused');
});
music.addEventListener('error', () => {
  if (musicRequested) stopMusicWithError(music.error);
});
