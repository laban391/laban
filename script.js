// User Accounts Storage
let userAccounts = JSON.parse(localStorage.getItem('userAccounts')) || [];

// DOM Elements
const gateway = document.getElementById('gateway');
const mainWebsite = document.getElementById('mainWebsite');
const gatewayTabBtns = document.querySelectorAll('.gateway-tab-btn');
const gatewayForms = document.querySelectorAll('.gateway-form');
const gatewayLoginForm = document.getElementById('gatewayLoginForm');
const gatewaySignupForm = document.getElementById('gatewaySignupForm');
const logoutBtn = document.getElementById('logoutBtn');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

// Password Strength Checker
function checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    
    return strength;
}

function updatePasswordStrength() {
    const password = document.getElementById('gatewaySignupPassword').value;
    const strength = checkPasswordStrength(password);
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    if (strengthBar) {
        strengthBar.style.width = `${strength * 25}%`;
    }
    
    let strengthMessage = '';
    let color = '';
    
    switch(strength) {
        case 0:
        case 1:
            strengthMessage = 'Weak';
            color = '#ff4757';
            break;
        case 2:
            strengthMessage = 'Fair';
            color = '#ffa502';
            break;
        case 3:
            strengthMessage = 'Good';
            color = '#2ed573';
            break;
        case 4:
            strengthMessage = 'Strong';
            color = '#2ed573';
            break;
    }
    
    if (strengthBar) {
        strengthBar.style.background = color;
    }
    
    if (strengthText) {
        strengthText.textContent = strengthMessage;
        strengthText.style.color = color;
    }
}

function checkPasswordMatch() {
    const password = document.getElementById('gatewaySignupPassword').value;
    const confirmPassword = document.getElementById('gatewayConfirmPassword').value;
    const passwordMatch = document.querySelector('.password-match');
    
    if (!passwordMatch) return;
    
    if (confirmPassword === '') {
        passwordMatch.textContent = '';
        return;
    }
    
    if (password === confirmPassword) {
        passwordMatch.textContent = 'Passwords match';
        passwordMatch.style.color = '#2ed573';
    } else {
        passwordMatch.textContent = 'Passwords do not match';
        passwordMatch.style.color = '#ff4757';
    }
}

