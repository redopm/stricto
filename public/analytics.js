// analytics.js
import { requireAuth, loadUserProfile } from './app.js';

// Global Chart Instance to destroy before re-rendering
let myRadarChart = null;

// --- INIT ---
(async () => {
    const user = await requireAuth();
    if (user) {
        await initAnalytics(user.uid);
    }
})();

async function initAnalytics(uid) {
    console.log("Initializing Analytics for:", uid);
    try {
        const { dna, tasks, history } = await loadUserProfile(uid);
        console.log("Data Loaded:", { dna, tasksCount: tasks?.length });

        if (!dna) {
            console.error("No DNA found for user.");
            document.getElementById('target-exam-name').innerText = "NO DATA";
            return;
        }

        // 1. Calculate Stats
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;

        // 2. Identity & Goal Section
        console.log("Rendering Identity...");
        renderIdentity(dna, tasks);

        // 3. Render Radar Chart (The "Spider")
        renderRadarChart(dna);

        // 4. Render Visual Sliders (DNA)
        renderDNASliders(dna);

        // Dom Updates
        renderWeeklyChart(tasks);
        renderSubjectHeatmaps(tasks);
    } catch (error) {
        console.error("Analytics Initialization Failed:", error);
    }
}

// --- 1. IDENTITY & GOAL LOGIC ---
function renderIdentity(dna, tasks) {
    if (!dna) return;

    // Name & Initials
    const name = dna.name || "Agent";
    document.getElementById('intel-initials').innerText = name.charAt(0).toUpperCase();

    // Badge Logic (Simple Gamification)
    const completedCount = tasks ? tasks.filter(t => t.completed).length : 0;
    let badge = "ROOKIE";
    if (completedCount > 10) badge = "SOLDIER";
    if (completedCount > 50) badge = "WARRIOR";
    if (completedCount > 100) badge = "VETERAN";
    document.getElementById('intel-level-badge').innerText = badge;
    const rankEl = document.getElementById('user-rank');
    if (rankEl) rankEl.innerText = badge;

    // Exam Target
    const examName = dna.goal?.exam || "No Mission Set";
    document.getElementById('target-exam-name').innerText = examName.toUpperCase();

    // Phase Tag
    const stage = dna.goal?.stage || "Prelims";
    const phaseEl = document.getElementById('exam-phase-tag');
    phaseEl.innerText = `PHASE: ${stage.toUpperCase()}`;
    if (stage === 'Mains') {
        phaseEl.style.borderColor = 'var(--danger)';
        phaseEl.style.color = 'var(--danger)';
        phaseEl.style.boxShadow = '0 0 10px rgba(255, 0, 60, 0.2)';
    }

    // Countdown Timer
    if (dna.goal?.date) {
        if (dna.goal.date === 'other') {
            document.getElementById('countdown-timer').innerText = "TBD";
        } else {
            const targetDate = new Date(dna.goal.date);
            const today = new Date();
            const diffTime = targetDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const timerEl = document.getElementById('countdown-timer');
            if (diffDays > 0) {
                timerEl.innerText = diffDays;
            } else if (diffDays === 0) {
                timerEl.innerText = "TODAY";
                timerEl.style.color = "var(--danger)";
            } else {
                timerEl.innerText = "DONE";
                timerEl.style.color = "var(--text-dim)";
            }
        }
    } else {
        document.getElementById('countdown-timer').innerText = "---";
    }
}

