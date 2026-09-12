(() => {
  const root = document.querySelector('[data-share]');
  const canonical = document.querySelector('link[rel="canonical"]');
  if (!root || !canonical) return;
  let url;
  try { url = new URL(canonical.href); } catch { return; }
  if (url.protocol !== 'https:') return;
  const title = document.querySelector('h1').textContent.trim();
  const data = { title, url: url.href };
  const status = root.querySelector('[data-share-status]');
  const fallback = root.querySelector('[data-share-fallback]');
  const manual = () => {
    fallback.hidden = false;
    fallback.value = url.href;
    fallback.focus();
    fallback.select();
    status.textContent = '请复制下方网址。';
  };
  root.querySelector('.page-share__actions').hidden = false;
  root.querySelector('[data-share-facebook]').href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url.href);
  root.querySelector('[data-share-whatsapp]').href = 'https://wa.me/?text=' + encodeURIComponent(title + '\n' + url.href);
  root.querySelector('[data-share-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url.href);
      status.textContent = '链接已复制';
      const copy = root.querySelector('[data-share-copy]');
      copy.classList.add('is-copied');
      clearTimeout(copy.resetTimer);
      copy.resetTimer = setTimeout(() => copy.classList.remove('is-copied'), 2000);
    } catch { manual(); }
  });
  const native = root.querySelector('[data-share-native]');
  native.hidden = typeof navigator.share !== 'function';
  native.addEventListener('click', async () => {
    try { await navigator.share(data); }
    catch (error) { if (error.name !== 'AbortError') manual(); }
  });
  const qr = root.querySelector('[data-share-qr]');
  const dialog = root.querySelector('[data-share-dialog]');
  dialog.querySelector('[data-share-title]').textContent = title;
  dialog.querySelector('[data-share-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => qr.focus());
  let ready = false;
  qr.addEventListener('click', () => {
    dialog.showModal();
    if (ready) return;
    const output = dialog.querySelector('.page-share__qr');
    try {
      new QRCode(output, { text: url.href, width: 192, height: 192, correctLevel: QRCode.CorrectLevel.M });
      ready = true;
    } catch {
      output.textContent = '二维码暂不可用，请复制链接。';
    }
  });
})();
