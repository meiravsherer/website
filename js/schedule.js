/* Renders data/schedule.json into a weekly grid (desktop) and per-day list (mobile). */
(async function () {
  const root = document.getElementById('schedule');
  const listRoot = document.getElementById('schedule-list');
  const filtersRoot = document.getElementById('filters');
  const legendRoot = document.getElementById('legend');
  const notesRoot = document.getElementById('notes');

  const res = await fetch('data/schedule.json');
  const data = await res.json();

  const state = { category: 'all', branch: 'all' };

  root.style.setProperty('--days', data.days.length);
  document.querySelectorAll('[data-season]').forEach(el => el.textContent = el.dataset.season.replace('{season}', data.season));

  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  function visible(c) {
    return (state.category === 'all' || c.category === state.category) &&
           (state.branch === 'all' || c.branch === state.branch);
  }

  function card(c, withTime = true) {
    const b = data.branches[c.branch];
    const el = document.createElement('article');
    el.className = 'cls';
    el.dataset.branch = c.branch;
    el.innerHTML = `
      ${withTime ? `<div class="cls__time">${c.time}</div>` : ''}
      <div>
        <div class="cls__title">${c.title}</div>
        ${c.subtitle ? `<div class="cls__sub">${c.subtitle}</div>` : ''}
      </div>
      <span class="cls__branch">${b.short}</span>`;
    return el;
  }

  function renderGrid() {
    const classes = data.classes.filter(visible);
    root.innerHTML = '';
    if (!classes.length) { root.innerHTML = '<p class="empty">אין שיעורים התואמים לסינון</p>'; return; }

    const times = [...new Set(classes.map(c => c.time))].sort((a, b) => toMin(a) - toMin(b));

    root.appendChild(Object.assign(document.createElement('div'), { className: 'sched__corner' }));
    data.days.forEach(d => {
      const h = document.createElement('div'); h.className = 'sched__day'; h.textContent = d; root.appendChild(h);
    });

    times.forEach(t => {
      const tl = document.createElement('div'); tl.className = 'sched__time'; tl.textContent = t; root.appendChild(tl);
      data.days.forEach((_, di) => {
        const cell = document.createElement('div'); cell.className = 'sched__cell';
        classes.filter(c => c.day === di && c.time === t).forEach(c => cell.appendChild(card(c, false)));
        root.appendChild(cell);
      });
    });
  }

  function renderList() {
    const classes = data.classes.filter(visible);
    listRoot.innerHTML = '';
    data.days.forEach((d, di) => {
      const items = classes.filter(c => c.day === di).sort((a, b) => toMin(a.time) - toMin(b.time));
      if (!items.length) return;
      const sec = document.createElement('section'); sec.className = 'sched-list__day';
      sec.innerHTML = `<h3>יום ${d}</h3>`;
      const wrap = document.createElement('div'); wrap.className = 'sched-list__cards';
      items.forEach(c => wrap.appendChild(card(c, true)));
      sec.appendChild(wrap); listRoot.appendChild(sec);
    });
    if (!listRoot.children.length) listRoot.innerHTML = '<p class="empty">אין שיעורים התואמים לסינון</p>';
  }

  function renderFilters() {
    const groups = [
      { key: 'category', items: [['all', 'כל השיעורים'], ...Object.entries(data.categories)] },
      { key: 'branch', items: [['all', 'כל הסניפים'], ...Object.entries(data.branches).map(([k, v]) => [k, v.name])] },
    ];
    filtersRoot.innerHTML = '';
    groups.forEach(g => {
      const row = document.createElement('div'); row.className = 'filters';
      g.items.forEach(([val, label]) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'chip';
        b.textContent = label; b.dataset.group = g.key; b.dataset.val = val;
        if (state[g.key] === val) b.classList.add('is-on');
        b.addEventListener('click', () => { state[g.key] = val; render(); });
        row.appendChild(b);
      });
      filtersRoot.appendChild(row);
    });
  }

  function renderLegend() {
    legendRoot.innerHTML = Object.entries(data.branches)
      .map(([k, v]) => `<span data-branch="${k}"><i style="background:var(--bc)"></i>${v.name}${v.address ? ' · ' + v.address : ''}</span>`)
      .join('');
    notesRoot.innerHTML = data.notes.map(n => `<div>${n}</div>`).join('');
  }

  function render() { renderFilters(); renderGrid(); renderList(); }
  renderLegend(); render();
})();
