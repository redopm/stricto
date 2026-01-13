// app.js - Shared State Manager & Utilities
import { auth, db, doc, getDoc, setDoc, onAuthStateChanged, signOut } from './firebase-config.js';

// 1. Auth Guard (Standard for all protected pages)
export function requireAuth(redirectUrl = 'login.html') {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                window.location.href = redirectUrl;
                resolve(null);
            } else {
                resolve(user);
            }
        });
    });
}

// 2. Load User Profile (Centralized Logic: Local -> Cloud -> Merge)
export async function loadUserProfile(uid) {
    let dna = null;
    let tasks = [];
    let history = {};

    // A. Local Strategy (Fastest)
    const localDNA = localStorage.getItem('stricto_userDNA');
    const localTasks = localStorage.getItem(`stricto_tasks_${uid}`); // Note: dashboard used specific key
    const localHistory = localStorage.getItem(`stricto_history_${uid}`);

    if (localDNA) dna = JSON.parse(localDNA);
    if (localTasks) tasks = JSON.parse(localTasks);
    if (localHistory) history = JSON.parse(localHistory);

    // B. Cloud Strategy (Sync)
    try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
            const data = snap.data();

            // Cloud is source of truth for DNA & Tasks usually
            if (data.userDNA) {
                dna = data.userDNA;
                localStorage.setItem('stricto_userDNA', JSON.stringify(dna));
            }
            if (data.tasks) {
                tasks = data.tasks;
                // Update local tasks relative to this user
                localStorage.setItem(`stricto_tasks_${uid}`, JSON.stringify(tasks));
            }
            if (data.history) {
                // For history, we might want to merge if offline was used, but simple overwrite is safer for now
                history = data.history;
                localStorage.setItem(`stricto_history_${uid}`, JSON.stringify(history));
            }
        }
    } catch (e) {
        console.warn("Offline Mode: Using Local Data", e);
    }

    // Default Structure if nothing found
    if (!dna) dna = { history: [], streak: 0, progress: {} };

    // Ensure Gamification Schema Exists
    if (!dna.gamification) {
        dna.gamification = {
            points: 0,
            badges: [],
            totalTasksCompleted: 0
        };
    }

    return { dna, tasks, history };
}

// 3. Shared Utilities
export function parseTags(str) {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

export async function logoutUser() {
    await signOut(auth);
    localStorage.clear();
    window.location.href = 'login.html';
}

// === GLOBAL UTILITIES (Share & Notify) ===

export async function shareApp() {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Stricto - Mission Ops',
                text: 'Join me on Stricto to conquer your daily missions! 🛡️',
                url: window.location.origin
            });
        } catch (err) {
            console.log('Error sharing:', err);
        }
    } else {
        // Fallback
        try {
            await navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard! 📋');
        } catch (err) {
            alert('Share URL: ' + window.location.href);
        }
    }
}

export function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
}

export function notifyTaskGenerated() {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
        new Notification("New Orders Received! 📜", {
            body: "Your daily protocol has been updated. Check the dashboard.",
            icon: "icon-192.png",
            vibrate: [200, 100, 200]
        });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                notifyTaskGenerated();
            }
        });
    }
}

// Make globally available for HTML onclick events
window.shareApp = shareApp;
window.requestNotificationPermission = requestNotificationPermission;
