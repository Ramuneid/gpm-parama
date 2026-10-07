'use strict';
const $ = id => document.getElementById(id);
const nf = new Intl.NumberFormat('lt-LT', {maximumFractionDigits: 0});
const money = new Intl.NumberFormat('lt-LT', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0});
const precise = new Intl.NumberFormat('lt-LT', {style: 'currency', currency: 'EUR', maximumFractionDigits: 2});
const fmt = (value, kind = 'number') => value == null ? 'Nežinoma' : (kind === 'money' ? money : kind === 'precise' ? precise : nf).format(value);
const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('lt').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const sizeGroup = amount => amount == null ? -1 : amount <= 1000 ? 0 : amount <= 10000 ? 1 : amount <= 50000 ? 2 : amount <= 100000 ? 3 : 4;
const state = {data: null, organizations: [], byCode: new Map(), selected: new Set(), visible: [], page: 0, perPage: 15, chart: null, detailCodes: [], colors: ['#A65D23', '#4B574B', '#8C491F']};
if (typeof Chart !== 'undefined') {
  Chart.defaults.font.family = '"Public Sans", Arial, sans-serif';
  Chart.defaults.color = '#4B574B';
}
function element(tag, text, className) {
  const el = document.createElement(tag);
  if (text != null) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function notify(message) { $('notice').textContent = message; }
async function load() {
  $('error').hidden = true;
  try {
    const datasets = {
      parties: './data/politines-partijos.json',
      unions: './data/profesines-sajungos.json',
    };
    const scope = document.body.dataset.scope;
    if (scope && !datasets[scope]) throw new Error('Unknown page scope');
    const response = await fetch(scope ? datasets[scope] : './data/recipients.json');
    if (!response.ok) throw new Error('Data not available');
    state.data = await response.json();
    if (!Array.isArray(state.data.organizations) || !state.data.years?.length) throw new Error('Invalid data');
    try {
      const themeResponse = await fetch('./assets/theme.json');
      if (themeResponse.ok) {
        const theme = await themeResponse.json();
        // Distinct, dark series colours remain legible on the Honey Sage paper.
        state.colors = [theme.dataColors[0], theme.dataColors[1], theme.sequentialColors[4]];
      }
    } catch (_) { /* The matching default theme keeps the site usable offline. */ }
    state.organizations = state.data.organizations.map(org => ({...org, searchable: normalize(org.name + ' ' + org.code), years: new Map(org.history.map(row => [row[0], row]))}));
    state.byCode = new Map(state.organizations.map(org => [org.code, org]));
    $('year').replaceChildren(...[...state.data.years].reverse().map(year => new Option(String(year), String(year))));
    const municipalities = [...new Set(state.organizations.map(org => org.municipality).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'lt'));
    $('municipality').replaceChildren(new Option('Visos savivaldybės', ''), ...municipalities.map(name => new Option(name, name)));
    for (const id of ['search', 'search-button', 'year', 'municipality', 'size', 'sort']) $(id).disabled = false;
    $('data-date').textContent = 'Duomenų eksportas: ' + new Intl.DateTimeFormat('lt-LT').format(new Date(state.data.exportedAt)) + '.';
    applyFilters();
    route();
  } catch (error) {
    $('error').hidden = false;
    $('result-count').textContent = 'Duomenys nepasiekiami';
    $('stats').replaceChildren(element('p', 'Duomenys nepasiekiami'));
  }
}
function applyFilters() {
  if (!state.data) return;
  state.page = 0;
  const year = Number($('year').value), query = normalize($('search').value), terms = query.split(' ').filter(Boolean);
  const municipality = $('municipality').value, size = $('size').value;
  state.visible = state.organizations.filter(org => {
    const row = org.years.get(year);
    return terms.every(term => org.searchable.includes(term)) && (!municipality || org.municipality === municipality)
      && (size === '' || (row && sizeGroup(row[1]) === Number(size)));
  });
  const sort = $('sort').value;
  state.visible.sort((a,b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'lt') || a.code.localeCompare(b.code);
    const index = sort === 'requests' ? 2 : sort === 'transferred' ? 3 : 1;
    const av = a.years.get(year)?.[index], bv = b.years.get(year)?.[index];
    const delta = av == null && bv == null ? 0 : av == null ? 1 : bv == null ? -1 : bv - av;
    return delta || a.name.localeCompare(b.name, 'lt') || a.code.localeCompare(b.code);
  });
  const summary = state.data.summary.find(row => row.year === year);
  $('stats').replaceChildren(...[
    [summary.amount, 'money', `${year} m. apskaičiuota suma`],
    [summary.transferred, 'money', `${year} m. pervesta suma`, year === 2025 && summary.transferred == null],
    [summary.recipients, 'number', `${year} m. paramos gavėjų`],
    [summary.requests, 'number', `${year} m. prašymų`],
  ].map(([value, kind, label, hasNote]) => {
    const stat = element('div', null, 'stat');
    const displayValue = element('span', fmt(value, kind), 'stat-value');
    if (hasNote) {
      const marker = element('sup', '*');
      marker.setAttribute('aria-hidden', 'true');
      displayValue.append(marker);
      displayValue.setAttribute('aria-describedby', 'transfer-note');
    }
    stat.append(displayValue, element('span', label, 'stat-label'));
    return stat;
  }));
  renderResults();
}
function renderResults() {
  const year = Number($('year').value), count = state.visible.length;
  $('result-count').textContent = `${nf.format(count)} organizacijų · metinės sumos: ${year}`;
  $('empty').hidden = count > 0;
  $('result-body').replaceChildren(...state.visible.slice(state.page * state.perPage, (state.page + 1) * state.perPage).map(org => {
    const tr = element('tr'), nameCell = element('td'), link = element('a', org.name, 'organization-link');
    link.href = '#org=' + encodeURIComponent(org.code);
    nameCell.append(link, element('small', 'Kodas ' + org.code));
    const row = org.years.get(year);
    tr.append(nameCell, element('td', org.municipality || 'Nežinoma'),
      element('td', row ? fmt(row[1], 'money') : 'Nėra įrašo', 'numeric'),
      element('td', row ? fmt(row[3], 'money') : 'Nėra įrašo', 'numeric'),
      element('td', row ? fmt(row[2]) : 'Nėra įrašo', 'numeric'));
    const action = element('td'), button = element('button', state.selected.has(org.code) ? 'Pašalinti' : 'Palyginti', 'compare-button');
    button.setAttribute('aria-pressed', String(state.selected.has(org.code)));
    button.setAttribute('aria-label', (state.selected.has(org.code) ? 'Pašalinti: ' : 'Palyginti: ') + org.name);
    button.disabled = state.selected.size >= 3 && !state.selected.has(org.code);
    button.addEventListener('click', () => toggleCompare(org.code));
    action.append(button); tr.append(action); return tr;
  }));
  window.GpmTerms?.refresh();
  const pages = Math.max(1, Math.ceil(count / state.perPage));
  $('page-label').textContent = count ? `${state.page + 1} / ${pages}` : '0 rezultatų';
  $('previous').disabled = state.page === 0;
  $('next').disabled = state.page + 1 >= pages;
}
function toggleCompare(code) {
  if (state.selected.has(code)) state.selected.delete(code);
  else if (state.selected.size < 3) state.selected.add(code);
  updateCompare();
  renderResults();
}
function updateCompare() {
  const count = state.selected.size;
  $('compare-tray').hidden = !count;
  $('tray-label').textContent = `Pasirinkta palyginimui: ${count} iš 3`;
  $('open-compare').disabled = count < 2;
  notify(`Pasirinkta organizacijų: ${count}.`);
}
function route() {
  if (!state.data) return;
  const params = new URLSearchParams(location.hash.slice(1));
  let codes = params.has('org') ? [params.get('org')] : (params.get('compare') || '').split(',');
  codes = [...new Set(codes.filter(code => state.byCode.has(code)))].slice(0,3);
  if (!codes.length) { $('detail').hidden = true; return; }
  if (params.has('compare')) { state.selected = new Set(codes); updateCompare(); renderResults(); }
  showDetail(codes);
}
function showDetail(codes) {
  const measure = Number($('chart-measure').value);
  const measureLabel = measure === 3 ? 'Pervesta suma' : 'Apskaičiuota suma';
  $('chart-title').textContent = measureLabel;
  $('history-chart').setAttribute('aria-label', measureLabel + '. Reikšmės pateiktos lentelėje.');
  state.detailCodes = codes;
  const organizations = codes.map(code => state.byCode.get(code));
  $('detail').hidden = false;
  $('detail-kind').textContent = codes.length === 1 ? 'ORGANIZACIJOS ISTORIJA' : 'ORGANIZACIJŲ PALYGINIMAS';
  $('detail-title').textContent = codes.length === 1 ? organizations[0].name : 'Parama per šešerius metus';
  $('detail-subtitle').textContent = codes.length === 1 ? `Kodas ${codes[0]} · ${organizations[0].municipality || 'Savivaldybė nežinoma'}` : `${codes.length} organizacijos · 2020–2025`;
  $('selected-list').replaceChildren(...organizations.map((org, i) => {
    const label = element('span', org.name); label.style.borderColor = state.colors[i]; return label;
  }));
  const tbody = $('history-table').querySelector('tbody');
  tbody.replaceChildren(...organizations.flatMap(org => [...state.data.years].reverse().map(year => {
    const row = org.years.get(year), tr = element('tr');
    const ratio = row && row[1] != null && row[2] > 0 ? row[1] / row[2] : null;
    tr.append(element('td', org.name), element('td', String(year)),
      element('td', row ? fmt(row[1], 'precise') : 'Nėra įrašo', 'numeric'),
      element('td', row ? fmt(row[3], 'precise') : 'Nėra įrašo', 'numeric'),
      element('td', row ? fmt(row[2]) : 'Nėra įrašo', 'numeric'),
      element('td', ratio == null ? 'Neapibrėžta' : fmt(ratio, 'precise'), 'numeric'));
    return tr;
  })));
  state.chart?.destroy();
  $('chart-error').hidden = typeof Chart !== 'undefined';
  if (typeof Chart !== 'undefined') {
    state.chart = new Chart($('history-chart'), {
      type: 'line',
      data: {labels: state.data.years, datasets: organizations.map((org, i) => ({label: org.name,
        data: state.data.years.map(year => org.years.get(year)?.[measure] ?? null),
        borderColor: state.colors[i], backgroundColor: state.colors[i], pointBorderWidth: 0,
        borderWidth: 2.5, pointRadius: 4, pointHoverRadius: 6, tension: 0, spanGaps: false,
      }))},
      options: {responsive: true, maintainAspectRatio: false, animation: false,
        layout: {padding: {top: 28, left: 20, right: 35}},
        interaction: {mode: 'index', intersect: false},
        plugins: {legend: {display: false}, tooltip: {callbacks: {label: item => item.dataset.label + ': ' + fmt(item.parsed.y, 'precise')}}},
        scales: {x: {grid: {display: false}, ticks: {color: '#626D61'}},
          y: {beginAtZero: true, grace: '15%', border: {display: false}, grid: {color: ctx => ctx.tick.value === 0 ? '#4B574B40' : 'transparent'},
            ticks: {color: '#626D61', maxTicksLimit: 5, callback: value => new Intl.NumberFormat('lt-LT', {notation: 'compact', maximumFractionDigits: 1}).format(value) + ' €'}}}},
      plugins: [{id: 'values', afterDatasetsDraw(chart) {
        if (organizations.length > 1) return;
        const ctx = chart.ctx; ctx.save(); ctx.font = '11px "Public Sans", Arial'; ctx.fillStyle = '#4B574B';
        chart.getDatasetMeta(0).data.forEach((point, index) => {
          const value = chart.data.datasets[0].data[index]; if (value == null) return;
          ctx.textAlign = index === 0 ? 'left' : index === 5 ? 'right' : 'center';
          ctx.fillText(new Intl.NumberFormat('lt-LT', {notation: 'compact', maximumFractionDigits: 1}).format(value) + ' €', point.x, point.y - 13);
        }); ctx.restore();
      }}],
    });
  }
  $('share-status').textContent = '';
  requestAnimationFrame(() => { $('detail').scrollIntoView({behavior: 'auto', block: 'start'}); $('detail').focus({preventScroll:true}); });
}
$('search-form').addEventListener('submit', event => {event.preventDefault(); applyFilters(); $('results').scrollIntoView({behavior: 'auto'});});
let timer;
$('search').addEventListener('input', () => {clearTimeout(timer); timer = setTimeout(applyFilters, 150);});
for (const id of ['year', 'municipality', 'size', 'sort']) $(id).addEventListener('change', applyFilters);
document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => {
  $('search').value = button.dataset.query; applyFilters(); $('results').scrollIntoView({behavior: 'auto'});
}));
$('reset').addEventListener('click', () => { $('search').value = ''; $('municipality').value = ''; $('size').value = ''; $('sort').value = 'amount'; applyFilters(); });
$('previous').addEventListener('click', () => {state.page--; renderResults();});
$('next').addEventListener('click', () => {state.page++; renderResults();});
function openComparison() { if (state.selected.size >= 2) location.hash = 'compare=' + [...state.selected].map(encodeURIComponent).join(','); }
$('open-compare').addEventListener('click', openComparison);
$('clear-compare').addEventListener('click', () => {state.selected.clear(); updateCompare(); renderResults();});
$('close-detail').addEventListener('click', () => {history.replaceState(null, '', location.pathname + location.search); $('detail').hidden = true; $('results').focus();});
$('share').addEventListener('click', async () => {
  try {await navigator.clipboard.writeText(location.href); $('share-status').textContent = 'Nuoroda nukopijuota.';}
  catch (_) {$('share-status').textContent = 'Nuoroda: ' + location.href;}
});
$('retry').addEventListener('click', load);
$('chart-measure').addEventListener('change', () => {if (state.detailCodes.length) showDetail(state.detailCodes);});
window.addEventListener('hashchange', route);
load();
