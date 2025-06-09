class Auth {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || {};
        this.currentUser = null;
    }

    register(username, password) {
        if (this.users[username]) {
            throw new Error('Username already exists');
        }

        // Simple password hashing (in a real app, use a proper hashing library)
        const hashedPassword = btoa(password);
        this.users[username] = {
            password: hashedPassword,
            documents: []
        };

        localStorage.setItem('users', JSON.stringify(this.users));
        return true;
    }

    login(username, password) {
        const user = this.users[username];
        if (!user || user.password !== btoa(password)) {
            throw new Error('Invalid username or password');
        }

        this.currentUser = username;
        localStorage.setItem('currentUser', username);
        return true;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    addDocumentToUser(document) {
        if (!this.currentUser) {
            throw new Error('User not logged in');
        }

        this.users[this.currentUser].documents.push(document);
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    getUserDocuments() {
        if (!this.currentUser) {
            return [];
        }
        return this.users[this.currentUser].documents;
    }
}

// Initialize auth
const auth = new Auth();

// Check for existing session
const savedUser = localStorage.getItem('currentUser');
if (savedUser) {
    auth.currentUser = savedUser;
}

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Event Listeners
loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

registerBtn.addEventListener('click', () => {
    registerModal.style.display = 'block';
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (e.target === registerModal) {
        registerModal.style.display = 'none';
    }
});

// Form submissions
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = loginForm.querySelector('input[type="text"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;

    try {
        auth.login(username, password);
        loginModal.style.display = 'none';
        updateUI();
    } catch (error) {
        alert(error.message);
    }
});

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = registerForm.querySelector('input[type="text"]').value;
    const password = registerForm.querySelector('input[type="password"]').value;
    const confirmPassword = registerForm.querySelectorAll('input[type="password"]')[1].value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        auth.register(username, password);
        registerModal.style.display = 'none';
        alert('Registration successful! Please login.');
    } catch (error) {
        alert(error.message);
    }
});

// Update UI based on auth state
function updateUI() {
    const uploadSection = document.getElementById('uploadSection');
    const documentsSection = document.getElementById('documentsSection');
    const navLinks = document.querySelector('.nav-links');

    if (auth.isLoggedIn()) {
        uploadSection.style.display = 'block';
        documentsSection.style.display = 'block';
        navLinks.innerHTML = `
            <span>Welcome, ${auth.getCurrentUser()}</span>
            <button id="logoutBtn">Logout</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', () => {
            auth.logout();
            updateUI();
        });
        loadUserDocuments();
    } else {
        uploadSection.style.display = 'none';
        documentsSection.style.display = 'none';
        navLinks.innerHTML = `
            <button id="loginBtn">Login</button>
            <button id="registerBtn">Register</button>
        `;
    }
}

// Load user documents
function loadUserDocuments() {
    const documentsList = document.getElementById('documentsList');
    const documents = auth.getUserDocuments();
    
    documentsList.innerHTML = documents.map(doc => `
        <div class="document-item">
            <h3>${doc.name}</h3>
            <p>Size: ${formatFileSize(doc.size)}</p>
            <p>Type: ${doc.type}</p>
            <p>Hash: ${doc.hash.substring(0, 10)}...</p>
            <p>Added: ${new Date(doc.timestamp).toLocaleString()}</p>
        </div>
    `).join('');
}

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Initial UI update
updateUI();

// Export auth for use in other files
window.auth = auth; 