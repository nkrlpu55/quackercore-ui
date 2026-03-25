'use strict';
/* ══════════════════════════════════════════
   MOCK DB
══════════════════════════════════════════ */
const DB = {
  users: [
    {id:'u1',name:'Aryan Singh',   key:'C001-NOVA-2025',role:'contributor',score:340},
    {id:'u2',name:'Priya Sharma',  key:'C002-APEX-2025',role:'contributor',score:295},
    {id:'u3',name:'Rohan Mehta',   key:'C003-ZETA-2025',role:'contributor',score:260},
    {id:'u4',name:'Nisha Kapoor',  key:'C004-FLUX-2025',role:'contributor',score:215},
    {id:'u5',name:'Dev Patel',     key:'C005-ORION-2025',role:'contributor',score:188},
    {id:'a1',name:'Admin Nexus',   email:'admin@qacker.io',pass:'admin123',role:'admin'}
  ],
  tasks: [
    {id:'t1',url:'https://qora.com/Why-is-dark-matter-real',title:'Why is dark matter considered real evidence?',
     assignedTo:'u1',assignedDate:'2025-01-10T09:00:00',status:'submitted',submittedDate:'2025-01-12T14:22:00',submittedUrl:'https://qora.com/a/12345',score:92},
    {id:'t2',url:'https://qora.com/What-makes-a-great-PM',title:'What makes a great product manager in 2025?',
     assignedTo:'u2',assignedDate:'2025-01-11T10:00:00',status:'submitted',submittedDate:'2025-01-14T11:05:00',submittedUrl:'https://qora.com/a/12346',score:85},
    {id:'t3',url:'https://qora.com/Will-AI-replace-devs',title:'Will AI replace software developers entirely?',
     assignedTo:'u3',assignedDate:'2025-01-12T08:30:00',status:'missed',submittedDate:null,submittedUrl:null,score:0},
    {id:'t4',url:'https://qora.com/How-compound-interest-works',title:'How does compound interest actually work?',
     assignedTo:'u1',assignedDate:'2025-01-14T09:00:00',status:'pending',submittedDate:null,submittedUrl:null,score:null},
    {id:'t5',url:'https://qora.com/Best-way-to-learn-coding',title:'What is the best way to learn coding in 2025?',
     assignedTo:'u2',assignedDate:'2025-01-15T10:00:00',status:'pending',submittedDate:null,submittedUrl:null,score:null},
    {id:'t6',url:'https://qora.com/Why-do-people-procrastinate',title:'Why do people procrastinate despite knowing better?',
     assignedTo:'u4',assignedDate:'2025-01-13T11:00:00',status:'submitted',submittedDate:'2025-01-15T16:40:00',submittedUrl:'https://qora.com/a/12350',score:78},
    {id:'t7',url:'https://qora.com/Crypto-markets-2024',title:'What happened to crypto markets in 2024?',
     assignedTo:'u3',assignedDate:'2025-01-16T09:00:00',status:'pending',submittedDate:null,submittedUrl:null,score:null},
    {id:'t8',url:'https://qora.com/Black-holes-Hawking-radiation',title:'How do black holes evaporate via Hawking radiation?',
     assignedTo:'u5',assignedDate:'2025-01-14T12:00:00',status:'missed',submittedDate:null,submittedUrl:null,score:0}
  ],
  trend: [3,7,4,9,5,11,8]
};

/* ══════════════════════════════════════════
   STATE
══════════════════════════════════════════ */
let ST = {session:null, filter:'all', charts:{donut:null,area:null}, pendingRole:null, googleLinked:false};

/* ══════════════════════════════════════════
   UTILS
══════════════════════════════════════════ */
const $  = id => document.getElementById(id);
const fmtDate = s => s ? new Date(s).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : '—';
const getUserById = id => DB.users.find(u => u.id === id);

function toast(msg, type='ok') {
  const el=$('toast'), ic=$('toast-icon'), txt=$('toast-msg');
  ic.innerHTML = type==='ok'
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  txt.textContent = msg;
  el.className = `toast ${type} show`;
  clearTimeout(el._t);
  el._t = setTimeout(()=>el.className='toast',3500);
}

