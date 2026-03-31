'use strict';
/* ══════════════════════════════════════════
   firebase.js
   ─────────────────────────────────────────
   Centralised mock database + shared state.
   Replace this file with your real Firebase
   SDK initialisation and Firestore/RTDB calls
   when you integrate Firebase.
══════════════════════════════════════════ */

/* ── Mock database ── */
const DB = {
    users: [
        { id: 'u1', name: 'Aryan Singh', key: 'C001-NOVA-2025', role: 'contributor', score: 340 },
        { id: 'u2', name: 'Priya Sharma', key: 'C002-APEX-2025', role: 'contributor', score: 295 },
        { id: 'u3', name: 'Rohan Mehta', key: 'C003-ZETA-2025', role: 'contributor', score: 260 },
        { id: 'u4', name: 'Nisha Kapoor', key: 'C004-FLUX-2025', role: 'contributor', score: 215 },
        { id: 'u5', name: 'Dev Patel', key: 'C005-ORION-2025', role: 'contributor', score: 188 },
        { id: 'a1', name: 'Admin Nexus', email: 'admin@qacker.io', pass: 'admin123', role: 'admin' }
    ],
    tasks: [
        {
            id: 't1', url: 'https://qora.com/Why-is-dark-matter-real',
            title: 'Why is dark matter considered real evidence?',
            assignedTo: 'u1', assignedDate: '2025-01-10T09:00:00',
            status: 'submitted', submittedDate: '2025-01-12T14:22:00',
            submittedUrl: 'https://qora.com/a/12345', score: 92
        },
        {
            id: 't2', url: 'https://qora.com/What-makes-a-great-PM',
            title: 'What makes a great product manager in 2025?',
            assignedTo: 'u2', assignedDate: '2025-01-11T10:00:00',
            status: 'submitted', submittedDate: '2025-01-14T11:05:00',
            submittedUrl: 'https://qora.com/a/12346', score: 85
        },
        {
            id: 't3', url: 'https://qora.com/Will-AI-replace-devs',
            title: 'Will AI replace software developers entirely?',
            assignedTo: 'u3', assignedDate: '2025-01-12T08:30:00',
            status: 'missed', submittedDate: null, submittedUrl: null, score: 0
        },
        {
            id: 't4', url: 'https://qora.com/How-compound-interest-works',
            title: 'How does compound interest actually work?',
            assignedTo: 'u1', assignedDate: '2025-01-14T09:00:00',
            status: 'pending', submittedDate: null, submittedUrl: null, score: null
        },
        {
            id: 't5', url: 'https://qora.com/Best-way-to-learn-coding',
            title: 'What is the best way to learn coding in 2025?',
            assignedTo: 'u2', assignedDate: '2025-01-15T10:00:00',
            status: 'pending', submittedDate: null, submittedUrl: null, score: null
        },
        {
            id: 't6', url: 'https://qora.com/Why-do-people-procrastinate',
            title: 'Why do people procrastinate despite knowing better?',
            assignedTo: 'u4', assignedDate: '2025-01-13T11:00:00',
            status: 'submitted', submittedDate: '2025-01-15T16:40:00',
            submittedUrl: 'https://qora.com/a/12350', score: 78
        },
        {
            id: 't7', url: 'https://qora.com/Crypto-markets-2024',
            title: 'What happened to crypto markets in 2024?',
            assignedTo: 'u3', assignedDate: '2025-01-16T09:00:00',
            status: 'pending', submittedDate: null, submittedUrl: null, score: null
        },
        {
            id: 't8', url: 'https://qora.com/Black-holes-Hawking-radiation',
            title: 'How do black holes evaporate via Hawking radiation?',
            assignedTo: 'u5', assignedDate: '2025-01-14T12:00:00',
            status: 'missed', submittedDate: null, submittedUrl: null, score: 0
        }
    ],
    trend: [3, 7, 4, 9, 5, 11, 8]
};

/* ── Shared state ── */
const ST = {
    session: null,
    filter: 'all',
    charts: { donut: null, area: null },
    pendingRole: null,
    googleLinked: false
};

/* ── Shared helpers ── */
const $ = id => document.getElementById(id);
const fmtDate = s => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';
const getUserById = id => DB.users.find(u => u.id === id);

function calcScore(dateStr) {
    const hrs = (Date.now() - new Date(dateStr).getTime()) / 3600000;
    if (hrs < 24) return 85 + Math.floor(Math.random() * 14);
    if (hrs < 48) return 65 + Math.floor(Math.random() * 19);
    if (hrs < 72) return 45 + Math.floor(Math.random() * 19);
    return 25 + Math.floor(Math.random() * 19);
}

function toast(msg, type = 'ok') {
    const el = $('toast'), ic = $('toast-icon'), txt = $('toast-msg');
    if (!el) return;
    ic.innerHTML = type === 'ok'
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    txt.textContent = msg;
    el.className = `toast ${type} show`;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.className = 'toast', 3500);
}