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
    const openedAt = Date.now();
    const minFillMs = Number(form.getAttribute('data-min-fill-ms')) || 2000;
    if (!submitButton || submitButton.disabled || !status) return;

    form.addEventListener('submit', function (event) {
      status.classList.remove('is-error');
      if (honeypot && honeypot.value.trim() !== '') {
        event.preventDefault();
        status.textContent = '暂时无法提交，请稍后重试。';
        status.classList.add('is-error');
      } else if (Date.now() - openedAt < minFillMs) {
        event.preventDefault();
        status.textContent = '填写时间过短，请检查资料后再次提交。';
        status.classList.add('is-error');
      }
      // Native navigation displays Google's actual receipt or validation error.
      // No iframe load, submit event, or navigation is treated as a received lead.
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
