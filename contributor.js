'use strict';
/* ══════════════════════════════════════════
   contributor.js
   ─────────────────────────────────────────
   Contributor dashboard: personal KPIs,
   charts, task submission, operative pulse,
   leaderboard, and activity page.
   Depends on: firebase.js  (DB, ST, $, fmtDate,
               getUserById, calcScore, toast)
══════════════════════════════════════════ */

/* ══════════════════════════════════════════
   ROUTING
══════════════════════════════════════════ */
function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const map = { dashboard: 'dashboard-page', activity: 'activity-page' };
    const el = $(map[name]);
    if (el) el.classList.add('active');
    if (name === 'dashboard') renderDashboard();
    if (name === 'activity') renderActivity();
}

function logout() {
    localStorage.removeItem('qn_s');
    ['donut', 'area'].forEach(k => {
        if (ST.charts[k]) { ST.charts[k].destroy(); ST.charts[k] = null; }
    });
    window.location.href = 'index.html';
}

/* ══════════════════════════════════════════
   DASHBOARD RENDER
══════════════════════════════════════════ */
function renderDashboard() {
    const { user } = ST.session;
    syncBadges(user);

    // Only show this contributor's tasks
    const mine = DB.tasks.filter(t => t.assignedTo === user.id);
    const pending = mine.filter(t => t.status === 'pending').length;
    const submitted = mine.filter(t => t.status === 'submitted').length;
    const missed = mine.filter(t => t.status === 'missed').length;
    const eff = mine.length ? Math.round((submitted / mine.length) * 100) : 0;

    $('kpi-total').textContent = mine.length;
    $('kpi-pending').textContent = pending;
    $('kpi-submitted').textContent = submitted;
    $('kpi-missed').textContent = missed;
    $('kpi-eff').textContent = `${eff}% efficiency`;
    $('topbar-sub-dash').textContent = `${user.name} · Operative view`;

    renderTaskTable('task-tbody', getFiltered(ST.filter));
    $('task-count').textContent = `${getFiltered(ST.filter).length} entries`;
    renderSidePanel();
    renderCharts();
}

function syncBadges(user) {
    const firstName = user.name.split(' ')[0];
    const setEl = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    setEl('s-role-name', firstName);
    setEl('s-role-tag', 'OPERATIVE');
    setEl('s-role-name-act', firstName);
    setEl('s-role-tag-act', 'OPERATIVE');
    setEl('topbar-badge-dash', 'CONTRIBUTOR');
    setEl('topbar-badge-act', 'CONTRIBUTOR');
}

function getFiltered(filter) {
    const { user } = ST.session;
    const mine = DB.tasks.filter(t => t.assignedTo === user.id);
    return filter === 'all' ? mine : mine.filter(t => t.status === filter);
}

function applyFilter(f, btn) {
    ST.filter = f;
    document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const filtered = getFiltered(f);
    renderTaskTable('task-tbody', filtered);
    $('task-count').textContent = `${filtered.length} entries`;
}

/* ── Task table ── */
function renderTaskTable(tbodyId, tasks) {
    const tbody = $(tbodyId);
    if (!tbody) return;

    if (!tasks.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.5rem;font-family:var(--f-mono);font-size:0.65rem;color:var(--text-4);letter-spacing:0.1em">NO RECORDS</td></tr>`;
        return;
    }

    const { user } = ST.session;

    tbody.innerHTML = tasks.map(task => {
        const assignee = getUserById(task.assignedTo);
        const pillClass = { submitted: 'pill-green', missed: 'pill-red', pending: 'pill-amber' }[task.status];
        const statusLabel = task.status.charAt(0).toUpperCase() + task.status.slice(1);

        // Contributor can only submit their own pending tasks
        const canSubmit = task.status === 'pending' && task.assignedTo === user.id;

        const scoreCell = task.score > 0
            ? `<span class="cell-score">${task.score}</span>`
            : `<span class="cell-dash">—</span>`;

        let questionCell = `<a class="cell-link" href="${task.url}" target="_blank" title="${task.title}">${task.title}</a>`;
        if (canSubmit) {
            questionCell += `<div class="inline-row">
        <input class="inline-url-input" id="ans-${task.id}" placeholder="Paste answer URL…">
        <button class="inline-submit-btn" onclick="submitTask('${task.id}')" title="Submit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>`;
        }

        return `<tr>
      <td><span class="pill ${pillClass}"><span class="pill-dot"></span>${statusLabel}</span></td>
      <td>${questionCell}</td>
      <td><span class="cell-mono">${fmtDate(task.assignedDate)}</span></td>
      <td><span class="cell-mono">${fmtDate(task.submittedDate)}</span></td>
      <td><span class="cell-mono">${assignee ? assignee.name.split(' ')[0] : '—'}</span></td>
      <td>${scoreCell}</td>
    </tr>`;
    }).join('');
}

