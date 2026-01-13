// dashboard.js - Smart Scheduler Engine
import { auth, db, doc, updateDoc } from './firebase-config.js';
import { requireAuth, loadUserProfile, logoutUser } from './app.js';

// Global State
let STATE = {
    user: null,
    profile: null, // Full Firestore User Doc (Legacy structure support)
    dna: null,     // Short for profile.userDNA
    tasks: [],
    filter: { sort: 'priority', subject: 'all' }
};

// --- INIT ---
(async () => {
    const user = await requireAuth();
    if (user) {
        STATE.user = user;
        await initDashboard(user.uid);
        renderUI();
    }
})();

// --- DATA FNS ---
// --- DATA FNS ---
async function initDashboard(uid) {
    console.log("Loading dashboard data for:", uid);
    const { dna, tasks, history } = await loadUserProfile(uid);

    console.log("Loaded DNA:", dna);

    // NEW USER ONBOARDING: Auto-redirect to settings if profile incomplete
    if (!dna || !dna.goal || !dna.goal.exam || !dna.level) {
        console.warn("⚠️ NEW USER DETECTED: Profile incomplete. Redirecting to Settings...");
        // Store flag for settings page to show welcome message
        sessionStorage.setItem('stricto_new_user', 'true');
        window.location.href = 'settings.html';
        return;
    }

    STATE.dna = dna;
    STATE.tasks = tasks;

    // Construct Profile Object for legacy compatibility within this file
    STATE.profile = {
        userDNA: dna,
        tasks: tasks,
        history: history
    };

    // Calculate/Validate Syllabus (Fix for missing trajectory)
    if (!STATE.profile.history) STATE.profile.history = {};
}

function showSetupPrompt() {
    // Only used if new user flag is set
    if (confirm("First Time Setup: Initialize Protocol Parameters?")) {
        window.location.href = 'settings.html';
    }
}

async function saveTasks() {
    // 1. Local Save (Always works)
    localStorage.setItem(`stricto_tasks_${STATE.user.uid}`, JSON.stringify(STATE.tasks));

    // 2. Cloud Save (Best Effort)
    try {
        await updateDoc(doc(db, "users", STATE.user.uid), { tasks: STATE.tasks });
    } catch (e) {
        console.warn("Cloud save skipped (Permission/Network):", e.message);
    }
}

async function saveProfile() {
    localStorage.setItem('stricto_userDNA', JSON.stringify(STATE.dna));
    try {
        await updateDoc(doc(db, "users", STATE.user.uid), { userDNA: STATE.dna });
    } catch (e) { console.warn("Profile sync skipped:", e.message); }
}

// --- AI ENGINE (Python Bridge) ---
// --- AI ENGINE (Python Bridge) ---
// --- AI ENGINE (Python Bridge) ---
async function fetchTaskFromPython(subjectName, userLevel) {
    console.log("Asking Python Brain for task...");

    // Extract Metadata from Global State (loaded from Profile)
    let examStage = 'Prelims';
    let examDate = null;
    let userType = 'repeater';
    let dailyHours = 6; // Default

    // Estimate Syllabus (Mock Logic for now, can be real later)
    let syllabusCompleted = 30;

    if (STATE.dna) {
        if (STATE.dna.goal) {
            examStage = STATE.dna.goal.stage || 'Prelims';
            examDate = STATE.dna.goal.date;
        }
        userType = STATE.dna.level || 'repeater';
        if (userType === 'repeater') syllabusCompleted = 80;

        if (STATE.dna.schedule && STATE.dna.schedule.hours) {
            dailyHours = parseInt(STATE.dna.schedule.hours);
        }
    }

    // URL SWITCHING (DEV vs PROD)
    const IS_LOCALHOST = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

    // TODO: USER_MUST_UPDATE_THIS_AFTER_DEPLOYMENT
    const PROD_URL = "https://stricto-backend.onrender.com/get-daily-task";
    const DEV_URL = "http://127.0.0.1:5000/get-daily-task";

    const TARGET_URL = IS_LOCALHOST ? DEV_URL : PROD_URL;

    try {
        const response = await fetch(TARGET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject: subjectName,
                level: userLevel,
                examStage: examStage,
                examDate: examDate,
                userType: userType,
                syllabusCompleted: syllabusCompleted,
                dailyHours: dailyHours
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            console.error("Brain Error:", data.error);
            return null;
        }

        console.log("Brain Decision:", data);

        // Notify User
        if (window.notifyTaskGenerated) window.notifyTaskGenerated();

        return data;

    } catch (error) {
        console.error("Python Server is Offline! (Did you run server.py?)", error);
        return null;
    }
}

