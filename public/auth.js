// auth.js - Pure Logic Component
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, googleProvider, signInWithPopup, updateProfile, db, doc, setDoc, getDoc } from './firebase-config.js';

// Logic
let isLogin = true;
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const authBtn = document.getElementById('auth-btn');
const errorMsg = document.getElementById('auth-error');
const regFields = document.getElementById('register-fields');

// Mode Switcher
const toggleMode = (login) => {
    isLogin = login;
    const forgotLink = document.getElementById('forgot-password-link');

    if (isLogin) {
        // Login State
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');

        regFields.classList.add('hidden');
        if (forgotLink) forgotLink.style.display = 'block'; // Show forgot password
        authBtn.innerText = "ENTER SYSTEM";
        authBtn.classList.remove('btn-accent');
    } else {
        // Register State
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');

        regFields.classList.remove('hidden');
        if (forgotLink) forgotLink.style.display = 'none'; // Hide forgot password
        authBtn.innerText = "INITIATE PROTOCOL";
        authBtn.classList.add('btn-accent'); // CSS logic ensures color
    }
    if (errorMsg) errorMsg.innerText = "";
};

// Event Listeners
if (tabLogin) tabLogin.onclick = () => toggleMode(true);
if (tabSignup) tabSignup.onclick = () => toggleMode(false);

// Google Auth Logic
const googleBtn = document.getElementById('google-btn');
if (googleBtn) {
    googleBtn.onclick = async () => {
        try {
            authBtn.innerHTML = '<span class="blink">AUTHENTICATING...</span>';
            await signInWithPopup(auth, googleProvider);
            window.location.href = 'dashboard.html';
        } catch (error) {
            authBtn.innerText = isLogin ? "ENTER SYSTEM" : "INITIATE PROTOCOL";
            if (errorMsg) errorMsg.innerText = error.message;
        }
    };
}

// Forgot Password Logic
const forgotPasswordBtn = document.getElementById('forgot-password-btn');
if (forgotPasswordBtn) {
    forgotPasswordBtn.onclick = async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const email = emailInput.value.trim();

        if (!email) {
            if (errorMsg) {
                errorMsg.innerText = "📧 Please enter your email address first";
                errorMsg.style.color = "var(--warning)";
            }
            emailInput.focus();
            return;
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (errorMsg) {
                errorMsg.innerText = "❌ Invalid email format";
                errorMsg.style.color = "var(--danger)";
            }
            return;
        }

        authBtn.innerHTML = '<span class="blink">SENDING RESET LINK...</span>';

        try {
            // Import sendPasswordResetEmail
            const { sendPasswordResetEmail } = await import('./firebase-config.js');
            await sendPasswordResetEmail(auth, email);

            if (errorMsg) {
                errorMsg.innerText = "✅ PASSWORD RESET EMAIL SENT! Check your inbox.";
                errorMsg.style.color = "var(--primary)";
            }
            authBtn.innerText = "EMAIL SENT ✓";
            authBtn.style.background = "var(--primary)";

            setTimeout(() => {
                authBtn.innerText = "ENTER SYSTEM";
                authBtn.style.background = "transparent";
                if (errorMsg) errorMsg.innerText = "";
            }, 3000);

        } catch (error) {
            console.error("Password reset error:", error);
            authBtn.innerText = "ENTER SYSTEM";
            authBtn.style.background = "transparent";

            let msg = "❌ Failed to send reset email";
            if (error.code === 'auth/user-not-found') {
                msg = "⚠️ No account found with this email";
            } else if (error.code === 'auth/invalid-email') {
                msg = "📧 Invalid email address";
            } else if (error.code === 'auth/too-many-requests') {
                msg = "⏸️ Too many requests. Try again later";
            }

            if (errorMsg) {
                errorMsg.innerText = msg;
                errorMsg.style.color = "var(--danger)";
            }
        }
    };
}

// Validation Logic
const validate = () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;

    if (!isLogin) {
        const username = document.getElementById('username')?.value;
        const phone = document.getElementById('phone')?.value;

        if (!username || username.length < 3) return "Codename Invalid: Too Short (Min 3).";
        if (!/^\d{10}$/.test(phone)) return "Comms Error: Phone must be 10 digits.";

        // Password Complexity
        const hasUpper = /[A-Z]/.test(pass);
        const hasLower = /[a-z]/.test(pass);
        const hasNum = /[0-9]/.test(pass);
        const hasSpecial = /[!@#$%^&*]/.test(pass);
        if (pass.length < 8 || !hasUpper || !hasLower || !hasNum || !hasSpecial) {
            return "Weak Security: 8+ Chars, Upper, Lower, Number & Special Required.";
        }
    }
    return null;
};

