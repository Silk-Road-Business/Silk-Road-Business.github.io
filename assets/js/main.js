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

  document.querySelectorAll('[data-company-application-form]').forEach(function (form) {
    const submitButton = form.querySelector('[data-company-application-submit]');
    const status = form.querySelector('[data-company-application-status]');
    const fallback = form.querySelector('[data-company-application-fallback]');
    const honeypot = form.querySelector('[data-company-application-honeypot]');
    let responseFrame = document.querySelector('[data-company-application-frame]');
    const defaultButtonText = submitButton ? submitButton.textContent : '提交申请';
    const minFillMs = Number(form.getAttribute('data-min-fill-ms')) || 2000;
    const timeoutMs = Number(form.getAttribute('data-timeout-ms')) || 15000;
    let openedAt = Date.now();
    let isSubmitting = false;
    let isAwaitingFrame = false;
    let timeoutId = null;
    let activeFrame = null;
    let frameSequence = 0;

    function setStatus(message, state) {
      if (!status) return;
      status.textContent = message;
      status.classList.remove('is-submitting', 'is-success', 'is-error');
      if (state) status.classList.add('is-' + state);
    }

    function restoreControls() {
      isSubmitting = false;
      form.removeAttribute('aria-busy');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = defaultButtonText;
      }
    }

    if (!submitButton || submitButton.disabled || !responseFrame) return;

    function bindResponseFrame(frame) {
      frame.addEventListener('load', function () {
        if (frame !== activeFrame || !isSubmitting || !isAwaitingFrame) return;

        window.clearTimeout(timeoutId);
        activeFrame = null;
        isAwaitingFrame = false;
        form.reset();
        openedAt = Date.now();
        if (fallback) fallback.hidden = true;
        setStatus('申请已发送，我们将在审核后与您联系。', 'success');
        restoreControls();
      });
    }

    function replaceResponseFrame(onReady) {
      frameSequence += 1;
      responseFrame.remove();

      const nextFrame = document.createElement('iframe');
      nextFrame.className = 'company-application-response-frame';
      nextFrame.name = 'company-application-response-' + Date.now() + '-' + frameSequence;
      nextFrame.title = '企业入驻申请提交响应';
      nextFrame.hidden = true;
      nextFrame.setAttribute('data-company-application-frame', '');
      nextFrame.addEventListener('load', function handleInitialLoad() {
        nextFrame.removeEventListener('load', handleInitialLoad);
        bindResponseFrame(nextFrame);
        onReady();
      });
      nextFrame.src = 'about:blank';
      form.insertAdjacentElement('afterend', nextFrame);
      responseFrame = nextFrame;
      form.target = nextFrame.name;
    }

    bindResponseFrame(responseFrame);

    form.addEventListener('submit', function (event) {
      if (isSubmitting) {
        event.preventDefault();
        return;
      }

      if (honeypot && honeypot.value.trim() !== '') {
        event.preventDefault();
        setStatus('暂时无法提交，请稍后重试。', 'error');
        return;
      }

      if (Date.now() - openedAt < minFillMs) {
        event.preventDefault();
        setStatus('填写时间过短，请检查资料后再次提交。', 'error');
        return;
      }

      isSubmitting = true;
      isAwaitingFrame = true;
      activeFrame = responseFrame;
      form.setAttribute('aria-busy', 'true');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '正在提交…';
      }
      if (fallback) fallback.hidden = true;
      setStatus('正在提交，请稍候。', 'submitting');

      timeoutId = window.setTimeout(function () {
        if (!isSubmitting || !isAwaitingFrame) return;

        activeFrame = null;
        isAwaitingFrame = false;
        setStatus('暂时无法确认提交状态，请保留当前资料并重试，或使用备用表单。', 'error');
        if (fallback) fallback.hidden = false;
        replaceResponseFrame(restoreControls);
      }, timeoutMs);
    });
  });
})();
