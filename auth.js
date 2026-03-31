'use strict';
/* ══════════════════════════════════════════
   auth.js
   ─────────────────────────────────────────
   Handles login form flow, role selection,
   Google link mock, and post-auth redirect
   to admin.html or contributor.html.
   Depends on: firebase.js  (DB, ST, $, toast)
══════════════════════════════════════════ */

/* ── Clock ── */
function startClock() {
    const update = () => {
        const el = $('login-clock');
        if (el) el.textContent = new Date().toUTCString().split(' ')[4] + ' UTC';
    };
    update();
    setInterval(update, 1000);
}

/* ── Form navigation ── */
function showForm(type) {
    document.querySelectorAll('.form-state').forEach(f => f.classList.remove('active'));
    const target = $(`form-${type}`);
    if (target) target.classList.add('active');

    // Show/hide Google login buttons based on linked state
    if (type === 'admin' || type === 'contributor') {
        const btn = $(`google-login-${type}`);
        if (btn) btn.style.display = ST.googleLinked ? 'flex' : 'none';
    }
}

function handleRoleSelect(role) {
    ST.pendingRole = role;
    const kicker = $('choice-kicker');
    if (kicker) kicker.textContent = role === 'admin' ? 'Administrator' : 'Contributor';
    showForm('auth-choice');
}

/* Called by the "Already have an account?" button in auth-choice */
function showFormForRole() {
    showForm(ST.pendingRole);
}

/* ── Google account linking (sign-up flow) ── */
function linkGoogleAccount(btn) {
    const origHTML = btn.innerHTML;
    btn.innerHTML = 'Connecting to Google <span class="live-dot" style="margin-left:0.5rem;background:#4285F4;display:inline-block"></span>';
    toast('Requesting Google permissions...', 'ok');

    setTimeout(() => {
        ST.googleLinked = true;
        localStorage.setItem('qn_gl', 'true');
        toast('Google account linked successfully!', 'ok');
        btn.innerHTML = origHTML;
        showForm('auth-choice');
    }, 1500);
}

/* ── Google login (existing account) ── */
function loginWithGoogle(role) {
    toast('Verifying Google credentials...', 'ok');
    setTimeout(() => {
        const found = role === 'admin'
            ? DB.users.find(u => u.role === 'admin')
            : DB.users.find(u => u.role === 'contributor');

        if (found) {
            persistSession(role, found);
            redirectByRole(role);
        }
    }, 1000);
}

/* ── Credential login ── */
function loginAs(role) {
    let found;

    if (role === 'admin') {
        const e = $('admin-email').value.trim();
        const p = $('admin-pass').value.trim();
        found = DB.users.find(u => u.role === 'admin' && u.email === e && u.pass === p);
        if (!found) { toast('Invalid credentials — try admin@qacker.io / admin123', 'err'); return; }
    } else {
        const k = $('contrib-key').value.trim().toUpperCase();
        found = DB.users.find(u => u.role === 'contributor' && u.key === k);
        if (!found) { toast('Invalid pass key — try C001-NOVA-2025', 'err'); return; }
    }

    persistSession(role, found);
    redirectByRole(role);
}

/* ── Session helpers ── */
function persistSession(role, user) {
    ST.session = { role, user };
    localStorage.setItem('qn_s', JSON.stringify({ role, userId: user.id }));
}

function redirectByRole(role) {
    if (role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'contributor.html';
    }
}

/* ── Init ── */
(function initLogin() {
    startClock();

    // Restore Google-linked flag
    ST.googleLinked = localStorage.getItem('qn_gl') === 'true';

    // If already logged in, redirect immediately
    const saved = localStorage.getItem('qn_s');
    if (saved) {
        try {
            const { role } = JSON.parse(saved);
            if (role === 'admin') { window.location.href = 'admin.html'; return; }
            if (role === 'contributor') { window.location.href = 'contributor.html'; return; }
        } catch (e) {
            localStorage.removeItem('qn_s');
        }
    }

    showForm('select');
})();