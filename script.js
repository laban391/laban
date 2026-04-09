// script.js - Complete backend logic for NEXUS BYPASS Dashboard
// Handles authentication, bypass states, activity logging, and WhatsApp order processing

(function() {
    "use strict";

    // ======================== STORAGE KEYS ========================
    const STORAGE_KEYS = {
        USERS: 'nexus_bypass_users',
        SESSION: 'nexus_session',
        BYPASS_STATES: 'nexus_bypass_states',
        ACTIVITY_LOG: 'nexus_activity_log'
    };

    // ======================== HELPER FUNCTIONS ========================
    
    /**
     * Simple hash function for password obfuscation (not for production crypto)
     * @param {string} password - Plain text password
     * @returns {string} Hashed password string
     */
    function hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return 'nx_' + Math.abs(hash).toString(36) + '_' + btoa(password).substring(0, 10);
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid email format
     */
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {object} { valid: boolean, message: string }
     */
    function validatePasswordStrength(password) {
        if (password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters' };
        }
        if (!/[A-Z]/.test(password)) {
            return { valid: false, message: 'Include at least one uppercase letter' };
        }
        if (!/[a-z]/.test(password)) {
            return { valid: false, message: 'Include at least one lowercase letter' };
        }
        if (!/[0-9]/.test(password)) {
            return { valid: false, message: 'Include at least one number' };
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return { valid: false, message: 'Include at least one special character' };
        }
        return { valid: true, message: 'Strong password' };
    }

    /**
     * Show notification toast
     * @param {string} message - Notification message
     * @param {string} type - 'success', 'error', or 'info'
     */
    function showNotification(message, type = 'info') {
        const container = document.getElementById('notifContainer');
        if (!container) {
            console.log('Notification:', message, type);
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        
        const borderColor = {
            success: '#2ecc71',
            error: '#e74c3c',
            info: '#f39c12'
        };
        notification.style.borderLeftColor = borderColor[type] || borderColor.info;
        
        const icon = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `<i class="fas ${icon[type]}"></i> <span>${escapeHtml(message)}</span>`;
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            notification.style.transition = 'all 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    // ======================== USER DATABASE MANAGER ========================
    
    const UserDatabase = {
        /**
         * Get all registered users
         * @returns {Array} Array of user objects
         */
        getAllUsers() {
            const users = localStorage.getItem(STORAGE_KEYS.USERS);
            return users ? JSON.parse(users) : [];
        },

        /**
         * Save users array to localStorage
         * @param {Array} users - Array of user objects
         */
        saveUsers(users) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        },

        /**
         * Find user by email
         * @param {string} email - User email
         * @returns {object|null} User object or null
         */
        findByEmail(email) {
            const users = this.getAllUsers();
            return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
        },

        /**
         * Create a new user account
         * @param {object} userData - { name, email, password }
         * @returns {object} Created user (without password)
         * @throws {Error} If email already exists or password invalid
         */
        createUser(userData) {
            const { name, email, password } = userData;
            
            // Check if email already exists
            if (this.findByEmail(email)) {
                throw new Error('Email already registered');
            }
            
            // Validate password strength
            const passwordCheck = validatePasswordStrength(password);
            if (!passwordCheck.valid) {
                throw new Error(passwordCheck.message);
            }
            
            // Validate name
            if (!name || name.trim().length === 0) {
                throw new Error('Name is required');
            }
            
            // Create new user
            const newUser = {
                id: Date.now() + Math.random().toString(36).substring(2),
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: hashPassword(password),
                createdAt: new Date().toISOString(),
                lastLogin: null
            };
            
            const users = this.getAllUsers();
            users.push(newUser);
            this.saveUsers(users);
            
            // Return user without password
            const { password: _, ...userWithoutPassword } = newUser;
            return userWithoutPassword;
        },

        /**
         * Authenticate user login
         * @param {string} email - User email
         * @param {string} password - Plain text password
         * @returns {object} Authenticated user (without password)
         * @throws {Error} If credentials invalid
         */
        authenticate(email, password) {
            const user = this.findByEmail(email);
            if (!user) {
                throw new Error('Invalid email or password');
            }
            
            const hashedInput = hashPassword(password);
            if (user.password !== hashedInput) {
                throw new Error('Invalid email or password');
            }
            
            // Update last login
            const users = this.getAllUsers();
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                users[userIndex].lastLogin = new Date().toISOString();
                this.saveUsers(users);
            }
            
            // Return user without password
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        },

        /**
         * Initialize demo user if no users exist
         */
        initDemoUser() {
            const users = this.getAllUsers();
            if (users.length === 0) {
                this.createUser({
                    name: 'Demo User',
                    email: 'demo@bypass.io',
                    password: 'Demo@123'
                });
                console.log('Demo user created: demo@bypass.io / Demo@123');
            }
        }
    };

    // ======================== SESSION MANAGER ========================
    
    const SessionManager = {
        /**
         * Create a new session for logged in user
         * @param {object} user - User object (with id, name, email)
         * @returns {object} Session object
         */
        createSession(user) {
            const session = {
                userId: user.id,
                name: user.name,
                email: user.email,
                loginTime: new Date().toISOString(),
                expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            };
            sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
            return session;
        },

        /**
         * Get current session if valid
         * @returns {object|null} Session object or null
         */
        getSession() {
            const sessionData = sessionStorage.getItem(STORAGE_KEYS.SESSION);
            if (!sessionData) return null;
            
            try {
                const session = JSON.parse(sessionData);
                if (Date.now() > session.expiresAt) {
                    this.clearSession();
                    return null;
                }
                return session;
            } catch (e) {
                this.clearSession();
                return null;
            }
        },

        /**
         * Clear current session (logout)
         */
        clearSession() {
            sessionStorage.removeItem(STORAGE_KEYS.SESSION);
        },

        /**
         * Check if user is logged in
         * @returns {boolean} True if session exists and valid
         */
        isLoggedIn() {
            return this.getSession() !== null;
        }
    };

    // ======================== BYPASS MANAGER ========================
    
    const BypassManager = {
        /**
         * Default bypass states
         */
        defaultStates: {
            'dynamic-wifi': false,
            'prestige-wifi': false,
            'duke-wifi': false,
            'tiktok-bypass': false,
            'youtube-bypass': false,
            'saf-capped': false,
            'airtel-capped': false
        },

        /**
         * Display names for each bypass option
         */
        displayNames: {
            'dynamic-wifi': 'Dynamic WiFi',
            'prestige-wifi': 'Prestige WiFi',
            'duke-wifi': 'Duke WiFi',
            'tiktok-bypass': 'TikTok Bypass',
            'youtube-bypass': 'YouTube Bypass',
            'saf-capped': 'Saf Capped',
            'airtel-capped': 'Airtel Capped'
        },

        /**
         * Get all bypass states
         * @returns {object} Bypass states object
         */
        getAllStates() {
            const saved = localStorage.getItem(STORAGE_KEYS.BYPASS_STATES);
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    return { ...this.defaultStates };
                }
            }
            return { ...this.defaultStates };
        },

        /**
         * Save bypass states to localStorage
         * @param {object} states - Bypass states object
         */
        saveStates(states) {
            localStorage.setItem(STORAGE_KEYS.BYPASS_STATES, JSON.stringify(states));
        },

        /**
         * Get state of a specific bypass
         * @param {string} bypassId - Bypass identifier
         * @returns {boolean} Current state
         */
        getState(bypassId) {
            const states = this.getAllStates();
            return states[bypassId] || false;
        },

        /**
         * Toggle a bypass state
         * @param {string} bypassId - Bypass identifier
         * @returns {boolean} New state after toggle
         */
        toggleBypass(bypassId) {
            const states = this.getAllStates();
            states[bypassId] = !states[bypassId];
            this.saveStates(states);
            return states[bypassId];
        },

        /**
         * Get display name for a bypass
         * @param {string} bypassId - Bypass identifier
         * @returns {string} Display name
         */
        getDisplayName(bypassId) {
            return this.displayNames[bypassId] || bypassId;
        },

        /**
         * Update all bypass UI elements
         */
        updateUI() {
            const states = this.getAllStates();
            document.querySelectorAll('.bypass-option').forEach(option => {
                const bypassId = option.getAttribute('data-bypass');
                if (bypassId && states.hasOwnProperty(bypassId)) {
                    const statusSpan = option.querySelector('.option-status');
                    const isActive = states[bypassId];
                    
                    if (statusSpan) {
                        statusSpan.textContent = isActive ? 'Active' : 'Inactive';
                        statusSpan.className = isActive ? 'option-status' : 'option-status inactive';
                    }
                    
                    if (isActive) {
                        option.classList.add('active');
                    } else {
                        option.classList.remove('active');
                    }
                }
            });
        }
    };

    // ======================== ACTIVITY LOGGER ========================
    
    const ActivityLogger = {
        /**
         * Get all activity logs
         * @returns {Array} Array of log objects
         */
        getLogs() {
            const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
            return saved ? JSON.parse(saved) : [];
        },

        /**
         * Save logs to localStorage
         * @param {Array} logs - Array of log objects
         */
        saveLogs(logs) {
            localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(logs));
        },

        /**
         * Add a new activity log
         * @param {string} action - Action type (e.g., 'activated', 'login')
         * @param {string} details - Detailed description
         * @returns {object} Created log object
         */
        addLog(action, details) {
            const logs = this.getLogs();
            const log = {
                id: Date.now(),
                action: action,
                details: details,
                timestamp: new Date().toISOString(),
                time: new Date().toLocaleTimeString(),
                date: new Date().toLocaleDateString()
            };
            
            logs.unshift(log);
            
            // Keep only last 100 logs
            while (logs.length > 100) {
                logs.pop();
            }
            
            this.saveLogs(logs);
            this.renderToUI();
            return log;
        },

        /**
         * Clear all activity logs
         */
        clearLogs() {
            this.saveLogs([]);
            this.renderToUI();
            showNotification('Activity log cleared', 'info');
        },

        /**
         * Render logs to the UI container
         */
        renderToUI() {
            const container = document.getElementById('logList');
            if (!container) return;
            
            const logs = this.getLogs();
            
            if (logs.length === 0) {
                container.innerHTML = `
                    <div class="log-item">
                        <i class="fas fa-info-circle" style="color: #4db8ff;"></i>
                        <span>No activity yet</span>
                        <span class="log-time">--:--</span>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = logs.slice(0, 25).map(log => {
                const isActivated = log.action === 'activated';
                const icon = isActivated ? 'fa-toggle-on' : 'fa-exchange-alt';
                const iconColor = isActivated ? '#6bffb8' : '#ffaa88';
                
                return `
                    <div class="log-item">
                        <i class="fas ${icon}" style="color: ${iconColor};"></i>
                        <span>${escapeHtml(log.details)}</span>
                        <span class="log-time">${escapeHtml(log.time)}</span>
                    </div>
                `;
            }).join('');
        },

        /**
         * Log a bypass toggle event
         * @param {string} bypassId - Bypass identifier
         * @param {boolean} newState - New state after toggle
         */
        logBypassToggle(bypassId, newState) {
            const displayName = BypassManager.getDisplayName(bypassId);
            const action = newState ? 'activated' : 'deactivated';
            this.addLog(action, `${displayName} ${action}`);
        },

        /**
         * Log login event
         * @param {string} userName - Name of logged in user
         */
        logLogin(userName) {
            this.addLog('login', `User ${userName} logged in`);
        },

        /**
         * Log logout event
         * @param {string} userName - Name of logged out user
         */
        logLogout(userName) {
            this.addLog('logout', `User ${userName} logged out`);
        },

        /**
         * Log account creation
         * @param {string} userName - Name of new user
         */
        logAccountCreation(userName) {
            this.addLog('account_created', `New account created for ${userName}`);
        },

        /**
         * Log WhatsApp order
         * @param {object} orderData - Order details
         */
        logWhatsAppOrder(orderData) {
            const { packageName, paymentMethod, days, userName } = orderData;
            this.addLog('whatsapp_order', 
                `WhatsApp order: ${packageName || 'No package'} | ${paymentMethod} | ${days || 'No duration'} | User: ${userName}`
            );
        }
    };

    // ======================== WHATSAPP ORDER HANDLER ========================
    
    const WhatsAppHandler = {
        /**
         * Target WhatsApp number from the reference image
         */
        TARGET_NUMBER: '+584265907014',

        /**
         * Send order to WhatsApp
         * @param {object} orderData - Order details
         */
        sendOrder(orderData) {
            const { packageName, paymentMethod, days, userName } = orderData;
            
            // Build WhatsApp message
            const messageParts = [];
            messageParts.push('🔹 *NEW BYPASS ORDER* 🔹');
            messageParts.push(`👤 *User:* ${userName || 'Guest'}`);
            messageParts.push(`📦 *Package:* ${packageName || 'Not specified'}`);
            messageParts.push(`💰 *Payment Method:* ${paymentMethod || 'Not specified'}`);
            messageParts.push(`📅 *Duration:* ${days || 'Not set'}`);
            messageParts.push(`🛡️ *Bypass Panel:* NEXUS SECURE`);
            messageParts.push('');
            messageParts.push(`_Order placed via Nexus Bypass Dashboard_`);
            
            const message = messageParts.join('%0A');
            const url = `https://wa.me/${this.TARGET_NUMBER}?text=${message}`;
            
            // Open WhatsApp
            window.open(url, '_blank');
            
            // Log the order
            ActivityLogger.logWhatsAppOrder(orderData);
            
            return true;
        },

        /**
         * Validate order data before sending
         * @param {object} orderData - Order details to validate
         * @returns {object} { valid: boolean, error: string|null }
         */
        validateOrder(orderData) {
            if (!orderData.packageName && !orderData.days) {
                return { valid: false, error: 'Please enter at least package name or duration' };
            }
            return { valid: true, error: null };
        }
    };

    // ======================== UI CONTROLLER ========================
    
    const UIController = {
        // DOM Elements
        elements: {
            authCard: null,
            dashboardCard: null,
            loginPanel: null,
            signupPanel: null,
            dashboardUserName: null,
            loginEmail: null,
            loginPassword: null,
            signupName: null,
            signupEmail: null,
            signupPassword: null,
            signupConfirm: null,
            packageName: null,
            paymentMethod: null,
            daysWeek: null
        },

        /**
         * Initialize DOM element references
         */
        initElements() {
            this.elements.authCard = document.getElementById('authCard');
            this.elements.dashboardCard = document.getElementById('dashboardCard');
            this.elements.loginPanel = document.getElementById('loginPanel');
            this.elements.signupPanel = document.getElementById('signupPanel');
            this.elements.dashboardUserName = document.getElementById('dashboardUserName');
            
            this.elements.loginEmail = document.getElementById('loginEmail');
            this.elements.loginPassword = document.getElementById('loginPass');
            this.elements.signupName = document.getElementById('signupName');
            this.elements.signupEmail = document.getElementById('signupEmail');
            this.elements.signupPassword = document.getElementById('signupPass');
            this.elements.signupConfirm = document.getElementById('signupConfirm');
            
            this.elements.packageName = document.getElementById('packageNameInput');
            this.elements.paymentMethod = document.getElementById('paymentMethodSelect');
            this.elements.daysWeek = document.getElementById('daysWeekInput');
        },

        /**
         * Clear all error messages
         */
        clearErrors() {
            document.querySelectorAll('#authCard .error-message').forEach(el => {
                el.textContent = '';
            });
            document.querySelectorAll('#authCard .input-field').forEach(el => {
                el.classList.remove('input-error');
            });
        },

        /**
         * Show login form
         */
        showLoginForm() {
            this.elements.loginPanel.classList.remove('hidden');
            this.elements.signupPanel.classList.add('hidden');
            this.clearErrors();
        },

        /**
         * Show signup form
         */
        showSignupForm() {
            this.elements.loginPanel.classList.add('hidden');
            this.elements.signupPanel.classList.remove('hidden');
            this.clearErrors();
        },

        /**
         * Show dashboard
         * @param {string} userName - User's display name
         */
        showDashboard(userName) {
            this.elements.authCard.classList.add('hidden');
            this.elements.dashboardCard.classList.remove('hidden');
            if (this.elements.dashboardUserName) {
                this.elements.dashboardUserName.textContent = userName || 'User';
            }
            
            // Update bypass UI
            BypassManager.updateUI();
            
            // Render activity logs
            ActivityLogger.renderToUI();
        },

        /**
         * Show authentication screen (login/signup)
         */
        showAuthScreen() {
            this.elements.authCard.classList.remove('hidden');
            this.elements.dashboardCard.classList.add('hidden');
            this.showLoginForm();
            
            // Clear input fields
            if (this.elements.loginEmail) this.elements.loginEmail.value = '';
            if (this.elements.loginPassword) this.elements.loginPassword.value = '';
            if (this.elements.signupName) this.elements.signupName.value = '';
            if (this.elements.signupEmail) this.elements.signupEmail.value = '';
            if (this.elements.signupPassword) this.elements.signupPassword.value = '';
            if (this.elements.signupConfirm) this.elements.signupConfirm.value = '';
        },

        /**
         * Get order data from form inputs
         * @returns {object} Order data object
         */
        getOrderData() {
            const session = SessionManager.getSession();
            return {
                packageName: this.elements.packageName ? this.elements.packageName.value.trim() : '',
                paymentMethod: this.elements.paymentMethod ? this.elements.paymentMethod.value : 'M-Pesa',
                days: this.elements.daysWeek ? this.elements.daysWeek.value.trim() : '',
                userName: session ? session.name : 'Guest'
            };
        },

        /**
         * Validate login form
         * @returns {boolean} True if valid
         */
        validateLoginForm() {
            let isValid = true;
            const email = this.elements.loginEmail ? this.elements.loginEmail.value.trim() : '';
            const password = this.elements.loginPassword ? this.elements.loginPassword.value : '';
            
            const emailError = document.getElementById('loginEmailErr');
            const passError = document.getElementById('loginPassErr');
            
            if (!email) {
                if (emailError) emailError.textContent = 'Email is required';
                if (this.elements.loginEmail) this.elements.loginEmail.classList.add('input-error');
                isValid = false;
            } else if (!validateEmail(email)) {
                if (emailError) emailError.textContent = 'Invalid email format';
                if (this.elements.loginEmail) this.elements.loginEmail.classList.add('input-error');
                isValid = false;
            } else {
                if (emailError) emailError.textContent = '';
                if (this.elements.loginEmail) this.elements.loginEmail.classList.remove('input-error');
            }
            
            if (!password) {
                if (passError) passError.textContent = 'Password is required';
                if (this.elements.loginPassword) this.elements.loginPassword.classList.add('input-error');
                isValid = false;
            } else {
                if (passError) passError.textContent = '';
                if (this.elements.loginPassword) this.elements.loginPassword.classList.remove('input-error');
            }
            
            return isValid;
        },

        /**
         * Validate signup form
         * @returns {boolean} True if valid
         */
        validateSignupForm() {
            let isValid = true;
            const name = this.elements.signupName ? this.elements.signupName.value.trim() : '';
            const email = this.elements.signupEmail ? this.elements.signupEmail.value.trim() : '';
            const password = this.elements.signupPassword ? this.elements.signupPassword.value : '';
            const confirm = this.elements.signupConfirm ? this.elements.signupConfirm.value : '';
            
            const nameError = document.getElementById('signupNameErr');
            const emailError = document.getElementById('signupEmailErr');
            const passError = document.getElementById('signupPassErr');
            const confirmError = document.getElementById('signupConfirmErr');
            
            // Validate name
            if (!name) {
                if (nameError) nameError.textContent = 'Full name is required';
                if (this.elements.signupName) this.elements.signupName.classList.add('input-error');
                isValid = false;
            } else {
                if (nameError) nameError.textContent = '';
                if (this.elements.signupName) this.elements.signupName.classList.remove('input-error');
            }
            
            // Validate email
            if (!email) {
                if (emailError) emailError.textContent = 'Email is required';
                if (this.elements.signupEmail) this.elements.signupEmail.classList.add('input-error');
                isValid = false;
            } else if (!validateEmail(email)) {
                if (emailError) emailError.textContent = 'Invalid email format';
                if (this.elements.signupEmail) this.elements.signupEmail.classList.add('input-error');
                isValid = false;
            } else if (UserDatabase.findByEmail(email)) {
                if (emailError) emailError.textContent = 'Email already registered';
                if (this.elements.signupEmail) this.elements.signupEmail.classList.add('input-error');
                isValid = false;
            } else {
                if (emailError) emailError.textContent = '';
                if (this.elements.signupEmail) this.elements.signupEmail.classList.remove('input-error');
            }
            
            // Validate password
            if (!password) {
                if (passError) passError.textContent = 'Password is required';
                if (this.elements.signupPassword) this.elements.signupPassword.classList.add('input-error');
                isValid = false;
            } else {
                const passwordCheck = validatePasswordStrength(password);
                if (!passwordCheck.valid) {
                    if (passError) passError.textContent = passwordCheck.message;
                    if (this.elements.signupPassword) this.elements.signupPassword.classList.add('input-error');
                    isValid = false;
                } else {
                    if (passError) passError.textContent = '';
                    if (this.elements.signupPassword) this.elements.signupPassword.classList.remove('input-error');
                }
            }
            
            // Validate confirm password
            if (password !== confirm) {
                if (confirmError) confirmError.textContent = 'Passwords do not match';
                if (this.elements.signupConfirm) this.elements.signupConfirm.classList.add('input-error');
                isValid = false;
            } else {
                if (confirmError) confirmError.textContent = '';
                if (this.elements.signupConfirm) this.elements.signupConfirm.classList.remove('input-error');
            }
            
            return isValid;
        }
    };

    // ======================== EVENT HANDLERS ========================
    
    /**
     * Handle login button click
     */
    function handleLogin() {
        if (!UIController.validateLoginForm()) {
            showNotification('Please fix the errors above', 'error');
            return;
        }
        
        const email = UIController.elements.loginEmail.value.trim();
        const password = UIController.elements.loginPassword.value;
        
        try {
            const user = UserDatabase.authenticate(email, password);
            SessionManager.createSession(user);
            ActivityLogger.logLogin(user.name);
            UIController.showDashboard(user.name);
            showNotification(`Welcome back, ${user.name}!`, 'success');
        } catch (error) {
            showNotification(error.message, 'error');
            const passError = document.getElementById('loginPassErr');
            if (passError) passError.textContent = error.message;
            if (UIController.elements.loginPassword) {
                UIController.elements.loginPassword.classList.add('input-error');
            }
        }
    }

    /**
     * Handle signup button click
     */
    function handleSignup() {
        if (!UIController.validateSignupForm()) {
            showNotification('Please fix the errors above', 'error');
            return;
        }
        
        const name = UIController.elements.signupName.value.trim();
        const email = UIController.elements.signupEmail.value.trim();
        const password = UIController.elements.signupPassword.value;
        
        try {
            const newUser = UserDatabase.createUser({ name, email, password });
            SessionManager.createSession(newUser);
            ActivityLogger.logAccountCreation(newUser.name);
            UIController.showDashboard(newUser.name);
            showNotification(`Account created! Welcome ${newUser.name}`, 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    /**
     * Handle logout button click
     */
    function handleLogout() {
        const session = SessionManager.getSession();
        if (session) {
            ActivityLogger.logLogout(session.name);
        }
        SessionManager.clearSession();
        UIController.showAuthScreen();
        showNotification('You have been securely logged out', 'info');
    }

    /**
     * Handle bypass option click
     * @param {Event} event - Click event
     */
    function handleBypassClick(event) {
        const option = event.currentTarget;
        const bypassId = option.getAttribute('data-bypass');
        
        if (bypassId) {
            const newState = BypassManager.toggleBypass(bypassId);
            BypassManager.updateUI();
            ActivityLogger.logBypassToggle(bypassId, newState);
            showNotification(
                `${BypassManager.getDisplayName(bypassId)} ${newState ? 'activated' : 'deactivated'}`,
                newState ? 'success' : 'info'
            );
        }
    }

    /**
     * Handle WhatsApp order button click
     */
    function handleWhatsAppOrder() {
        const orderData = UIController.getOrderData();
        const validation = WhatsAppHandler.validateOrder(orderData);
        
        if (!validation.valid) {
            showNotification(validation.error, 'error');
            return;
        }
        
        WhatsAppHandler.sendOrder(orderData);
        showNotification('Redirecting to WhatsApp...', 'success');
    }

    /**
     * Handle clear log button click
     */
    function handleClearLogs() {
        ActivityLogger.clearLogs();
    }

    // ======================== INITIALIZATION ========================
    
    /**
     * Attach all event listeners
     */
    function attachEventListeners() {
        // Auth buttons
        const loginBtn = document.getElementById('doLoginBtn');
        const signupBtn = document.getElementById('doSignupBtn');
        const showSignupLink = document.getElementById('showSignupLink');
        const showLoginLink = document.getElementById('showLoginLink');
        const logoutBtn = document.getElementById('logoutBtnDash');
        
        if (loginBtn) loginBtn.addEventListener('click', handleLogin);
        if (signupBtn) signupBtn.addEventListener('click', handleSignup);
        if (showSignupLink) showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            UIController.showSignupForm();
        });
        if (showLoginLink) showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            UIController.showLoginForm();
        });
        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
        
        // WhatsApp order button
        const whatsappBtn = document.getElementById('whatsappRedirectBtn');
        if (whatsappBtn) whatsappBtn.addEventListener('click', handleWhatsAppOrder);
        
        // Clear log button
        const clearLogBtn = document.getElementById('clearLogBtn');
        if (clearLogBtn) clearLogBtn.addEventListener('click', handleClearLogs);
        
        // Bypass options (dynamic attachment)
        document.querySelectorAll('.bypass-option').forEach(option => {
            option.removeEventListener('click', handleBypassClick);
            option.addEventListener('click', handleBypassClick);
        });
        
        // Enter key support for login
        const loginPass = document.getElementById('loginPass');
        if (loginPass) {
            loginPass.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleLogin();
            });
        }
        const loginEmail = document.getElementById('loginEmail');
        if (loginEmail) {
            loginEmail.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleLogin();
            });
        }
    }

    /**
     * Initialize the application
     */
    function init() {
        // Initialize demo user
        UserDatabase.initDemoUser();
        
        // Initialize UI elements
        UIController.initElements();
        
        // Check for existing session
        const session = SessionManager.getSession();
        
        if (session) {
            // Verify user still exists
            const user = UserDatabase.findByEmail(session.email);
            if (user) {
                UIController.showDashboard(session.name);
            } else {
                SessionManager.clearSession();
                UIController.showAuthScreen();
            }
        } else {
            UIController.showAuthScreen();
        }
        
        // Attach event listeners
        attachEventListeners();
        
        // Initial render of bypass states and logs
        BypassManager.updateUI();
        ActivityLogger.renderToUI();
        
        console.log('NEXUS BYPASS Dashboard initialized');
    }

    // Start the application
    init();
})();