// Main Form Handler
const authForm = document.getElementById('auth-form');
if (authForm) {
    authForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Clear Error
        if (errorMsg) {
            errorMsg.innerText = "";
            errorMsg.style.color = "var(--danger-color)";
        }

        // Validate
        const validationError = validate();
        if (validationError) {
            if (errorMsg) errorMsg.innerText = validationError;
            // Shake UI
            const panel = document.querySelector('.glass-panel');
            if (panel) {
                panel.style.animation = 'none';
                panel.offsetHeight;
                panel.style.animation = 'shake 0.5s';
            }
            return;
        }

        authBtn.innerHTML = '<span class="blink">PROCESSING...</span>';

        try {
            if (isLogin) {
                // await signInWithEmailAndPassword(auth, email, password);
                // The snippet requested uses the result of this promise.
                // CURRENT CODE: await signInWithEmailAndPassword(auth, email, password);

                // We need the user credential to get UID.
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 🔍 CHECK: Old vs New User
                // Check if user profile doc exists in Firestore
                // Note: Imports must include getDoc

                let targetPage = 'dashboard.html'; // Default

                try {
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        console.log("Old User: Redirecting to Dashboard...");
                        targetPage = 'dashboard.html';
                    } else {
                        console.log("New/Reset User: Redirecting to Dashboard (Setup Flag)...");
                        sessionStorage.setItem('stricto_new_user', 'true');
                        targetPage = 'dashboard.html';
                    }
                } catch (err) {
                    console.warn("Offline/Error during redirection check, defaulting to Dashboard", err);
                }

                authBtn.innerText = "ACCESS GRANTED";
                authBtn.style.background = "var(--primary-color)";
                setTimeout(() => window.location.href = targetPage, 500);
            } else {
                const userCred = await createUserWithEmailAndPassword(auth, email, password);

                const username = document.getElementById('username').value;
                const phone = document.getElementById('phone').value;

                try {
                    await updateProfile(userCred.user, { displayName: username });
                    await setDoc(doc(db, "users", userCred.user.uid), {
                        username: username,
                        phone: phone,
                        email: email,
                        joined: new Date().toISOString(),
                        lastLoginDate: new Date().toDateString(),
                        tasks: [],
                        progress: null
                    });
                } catch (extraErr) {
                    console.warn("Permission Error (Hybrid Fallback)", extraErr);
                    localStorage.setItem('stricto_sub_dna', JSON.stringify({ username, phone }));
                }

                authBtn.innerText = "IDENTITY CREATED";
                authBtn.style.background = "var(--accent-color)";
                // Flag new user for Dashboard to handle
                sessionStorage.setItem('stricto_new_user', 'true');
                setTimeout(() => window.location.href = 'dashboard.html', 500);
            }
        } catch (error) {
            console.error(error);
            authBtn.innerText = isLogin ? "ENTER SYSTEM" : "INITIATE PROTOCOL";
            authBtn.style.background = "transparent";

            // User-Friendly Error Messages
            let msg = error.message;
            const code = error.code;

            if (code === 'auth/email-already-in-use') {
                msg = "⚠️ ALERT: Email already registered! Please LOGIN instead.";
            } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
                msg = "❌ LOGIN FAILED: Wrong email or password!";
            } else if (code === 'auth/weak-password') {
                msg = "🔒 SECURITY ALERT: Password too weak (min 6 characters)";
            } else if (code === 'auth/invalid-email') {
                msg = "📧 INVALID EMAIL: Please enter a valid email address";
            } else if (code === 'auth/network-request-failed') {
                msg = "🌐 CONNECTION FAILED: Check your internet connection";
            } else if (code === 'auth/too-many-requests') {
                msg = "⏸️ TOO MANY ATTEMPTS: Please try again later";
            }

            if (errorMsg) {
                errorMsg.innerText = msg;
                // Shake animation for error
                const panel = document.querySelector('.auth-card');
                if (panel) {
                    panel.style.animation = 'none';
                    setTimeout(() => panel.style.animation = 'shake 0.5s', 10);
                }
            }
        }
    };
}
