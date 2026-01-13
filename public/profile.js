// profile.js - Logic for profile.html

import { requireAuth, loadUserProfile, logoutUser } from './app.js';
import { auth } from './firebase-config.js';

(async () => {
    // 0. Bind Actions immediately (safer)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.onclick = logoutUser;

    // 1. Auth Guard
    const user = await requireAuth();
    if (user) {
        // 2. Load Data
        const { dna, tasks, history } = await loadUserProfile(user.uid);

        const STATE = {
            user: user,
            userDNA: dna,
            tasks: tasks,
            profile: { history: history } // Structuring to match renderProfile expectations
        };

        // 3. Render
        renderProfile(STATE);
    }
})();

function renderProfile(STATE) {
    // Basic Info
    const name = STATE.user.displayName || "Warrior";
    document.getElementById('profile-name').innerText = name;
    document.getElementById('profile-initials').innerText = name.charAt(0).toUpperCase();

    if (document.getElementById('profile-exam')) {
        document.getElementById('profile-exam').innerText = STATE.userDNA?.goal?.exam || "General";
    }

    if (document.getElementById('user-id-display')) {
        // Show truncated UID or custom ID
        document.getElementById('user-id-display').innerText = STATE.user.uid.substring(0, 8).toUpperCase();
    }

    // Stats
    const total = STATE.tasks.length;
    const done = STATE.tasks.filter(t => t.completed).length;
    const score = total > 0 ? Math.round((done / total) * 100) : 0;

    document.getElementById('consistency-score').innerText = `${score}%`;
    document.getElementById('day-streak').innerText = calculateStreak(STATE.tasks);
    document.getElementById('hours-logged').innerText = calculateHours(STATE.tasks);

    // Heatmap 
    renderHeatmap(STATE.profile?.history || {});
}

function calculateStreak(tasks) {
    return localStorage.getItem('stricto_streak') || 0;
}

function calculateHours(tasks) {
    const done = tasks.filter(t => t.completed);
    let mins = 0;
    done.forEach(t => mins += (Number(t.duration) || 0));
    return Math.floor(mins / 60);
}

function renderHeatmap(history = {}) {
    const container = document.getElementById('heatmap-grid');
    if (!container) return;

    container.innerHTML = '';
    const today = new Date();

    // Reverse Loop (Last 84 days)
    for (let i = 83; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];

        const entry = history[dateKey];
        const div = document.createElement('div');
        div.className = "heatmap-node";
        div.title = `${dateKey}: No Activity`; // Default

        if (entry) {
            div.classList.add(`status-${entry.status}`);
            if (entry.status === 'full') div.title = `${dateKey}: Mission Accomplished`;
            else if (entry.status === 'partial') div.title = `${dateKey}: Partial (${entry.percent}%)`;
            else if (entry.status === 'fail') div.title = `${dateKey}: Failed`;
            else if (entry.status === 'leave') div.title = `${dateKey}: On Leave`;
        }

        container.appendChild(div);
    }
}