// --- CORE SCHEDULER LOGIC ---
// --- AI PROTOCOL LOGIC ---
async function initiateDailyProtocol(mood, hoursInput, specialReq) {
    if (!STATE.dna) return [];

    // 1. INTELLIGENT TASK GENERATION SETUP
    const isBeginner = STATE.dna.level === 'beginner';

    // 2. EXAM PROXIMITY CALCULATION
    let daysToExam = 999; // Default: far away
    if (STATE.dna.goal && STATE.dna.goal.date && STATE.dna.goal.date !== 'other') {
        const examDate = new Date(STATE.dna.goal.date);
        const today = new Date();
        daysToExam = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
    }

    // 3. PROXIMITY-BASED PRIORITY STRATEGY
    let revisionRatio = 0.2; // Default: 20% revision
    if (daysToExam < 7) revisionRatio = 0.8; // Crisis: 80% revision
    else if (daysToExam < 30) revisionRatio = 0.5; // Moderate: 50% revision

    console.log(`\u{1F4A1} Smart Strategy: ${daysToExam} days to exam, ${Math.round(revisionRatio * 100)}% revision tasks`);

    // 4. TASK DIVERSITY: Track last generated topics
    const recentTasks = STATE.tasks.slice(-7); // Last 7 tasks
    const recentTopics = recentTasks.map(t => t.title.toLowerCase());

    // 5. SUBJECT ALLOCATION: Weak subjects get priority
    const weakSubjects = (STATE.dna.subjects?.weak || []).map(s => s.toUpperCase());
    const strongSubjects = (STATE.dna.subjects?.strong || []).map(s => s.toUpperCase());

    // 6. BUILD SUBJECT PRIORITY LIST
    const subjects = [];
    // Weak subjects first (50% time allocation)
    weakSubjects.forEach(sub => {
        if (['MATH', 'REASONING', 'ENGLISH', 'GA'].includes(sub)) {
            subjects.push(sub);
        }
    });

    // Add remaining core subjects
    ['MATH', 'REASONING', 'ENGLISH', 'GA'].forEach(core => {
        if (!subjects.includes(core)) subjects.push(core);
    });

    let generatedTasks = [];

    console.log(`\u{1F916} Contacting AI Brain for ${subjects.length} subjects...`);

    // 7. PARALLEL TASK GENERATION
    const promises = subjects.map(async (sub) => {
        // Proficiency Check
        let proficiency = 'average';
        const weakList = (STATE.dna.subjects?.weak || []).map(s => s.toUpperCase());
        const strongList = (STATE.dna.subjects?.strong || []).map(s => s.toUpperCase());

        if (weakList.some(w => w.includes(sub) || (sub === 'GA' && w.includes('GK')))) proficiency = 'weak';
        if (strongList.some(s => s.includes(sub) || (sub === 'GA' && s.includes('GK')))) proficiency = 'strong';

        // FETCH FROM PYTHON
        const result = await fetchTaskFromPython(sub, proficiency);

        if (result && !result.error && result.tasks) {
            result.tasks.forEach(t => {
                // DIVERSITY CHECK: Skip if topic was recently done
                const isRecent = recentTopics.some(topic => topic.includes(t.task.toLowerCase().substring(0, 20)));
                if (!isRecent || daysToExam < 7) { // Allow repetition in crisis mode
                    // DURATION FIX: Backend sends "X.XX Hrs", convert to minutes
                    let durationMinutes = 45; // Default
                    if (t.duration && typeof t.duration === 'string') {
                        const match = t.duration.match(/([0-9.]+)/); // Extract number
                        if (match) {
                            const hours = parseFloat(match[1]);
                            durationMinutes = Math.round(hours * 60); // Convert to minutes
                            durationMinutes = Math.round(durationMinutes / 5) * 5; // Round to nearest 5
                        }
                    }

                    generatedTasks.push(createTask(
                        t.task,
                        sub,
                        durationMinutes,
                        t.priority || 'normal',
                        { type: t.type, strategy: t.strategy }
                    ));
                }
            });
        }
    });

    await Promise.all(promises);

    // 8. OPTIMAL TASK ORDERING FOR MAXIMUM LEARNING EFFICIENCY
    // Psychology: Fresh mind → Weak subjects, Tired mind → Strong subjects
    const weakList = (STATE.dna.subjects?.weak || []).map(s => s.toUpperCase());
    const strongList = (STATE.dna.subjects?.strong || []).map(s => s.toUpperCase());

    generatedTasks.sort((a, b) => {
        // Priority 1: Daily Habits FIRST (Editorial, Calculation) - Warm-up
        const aIsHabit = a.title.includes('Editorial') || a.title.includes('Calculation Drill');
        const bIsHabit = b.title.includes('Editorial') || b.title.includes('Calculation Drill');
        if (aIsHabit && !bIsHabit) return -1;
        if (!aIsHabit && bIsHabit) return 1;

        // Priority 2: Weak → Average → Strong (optimal energy allocation)
        const aIsWeak = weakList.some(w => a.category.includes(w) || (a.category === 'GA' && w.includes('GK')));
        const bIsWeak = weakList.some(w => b.category.includes(w) || (b.category === 'GA' && w.includes('GK')));
        const aIsStrong = strongList.some(s => a.category.includes(s) || (a.category === 'GA' && s.includes('GK')));
        const bIsStrong = strongList.some(s => b.category.includes(s) || (b.category === 'GA' && s.includes('GK')));

        if (aIsWeak && !bIsWeak) return -1; // Weak first
        if (!aIsWeak && bIsWeak) return 1;
        if (aIsStrong && !bIsStrong) return 1; // Strong last
        if (!aIsStrong && bIsStrong) return -1;

        // Priority 3: High priority within category
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;

        return 0;
    });

    console.log(`✅ Generated ${generatedTasks.length} tasks (Ordered: Habits → Weak → Avg → Strong)`);
    return generatedTasks;
}

