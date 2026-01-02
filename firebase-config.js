// ===== FIREBASE AUTHENTICATION SYSTEM =====
console.log("🔥 Initializing Firebase Authentication...");

const firebaseConfig = {
    apiKey: "AIzaSyDovLKo3djdRbs963vqKdbj-geRWyzMTrg",
    authDomain: "planora-86835.firebaseapp.com",
    projectId: "planora-86835",
    storageBucket: "planora-86835.appspot.com",
    messagingSenderId: "971834924900",
    appId: "1:971834924900:web:ff3d82595e08839130e471"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Make available globally
window.auth = auth;
window.db = db;

console.log("✅ Firebase initialized successfully!");

// ===== AUTHENTICATION STATE LISTENER =====
auth.onAuthStateChanged((user) => {
    console.log("Auth state changed:", user ? user.email : "No user");
    
    if (user) {
        // User is signed in
        showUserInfo(user);
        loadUserData(user.uid);
    } else {
        // User is signed out
        showLoginPrompt();
        clearUserData();
    }
});

// ===== UI UPDATE FUNCTIONS =====
function showUserInfo(user) {
    document.getElementById('login-prompt').classList.add('hidden');
    document.getElementById('user-info').classList.remove('hidden');
    document.getElementById('username').textContent = user.email.split('@')[0]; // Show name before @
    
    // Close any open auth modals
    closeAllModals();
}

function showLoginPrompt() {
    document.getElementById('user-info').classList.add('hidden');
    document.getElementById('login-prompt').classList.remove('hidden');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="error-message">${message}</div>`;
    element.classList.remove('hidden');
    
    // Auto-remove error after 5 seconds
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="success-message">${message}</div>`;
    element.classList.remove('hidden');
    
    // Auto-remove success after 3 seconds
    setTimeout(() => {
        element.classList.add('hidden');
    }, 3000);
}

function showLoading(buttonId, spinnerId, textId) {
    document.getElementById(spinnerId).classList.remove('hidden');
    document.getElementById(textId).textContent = 'Processing...';
    document.getElementById(buttonId).disabled = true;
}

function hideLoading(buttonId, spinnerId, textId, originalText) {
    document.getElementById(spinnerId).classList.add('hidden');
    document.getElementById(textId).textContent = originalText;
    document.getElementById(buttonId).disabled = false;
}

// ===== SIGN UP FUNCTION =====
async function signUp(email, password, confirmPassword) {
    // Validation
    if (!email || !password || !confirmPassword) {
        throw new Error('Please fill in all fields');
    }
    
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
    }
    
    if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
    }
    
    if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
    }
    
    // Create user with Firebase
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        console.log("User created:", userCredential.user.email);
        
        // Create user data structure in database
        await db.ref('users/' + userCredential.user.uid).set({
            email: email,
            createdAt: new Date().toISOString(),
            plan: 'free'
        });
        
        return userCredential.user;
    } catch (error) {
        console.error("Sign up error:", error);
        
        // User-friendly error messages
        switch (error.code) {
            case 'auth/email-already-in-use':
                throw new Error('This email is already registered. Try logging in instead.');
            case 'auth/invalid-email':
                throw new Error('Please enter a valid email address.');
            case 'auth/weak-password':
                throw new Error('Password is too weak. Please choose a stronger password.');
            default:
                throw new Error('Sign up failed. Please try again.');
        }
    }
}

// ===== LOGIN FUNCTION =====
async function login(email, password) {
    // Validation
    if (!email || !password) {
        throw new Error('Please fill in all fields');
    }
    
    if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
    }
    
    // Login with Firebase
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log("User logged in:", userCredential.user.email);
        return userCredential.user;
    } catch (error) {
        console.error("Login error:", error);
        
        // User-friendly error messages
        switch (error.code) {
            case 'auth/user-not-found':
                throw new Error('No account found with this email.');
            case 'auth/wrong-password':
                throw new Error('Incorrect password. Please try again.');
            case 'auth/invalid-email':
                throw new Error('Please enter a valid email address.');
            case 'auth/user-disabled':
                throw new Error('This account has been disabled.');
            default:
                throw new Error('Login failed. Please check your credentials.');
        }
    }
}

// ===== LOGOUT FUNCTION =====
function logout() {
    auth.signOut().then(() => {
        console.log("User signed out successfully");
    }).catch((error) => {
        console.error("Logout error:", error);
        alert('Logout failed. Please try again.');
    });
}

