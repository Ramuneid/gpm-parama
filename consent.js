(() => {
  'use strict';
  const key = 'gpm-parama:analytics-consent:v1';
  const valid = value => value === 'accepted' || value === 'rejected';
  let choice = null;
  try { choice = localStorage.getItem(key); } catch (_) { /* Ask again when storage is unavailable. */ }
  let loaded = false;
  const banner = document.createElement('section');
  banner.className = 'consent-banner';
  banner.setAttribute('aria-label', 'Lankomumo statistikos pasirinkimas');
  banner.innerHTML = '<div class="wrap consent-inner"><p>Naudojame analitiką svetainės statistikai. <a href="privatumo-politika.html">Privatumo politika</a></p><div class="consent-actions"><button type="button" data-choice="rejected">Atmesti</button><button type="button" data-choice="accepted">Sutinku</button></div></div>';
  document.body.append(banner);
  function resize() {
    document.documentElement.style.setProperty('--consent-height', banner.hidden ? '0px' : banner.offsetHeight + 'px');
  }
  function show(visible) {
    banner.hidden = !visible;
    resize();
  }
  function enable() {
    if (loaded) return;
    loaded = true;
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.setAttribute('data-cf-beacon', JSON.stringify({token: '3325e93ceb974b8e80d7953d97ebd1fa'}));
    document.body.append(script);
  }
  banner.addEventListener('click', event => {
    const button = event.target.closest('button[data-choice]');
    if (!button) return;
    choice = button.dataset.choice;
    try { localStorage.setItem(key, choice); } catch (_) { /* Choice still applies to this page. */ }
    show(false);
    // Reload removes the already-running beacon when consent is withdrawn.
    if (choice === 'rejected' && loaded) { location.reload(); return; }
    if (choice === 'accepted') enable();
    document.querySelector('[data-consent-settings]')?.focus();
  });
  document.querySelectorAll('[data-consent-settings]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      show(true);
      banner.querySelector('button').focus();
    });
  });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    choice = event.newValue;
    if (loaded && choice !== 'accepted') { location.reload(); return; }
    show(!valid(choice));
    if (choice === 'accepted') enable();
  });
  new ResizeObserver(resize).observe(banner);
  show(!valid(choice));
  if (choice === 'accepted') enable();
})();
