(function () {
  const button = document.querySelector('[data-menu-button]');
  const nav = document.querySelector('.site-nav');

  if (button && nav) {
    button.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('is-open');
      button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  document.querySelectorAll('[data-share-button]').forEach(function (shareButton) {
    shareButton.addEventListener('click', async function () {
      const title = shareButton.getAttribute('data-share-title') || document.title;
      const url = window.location.href;
      const status = shareButton.parentElement.querySelector('[data-share-status]');

      try {
        if (navigator.share) {
          await navigator.share({ title: title, url: url });
          if (status) status.textContent = '已打开分享菜单';
          return;
        }

        await navigator.clipboard.writeText(url);
        if (status) status.textContent = '链接已复制';
      } catch (error) {
        if (status) status.textContent = '可复制浏览器地址进行分享';
      }
    });
  });
})();