function createTask(title, cat, dur, pri, meta = null) {
    return {
        id: Date.now() + Math.random(),
        title: title || "Unknown Mission", // Fallback
        category: cat,
        duration: dur,
        priority: pri,
        meta: meta,
        completed: false,
        created: new Date().toISOString()
    };
}


// --- UI RENDERING ---
function renderUI() {
    // 1. Update Profile Section - Show actual user details
    const nameEl = document.getElementById('user-name-display');
    const avatarEl = document.getElementById('user-avatar');
    const levelEl = document.getElementById('user-level-text');

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

    // 2. Update Rank Badge based on completed tasks
    const rankBadge = document.getElementById('user-rank-badge');
    const completedCount = STATE.tasks.filter(t => t.completed).length;
    let badge = "ROOKIE";
    if (completedCount > 10) badge = "SOLDIER";
    if (completedCount > 50) badge = "WARRIOR";
    if (completedCount > 100) badge = "VETERAN";
    if (rankBadge) rankBadge.innerText = badge;

    // 3. Dynamic Greeting
    const hour = new Date().getHours();
    let greeting = "MORNING PROTOCOL";
    if (hour >= 12 && hour < 17) greeting = "AFTERNOON PROTOCOL";
    else if (hour >= 17) greeting = "EVENING PROTOCOL";
    const greetingEl = document.getElementById('dynamic-greeting');
    if (greetingEl) greetingEl.innerText = greeting;

    // 4. Exam Countdown
    if (STATE.dna && STATE.dna.goal && STATE.dna.goal.date && STATE.dna.goal.date !== 'other') {
        const examDate = new Date(STATE.dna.goal.date);
        const today = new Date();
        const daysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
        const daysEl = document.getElementById('days-to-exam');
        if (daysEl) daysEl.innerText = daysLeft > 0 ? daysLeft : "0";
    }

    const container = document.getElementById('task-list-container');
    if (!container) return;

    // Filter Logic
    let displayTasks = [...STATE.tasks];

    // 1. Subject Filter
    if (STATE.filter.subject !== 'all') {
        displayTasks = displayTasks.filter(t => t.category === STATE.filter.subject);
    }

    // 2. Sort Logic
    if (STATE.filter.sort === 'priority') {
        displayTasks.sort((a, b) => {
            const pA = a.priority === 'high' ? 2 : 1;
            const pB = b.priority === 'high' ? 2 : 1;
            return pB - pA;
        });
    } else if (STATE.filter.sort === 'time_asc') {
        displayTasks.sort((a, b) => parseInt(a.duration) - parseInt(b.duration));
    } else if (STATE.filter.sort === 'time_desc') {
        displayTasks.sort((a, b) => parseInt(b.duration) - parseInt(a.duration));
    }

    container.innerHTML = '';
    if (displayTasks.length === 0) {
        if (STATE.tasks.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-dim); margin-top: 30px; cursor: pointer;">
                <ion-icon name="arrow-down-circle" style="font-size: 2rem;"></ion-icon><br>
                Click <strong>INITIATE DAILY PROTOCOL</strong> below to generate missions.
             </div>`;
        } else {
            container.innerHTML = `<div style="text-align: center; color: var(--text-dim); margin-top: 30px;">No tasks match filter config.</div>`;
        }
    } else {
        displayTasks.forEach(task => {
            const div = document.createElement('div');
            div.className = `task-card ${task.completed ? 'completed' : ''}`;
            // Add data attributes for CSS subject colors and priority
            div.setAttribute('data-subject', task.category);
            div.setAttribute('data-priority', task.priority || 'normal');

            div.innerHTML = `
                <div style="flex: 1;">
                    <div class="task-cat">${task.category}</div>
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <ion-icon name="time"></ion-icon> ${task.duration} min 
                        ${task.priority === 'high' ? '<span class="priority-badge-high">★ PRIORITY</span>' : ''}
                        ${task.meta && task.meta.type ? `<span style="font-size: 0.7rem; color: var(--secondary);">• ${task.meta.type}</span>` : ''}
                    </div>
                </div>
                <input type="checkbox" class="task-check" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
            `;
            container.appendChild(div);
        });
    }

    // Attach Filter Listeners (Once)
    const sortEl = document.getElementById('filter-sort');
    const subEl = document.getElementById('filter-subject');

    if (sortEl && !sortEl.dataset.bound) {
        sortEl.dataset.bound = true;
        sortEl.value = STATE.filter.sort;
        sortEl.addEventListener('change', (e) => {
            STATE.filter.sort = e.target.value;
            renderUI();
        });
    }

    if (subEl && !subEl.dataset.bound) {
        subEl.dataset.bound = true;
        subEl.value = STATE.filter.subject;
        subEl.addEventListener('change', (e) => {
            STATE.filter.subject = e.target.value;
            renderUI();
        });
    }

    // Checkbox Logic
    document.querySelectorAll('.task-check').forEach(cb => {
        cb.addEventListener('click', (e) => {
            const taskId = e.target.dataset.id;
            const task = STATE.tasks.find(t => t.id == taskId);
            if (!task.completed && e.target.checked) {
                e.preventDefault(); e.target.checked = false;
                initiateVerification(taskId, task);
            } else if (task.completed && !e.target.checked) {
                toggleTaskComplete(taskId, false);
            }
        });
    });

    renderStats();
    renderMissionControl();
}

// --- VERIFICATION & COMPLETION ---
let activeTaskId = null;
let streamRef = null;

function initiateVerification(taskId, task) {
    activeTaskId = taskId;
    const modal = document.getElementById('verify-modal');
    modal.classList.remove('hidden'); modal.classList.add('active');
    ['verify-cam', 'verify-upload', 'verify-text'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById('submit-proof-btn').disabled = true;

    const title = task.title.toUpperCase();
    if (title.includes('MOCK') || title.includes('TEST')) {
        document.getElementById('verify-upload').classList.remove('hidden');
    } else if (title.includes('REVISION') || title.includes('CONCEPT') || title.includes('FOUNDATION')) {
        document.getElementById('verify-text').classList.remove('hidden');
    } else {
        document.getElementById('verify-cam').classList.remove('hidden');
        startCamera();
    }
}

function closeVerification() {
    const modal = document.getElementById('verify-modal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
    stopCamera();
    activeTaskId = null;
}

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        document.getElementById('camera-stream').srcObject = stream;
        streamRef = stream;
    } catch (err) { alert("Camera Access Denied"); }
}

function stopCamera() {
    if (streamRef) { streamRef.getTracks().forEach(t => t.stop()); streamRef = null; }
}

function toggleTaskComplete(id, isComplete) {
    const task = STATE.tasks.find(t => t.id == id);
    if (!task) return;

    task.completed = isComplete;

    // PROGRESS TRACKING LOGIC
    if (isComplete) {
        // 1. UPDATE POINTS
        if (!STATE.dna.gamification) {
            STATE.dna.gamification = { points: 0, badges: [], totalTasksCompleted: 0 };
        }

        STATE.dna.gamification.points += 10;
        STATE.dna.gamification.totalTasksCompleted += 1;

        // 2. CHECK BADGES
        checkAchievements();

        // 3. TOPIC PROGRESS (Beginner Mode)
        if (task.meta && task.meta.topicId && task.meta.subjectKey) {
            if (!STATE.dna.progress) STATE.dna.progress = {};
            if (!STATE.dna.progress[task.meta.subjectKey]) STATE.dna.progress[task.meta.subjectKey] = [];

            // Add ID if not exists
            if (!STATE.dna.progress[task.meta.subjectKey].includes(task.meta.topicId)) {
                STATE.dna.progress[task.meta.subjectKey].push(task.meta.topicId);
            }
        }

        saveProfile(); // Write progress & gamification to DB
    }

    saveTasks();
    renderUI();
}

function checkAchievements() {
    const badges = [
        { id: 'task_10', title: 'Getting Started', desc: 'Complete 10 Tasks', condition: (d) => d.totalTasksCompleted >= 10 },
        { id: 'task_50', title: 'Half Century', desc: 'Complete 50 Tasks', condition: (d) => d.totalTasksCompleted >= 50 },
        { id: 'task_100', title: 'Centurion', desc: 'Complete 100 Tasks', condition: (d) => d.totalTasksCompleted >= 100 },
        { id: 'streak_3', title: 'Hat-Trick', desc: '3 Day Streak', condition: (d) => (localStorage.getItem('stricto_streak') || 0) >= 3 },
        { id: 'streak_7', title: 'Week Warrior', desc: '7 Day Streak', condition: (d) => (localStorage.getItem('stricto_streak') || 0) >= 7 }
    ];

    const unlocked = STATE.dna.gamification.badges;

    badges.forEach(b => {
        if (!unlocked.includes(b.id) && b.condition(STATE.dna.gamification)) {
            unlocked.push(b.id);
            showGamificationToast(b);
        }
    });
}

function showGamificationToast(badge) {
    const div = document.createElement('div');
    div.className = "gamification-toast glass-panel slide-in-right";

    div.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--secondary);">BADGE UNLOCKED!</div>
        <div style="font-weight: bold; margin-top: 5px;">🏆 ${badge.title}</div>
        <div style="font-size: 0.8rem; color: #ccc;">${badge.desc}</div>
        <div style="font-size: 0.7rem; color: var(--primary); margin-top: 5px;">+50 Bonus Points</div>
    `;

    document.body.appendChild(div);
    STATE.dna.gamification.points += 50; // Bonus for badge

    setTimeout(() => div.remove(), 4000);
}

// Modal Event Listeners
document.getElementById('close-verify-btn')?.addEventListener('click', closeVerification);
document.getElementById('capture-btn')?.addEventListener('click', () => {
    document.getElementById('submit-proof-btn').disabled = false;
    stopCamera();
});
document.getElementById('proof-file')?.addEventListener('change', () => document.getElementById('submit-proof-btn').disabled = false);
document.getElementById('proof-text')?.addEventListener('input', (e) => document.getElementById('submit-proof-btn').disabled = e.target.value.length < 5);
document.getElementById('submit-proof-btn')?.addEventListener('click', () => {
    if (activeTaskId) { toggleTaskComplete(activeTaskId, true); closeVerification(); }
});

// --- LEAVE LOGIC (FIXED) ---
// --- LEAVE & HISTORY LOGIC ---
document.getElementById('apply-leave-dash-btn')?.addEventListener('click', () => {
    const m = document.getElementById('leave-modal');
    if (m) { m.classList.remove('hidden'); m.classList.add('active'); }
});
document.getElementById('close-leave-btn')?.addEventListener('click', () => {
    const m = document.getElementById('leave-modal');
    m.classList.remove('active');
    m.classList.add('hidden');
});

document.getElementById('confirm-leave-btn')?.addEventListener('click', async () => {
    const days = parseInt(document.getElementById('leave-duration').value) || 1;
    const type = document.getElementById('leave-type').value;
    const btn = document.getElementById('confirm-leave-btn');

    btn.innerHTML = `<ion-icon name="sync" class="spin"></ion-icon> SAVING...`;

    // 1. Optimistic Update (InMemory)
    const historyUpdate = {};
    const today = new Date();
    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateKey = d.toISOString().split('T')[0];
        historyUpdate[dateKey] = { status: 'leave', type: type, percent: 0 };
    }

    const currentHistory = STATE.profile.history || {};
    const newHistory = { ...currentHistory, ...historyUpdate };

    STATE.profile.history = newHistory;

    // 2. Local Save (Critical for Offline Mode)
    // We explicitly save 'stricto_history_UID' to persist this just like tasks
    localStorage.setItem(`stricto_history_${STATE.user.uid}`, JSON.stringify(newHistory));

    // 3. Cloud Save (Best Effort)
    try {
        await updateDoc(doc(db, "users", STATE.user.uid), { history: newHistory });
        alert(`Leave approved for ${days} days.`);
    } catch (e) {
        console.warn("Leave Cloud Sync Failed (Offline Saved):", e.message);
        // Do NOT alert user about error, just confirm success visually
        alert(`Leave approved (Offline Mode). Data saved locally.`);
    }

    // Cleanup
    btn.innerHTML = `<ion-icon name="checkmark-circle"></ion-icon> CONFIRMED`;
    setTimeout(() => {
        const m = document.getElementById('leave-modal');
        m.classList.remove('active');
        m.classList.add('hidden');
        renderStats();
        window.location.reload(); // Reload to refresh calendar/heatmap
    }, 1000);
});