// Gateway Functions
function switchGatewayTab(tabName) {
    gatewayTabBtns.forEach(button => {
        if (button.getAttribute('data-tab') === tabName) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    gatewayForms.forEach(form => {
        if (form.id === `gateway${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Form`) {
            form.classList.add('active');
        } else {
            form.classList.remove('active');
        }
    });
}

function showMessage(elementId, message, type) {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    
    setTimeout(() => {
        messageEl.textContent = '';
        messageEl.className = 'message';
    }, 3000);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Secure Login System
function handleGatewayLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('gatewayEmail').value;
    const password = document.getElementById('gatewayPassword').value;
    
    if (!email || !password) {
        showMessage('gatewayLoginMessage', 'Please fill in all fields', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('gatewayLoginMessage', 'Please enter a valid email address', 'error');
        return;
    }
    
    // Check if user exists and password matches
    const user = userAccounts.find(acc => acc.email === email);
    
    if (!user) {
        showMessage('gatewayLoginMessage', 'Account not found. Please sign up first.', 'error');
        return;
    }
    
    if (user.password !== password) {
        showMessage('gatewayLoginMessage', 'Incorrect password. Please try again.', 'error');
        return;
    }
    
    // Successful login
    showMessage('gatewayLoginMessage', 'Login successful! Welcome back.', 'success');
    
    setTimeout(() => {
        // Hide gateway and show main website
        gateway.style.display = 'none';
        mainWebsite.classList.remove('hidden');
        
        // Store login session
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('isLoggedIn', 'true');
    }, 1500);
}

function handleGatewaySignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('gatewaySignupName').value;
    const email = document.getElementById('gatewaySignupEmail').value;
    const password = document.getElementById('gatewaySignupPassword').value;
    const confirmPassword = document.getElementById('gatewayConfirmPassword').value;
    const agreeTerms = document.getElementById('gatewayAgreeTerms').checked;
    
    if (!name || !email || !password || !confirmPassword) {
        showMessage('gatewaySignupMessage', 'Please fill in all fields', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('gatewaySignupMessage', 'Please enter a valid email address', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('gatewaySignupMessage', 'Passwords do not match', 'error');
        return;
    }
    
    const strength = checkPasswordStrength(password);
    if (strength < 3) {
        showMessage('gatewaySignupMessage', 'Please choose a stronger password', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showMessage('gatewaySignupMessage', 'Please agree to the terms and conditions', 'error');
        return;
    }
    
    // Check if email already exists
    if (userAccounts.find(acc => acc.email === email)) {
        showMessage('gatewaySignupMessage', 'Email already registered. Please login instead.', 'error');
        return;
    }
    
    // Create new account
    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString()
    };
    
    userAccounts.push(newUser);
    localStorage.setItem('userAccounts', JSON.stringify(userAccounts));
    
    showMessage('gatewaySignupMessage', 'Account created successfully! Welcome to DigitalCreative.', 'success');
    
    setTimeout(() => {
        // Hide gateway and show main website
        gateway.style.display = 'none';
        mainWebsite.classList.remove('hidden');
        
        // Store login session
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        localStorage.setItem('isLoggedIn', 'true');
    }, 1500);
}

function handleLogout() {
    // Clear session
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    
    // Show gateway and hide main website
    gateway.style.display = 'flex';
    mainWebsite.classList.add('hidden');
    
    // Reset forms
    gatewayLoginForm.reset();
    gatewaySignupForm.reset();
}

// Service Pages Functions
function openServicePage(serviceType) {
    document.querySelectorAll('.service-page').forEach(page => {
        page.classList.add('hidden');
    });
    
    const servicePage = document.getElementById(`${serviceType}-page`);
    if (servicePage) {
        servicePage.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeServicePage() {
    document.querySelectorAll('.service-page').forEach(page => {
        page.classList.add('hidden');
    });
    document.body.style.overflow = 'auto';
}

function contactUs() {
    // Redirect to WhatsApp
    const phoneNumber = '+18002428478';
    const message = 'Hello! I am interested in your services.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    closeServicePage();
}

// WhatsApp Redirection Functions
function redirectToWhatsApp(serviceType) {
    const phoneNumber = '+18002428478';
    let message = '';
    
    switch(serviceType) {
        case 'seo':
            message = 'Hello! I am interested in your SEO Audit service.';
            break;
        case 'web-design':
            message = 'Hello! I am interested in starting a Web Design project.';
            break;
        case 'branding':
            message = 'Hello! I am interested in your Branding services.';
            break;
        case 'development':
            message = 'Hello! I am interested in your Development services.';
            break;
        default:
            message = 'Hello! I am interested in your services.';
    }
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (isLoggedIn && currentUser) {
        gateway.style.display = 'none';
        mainWebsite.classList.remove('hidden');
    }
    
    // Gateway tab switching
    gatewayTabBtns.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchGatewayTab(tabName);
        });
    });
    
    // Gateway form submissions
    gatewayLoginForm.addEventListener('submit', handleGatewayLogin);
    gatewaySignupForm.addEventListener('submit', handleGatewaySignup);
    
    // Password strength and match checking
    document.getElementById('gatewaySignupPassword').addEventListener('input', updatePasswordStrength);
    document.getElementById('gatewayConfirmPassword').addEventListener('input', checkPasswordMatch);
    
    // Logout button
    logoutBtn.addEventListener('click', handleLogout);
    
    // Hamburger menu
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            if (hamburger) hamburger.classList.remove('active');
            if (navMenu) navMenu.classList.remove('active');
        });
    });
    
    // Add WhatsApp redirection to service buttons
    document.querySelectorAll('.cta-btn').forEach(button => {
        if (button.textContent === 'Get SEO Audit') {
            button.onclick = function() { redirectToWhatsApp('seo'); };
        } else if (button.textContent === 'Start Your Project') {
            button.onclick = function() { redirectToWhatsApp('web-design'); };
        } else if (button.textContent === 'Start Branding') {
            button.onclick = function() { redirectToWhatsApp('branding'); };
        } else if (button.textContent === 'Start Development') {
            button.onclick = function() { redirectToWhatsApp('development'); };
        }
    });
    
    // Animate service cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.service-card').forEach(card => {
        card.style.opacity = 0;
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s, transform 0.5s';
        observer.observe(card);
    });
});