function submitTask(id) {
    const inp = $(`ans-${id}`);
    if (!inp) return;
    const url = inp.value.trim();
    if (!url) { toast('Please paste a valid URL first', 'err'); return; }
    if (!url.startsWith('http')) { toast('URL must begin with http/https', 'err'); return; }

    const task = DB.tasks.find(t => t.id === id);
    if (!task) return;
    task.status = 'submitted';
    task.submittedDate = new Date().toISOString();
    task.submittedUrl = url;
    task.score = calcScore(task.assignedDate);

    toast(`Submitted · Score: ${task.score}`, 'ok');
    renderDashboard();
    if ($('act-task-tbody')) renderActivity();
}

/* ── Side panel ── */
function renderSidePanel() {
    const sp = $('side-panel');
    if (!sp) return;
    sp.innerHTML = contribPanelHTML();
    setTimeout(animatePulse, 80);
}

function contribPanelHTML() {
    const { user } = ST.session;
    const mine = DB.tasks.filter(t => t.assignedTo === user.id);
    const done = mine.filter(t => t.status === 'submitted').length;
    const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;

    const badges = [];
    if (done >= 1) badges.push({ e: '📡', l: 'Signal Online' });
    if (done >= 3) badges.push({ e: '⚡', l: 'Momentum' });
    if (pct >= 80) badges.push({ e: '🎯', l: 'Precision' });
    if (mine.length > 0 && mine.length === done) badges.push({ e: '✅', l: 'Clean Sweep' });

    const badgeHTML = badges.length
        ? badges.map(b => `<span class="badge-tag">${b.e} ${b.l}</span>`).join('')
        : `<span style="font-family:var(--f-mono);font-size:0.62rem;color:var(--text-4)">Complete tasks to earn badges</span>`;

    const sorted = [...DB.users.filter(u => u.role === 'contributor')].sort((a, b) => b.score - a.score);
    const lbRows = sorted.map((u, i) => {
        const cls = ['g1', 'g2', 'g3'][i] || '';
        const isMe = u.id === user.id;
        return `<tr style="${isMe ? 'background:rgba(34,197,94,0.04);' : ''}">
      <td class="lb-rank ${cls}">#${i + 1}</td>
      <td style="font-size:0.78rem;color:${isMe ? 'var(--green)' : 'inherit'}">${u.name}${isMe ? ' ←' : ''}</td>
      <td class="lb-score">${u.score}</td>
    </tr>`;
    }).join('');

    return `
    <div class="panel-card">
      <div class="panel-card-header"><span class="panel-card-title">Operative pulse</span></div>
      <div class="panel-card-body">
        <div class="pulse-section">
          <div class="progress-row">
            <span class="progress-label">Completion rate</span>
            <span class="progress-pct">${pct}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" id="pulse-bar" style="width:0%"></div>
          </div>
          <p class="prog-detail">${done} of ${mine.length} tasks completed</p>
          <div class="badges-grid">${badgeHTML}</div>
        </div>
      </div>
    </div>
    <div class="panel-card">
      <div class="panel-card-header"><span class="panel-card-title">Leaderboard</span></div>
      <div class="panel-card-body" style="padding:0.5rem 1.1rem 1rem">
        <table class="lb-table">${lbRows}</table>
      </div>
    </div>`;
}

function animatePulse() {
    const bar = $('pulse-bar');
    if (!bar) return;
    const { user } = ST.session;
    const mine = DB.tasks.filter(t => t.assignedTo === user.id);
    const done = mine.filter(t => t.status === 'submitted').length;
    const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;
    bar.style.width = `${pct}%`;
}

/* ── Charts ── */
function renderCharts() { renderDonut(); renderArea(); }