function calcScore(dateStr) {
  const hrs = (Date.now() - new Date(dateStr).getTime()) / 3600000;
  if (hrs<24) return 85+Math.floor(Math.random()*14);
  if (hrs<48) return 65+Math.floor(Math.random()*19);
  if (hrs<72) return 45+Math.floor(Math.random()*19);
  return 25+Math.floor(Math.random()*19);
}

/* ══════════════════════════════════════════
   LOGIN
══════════════════════════════════════════ */
function handleRoleSelect(role) {
  ST.pendingRole = role;
  const kicker = $('choice-kicker');
  if(kicker) kicker.textContent = role === 'admin' ? 'Administrator' : 'Contributor';
  showForm('auth-choice');
}

function linkGoogleAccount(btn) {
  const origText = btn.innerHTML;
  btn.innerHTML = 'Connecting to Google <span class="live-dot" style="margin-left:0.5rem;background:#4285F4;display:inline-block"></span>';
  toast('Requesting Google permissions...', 'ok');
  setTimeout(() => {
    ST.googleLinked = true;
    localStorage.setItem('qn_gl', 'true');
    toast('Google account linked successfully!', 'ok');
    btn.innerHTML = origText;
    showForm('auth-choice'); 
  }, 1500);
}

function loginWithGoogle(role) {
  toast('Verifying Google credentials...', 'ok');
  setTimeout(() => {
    // Attempt to log in with a mock user mapping
    let found;
    if (role === 'admin') {
      found = DB.users.find(u => u.role === 'admin');
    } else {
      found = DB.users.find(u => u.role === 'contributor');
    }
    if(found){
      ST.session = {role, user:found};
      localStorage.setItem('qn_s', JSON.stringify(ST.session));
      showPage('dashboard');
      toast('Signed in via Google', 'ok');
    }
  }, 1000);
}

function showForm(type) {
  document.querySelectorAll('.form-state').forEach(f=>f.classList.remove('active'));
  const target = $(`form-${type}`);
  if(target) target.classList.add('active');
  
  if (type === 'admin' || type === 'contributor') {
    const btn = $(`google-login-${type}`);
    if (btn) {
      btn.style.display = ST.googleLinked ? 'flex' : 'none';
    }
  }
}

function loginAs(role) {
  let found;
  if (role==='admin') {
    const e=$('admin-email').value.trim(), p=$('admin-pass').value.trim();
    found = DB.users.find(u=>u.role==='admin'&&u.email===e&&u.pass===p);
    if (!found) { toast('Invalid credentials — try admin@qacker.io / admin123','err'); return; }
  } else {
    const k=$('contrib-key').value.trim().toUpperCase();
    found = DB.users.find(u=>u.role==='contributor'&&u.key===k);
    if (!found) { toast('Invalid pass key — try C001-NOVA-2025','err'); return; }
  }
  ST.session = {role, user:found};
  localStorage.setItem('qn_s', JSON.stringify(ST.session));
  showPage('dashboard');
}

function logout() {
  ST.session=null;
  localStorage.removeItem('qn_s');
  ['donut','area'].forEach(k=>{ if(ST.charts[k]){ST.charts[k].destroy();ST.charts[k]=null;} });
  showPage('login');
  showForm('select');
}

/* ══════════════════════════════════════════
   ROUTING
══════════════════════════════════════════ */
function showPage(name) {
  if (name!=='login'&&!ST.session) { showPage('login'); return; }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const map={login:'login-page',dashboard:'dashboard-page',activity:'activity-page'};
  const el=$(map[name]); if(el) el.classList.add('active');
  if (name==='dashboard') renderDashboard();
  if (name==='activity')  renderActivity();
}

/* ══════════════════════════════════════════
   DASHBOARD RENDER
══════════════════════════════════════════ */
function renderDashboard() {
  const {role,user} = ST.session;
  // topbar badges
  syncBadges(role, user);
  // KPIs
  const all = DB.tasks;
  const pending   = all.filter(t=>t.status==='pending').length;
  const submitted = all.filter(t=>t.status==='submitted').length;
  const missed    = all.filter(t=>t.status==='missed').length;
  const eff = Math.round((submitted/all.length)*100);
  $('kpi-total').textContent     = all.length;
  $('kpi-pending').textContent   = pending;
  $('kpi-submitted').textContent = submitted;
  $('kpi-missed').textContent    = missed;
  $('kpi-eff').textContent       = `${eff}% efficiency`;
  $('topbar-sub-dash').textContent= role==='contributor'
    ? `${user.name} · Operative view`
    : `Admin view · ${all.length} total tasks`;
  renderTaskTable('task-tbody', getFiltered(ST.filter));
  $('task-count').textContent = `${getFiltered(ST.filter).length} entries`;
  renderSidePanel();
  renderCharts();
}

