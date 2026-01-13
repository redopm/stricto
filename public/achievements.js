import { requireAuth, loadUserProfile } from './app.js';

let STATE = {
    user: null,
    dna: null
};

// 🏆 Define all possible Badges here
const ALL_BADGES = [
    { id: 'task_10', title: 'First Steps', desc: 'Complete 10 Tasks successfully.', icon: 'footsteps' },
    { id: 'task_50', title: 'Half Century', desc: 'Complete 50 Tasks.', icon: 'bicycle' },
    { id: 'task_100', title: 'Centurion', desc: 'Hit the 100 Task Milestone.', icon: 'ribbon' },
    { id: 'streak_3', title: 'Hat-Trick', desc: 'Maintain a 3 Day Streak.', icon: 'flame' },
    { id: 'streak_7', title: 'Week Warrior', desc: 'One full week of discipline.', icon: 'flash' },
    { id: 'streak_21', title: 'Habit Master', desc: '21 Days: The habit is formed.', icon: 'medal' },
    { id: 'perfect_day', title: 'God Mode', desc: 'Complete ALL tasks in a single day.', icon: 'checkmark-done-circle' }
];

// --- INIT ---
(async () => {
    STATE.user = await requireAuth();
    if (STATE.user) {
        initPage(STATE.user.uid);
    }
})();

async function initPage(uid) {
    // Load User Data
    const { dna } = await loadUserProfile(uid);
    STATE.dna = dna;

    // Safety check if gamification data is missing
    if (!STATE.dna.gamification) {
        STATE.dna.gamification = { points: 0, badges: [] };
    }

    renderPoints();
    renderBadges();
    renderProfile();
}

function renderProfile() {
    // 1. Update Profile Section - Show actual user details
    const nameEl = document.getElementById('user-name-display');
    const avatarEl = document.getElementById('user-avatar');
    const levelEl = document.getElementById('user-level-text');
    const rankBadge = document.getElementById('user-rank-badge');

    if (STATE.user) {
        // Get username from displayName or email
        let displayName = STATE.user.displayName || STATE.user.email?.split('@')[0] || "Agent";
        if (nameEl) nameEl.innerText = displayName;

        // Update avatar with first letter
        if (avatarEl) {
            const initial = displayName.charAt(0).toUpperCase();
            avatarEl.innerText = initial;
        }

        // Update level text based on user type
        if (levelEl && STATE.dna) {
            const userType = STATE.dna.level || 'beginner';
            const goal = STATE.dna.goal?.exam || 'Banking Exam';
            levelEl.innerText = `${userType.toUpperCase()} | ${goal}`;
        }
    }

    // 2. Update Rank Badge based on tasks from user profile (if available)
    // Note: STATE.dna.gamification.totalTasksCompleted is more reliable here
    const completedCount = STATE.dna.gamification?.totalTasksCompleted || 0;

    let badge = "ROOKIE";
    if (completedCount > 10) badge = "SOLDIER";
    if (completedCount > 50) badge = "WARRIOR";
    if (completedCount > 100) badge = "VETERAN";

    if (rankBadge) {
        rankBadge.innerText = badge;
        // Fix badge style just in case CSS didn't catch it
        rankBadge.style.color = "#fff";
        rankBadge.style.background = "rgba(0,0,0,0.95)";
    }
}

function renderPoints() {
    // Points Update with simple counting animation effect
    const points = STATE.dna.gamification.points || 0;
    const pointsEl = document.getElementById('total-points');
    pointsEl.innerText = points;
}

function renderBadges() {
    const grid = document.getElementById('badge-grid');
    grid.innerHTML = '';

    // User ke unlocked badges ki list
    const unlockedIds = STATE.dna.gamification.badges || [];

    ALL_BADGES.forEach((badge, index) => {
        const isUnlocked = unlockedIds.includes(badge.id);

        // Create Card Element
        const card = document.createElement('div');
        // Add classes for styling (Locked vs Unlocked)
        card.className = `badge-card ${isUnlocked ? 'unlocked' : 'locked'}`;

        // Add subtle animation delay for cascading effect
        card.style.animation = `fadeIn 0.5s ease forwards ${index * 0.1}s`;

        // Card Internal HTML
        card.innerHTML = `
            <div class="badge-icon-box">
                <ion-icon name="${badge.icon}"></ion-icon>
            </div>
            <div class="badge-title">${badge.title}</div>
            <div class="badge-desc">${badge.desc}</div>
        `;

        grid.appendChild(card);
    });
}