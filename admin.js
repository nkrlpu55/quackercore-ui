'use strict';
/* ══════════════════════════════════════════
   admin.js
   ─────────────────────────────────────────
   Admin dashboard: KPIs, charts, task table,
   create-task form, leaderboard, activity page.
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

    const all = DB.tasks;
    const pending = all.filter(t => t.status === 'pending').length;
    const submitted = all.filter(t => t.status === 'submitted').length;
    const missed = all.filter(t => t.status === 'missed').length;
    const eff = Math.round((submitted / all.length) * 100);

    $('kpi-total').textContent = all.length;
    $('kpi-pending').textContent = pending;
    $('kpi-submitted').textContent = submitted;
    $('kpi-missed').textContent = missed;
    $('kpi-eff').textContent = `${eff}% efficiency`;
    $('topbar-sub-dash').textContent = `Admin view · ${all.length} total tasks`;

    renderTaskTable('task-tbody', getFiltered(ST.filter));
    $('task-count').textContent = `${getFiltered(ST.filter).length} entries`;
    renderSidePanel();
    renderCharts();
}

function syncBadges(user) {
    const setEl = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    setEl('s-role-name', user.name);
    setEl('s-role-tag', 'ADMIN SESSION');
    setEl('s-role-name-act', user.name);
    setEl('s-role-tag-act', 'ADMIN SESSION');
    setEl('topbar-badge-dash', 'ADMIN');
    setEl('topbar-badge-act', 'ADMIN');
}

function getFiltered(filter) {
    return filter === 'all' ? DB.tasks : DB.tasks.filter(t => t.status === filter);
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

    tbody.innerHTML = tasks.map(task => {
        const assignee = getUserById(task.assignedTo);
        const pillClass = { submitted: 'pill-green', missed: 'pill-red', pending: 'pill-amber' }[task.status];
        const statusLabel = task.status.charAt(0).toUpperCase() + task.status.slice(1);

        // Admin can submit any pending task
        const canSubmit = task.status === 'pending';

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
    $('side-panel').innerHTML = adminPanelHTML();
}

function adminPanelHTML() {
    const contributors = DB.users.filter(u => u.role === 'contributor');
    const opts = contributors.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    const sorted = [...contributors].sort((a, b) => b.score - a.score);

    const lbRows = sorted.map((u, i) => {
        const cls = ['g1', 'g2', 'g3'][i] || '';
        const done = DB.tasks.filter(t => t.assignedTo === u.id && t.status === 'submitted').length;
        return `<tr>
      <td class="lb-rank ${cls}">#${i + 1}</td>
      <td style="font-size:0.78rem">${u.name}</td>
      <td class="lb-score">${done} done</td>
      <td class="lb-score">${u.score} pts</td>
    </tr>`;
    }).join('');

    return `
    <div class="panel-card">
      <div class="panel-card-header">
        <span class="panel-card-title">Create task</span>
      </div>
      <div class="panel-card-body">
        <div class="form-fields">
          <div class="mini-field">
            <label class="mini-label">Question URL</label>
            <input type="url" id="new-url" class="mini-input" placeholder="https://quora.com/…">
          </div>
          <div class="mini-field">
            <label class="mini-label">Assign to</label>
            <select id="new-user" class="mini-select">${opts}</select>
          </div>
          <div class="mini-field">
            <label class="mini-label">Instructions</label>
            <textarea id="new-instr" class="mini-textarea" placeholder="Answer guidelines…"></textarea>
          </div>
          <div class="mini-field">
            <label class="mini-label">Deadline</label>
            <input type="datetime-local" id="new-dl" class="mini-input">
          </div>
          <button class="btn-create" onclick="createTask()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create task
          </button>
        </div>
      </div>
    </div>
    <div class="panel-card">
      <div class="panel-card-header"><span class="panel-card-title">Team performance</span></div>
      <div class="panel-card-body" style="padding:0.5rem 1.1rem 1rem">
        <table class="lb-table">${lbRows}</table>
      </div>
    </div>`;
}

function createTask() {
    const url = $('new-url')?.value.trim();
    const uid = $('new-user')?.value;
    const instr = $('new-instr')?.value.trim();
    const dl = $('new-dl')?.value;

    if (!url || !uid) { toast('URL and assignee are required', 'err'); return; }

    const assignee = getUserById(uid);
    DB.tasks.push({
        id: `t${Date.now()}`, url,
        title: url.split('/').pop().replace(/-/g, ' ').substring(0, 55),
        assignedTo: uid,
        assignedDate: new Date().toISOString(),
        status: 'pending',
        submittedDate: null, submittedUrl: null, score: null,
        deadline: dl || new Date(Date.now() + 72 * 3600000).toISOString(),
        instruction: instr || ''
    });

    toast(`Task dispatched to ${assignee.name.split(' ')[0]}`, 'ok');
    if ($('new-url')) $('new-url').value = '';
    if ($('new-instr')) $('new-instr').value = '';
    renderDashboard();
}

/* ── Charts ── */
function renderCharts() { renderDonut(); renderArea(); }

function renderDonut() {
    const c = $('donut-chart');
    if (!c) return;
    if (ST.charts.donut) { ST.charts.donut.destroy(); ST.charts.donut = null; }

    const sub = DB.tasks.filter(t => t.status === 'submitted').length;
    const mis = DB.tasks.filter(t => t.status === 'missed').length;
    const pen = DB.tasks.filter(t => t.status === 'pending').length;
    const total = DB.tasks.length;
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
                data: [sub, pen, mis],
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
    grad.addColorStop(0, 'rgba(59,130,246,0.2)');
    grad.addColorStop(1, 'rgba(59,130,246,0)');

    ST.charts.area = new Chart(c, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Submissions', data: DB.trend,
                borderColor: '#3b82f6', backgroundColor: grad,
                borderWidth: 2, fill: true, tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: 'rgba(59,130,246,0.3)',
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

    const all = DB.tasks;
    const sub = all.filter(t => t.status === 'submitted').length;
    const pen = all.filter(t => t.status === 'pending').length;

    const chips = $('act-chips');
    if (chips) chips.innerHTML = [
        { n: all.length, l: 'Total', c: 'var(--text)' },
        { n: sub, l: 'Done', c: 'var(--green)' },
        { n: pen, l: 'Pending', c: 'var(--amber)' }
    ].map(i => `<div class="act-chip">
    <span class="act-chip-num" style="color:${i.c}">${i.n}</span>
    <span class="act-chip-lbl">${i.l}</span>
  </div>`).join('');

    renderTaskTable('act-task-tbody', all);
    const cnt = $('act-task-count');
    if (cnt) cnt.textContent = `${all.length} entries`;

    const side = $('act-side-col');
    if (side) side.innerHTML = adminPanelHTML();
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
(function initAdmin() {
    const saved = localStorage.getItem('qn_s');
    if (!saved) { window.location.href = 'index.html'; return; }

    try {
        const { role, userId } = JSON.parse(saved);
        if (role !== 'admin') { window.location.href = 'contributor.html'; return; }

        const user = DB.users.find(u => u.id === userId);
        if (!user) { localStorage.removeItem('qn_s'); window.location.href = 'index.html'; return; }

        ST.session = { role, user };
        ST.googleLinked = localStorage.getItem('qn_gl') === 'true';

        showPage('dashboard');
    } catch (e) {
        localStorage.removeItem('qn_s');
        window.location.href = 'index.html';
    }
})();