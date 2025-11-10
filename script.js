// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const serviceButtons = document.querySelectorAll('.service-btn');
const serviceModal = document.getElementById('serviceModal');
const authModal = document.getElementById('authModal');
const closeButtons = document.querySelectorAll('.close');
const tabButtons = document.querySelectorAll('.tab-btn');
const authForms = document.querySelectorAll('.auth-form');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const passwordInput = document.getElementById('signupPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

// Service content data
const serviceData = {
    'web-design': {
        title: 'Web Design',
        description: 'We create stunning, responsive websites that captivate your audience and drive conversions. Our designs are not just visually appealing but also optimized for performance and user experience.',
        features: [
            'Responsive design that works on all devices',
            'User-centered design approach',
            'Modern UI/UX principles',
            'Custom graphics and animations',
            'SEO-friendly structure',
            'Fast loading times'
        ],
        price: 'Starting at $1,500'
    },
    'seo': {
        title: 'SEO Optimization',
        description: 'Boost your online visibility and rank higher in search results with our comprehensive SEO strategies. We use data-driven approaches to improve your organic traffic.',
        features: [
            'Keyword research and analysis',
            'On-page optimization',
            'Technical SEO audit',
            'Content strategy development',
            'Link building campaigns',
            'Monthly performance reports'
        ],
        price: 'Packages starting at $500/month'
    },
    'branding': {
        title: 'Brand Identity',
        description: 'Build a memorable brand that stands out from the competition. We develop cohesive brand identities that communicate your values and resonate with your target audience.',
        features: [
            'Logo design and brand guidelines',
            'Color palette and typography',
            'Brand voice and messaging',
            'Marketing collateral design',
            'Social media branding',
            'Brand strategy development'
        ],
        price: 'Starting at $2,000'
    },
    'development': {
        title: 'Web Development',
        description: 'We build robust, scalable web applications using modern technologies. From simple websites to complex web applications, we deliver solutions that perform.',
        features: [
            'Frontend and backend development',
            'E-commerce solutions',
            'CMS development',
            'API integration',
            'Database design and optimization',
            'Ongoing maintenance and support'
        ],
        price: 'Starting at $3,000'
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Login button click
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            authModal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });
    }
    
    // Service buttons click
    serviceButtons.forEach(button => {
        button.addEventListener('click', function() {
            const serviceCard = this.closest('.service-card');
            const serviceType = serviceCard.getAttribute('data-service');
            showServiceDetails(serviceType);
        });
    });
    
    // Close modal buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            serviceModal.style.display = 'none';
            authModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        });
    });
    
    // Click outside modal to close
    window.addEventListener('click', function(event) {
        if (event.target === serviceModal) {
            serviceModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        if (event.target === authModal) {
            authModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchAuthTab(tabName);
        });
    });
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    // Signup form submission
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleSignup();
        });
    }
    
    // Password strength checker
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }
    
    // Password confirmation checker
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }
    
    // Hamburger menu toggle
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
    
    // Initialize password strength display
    initializePasswordStrength();
    
    // Check login state on page load
    checkLoginState();
});

// Functions
function showServiceDetails(serviceType) {
    const service = serviceData[serviceType];
    const modalBody = document.getElementById('modal-body');
    
    if (service && modalBody) {
        modalBody.innerHTML = `
            <div class="service-details">
                <h3>${service.title}</h3>
                <p>${service.description}</p>
                <ul class="service-features">
                    ${service.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
                <div class="service-price">
                    <strong>${service.price}</strong>
                </div>
                <button class="cta-btn" style="margin-top: 1.5rem;">Get a Quote</button>
            </div>
        `;
        
        serviceModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
}

function switchAuthTab(tabName) {
    // Update active tab button
    tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === tabName) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Show active form
    authForms.forEach(form => {
        if (form.id === `${tabName}Form`) {
            form.classList.add('active');
        } else {
            form.classList.remove('active');
        }
    });
}

function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Simple validation
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    // Email validation
    if (!validateEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    // Simulate login process
    showLoadingState(loginForm);
    
    setTimeout(() => {
        // In a real application, you would send this data to a server
        console.log('Login attempt with:', { email, password });
        
        // Simulate successful login
        showMessage('Login successful! Redirecting...', 'success');
        
        // Close the modal
        setTimeout(() => {
            authModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Update UI to show logged in state
            updateLoginState(true, email);
            
            // Redirect to home page or dashboard (in this case just refresh)
            window.location.href = 'index.html';
        }, 1500);
    }, 1500);
}