// --- STATS & SYLLABUS ---
function renderStats() {
    const total = STATE.tasks.length;
    const completed = STATE.tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const el = document.getElementById('stat-compliance');
    if (el) el.innerText = percent + "%";

    generateStrategicInsight(); // Call safely
}

function generateStrategicInsight() {
    const el = document.getElementById('ai-insight-text');
    if (!el || !STATE.dna) return;

    const examDateStr = STATE.dna.goal?.date;
    if (!examDateStr) {
        el.innerHTML = "⚠️ Setup Exam Date in Settings.";
        return;
    }

    // Simple Countdown first (Immediate Value)
    const daysLeft = Math.ceil((new Date(examDateStr) - new Date()) / (1000 * 60 * 60 * 24));

    let msg = `<div style="font-size:1.1rem; margin-bottom:10px;"><ion-icon name="hourglass"></ion-icon> <strong>${daysLeft} Days To Go</strong></div>`;

    // Velocity
    const history = STATE.profile?.history || {};
    const activeDays = Object.values(history).filter(h => h.status === 'full' || h.status === 'partial').length;

    if (activeDays < 3) {
        msg += `<div style="color:var(--text-dim); font-size:0.9rem;">Complete 3 missions to unlock Syllabus Projection.</div>`;
    } else {
        // Projection Logic
        const efficiency = activeDays / (Object.keys(history).length || 1);
        const effectiveSpeed = Math.max(efficiency, 0.1);
        const requiredDays = STATE.dna.level === 'beginner' ? 120 : 90;
        const projected = Math.round(requiredDays / effectiveSpeed);
        const buffer = daysLeft - projected;

        if (buffer >= 10) msg += `<div style="color:var(--primary)">✅ On Track! Expected finish: ${buffer} days early.</div>`;
        else if (buffer >= 0) msg += `<div style="color:var(--warning)">⚠️ Cut-to-Cut. No slack allow.</div>`;
        else msg += `<div style="color:var(--danger)">🛑 Behind Schedule by ${Math.abs(buffer)} days. Speed up!</div>`;
    }

    el.innerHTML = msg;
}