function renderDonut() {
    const c = $('donut-chart');
    if (!c) return;
    if (ST.charts.donut) { ST.charts.donut.destroy(); ST.charts.donut = null; }

    const { user } = ST.session;
    const mine = DB.tasks.filter(t => t.assignedTo === user.id);
    const sub = mine.filter(t => t.status === 'submitted').length;
    const mis = mine.filter(t => t.status === 'missed').length;
    const pen = mine.filter(t => t.status === 'pending').length;
    const total = mine.length || 1;
    const eff = Math.round((sub / total) * 100);

    if ($('donut-pct')) $('donut-pct').textContent = `${eff}%`;

    const leg = $('donut-legend');
    if (leg) leg.innerHTML = [
        { color: '#22c55e', label: 'Submitted', val: sub },
        { color: '#f59e0b', label: 'Pending', val: pen },
        { color: '#ef4444', label: 'Missed', val: mis }
    ].map(i => `<div class="legend-row">
    <span class="legend-label"><span class="legend-dot" style="background:${i.color}"></span>${i.label}</span>
    <span class="legend-val">${i.val}</span>
  </div>`).join('');

    ST.charts.donut = new Chart(c, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [sub || 0, pen || 0, mis || 0],
                backgroundColor: ['rgba(34,197,94,0.85)', 'rgba(245,158,11,0.85)', 'rgba(239,68,68,0.85)'],
                borderColor: ['rgba(34,197,94,0.2)', 'rgba(245,158,11,0.2)', 'rgba(239,68,68,0.2)'],
                borderWidth: 1, hoverOffset: 4
            }]
        },
        options: {
            responsive: false, cutout: '75%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(23,23,28,0.95)',
                    borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
                    titleColor: '#9898a3', bodyColor: '#f1f0ee', padding: 10,
                    callbacks: {
                        label: ctx => {
                            const labels = ['Submitted', 'Pending', 'Missed'];
                            return ` ${labels[ctx.dataIndex]}: ${ctx.raw}`;
                        }
                    }
                }
            },
            animation: { animateRotate: true, duration: 1000 }
        }
    });
}

function renderArea() {
    const c = $('area-chart');
    if (!c) return;
    if (ST.charts.area) { ST.charts.area.destroy(); ST.charts.area = null; }

    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 180);
    grad.addColorStop(0, 'rgba(34,197,94,0.2)');
    grad.addColorStop(1, 'rgba(34,197,94,0)');

    ST.charts.area = new Chart(c, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Submissions', data: DB.trend,
                borderColor: '#22c55e', backgroundColor: grad,
                borderWidth: 2, fill: true, tension: 0.4,
                pointBackgroundColor: '#22c55e',
                pointBorderColor: 'rgba(34,197,94,0.3)',
                pointRadius: 3, pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(23,23,28,0.95)',
                    borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
                    titleColor: '#9898a3', bodyColor: '#f1f0ee', padding: 10
                }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#52525e', font: { size: 10, family: 'DM Mono' } } },
                y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#52525e', font: { size: 10, family: 'DM Mono' } }, beginAtZero: true }
            }
        }
    });
}

/* ══════════════════════════════════════════
   ACTIVITY PAGE
══════════════════════════════════════════ */
function renderActivity() {
    const { user } = ST.session;
    syncBadges(user);

    const mine = DB.tasks.filter(t => t.assignedTo === user.id);
    const sub = mine.filter(t => t.status === 'submitted').length;
    const pen = mine.filter(t => t.status === 'pending').length;

    const chips = $('act-chips');
    if (chips) chips.innerHTML = [
        { n: mine.length, l: 'Total', c: 'var(--text)' },
        { n: sub, l: 'Done', c: 'var(--green)' },
        { n: pen, l: 'Pending', c: 'var(--amber)' }
    ].map(i => `<div class="act-chip">
    <span class="act-chip-num" style="color:${i.c}">${i.n}</span>
    <span class="act-chip-lbl">${i.l}</span>
  </div>`).join('');

    renderTaskTable('act-task-tbody', mine);
    const cnt = $('act-task-count');
    if (cnt) cnt.textContent = `${mine.length} entries`;

    const side = $('act-side-col');
    if (side) side.innerHTML = `
    <div class="panel-card">
      <div class="clearance-card">
        <div class="clearance-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div class="clearance-title">Restricted zone</div>
        <p class="clearance-sub">Task creation is restricted<br>to administrators.</p>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════
   MOBILE DRAWER
══════════════════════════════════════════ */
function openDrawer(ctx) {
    const panel = $('drawer-panel');
    panel.innerHTML = '';
    const src = $(ctx === 'dash' ? 'app-sidebar-dash' : 'app-sidebar-act');
    if (src) panel.innerHTML = src.innerHTML;
    $('mobile-drawer').classList.add('open');
}

function closeDrawer() {
    $('mobile-drawer').classList.remove('open');
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
(function initContributor() {
    const saved = localStorage.getItem('qn_s');
    if (!saved) { window.location.href = 'index.html'; return; }

    try {
        const { role, userId } = JSON.parse(saved);
        if (role !== 'contributor') { window.location.href = 'admin.html'; return; }

        const user = DB.users.find(u => u.id === userId);
        if (!user) { localStorage.removeItem('qn_s'); window.location.href = 'index.html'; return; }

        ST.session = { role, user };
        ST.googleLinked = localStorage.getItem('qn_gl') === 'true';

        // Observe side-panel DOM changes → re-animate pulse bar
        const sp = $('side-panel');
        if (sp) {
            const obs = new MutationObserver(() => setTimeout(animatePulse, 80));
            obs.observe(sp, { childList: true });
        }

        showPage('dashboard');
    } catch (e) {
        localStorage.removeItem('qn_s');
        window.location.href = 'index.html';
    }
})();