function handleSignup() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    // Check password strength
    const strength = calculatePasswordStrength(password);
    if (strength < 3) {
        showMessage('Please choose a stronger password', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showMessage('Please agree to the terms and conditions', 'error');
        return;
    }
    
    // Simulate signup process
    showLoadingState(signupForm);
    
    setTimeout(() => {
        // In a real application, you would send this data to a server
        console.log('Signup attempt with:', { name, email, password });
        
        // Simulate successful signup
        showMessage('Account created successfully! Redirecting to login...', 'success');
        
        // Switch to login tab after a delay
        setTimeout(() => {
            switchAuthTab('login');
            
            // Clear form
            signupForm.reset();
            resetPasswordStrength();
            
            // Pre-fill the login email
            document.getElementById('loginEmail').value = email;
        }, 1500);
    }, 1500);
}

function showLoadingState(form) {
    const submitBtn = form.querySelector('.auth-submit-btn');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;
    
    // Revert after 1.5 seconds (simulating API call)
    setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 1500);
}

function checkPasswordStrength() {
    const password = passwordInput.value;
    const strength = calculatePasswordStrength(password);
    
    // Get or create strength elements
    let strengthBar = document.querySelector('.strength-fill');
    let strengthText = document.querySelector('.strength-text');
    
    // Create elements if they don't exist
    if (!strengthBar || !strengthText) {
        initializePasswordStrength();
        strengthBar = document.querySelector('.strength-fill');
        strengthText = document.querySelector('.strength-text');
    }
    
    // Update strength bar
    if (strengthBar) {
        strengthBar.style.width = `${strength * 25}%`;
    }
    
    // Update strength text and color
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

function initializePasswordStrength() {
    const passwordStrengthDiv = document.querySelector('.password-strength');
    if (passwordStrengthDiv && !passwordStrengthDiv.querySelector('.strength-bar')) {
        passwordStrengthDiv.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill"></div>
            </div>
            <div class="strength-text"></div>
        `;
    }
}

function calculatePasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    
    return strength;
}

function checkPasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const passwordMatchDiv = document.querySelector('.password-match');
    
    if (!passwordMatchDiv) return;
    
    if (confirmPassword === '') {
        passwordMatchDiv.textContent = '';
        return;
    }
    
    if (password === confirmPassword) {
        passwordMatchDiv.textContent = 'Passwords match';
        passwordMatchDiv.style.color = '#2ed573';
    } else {
        passwordMatchDiv.textContent = 'Passwords do not match';
        passwordMatchDiv.style.color = '#ff4757';
    }
}

function resetPasswordStrength() {
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    const passwordMatch = document.querySelector('.password-match');
    
    if (strengthBar) strengthBar.style.width = '0%';
    if (strengthText) strengthText.textContent = '';
    if (passwordMatch) passwordMatch.textContent = '';
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showMessage(message, type) {
    // Remove any existing message
    const existingMessage = document.querySelector('.auth-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message element
    const messageEl = document.createElement('div');
    messageEl.className = `auth-message ${type}`;
    messageEl.textContent = message;
    
    // Add to the auth container
    const authContainer = document.querySelector('.auth-container');
    if (authContainer) {
        authContainer.insertBefore(messageEl, authContainer.firstChild);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

function updateLoginState(isLoggedIn, email = '') {
    if (isLoggedIn) {
        // Change login button to logout
        if (loginBtn) {
            loginBtn.textContent = 'Logout';
            loginBtn.removeEventListener('click', openAuthModal);
            loginBtn.addEventListener('click', handleLogout);
        }
        
        // Store login state in localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
    } else {
        // Change logout button to login
        if (loginBtn) {
            loginBtn.textContent = 'Login';
            loginBtn.removeEventListener('click', handleLogout);
            loginBtn.addEventListener('click', openAuthModal);
        }
        
        // Remove login state from localStorage
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
    }
}

function handleLogout() {
    updateLoginState(false);
    showMessage('You have been logged out', 'success');
}

function openAuthModal() {
    authModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Check login state on page load
function checkLoginState() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userEmail = localStorage.getItem('userEmail');
    
    if (isLoggedIn && userEmail) {
        updateLoginState(true, userEmail);
    }
}

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Animate service cards on scroll
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
    
    // Observe service cards
    document.querySelectorAll('.service-card').forEach(card => {
        card.style.opacity = 0;
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s, transform 0.5s';
        observer.observe(card);
    });
    
    // Add parallax effect to background
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const background = document.querySelector('.background');
        if (background) {
            background.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
});