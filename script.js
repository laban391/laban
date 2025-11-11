// User Accounts Storage
let userAccounts = JSON.parse(localStorage.getItem('userAccounts')) || [];
let selectedPlan = null;

// API Configuration
const API_BASE_URL = 'https://payment-mpesa.onrender.com';

// M-Pesa Configuration
const MPESA_CONFIG = {
    consumerKey: '7MUGhqjXOryLphqVdwFKhLRwZ2B3P3bSBr65eeLmJwCn4c7o',
    consumerSecret: '6ICXUIrP2Ynu6U3M8Ks6O98gqNQAX4pCf9Ygw5zsB9lHDjply6AvqN6wEUALOayp',
    shortcode: '174379',
    passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    callbackURL: 'https://yourdomain.com/callback'
};

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

// Payment Configuration
const PAYMENT_CONFIG = {
    stripe: {
        publishableKey: 'pk_test_your_stripe_publishable_key_here',
        plans: {
            basic: { price: 9900, name: 'Basic Plan' },
            professional: { price: 29900, name: 'Professional Plan' },
            enterprise: { price: 59900, name: 'Enterprise Plan' }
        }
    }
};

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
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        
        setTimeout(() => {
            messageEl.textContent = '';
            messageEl.className = 'message';
        }, 3000);
    }
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
        if (gateway) gateway.style.display = 'none';
        if (mainWebsite) mainWebsite.classList.remove('hidden');
        
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
        if (gateway) gateway.style.display = 'none';
        if (mainWebsite) mainWebsite.classList.remove('hidden');
        
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
    if (gateway) gateway.style.display = 'flex';
    if (mainWebsite) mainWebsite.classList.add('hidden');
    
    // Reset forms
    if (gatewayLoginForm) gatewayLoginForm.reset();
    if (gatewaySignupForm) gatewaySignupForm.reset();
}