function syncBadges(role, user) {
  const isAdmin = role==='admin';
  const roleText = isAdmin ? 'ADMIN' : 'CONTRIBUTOR';
  const displayName = isAdmin ? user.name : user.name.split(' ')[0];

  const setBadge = (elId,tagId,badgeId,cls) => {
    const n=$('s-role-name'+elId), t=$('s-role-tag'+elId), b=$(badgeId);
    if(n) n.textContent=displayName;
    if(t) t.textContent=isAdmin?'ADMIN SESSION':'OPERATIVE';
    if(b) { b.textContent=roleText; b.className=`topbar-badge ${cls}`; }
  };
  setBadge('','','topbar-badge-dash', isAdmin?'admin':'contrib');
  setBadge('-act','','topbar-badge-act', isAdmin?'admin':'contrib');
}

function getFiltered(filter) {
  const {role,user} = ST.session;
  let tasks = DB.tasks;
  if (role==='contributor') tasks=tasks.filter(t=>t.assignedTo===user.id);
  if (filter!=='all') tasks=tasks.filter(t=>t.status===filter);
  return tasks;
}

function applyFilter(f, btn) {
  ST.filter = f;
  document.querySelectorAll('.ftab').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const filtered = getFiltered(f);
  renderTaskTable('task-tbody', filtered);
  $('task-count').textContent = `${filtered.length} entries`;
}

