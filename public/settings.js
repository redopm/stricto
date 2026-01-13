// settings.js
import { auth, db, doc, setDoc, updateDoc } from './firebase-config.js';
import { requireAuth, loadUserProfile, parseTags } from './app.js';

// Auth Guard
(async () => {
    const user = await requireAuth();
    if (user) {
        await initSettings(user.uid);
    }
})();

async function initSettings(uid) {
    const { dna } = await loadUserProfile(uid);

    // Check if user was redirected from dashboard (new user flow)
    const isNewUserRedirect = sessionStorage.getItem('stricto_new_user') === 'true';

    if (isNewUserRedirect) {
        // Clear flag
        sessionStorage.removeItem('stricto_new_user');

        // Show welcome banner
        const header = document.querySelector('.glass-panel');
        if (header) {
            const banner = document.createElement('div');
            banner.style.cssText = `
                background: linear-gradient(135deg, rgba(10,255,104,0.1), rgba(0,180,216,0.1));
                border: 1px solid var(--primary);
                border-radius: 8px;
                padding: 15px 20px;
                margin-bottom: 20px;
                text-align: center;
                animation: fadeIn 0.5s;
            `;
            banner.innerHTML = `
                <p style="color: var(--primary); font-weight: bold; margin: 0;">
                    🎯 WELCOME TO STRICTO! Complete your profile to get personalized study tasks.
                </p>
            `;
            header.insertBefore(banner, header.firstChild);
        }
    }

    if (dna && dna.goal) {
        populateForm(dna);
    } else {
        // New User Mode: Adjust UI
        document.title = "Stricto // Calibration";
        document.querySelector('h1').innerText = "SYSTEM CALIBRATION";
        document.querySelector('p.text-muted').innerText = "Configure AI parameters for optimal mission generation.";

        const subBtn = document.querySelector('button[type="submit"]');
        subBtn.innerHTML = `<ion-icon name="finger-print-outline"></ion-icon> INITIALIZE PROTOCOL`;

        const backBtn = document.getElementById('back-btn');
        if (backBtn) backBtn.style.display = 'none';

        // Default values for new user
        document.getElementById('daily-hours').value = 6;
        document.getElementById('chronotype').value = 'early_bird';
    }
}

function populateForm(dna) {
    if (dna.goal) {
        document.getElementById('exam-goal').value = dna.goal.exam || 'SSC CGL';
        const dateInput = document.getElementById('exam-date');

        // Handle Date Logic
        if (dna.goal.date && dna.goal.date !== 'other') {
            dateInput.value = dna.goal.date;
            document.querySelector('input[name="date_type"][value="known"]').checked = true;
            document.getElementById('date-picker-wrapper').style.display = 'block';
        } else {
            document.querySelector('input[name="date_type"][value="unknown"]').checked = true;
            document.getElementById('date-picker-wrapper').style.display = 'none';
        }

        // Stage
        if (dna.goal.stage) {
            const rad = document.querySelector(`input[name="exam_stage"][value="${dna.goal.stage}"]`);
            if (rad) rad.checked = true;
        }
    }

    if (dna.level) {
        // Load user type (beginner/repeater)
        const userTypeRadio = document.querySelector(`input[name="user_type"][value="${dna.level}"]`);
        if (userTypeRadio) userTypeRadio.checked = true;
    }

    if (dna.subjects) {
        document.getElementById('weak-subjects').value = (dna.subjects.weak || []).join(', ');
        document.getElementById('avg-subjects').value = (dna.subjects.average || []).join(', ');
        document.getElementById('strong-subjects').value = (dna.subjects.strong || []).join(', ');
    }

    if (dna.schedule) {
        document.getElementById('daily-hours').value = dna.schedule.hours || 6;
        const cron = document.querySelector(`input[name="chronotype"][value="${dna.schedule.chronotype}"]`);
        if (cron) cron.checked = true;
    }
}

// Handle Update
document.getElementById('setup-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const isInit = btn.innerText.includes("INITIALIZE");

    btn.innerHTML = `<ion-icon name="sync" class="spin"></ion-icon> ${isInit ? 'PROFILING...' : 'UPDATING...'}`;

    const dateType = document.querySelector('input[name="date_type"]:checked').value;
    const unknownDate = (dateType === 'unknown');
    const userType = document.querySelector('input[name="user_type"]:checked').value;

    // Reconstruct DNA
    const newDNA = {
        goal: {
            exam: document.getElementById('exam-goal').value,
            date: unknownDate ? "other" : (document.getElementById('exam-date').value || "2026-06-15"),
            stage: document.querySelector('input[name="exam_stage"]:checked').value
        },
        level: userType,
        subjects: {
            weak: parseTags(document.getElementById('weak-subjects').value),
            average: parseTags(document.getElementById('avg-subjects').value),
            strong: parseTags(document.getElementById('strong-subjects').value)
        },
        schedule: {
            hours: parseInt(document.getElementById('daily-hours').value),
            chronotype: document.querySelector('input[name="chronotype"]:checked').value
        },
        // Initialize these if missing (for new users)
        history: [],
        streak: 0,
        progress: {}
    };

    // Update Local
    const old = JSON.parse(localStorage.getItem('stricto_userDNA') || '{}');

    const finalDNA = {
        ...old, // keep old data (like history, progress)
        ...newDNA, // overwrite config
        // Restore complex objects if they existed in 'old' and we don't want to wipe them
        history: old.history || [],
        streak: old.streak || 0,
        progress: old.progress || {}
    };

    localStorage.setItem('stricto_userDNA', JSON.stringify(finalDNA));
    localStorage.setItem('stricto_setup_complete', 'true');

    // Update Cloud
    if (auth.currentUser) {
        try {
            const userRef = doc(db, "users", auth.currentUser.uid);
            await setDoc(userRef, {
                userDNA: finalDNA,
                setupComplete: true,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (err) {
            console.error(err);
        }

        // CRITICAL FIX: Clear cached tasks to force regeneration with new profile settings
        try {
            const taskKey = `stricto_tasks_${auth.currentUser.uid}`;
            localStorage.removeItem(taskKey);

            // Also clear from Firestore to prevent cloud sync restoration
            const userRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(userRef, {
                tasks: []  // Clear old tasks
            });

            console.log("🔄 Tasks cleared from localStorage & Firestore - will regenerate with new profile");
        } catch (err) {
            console.warn("Could not clear tasks:", err);
        }
    }

    if (!isInit) alert("Configuration Updated Successfully for " + newDNA.goal.stage);

    // Redirect
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
};

// function parseTags(str) { ... } removed (imported from app.js)

// Back Button
document.getElementById('back-btn').onclick = () => window.location.href = 'dashboard.html';
