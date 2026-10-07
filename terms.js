(() => {
  'use strict';
  const definitions = new Map([
    ['Organizacija', 'GPM paramos gavėjas, nurodytas VMI duomenyse.'],
    ['Savivaldybė', 'Paskutinė žinoma organizacijos registracijos savivaldybė, nebūtinai jos veiklos ar rėmėjų gyvenamoji vieta.'],
    ['Apskaičiuota suma', 'Pagal gyventojų prašymus apskaičiuota GPM paramos suma.'],
    ['Pervesta suma', 'VMI duomenyse nurodyta pervesta GPM paramos suma, įskaitant ankstesnių metų perskaičiavimus.'],
    ['Prašymai', 'Prašymų skirti GPM paramą organizacijai skaičius, nebūtinai sutampantis su unikalių rėmėjų skaičiumi.'],
    ['Apskaičiuota vienam prašymui', 'Vidutinė paramos suma vienam prašymui: bendra apskaičiuota suma padalijama iš prašymų skaičiaus. Atskirų prašymų sumos gali skirtis.'],
    ['Metai', 'Metai nurodomi pagal VMI duomenų lentelę, o ne pagal pinigų pervedimo datą.'],
  ]);
  const popups = new Map();
  let active = null, pinned = false, closeTimer;
  function hide() {
    clearTimeout(closeTimer);
    if (active) {
      popups.get(active.dataset.term).hidden = true;
      active.setAttribute('aria-expanded', 'false');
    }
    active = null;
    pinned = false;
  }
  function show(button) {
    clearTimeout(closeTimer);
    if (active !== button) hide();
    active = button;
    const popup = popups.get(button.dataset.term);
    popup.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    const rect = button.getBoundingClientRect();
    const width = popup.offsetWidth, height = popup.offsetHeight;
    const margin = 12, gap = 6;
    const left = Math.max(margin, Math.min(rect.right - width, window.innerWidth - width - margin));
    const top = rect.top >= height + gap + margin ? rect.top - height - gap : rect.bottom + gap;
    popup.style.left = left + 'px';
    popup.style.top = Math.max(margin, Math.min(top, window.innerHeight - height - margin)) + 'px';
  }
  function scheduleHide() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!pinned && active !== document.activeElement) hide();
    }, 180);
  }
  // Body-level pop-ups remain visible outside horizontally scrolling tables.
  for (const [term, definition] of definitions) {
    const popup = document.createElement('div');
    popup.className = 'term-tooltip';
    popup.id = 'term-definition-' + popups.size;
    popup.setAttribute('role', 'tooltip');
    popup.textContent = definition;
    popup.hidden = true;
    popup.addEventListener('pointerenter', () => clearTimeout(closeTimer));
    popup.addEventListener('pointerleave', scheduleHide);
    document.body.append(popup);
    popups.set(term, popup);
  }
  function label(term) {
    const wrapper = document.createElement('span');
    wrapper.className = 'term-label';
    const text = document.createElement('span');
    text.textContent = term;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'term-help';
    button.dataset.term = term;
    button.setAttribute('aria-label', term + ': paaiškinimas');
    button.setAttribute('aria-describedby', popups.get(term).id);
    button.setAttribute('aria-expanded', 'false');
    const icon = document.createElement('img');
    icon.src = 'vendor/lucide-info.svg';
    icon.alt = '';
    icon.width = 14;
    icon.height = 14;
    button.append(icon);
    button.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') show(button); });
    button.addEventListener('pointerleave', scheduleHide);
    button.addEventListener('focus', () => show(button));
    button.addEventListener('blur', () => { if (active === button) hide(); });
    button.addEventListener('click', () => {
      if (active === button && pinned) hide();
      else { show(button); pinned = true; }
    });
    wrapper.append(text, button);
    return wrapper;
  }
  function refresh() {
    hide();
    document.querySelectorAll('.results-table th, #history-table th').forEach(cell => {
      if (cell.querySelector('.term-help')) return;
      const term = cell.textContent.trim();
      if (definitions.has(term)) cell.replaceChildren(label(term));
    });
  }
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  document.addEventListener('pointerdown', event => {
    if (active && !active.contains(event.target) && !popups.get(active.dataset.term).contains(event.target)) hide();
  });
  window.addEventListener('resize', hide);
  document.addEventListener('scroll', event => {
    if (active && event.target !== popups.get(active.dataset.term)) hide();
  }, true);
  window.GpmTerms = {refresh};
  refresh();
})();
