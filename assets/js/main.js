(function () {
  const button = document.querySelector('[data-menu-button]');
  const nav = document.querySelector('.site-nav');
  const header = button ? button.closest('.site-header') : null;
  const menuMedia = window.matchMedia('(max-width: 980px)');

  if (button && nav && header) {
    const navLinks = Array.from(nav.querySelectorAll('a[href]'));

    function setMenuOpen(open, options) {
      const settings = options || {};
      const shouldOpen = Boolean(open && menuMedia.matches);
      nav.classList.toggle('is-open', shouldOpen);
      button.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');

      if (shouldOpen && settings.focusFirst && navLinks[0]) {
        navLinks[0].focus();
      } else if (!shouldOpen && settings.restoreFocus) {
        button.focus();
      }
    }

    header.classList.add('is-menu-enhanced');
    button.hidden = false;
    setMenuOpen(false);

    button.addEventListener('click', function () {
      const isOpen = button.getAttribute('aria-expanded') === 'true';
      setMenuOpen(!isOpen, { focusFirst: !isOpen });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        event.preventDefault();
        setMenuOpen(false, { restoreFocus: true });
      }
    });

    document.addEventListener('click', function (event) {
      if (button.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) {
        setMenuOpen(false);
      }
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        setMenuOpen(false);
      }
    });

    function handleMenuMediaChange(event) {
      if (!event.matches) setMenuOpen(false);
    }

    if (menuMedia.addEventListener) {
      menuMedia.addEventListener('change', handleMenuMediaChange);
    } else {
      menuMedia.addListener(handleMenuMediaChange);
    }
  }

  document.querySelectorAll('[data-company-application-form]').forEach(function (form) {
    const submitButton = form.querySelector('[data-company-application-submit]');
    const status = form.querySelector('[data-company-application-status]');
    const honeypot = form.querySelector('[data-company-application-honeypot]');
    const endpoint = form.getAttribute('data-endpoint');
    const openedAt = Date.now();
    const minFillMs = Number(form.getAttribute('data-min-fill-ms')) || 2000;
    const fieldNames = ['company_name', 'contact_name', 'phone', 'email', 'country', 'industry', 'summary', 'cooperation', 'consent'];
    let busy = false;
    if (!submitButton || !status || !endpoint || form.getAttribute('aria-disabled') === 'true') return;
    function message(text, error) {
      status.textContent = text;
      status.classList.toggle('is-error', Boolean(error));
    }
    submitButton.disabled = false;
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (busy) return;
      if (honeypot && honeypot.value.trim()) { message('暂时无法提交，请稍后重试。', true); return; }
      if (Date.now() - openedAt < minFillMs) { message('填写时间过短，请检查资料后再次提交。', true); return; }
      if (!form.reportValidity()) return;
      busy = true;
      submitButton.disabled = true;
      const fields = {};
      fieldNames.forEach(name => { fields[name] = form.elements.namedItem(name).value.trim(); form.elements.namedItem(name).disabled = true; });
      message('正在提交，请稍候。');
      try {
        const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit', redirect: 'error', body: JSON.stringify({ fields }), signal: AbortSignal.timeout(20000) });
        const body = await response.json();
        if (response.ok && body.status === 'received' && body.code === 'received') {
          message('已收到您的申请，等待人工审核。再次提交会新增一份申请。');
          // Analytics is best-effort and must never turn confirmed receipt into uncertainty.
          try { if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { form_id: 'company-application' }); } catch (_) { /* Receipt remains confirmed. */ }
        } else if (!response.ok && body.status === 'failed' && ['invalid_fields', 'rate_limited', 'unavailable'].includes(body.code)) {
          const messages = { invalid_fields: '资料未通过检查，尚未提交。请检查必填项、邮箱及长度后重试。', rate_limited: '提交过于频繁，本次未保存。请稍后再试。', unavailable: '收件服务暂不可用，本次未保存。请稍后重试或联系站点。' };
          message(messages[body.code], true);
        } else throw new Error('unknown_receipt');
      } catch (_) {
        message('暂时无法确认是否收到申请，重新提交可能产生重复记录。您可以稍后重试或联系站点核对。', true);
      } finally {
        fieldNames.forEach(name => { form.elements.namedItem(name).disabled = false; });
        busy = false;
        submitButton.disabled = false;
      }
    });
  });

  const consentBanner = document.querySelector('[data-consent-banner]');
  const consentAccept = document.querySelector('[data-consent-accept]');
  const consentReject = document.querySelector('[data-consent-reject]');
  const consentStatus = document.querySelector('[data-consent-status]');
  const consentSettingsButtons = Array.from(document.querySelectorAll('[data-consent-settings]'));

  if (consentBanner && consentAccept && consentReject && window.SRBizConsent) {
    let returnFocus = null;

    function setConsentStatus(message) {
      if (consentStatus) consentStatus.textContent = message;
    }

    function showConsentBanner(options) {
      const settings = options || {};
      consentBanner.hidden = false;
      if (settings.focus) consentAccept.focus();
    }

    function hideConsentBanner(message) {
      consentBanner.hidden = true;
      setConsentStatus(message);

      const focusTarget = returnFocus || document.querySelector('#main-content');
      returnFocus = null;
      if (focusTarget && typeof focusTarget.focus === 'function') {
        try {
          focusTarget.focus({ preventScroll: true });
        } catch (_) {
          focusTarget.focus();
        }
      }
    }

    if (!window.SRBizConsent.current()) {
      showConsentBanner();
    }

    consentAccept.addEventListener('click', function () {
      window.SRBizConsent.acceptAnalytics();
      hideConsentBanner('已同意分析 Cookie。您可以随时通过页脚中的 Cookie 设置修改选择。');
    });

    consentReject.addEventListener('click', function () {
      window.SRBizConsent.rejectAnalytics();
      hideConsentBanner('已拒绝分析 Cookie。启用统计的页面仍会发送不使用分析 Cookie 的基本访问统计。');
    });

    consentSettingsButtons.forEach(function (settingsButton) {
      settingsButton.hidden = false;
      settingsButton.addEventListener('click', function () {
        returnFocus = settingsButton;
        showConsentBanner({ focus: true });
      });
    });

    consentBanner.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && window.SRBizConsent.current()) {
        event.preventDefault();
        hideConsentBanner('Cookie 设置未更改。');
      }
    });
  }
})();