// --- 2. RADAR CHART LOGIC ---
function renderRadarChart(dna) {
    const canvas = document.getElementById('radarChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Determine score based on proficiency string
    // Strong = 90, Average = 60, Weak = 30
    const getScore = (subjectName) => {
        // DNA structure: { subjects: { strong: ['Math'], weak: ['Eng'] } }
        // Note: Check DNA structure carefully. settings.js uses dna.subjects.strong
        if (dna.subjects?.strong?.includes(subjectName)) return 90;
        if (dna.subjects?.average?.includes(subjectName)) return 60;
        if (dna.subjects?.weak?.includes(subjectName)) return 30;
        return 50; // Default
    };

    const dataPoints = [
        getScore('Math'),
        getScore('Reasoning'),
        getScore('English'),
        getScore('GA')
    ];

    // Colors
    const primaryColor = '#0aff68';
    const glassFill = 'rgba(10, 255, 104, 0.2)';

    if (myRadarChart) myRadarChart.destroy();

    myRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Math', 'Reasoning', 'English', 'Gen. Awareness'],
            datasets: [{
                label: 'Capability Matrix',
                data: dataPoints,
                backgroundColor: glassFill,
                borderColor: primaryColor,
                pointBackgroundColor: primaryColor,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: primaryColor,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: {
                        color: '#fff',
                        font: { size: 12, family: 'Outfit' }
                    },
                    ticks: { display: false, max: 100, min: 0 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// --- 3. SLIDER VISUALS ---
function renderDNASliders(dna) {
    const setBar = (id, subName) => {
        const fillEl = document.getElementById(`fill-${id}`);
        const valEl = document.getElementById(`val-${id}`);

        let width = '50%';
        let text = 'Avg';
        let color = 'var(--warning)'; // Yellow default

        if (dna.subjects?.strong?.includes(subName)) {
            width = '90%'; text = 'Strong'; color = 'var(--primary)'; // Green
        } else if (dna.subjects?.weak?.includes(subName)) {
            width = '30%'; text = 'Weak'; color = 'var(--danger)'; // Red
        }

        fillEl.style.width = width;
        fillEl.style.backgroundColor = color;
        valEl.innerText = text;
        valEl.style.color = color;
    };

    setBar('math', 'Math');
    setBar('reas', 'Reasoning');
    setBar('eng', 'English');
    setBar('ga', 'GA');

    // Show GA only if relevant (Mains or explicitly listed)
    if (dna.goal?.stage === 'Mains' || dna.subjects?.average?.includes('GA')) {
        document.getElementById('ga-slider-group').style.display = 'block';
    }
}

function renderWeeklyChart(tasks) {
    const container = document.getElementById('weekly-chart-container');
    container.innerHTML = '';

    // 1. Get Last 7 Days Data
    const days = [];
    const counts = [];
    const today = new Date();

    // Map of date -> count
    const intensityMap = {};
    tasks.forEach(t => {
        if (t.completed) {
            const d = t.created ? t.created.split('T')[0] : new Date().toISOString().split('T')[0];
            intensityMap[d] = (intensityMap[d] || 0) + 1;
        }
    });

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue

        days.push(dayName);
        counts.push(intensityMap[dateStr] || 0);
    }

    const maxVal = Math.max(...counts, 5); // Minimum scale of 5 for visual balance

    // 2. Render Bars
    days.forEach((day, index) => {
        const count = counts[index];
        const heightPercent = (count / maxVal) * 100;

        const wrapper = document.createElement('div');
        wrapper.className = 'chart-bar-wrapper';
        wrapper.style.flex = '1'; /* Flex shorthand often cleaner inline for grid logic, but could be class */

        wrapper.innerHTML = `
            <div class="chart-bar-label" style="color: ${count > 0 ? '#fff' : 'transparent'}">${count}</div>
            <div class="chart-bar ${count > 0 ? 'filled' : 'empty'}" style="height: ${heightPercent}%;"></div>
            <div style="margin-top: 10px; font-size: 0.8rem; color: var(--text-dim);">${day}</div>
        `;

        container.appendChild(wrapper);
    });
}

function renderSubjectHeatmaps(tasks) {
    const container = document.getElementById('subject-heatmaps-container');
    container.innerHTML = '';

    // 1. Dynamic Subject Detection
    const detectedSubjects = new Set();
    const defaults = ['MATH', 'REASONING', 'ENGLISH', 'GA'];
    defaults.forEach(s => detectedSubjects.add(s));

    tasks.forEach(t => {
        if (t.category) detectedSubjects.add(t.category.toUpperCase());
    });

    const subjects = Array.from(detectedSubjects);

    // Group tasks by subject
    const subjectData = {};
    subjects.forEach(s => subjectData[s] = []);

    tasks.forEach(t => {
        if (t.completed && t.category) {
            const cat = t.category.toUpperCase();
            if (!subjectData[cat]) subjectData[cat] = [];
            subjectData[cat].push(t);
        }
    });

    // Render a Month-wise Heatmap for EACH subject
    subjects.forEach(subject => {
        const section = document.createElement('div');
        section.className = 'chart-container glass-panel';
        section.style.cssText = 'padding: 15px; margin-bottom: 15px;';

        // Header
        const header = document.createElement('h3');
        header.style.cssText = 'margin: 0 0 10px 0; font-size: 0.85rem;';
        header.innerHTML = `<ion-icon name="analytics-outline"></ion-icon> ${subject}`;
        section.appendChild(header);

        // GitHub-style grid container
        const scroller = document.createElement('div');
        scroller.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, 15px);
            gap: 6px;
            padding: 5px 0;
            max-width: 100%;
        `;


        // Generate intensity map
        const intensityMap = {};
        subjectData[subject].forEach(t => {
            const d = t.created ? t.created.split('T')[0] : new Date().toISOString().split('T')[0];
            intensityMap[d] = (intensityMap[d] || 0) + 1;
        });

        const today = new Date();
        const daysToShow = 31;

        // Render 31 days as simple bars
        for (let i = daysToShow; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = intensityMap[dateStr] || 0;

            let level = 0;
            if (count > 0) level = 1;
            if (count > 2) level = 2;
            if (count > 4) level = 3;

            const cell = document.createElement('div');
            cell.style.cssText = `
                width: 15px;
                height: 15px;
                border-radius: 2px;
                background: ${count === 0 ? 'rgba(255,255,255,0.08)' :
                    `rgba(10, 255, 104, ${0.25 + (level * 0.2)})`};
            `;
            cell.title = `${dateStr}: ${count} tasks`;
            scroller.appendChild(cell);
        }

        section.appendChild(scroller);
        container.appendChild(section);
    });
}

function renderActivityMatrix(history, tasks) {
    const grid = document.getElementById('activity-grid');
    grid.innerHTML = '';

    // Generate last 365 days (Github style)
    // For simplicity, let's do last ~150 days (approx 5 months) to fit mobile
    const daysToShow = 150;
    const today = new Date();

    // Create a map of date -> intensity
    const intensityMap = {};

    // 1. From History (Leaves, etc) - optional

    // 2. From Tasks (Real work)
    tasks.forEach(t => {
        if (t.completed) {
            // Use completed date if available, else created date
            // Assuming we don't track completedAt yet, we use created as proxy or stick to today if just clicked
            // Best effort: parse created date
            const dateStr = t.created.split('T')[0];
            intensityMap[dateStr] = (intensityMap[dateStr] || 0) + 1;
        }
    });

    // Render Grid
    for (let i = daysToShow; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const count = intensityMap[dateStr] || 0;

        let level = 0;
        if (count > 0) level = 1;
        if (count > 2) level = 2;
        if (count > 4) level = 3;

        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.dataset.date = dateStr;
        cell.dataset.level = level;

        // Tooltip title
        cell.title = `${dateStr}: ${count} missions`;

        grid.appendChild(cell);
    }
}