// ===== FORGOT PASSWORD FUNCTION =====
async function forgotPassword(email) {
    if (!email) {
        throw new Error('Please enter your email address');
    }
    
    if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
    }
    
    try {
        await auth.sendPasswordResetEmail(email);
        return true;
    } catch (error) {
        console.error("Forgot password error:", error);
        
        switch (error.code) {
            case 'auth/user-not-found':
                throw new Error('No account found with this email.');
            case 'auth/invalid-email':
                throw new Error('Please enter a valid email address.');
            default:
                throw new Error('Failed to send reset email. Please try again.');
        }
    }
}

// ===== USER DATA FUNCTIONS =====
function loadUserData(userId) {
    console.log("Loading data for user:", userId);
    
    // Load user's tasks from Firebase
    db.ref('users/' + userId + '/tasks').on('value', (snapshot) => {
        const tasks = snapshot.val() || {};
        console.log("Tasks loaded:", Object.keys(tasks).length);
        // TODO: Update UI with tasks
    });
    
    // Load user's subjects
    db.ref('users/' + userId + '/subjects').on('value', (snapshot) => {
        const subjects = snapshot.val() || {};
        console.log("Subjects loaded:", Object.keys(subjects).length);
        // TODO: Update UI with subjects
    });
}

function clearUserData() {
    console.log("Clearing user data from UI");
    // TODO: Clear tasks and subjects from UI
}

// ===== HELPER FUNCTIONS =====
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ===== EVENT LISTENERS SETUP =====
function setupAuthEventListeners() {
    console.log("Setting up auth event listeners...");
    
    // Login button in header
    document.getElementById('login-btn').addEventListener('click', () => {
        document.getElementById('login-modal').classList.add('active');
    });
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Login form submit
    document.getElementById('login-submit-btn').addEventListener('click', async () => {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        showLoading('login-submit-btn', 'login-spinner', 'login-text');
        
        try {
            await login(email, password);
            // Success - modal will close automatically via auth state change
        } catch (error) {
            showError('login-error', error.message);
        } finally {
            hideLoading('login-submit-btn', 'login-spinner', 'login-text', 'Login');
        }
    });
    
    // Sign up form submit
    document.getElementById('signup-submit-btn').addEventListener('click', async () => {
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;
        
        showLoading('signup-submit-btn', 'signup-spinner', 'signup-text');
        
        try {
            await signUp(email, password, confirmPassword);
            // Success - modal will close automatically via auth state change
        } catch (error) {
            showError('signup-error', error.message);
        } finally {
            hideLoading('signup-submit-btn', 'signup-spinner', 'signup-text', 'Create Account');
        }
    });
    
    // Forgot password submit
    document.getElementById('forgot-submit-btn').addEventListener('click', async () => {
        const email = document.getElementById('forgot-email').value.trim();
        
        showLoading('forgot-submit-btn', 'forgot-spinner', 'forgot-text');
        
        try {
            await forgotPassword(email);
            showSuccess('forgot-success', 'Password reset email sent! Check your inbox.');
            document.getElementById('forgot-email').value = '';
            
            // Close modal after 3 seconds
            setTimeout(() => {
                document.getElementById('forgot-modal').classList.remove('active');
            }, 3000);
        } catch (error) {
            showError('forgot-error', error.message);
        } finally {
            hideLoading('forgot-submit-btn', 'forgot-spinner', 'forgot-text', 'Send Reset Link');
        }
    });
    
    // Modal switching
    document.getElementById('switch-to-signup').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-modal').classList.remove('active');
        document.getElementById('signup-modal').classList.add('active');
    });
    
    document.getElementById('switch-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signup-modal').classList.remove('active');
        document.getElementById('login-modal').classList.add('active');
    });
    
    document.getElementById('forgot-password').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-modal').classList.remove('active');
        document.getElementById('forgot-modal').classList.add('active');
    });
    
    document.getElementById('switch-to-login-from-forgot').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('forgot-modal').classList.remove('active');
        document.getElementById('login-modal').classList.add('active');
    });
    
    // Close modals when clicking X
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // Submit on Enter key
    document.querySelectorAll('.modal input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const modal = input.closest('.modal');
                if (modal.id === 'login-modal') {
                    document.getElementById('login-submit-btn').click();
                } else if (modal.id === 'signup-modal') {
                    document.getElementById('signup-submit-btn').click();
                } else if (modal.id === 'forgot-modal') {
                    document.getElementById('forgot-submit-btn').click();
                }
            }
        });
    });
}

// ===== INITIALIZATION =====
// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, setting up auth...");
    setupAuthEventListeners();
    
    // Initialize your existing app
    if (typeof initApp === 'function') {
        initApp();
    }
});

console.log("✅ Authentication system ready!");
