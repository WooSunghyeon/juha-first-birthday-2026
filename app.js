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