/* ── Task table ── */
function renderTaskTable(tbodyId, tasks) {
  const tbody=$(tbodyId); if(!tbody) return;
  if (!tasks.length) {
    tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;padding:2.5rem;font-family:var(--f-mono);font-size:0.65rem;color:var(--text-4);letter-spacing:0.1em">NO RECORDS</td></tr>`;
    return;
  }
  const {role,user} = ST.session;
  tbody.innerHTML = tasks.map(task => {
    const assignee = getUserById(task.assignedTo);
    const pillClass = {submitted:'pill-green',missed:'pill-red',pending:'pill-amber'}[task.status];
    const statusLabel = task.status.charAt(0).toUpperCase()+task.status.slice(1);
    const canSubmit = task.status==='pending'&&(role==='admin'||task.assignedTo===user.id);

    const scoreCell = task.score>0
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
      <td><span class="cell-mono">${assignee?assignee.name.split(' ')[0]:'—'}</span></td>
      <td>${scoreCell}</td>
    </tr>`;
  }).join('');
}

function submitTask(id) {
  const inp=$(`ans-${id}`); if(!inp) return;
  const url=inp.value.trim();
  if (!url) { toast('Please paste a valid URL first','err'); return; }
  if (!url.startsWith('http')) { toast('URL must begin with http/https','err'); return; }
  const task=DB.tasks.find(t=>t.id===id); if(!task) return;
  task.status='submitted';
  task.submittedDate=new Date().toISOString();
  task.submittedUrl=url;
  task.score=calcScore(task.assignedDate);
  toast(`Submitted · Score: ${task.score}`,'ok');
  renderDashboard();
  if ($('act-task-tbody')) renderActivity();
}

/* ── Side panel ── */
function renderSidePanel() {
  const {role} = ST.session;
  $('side-panel').innerHTML = role==='admin' ? adminPanelHTML() : contribPanelHTML();
  if (role==='contributor') setTimeout(animatePulse, 80);
}

function adminPanelHTML() {
  const contributors = DB.users.filter(u=>u.role==='contributor');
  const opts = contributors.map(u=>`<option value="${u.id}">${u.name}</option>`).join('');
  const sorted = [...contributors].sort((a,b)=>b.score-a.score);
  const lbRows = sorted.map((u,i)=>{
    const cls=['g1','g2','g3'][i]||'';
    const done = DB.tasks.filter(t=>t.assignedTo===u.id&&t.status==='submitted').length;
    return `<tr>
      <td class="lb-rank ${cls}">#${i+1}</td>
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

function contribPanelHTML() {
  const {user} = ST.session;
  const mine = DB.tasks.filter(t=>t.assignedTo===user.id);
  const done = mine.filter(t=>t.status==='submitted').length;
  const pct  = mine.length ? Math.round((done/mine.length)*100) : 0;
  const badges=[];
  if(done>=1) badges.push({e:'📡',l:'Signal Online'});
  if(done>=3) badges.push({e:'⚡',l:'Momentum'});
  if(pct>=80) badges.push({e:'🎯',l:'Precision'});
  if(mine.length>0&&mine.length===done) badges.push({e:'✅',l:'Clean Sweep'});

  const badgeHTML = badges.length
    ? badges.map(b=>`<span class="badge-tag">${b.e} ${b.l}</span>`).join('')
    : `<span style="font-family:var(--f-mono);font-size:0.62rem;color:var(--text-4)">Complete tasks to earn badges</span>`;

  const sorted = [...DB.users.filter(u=>u.role==='contributor')].sort((a,b)=>b.score-a.score);
  const lbRows = sorted.map((u,i)=>{
    const cls=['g1','g2','g3'][i]||'';
    const isMe = u.id===user.id;
    return `<tr style="${isMe?'background:rgba(34,197,94,0.04);':''}">
      <td class="lb-rank ${cls}">#${i+1}</td>
      <td style="font-size:0.78rem;color:${isMe?'var(--green)':'inherit'}">${u.name}${isMe?' ←':''}</td>
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
  const bar=$('pulse-bar'); if(!bar) return;
  const {user}=ST.session;
  const mine=DB.tasks.filter(t=>t.assignedTo===user.id);
  const done=mine.filter(t=>t.status==='submitted').length;
  const pct=mine.length?Math.round((done/mine.length)*100):0;
  bar.style.width=`${pct}%`;
}

function createTask() {
  const url=$('new-url')?.value.trim();
  const uid=$('new-user')?.value;
  const instr=$('new-instr')?.value.trim();
  const dl=$('new-dl')?.value;
  if(!url||!uid){ toast('URL and assignee are required','err'); return; }
  const assignee=getUserById(uid);
  DB.tasks.push({
    id:`t${Date.now()}`,url,
    title:url.split('/').pop().replace(/-/g,' ').substring(0,55),
    assignedTo:uid,assignedDate:new Date().toISOString(),
    status:'pending',submittedDate:null,submittedUrl:null,score:null,
    deadline:dl||new Date(Date.now()+72*3600000).toISOString(),instruction:instr||''
  });
  toast(`Task dispatched to ${assignee.name.split(' ')[0]}`,'ok');
  $('new-url').value=''; if($('new-instr')) $('new-instr').value='';
  renderDashboard();
}

/* ── Charts ── */
function renderCharts() {
  renderDonut(); renderArea();
}

function renderDonut() {
  const c=$('donut-chart'); if(!c) return;
  if(ST.charts.donut){ST.charts.donut.destroy();ST.charts.donut=null;}
  const sub=DB.tasks.filter(t=>t.status==='submitted').length;
  const mis=DB.tasks.filter(t=>t.status==='missed').length;
  const pen=DB.tasks.filter(t=>t.status==='pending').length;
  const total=DB.tasks.length;
  const eff=Math.round((sub/total)*100);
  if($('donut-pct')) $('donut-pct').textContent=`${eff}%`;
  const leg=$('donut-legend');
  if(leg) leg.innerHTML=[
    {color:'#22c55e',label:'Submitted',val:sub},
    {color:'#f59e0b',label:'Pending',val:pen},
    {color:'#ef4444',label:'Missed',val:mis}
  ].map(i=>`<div class="legend-row">
    <span class="legend-label"><span class="legend-dot" style="background:${i.color}"></span>${i.label}</span>
    <span class="legend-val">${i.val}</span>
  </div>`).join('');

  ST.charts.donut = new Chart(c, {
    type:'doughnut',
    data:{
      datasets:[{
        data:[sub,pen,mis],
        backgroundColor:['rgba(34,197,94,0.85)','rgba(245,158,11,0.85)','rgba(239,68,68,0.85)'],
        borderColor:['rgba(34,197,94,0.2)','rgba(245,158,11,0.2)','rgba(239,68,68,0.2)'],
        borderWidth:1,hoverOffset:4
      }]
    },
    options:{
      responsive:false,cutout:'75%',
      plugins:{legend:{display:false},tooltip:{
        backgroundColor:'rgba(23,23,28,0.95)',
        borderColor:'rgba(255,255,255,0.08)',borderWidth:1,
        titleColor:'#9898a3',bodyColor:'#f1f0ee',padding:10,
        callbacks:{label:ctx=>{
          const labels=['Submitted','Pending','Missed'];
          return ` ${labels[ctx.dataIndex]}: ${ctx.raw}`;
        }}
      }},
      animation:{animateRotate:true,duration:1000}
    }
  });
}

function renderArea() {
  const c=$('area-chart'); if(!c) return;
  if(ST.charts.area){ST.charts.area.destroy();ST.charts.area=null;}
  const ctx=c.getContext('2d');
  const grad=ctx.createLinearGradient(0,0,0,180);
  grad.addColorStop(0,'rgba(59,130,246,0.2)');
  grad.addColorStop(1,'rgba(59,130,246,0)');
  ST.charts.area = new Chart(c,{
    type:'line',
    data:{
      labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets:[{
        label:'Submissions',data:DB.trend,
        borderColor:'#3b82f6',backgroundColor:grad,
        borderWidth:2,fill:true,tension:0.4,
        pointBackgroundColor:'#3b82f6',pointBorderColor:'rgba(59,130,246,0.3)',
        pointRadius:3,pointHoverRadius:5
      }]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{
        backgroundColor:'rgba(23,23,28,0.95)',
        borderColor:'rgba(255,255,255,0.08)',borderWidth:1,
        titleColor:'#9898a3',bodyColor:'#f1f0ee',padding:10
      }},
      scales:{
        x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#52525e',font:{size:10,family:'DM Mono'}}},
        y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#52525e',font:{size:10,family:'DM Mono'}},beginAtZero:true}
      }
    }
  });
}

/* ══════════════════════════════════════════
   ACTIVITY PAGE
══════════════════════════════════════════ */
function renderActivity() {
  const {role,user}=ST.session;
  syncBadges(role,user);
  const all=DB.tasks;
  const sub=all.filter(t=>t.status==='submitted').length;
  const pen=all.filter(t=>t.status==='pending').length;

  const chips=$('act-chips');
  if(chips) chips.innerHTML=[
    {n:all.length,l:'Total',c:'var(--text)'},
    {n:sub,l:'Done',c:'var(--green)'},
    {n:pen,l:'Pending',c:'var(--amber)'}
  ].map(i=>`<div class="act-chip">
    <span class="act-chip-num" style="color:${i.c}">${i.n}</span>
    <span class="act-chip-lbl">${i.l}</span>
  </div>`).join('');

  let tasks=all;
  if(role==='contributor') tasks=tasks.filter(t=>t.assignedTo===user.id);
  renderTaskTable('act-task-tbody',tasks);
  const cnt=$('act-task-count'); if(cnt) cnt.textContent=`${tasks.length} entries`;

  const side=$('act-side-col');
  if(side) side.innerHTML = role==='admin' ? adminPanelHTML() : `
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
  const panel=$('drawer-panel');
  panel.innerHTML=''; // clone sidebar
  const src=$(ctx==='dash'?'app-sidebar-dash':'app-sidebar-act');
  if(src) panel.innerHTML=src.innerHTML;
  $('mobile-drawer').classList.add('open');
}
function closeDrawer() { $('mobile-drawer').classList.remove('open'); }

/* ══════════════════════════════════════════
   CLOCK
══════════════════════════════════════════ */
function startClock() {
  const update=()=>{ const el=$('login-clock'); if(el) el.textContent=new Date().toUTCString().split(' ')[4]+' UTC'; };
  update(); setInterval(update,1000);
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
(function init(){
  startClock();
  ST.googleLinked = localStorage.getItem('qn_gl') === 'true';
  const saved=localStorage.getItem('qn_s');
  if(saved){
    try{
      const s=JSON.parse(saved);
      const u=DB.users.find(x=>x.id===s.user.id);
      if(u){ST.session={role:s.role,user:u};showPage('dashboard');return;}
    }catch(e){localStorage.removeItem('qn_s');}
  }
  showPage('login');
  // Observe sidebar for pulse bar
  const obs=new MutationObserver(()=>{if(ST.session?.role==='contributor')setTimeout(animatePulse,80);});
  const sp=$('side-panel');
  if(sp) obs.observe(sp,{childList:true});
})();