// Global Handlers
// Global Handlers
function renderMissionControl() {
    const panel = document.getElementById('mission-control-panel');
    if (!panel) return;
    panel.innerHTML = '';

    // Only show control if NO tasks exist. 
    // If tasks exist, we assume the day is planned. Use "Reset" if you want to clear.

    if (STATE.tasks.length === 0) {
        const btn = document.createElement('button');
        btn.className = "btn btn-primary w-full center";
        btn.style.padding = "20px";
        btn.innerHTML = `<ion-icon name="flash"></ion-icon> INITIATE DAILY PROTOCOL`;

        btn.onclick = async () => {
            const originalText = btn.innerHTML;
            btn.innerHTML = `<ion-icon name="sync" class="spin"></ion-icon> CONTACTING BRAIN...`;
            try {
                // Fetch New Tasks
                const newTasks = await initiateDailyProtocol('normal', null, null);

                if (newTasks.length > 0) {
                    STATE.tasks = newTasks; // Fresh Start
                    await saveTasks();
                    renderUI();
                } else {
                    btn.innerHTML = "NO NEW DIRECTIVES";
                    setTimeout(() => btn.innerHTML = originalText, 2000);
                }
            } catch (err) {
                console.error(err);
                btn.innerHTML = "SERVER OFFLINE";
                setTimeout(() => btn.innerHTML = originalText, 2000);
            }
        };
        panel.appendChild(btn);
    }
    // Reset/Manual controls removed for STRICTO compliance.
}

document.getElementById('logout-btn-dash')?.addEventListener('click', async () => {
    console.log("Logout Clicked");
    await logoutUser();
});