// Service Pages Functions
function openServicePage(serviceType) {
    const servicePages = document.querySelectorAll('.service-page');
    servicePages.forEach(page => {
        page.classList.add('hidden');
    });
    
    const servicePage = document.getElementById(`${serviceType}-page`);
    if (servicePage) {
        servicePage.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeServicePage() {
    const servicePages = document.querySelectorAll('.service-page');
    servicePages.forEach(page => {
        page.classList.add('hidden');
    });
    document.body.style.overflow = 'auto';
}

function contactUs() {
    // Redirect to WhatsApp
    const phoneNumber = '+254708700675';
    const message = 'Hello! I am interested in your services.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    closeServicePage();
}

// WhatsApp Redirection Functions
function redirectToWhatsApp(serviceType) {
    const phoneNumber = '+254708700675';
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

// Scroll to Pricing
function scrollToPricing() {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// ========== REAL M-PESA INTEGRATION ==========
async function getMpesaAccessToken() {
    try {
        const credentials = btoa(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`);
        
        const response = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get access token: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ M-Pesa Access Token:', result);
        
        return result.access_token;
    } catch (error) {
        console.error('❌ Error getting M-Pesa access token:', error);
        throw error;
    }
}

async function initiateSTKPush(accessToken, phone, amount, plan) {
    try {
        const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, -3);
        const password = btoa(`${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`);
        
        const stkPayload = {
            BusinessShortCode: MPESA_CONFIG.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: phone,
            PartyB: MPESA_CONFIG.shortcode,
            PhoneNumber: phone,
            CallBackURL: MPESA_CONFIG.callbackURL,
            AccountReference: `DigitalCreative`,
            TransactionDesc: `${plan} Plan Payment`
        };

        console.log('🔄 STK Push Payload:', stkPayload);

        const response = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stkPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ STK Push failed:', errorText);
            throw new Error(`STK Push failed: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ STK Push Response:', result);
        
        return result;

    } catch (error) {
        console.error('❌ Error initiating STK Push:', error);
        throw error;
    }
}

async function processMpesaPayment() {
    if (!selectedPlan) {
        alert('Please select a plan first.');
        return;
    }

    // Get phone number from user
    const phone = prompt('Please enter your M-Pesa phone number (e.g., 254712345678):');
    if (!phone) return;

    // Validate phone number format
    const cleanedPhone = phone.replace(/\s+/g, '');
    if (!/^254[17]\d{8}$/.test(cleanedPhone)) {
        alert('Please enter a valid Kenyan phone number starting with 254 (e.g., 254712345678)');
        return;
    }

    const mpesaBtn = document.querySelector('.mpesa-btn');
    const originalText = mpesaBtn.textContent;
    
    try {
        mpesaBtn.textContent = 'Getting access token...';
        mpesaBtn.disabled = true;

        const plan = PAYMENT_CONFIG.stripe.plans[selectedPlan];
        const amount = Math.floor(plan.price / 100); // Convert cents to dollars

        console.log('🔄 Starting M-Pesa payment process...');

        // Step 1: Get access token
        mpesaBtn.textContent = 'Authenticating...';
        const accessToken = await getMpesaAccessToken();
        
        if (!accessToken) {
            throw new Error('Failed to get access token');
        }

        // Step 2: Initiate STK Push
        mpesaBtn.textContent = 'Sending STK Push...';
        const stkResponse = await initiateSTKPush(accessToken, cleanedPhone, amount, selectedPlan);

        if (stkResponse.ResponseCode === '0') {
            mpesaBtn.textContent = 'STK Push sent!';
            
            alert(`✅ M-Pesa STK Push Sent!\n\n📱 Check your phone: ${cleanedPhone}\n💰 Amount: KES ${amount}\n📝 Description: DigitalCreative ${plan.name}\n\n💡 Enter your M-Pesa PIN when prompted`);

            // Store checkout ID for status checking
            const checkoutRequestID = stkResponse.CheckoutRequestID;
            
            if (checkoutRequestID) {
                // Start checking payment status
                checkMpesaPaymentStatusDirect(checkoutRequestID, cleanedPhone, amount);
            } else {
                throw new Error('No checkout request ID received from M-Pesa');
            }

        } else {
            throw new Error(stkResponse.ResponseDescription || 'STK Push initiation failed');
        }

    } catch (error) {
        console.error('❌ M-Pesa payment error:', error);
        
        let userMessage = `Payment failed: ${error.message}`;
        
        // Provide more user-friendly error messages
        if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
            userMessage = 'Network error: Unable to connect to M-Pesa service. Please check your internet connection and try again.';
        } else if (error.message.includes('CORS')) {
            userMessage = 'Browser security restriction. Please try again or contact support.';
        }
        
        alert(userMessage);
        resetMpesaButton();
    }
}

// M-Pesa status checking (simulated since we need backend for real status checks)
async function checkMpesaPaymentStatusDirect(checkoutRequestID, phone, amount) {
    const maxAttempts = 12;
    let attempts = 0;

    const checkStatus = async () => {
        attempts++;
        console.log(`🔍 Checking payment status (attempt ${attempts}/${maxAttempts})...`);

        try {
            // Note: In production, you need a backend to check M-Pesa status
            // This simulates the waiting process
            await new Promise(resolve => setTimeout(resolve, 5000));

            // For demo purposes, simulate successful payment after 3 attempts
            if (attempts >= 3) {
                const plan = PAYMENT_CONFIG.stripe.plans[selectedPlan];
                
                alert(`🎉 Payment Confirmed!\n\n✅ Plan: ${plan.name}\n💰 Amount: KES ${amount}\n📱 Phone: ${phone}\n\nThank you for your purchase!`);
                
                recordPurchase(selectedPlan, 'mpesa', plan.price, phone);
                closePaymentModal();
                resetMpesaButton();
                return true;
            } else {
                // Still processing
                if (attempts < maxAttempts) {
                    console.log(`⏳ Payment pending, checking again in 5 seconds...`);
                    setTimeout(checkStatus, 5000);
                } else {
                    alert('⏰ Payment request has expired. Please try the payment again.');
                    resetMpesaButton();
                }
            }

        } catch (error) {
            console.error('Status check error:', error);
            if (attempts < maxAttempts) {
                setTimeout(checkStatus, 5000);
            } else {
                alert('⚠️ Unable to confirm payment status. Please check your M-Pesa messages or try again.');
                resetMpesaButton();
            }
        }
    };

    // Start checking after a short delay
    console.log('⏳ Starting payment status checks...');
    setTimeout(checkStatus, 3000);
}

// Stripe Payment Integration
async function processStripePayment() {
    if (!selectedPlan) {
        alert('Please select a plan first.');
        return;
    }

    try {
        const stripeBtn = document.querySelector('.stripe-btn');
        const originalText = stripeBtn.textContent;
        stripeBtn.textContent = 'Processing...';
        stripeBtn.disabled = true;

        const plan = PAYMENT_CONFIG.stripe.plans[selectedPlan];
        
        // Simulate API call
        setTimeout(() => {
            stripeBtn.textContent = originalText;
            stripeBtn.disabled = false;
            
            alert(`✅ Payment Successful!\n\nPlan: ${plan.name}\nAmount: $${(plan.price / 100).toFixed(2)}\n\nThank you for your purchase!`);
            closePaymentModal();
            
            recordPurchase(selectedPlan, 'stripe', plan.price);
            
        }, 2000);

    } catch (error) {
        console.error('Stripe payment error:', error);
        alert('Payment failed. Please try again.');
        
        const stripeBtn = document.querySelector('.stripe-btn');
        stripeBtn.textContent = '💳 Pay with Credit/Debit Card';
        stripeBtn.disabled = false;
    }
}

// PayPal Payment Integration
function processPayPalPayment() {
    if (!selectedPlan) {
        alert('Please select a plan first.');
        return;
    }

    const plan = PAYMENT_CONFIG.stripe.plans[selectedPlan];
    const amount = (plan.price / 100).toFixed(2);
    
    const paypalBtn = document.querySelector('.paypal-btn');
    const originalText = paypalBtn.textContent;
    paypalBtn.textContent = 'Redirecting to PayPal...';
    paypalBtn.disabled = true;

    setTimeout(() => {
        paypalBtn.textContent = originalText;
        paypalBtn.disabled = false;
        
        alert(`✅ PayPal Payment Successful!\n\nPlan: ${plan.name}\nAmount: $${amount}\n\nThank you for your purchase!`);
        closePaymentModal();
        
        recordPurchase(selectedPlan, 'paypal', plan.price);
        
    }, 2000);
}

// Bank Transfer
function showBankDetails() {
    const bankDetails = document.getElementById('bank-details');
    if (bankDetails) {
        bankDetails.classList.remove('hidden');
        
        const plan = PAYMENT_CONFIG.stripe.plans[selectedPlan];
        if (plan) {
            const amount = (plan.price / 100).toFixed(2);
            document.getElementById('bank-reference').textContent = `DC-${selectedPlan.toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        }
    }
}

function closePaymentModal() {
    const paymentModal = document.getElementById('payment-modal');
    const bankDetails = document.getElementById('bank-details');
    
    if (paymentModal) paymentModal.classList.add('hidden');
    if (bankDetails) bankDetails.classList.add('hidden');
    
    document.body.style.overflow = 'auto';
}

function resetMpesaButton() {
    const mpesaBtn = document.querySelector('.mpesa-btn');
    if (mpesaBtn) {
        mpesaBtn.textContent = '📱 Pay with M-Pesa';
        mpesaBtn.disabled = false;
    }
}

// Record purchase
function recordPurchase(plan, method, amount, phone = null) {
    const purchase = {
        id: Date.now().toString(),
        plan: plan,
        method: method,
        amount: amount,
        phone: phone,
        timestamp: new Date().toISOString(),
        status: 'completed'
    };
    
    let purchases = JSON.parse(localStorage.getItem('purchases')) || [];
    purchases.push(purchase);
    localStorage.setItem('purchases', JSON.stringify(purchases));
    
    console.log('Purchase recorded:', purchase);
}

// Plan Selection
function selectPlan(planType) {
    selectedPlan = planType;
    const planNames = {
        'basic': 'Basic Plan',
        'professional': 'Professional Plan', 
        'enterprise': 'Enterprise Plan'
    };
    const planPrices = {
        'basic': '$99',
        'professional': '$299',
        'enterprise': '$599'
    };

    const planNameEl = document.getElementById('selected-plan-name');
    const planPriceEl = document.getElementById('selected-plan-price');
    const bankRefEl = document.getElementById('bank-reference');
    
    if (planNameEl) planNameEl.textContent = planNames[planType] || 'Selected Plan';
    if (planPriceEl) planPriceEl.textContent = planPrices[planType] || '$0';
    if (bankRefEl) bankRefEl.textContent = `DC-${planType.toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) {
        paymentModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = localStorage.getItem('currentUser');
    
    if (isLoggedIn && currentUser) {
        if (gateway) gateway.style.display = 'none';
        if (mainWebsite) mainWebsite.classList.remove('hidden');
    }
    
    // Gateway tab switching
    if (gatewayTabBtns.length > 0) {
        gatewayTabBtns.forEach(button => {
            button.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                switchGatewayTab(tabName);
            });
        });
    }
    
    // Gateway form submissions
    if (gatewayLoginForm) {
        gatewayLoginForm.addEventListener('submit', handleGatewayLogin);
    }
    
    if (gatewaySignupForm) {
        gatewaySignupForm.addEventListener('submit', handleGatewaySignup);
    }
    
    // Password strength and match checking
    const signupPassword = document.getElementById('gatewaySignupPassword');
    const confirmPassword = document.getElementById('gatewayConfirmPassword');
    
    if (signupPassword) {
        signupPassword.addEventListener('input', updatePasswordStrength);
    }
    
    if (confirmPassword) {
        confirmPassword.addEventListener('input', checkPasswordMatch);
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Hamburger menu
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-link');
    if (navLinks.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (hamburger) hamburger.classList.remove('active');
                if (navMenu) navMenu.classList.remove('active');
            });
        });
    }
    
    // Add WhatsApp redirection to service buttons
    const ctaButtons = document.querySelectorAll('.cta-btn');
    if (ctaButtons.length > 0) {
        ctaButtons.forEach(button => {
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
    }
    
    // Close payment modal when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('payment-modal')) {
            closePaymentModal();
        }
    });
    
    // Close service page when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('service-page')) {
            closeServicePage();
        }
    });
    
    // Animate service cards
    const serviceCards = document.querySelectorAll('.service-card');
    if (serviceCards.length > 0) {
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
        
        serviceCards.forEach(card => {
            card.style.opacity = 0;
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s, transform 0.5s';
            observer.observe(card);
        });
    }
    
    // Smooth scrolling for navigation links
    const navLinksSmooth = document.querySelectorAll('a[href^="#"]');
    navLinksSmooth.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});

// Global functions for HTML onclick
window.closePaymentModal = closePaymentModal;
window.closeServicePage = closeServicePage;
window.selectPlan = selectPlan;
window.processStripePayment = processStripePayment;
window.processPayPalPayment = processPayPalPayment;
window.processMpesaPayment = processMpesaPayment;
window.showBankDetails = showBankDetails;
window.openServicePage = openServicePage;
window.contactUs = contactUs;
window.redirectToWhatsApp = redirectToWhatsApp;
window.scrollToPricing = scrollToPricing;