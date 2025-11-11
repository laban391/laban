// User Accounts Storage
let userAccounts = JSON.parse(localStorage.getItem('userAccounts')) || [];
let selectedPlan = null;

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
        publishableKey: 'pk_test_your_stripe_publishable_key_here', // Replace with your Stripe key
        plans: {
            basic: { price: 9900, name: 'Basic Plan' }, // $99.00 in cents
            professional: { price: 29900, name: 'Professional Plan' }, // $299.00 in cents
            enterprise: { price: 59900, name: 'Enterprise Plan' } // $599.00 in cents
        }
    },
    paypal: {
        clientId: 'ARSawPQyi2MyGHAfI-0F_mxfFcRbElXSVkEivZhkd9MzTmsxYX1_7K_PF5vrWgY5mBB_AZYbMzUPxdIQ', // Replace with your PayPal Client ID
        currency: 'USD'
    },
    mpesa: {
        businessShortCode: '174379', // Sandbox shortcode
        passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919', // Sandbox passkey
        consumerKey: 'N01URGhqalXORYLphqVdwFKhLRwZ2B3P3bSBr65eeLmJwCn4c7o', // From your credentials
        consumerSecret: '6ICXUIrP2Ynu6U3M8Ks6O98gqNQAX4pCf9Ygw5zsB9lHDjply6AvqN6wEUALOayp' // From your credentials
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

// ========== REAL PAYMENT IMPLEMENTATIONS ==========
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

function closePaymentModal() {
    const paymentModal = document.getElementById('payment-modal');
    const bankDetails = document.getElementById('bank-details');
    
    if (paymentModal) paymentModal.classList.add('hidden');
    if (bankDetails) bankDetails.classList.add('hidden');
    
    document.body.style.overflow = 'auto';
}

// Stripe Payment Integration
async function processStripePayment() {
    if (!selectedPlan) {
        alert('Please select a plan first.');
        return;
    }

    try {
        // Show loading state
        const stripeBtn = document.querySelector('.stripe-btn');
        const originalText = stripeBtn.textContent;
        stripeBtn.textContent = 'Processing...';
        stripeBtn.disabled = true;

        // In a real implementation, you would:
        // 1. Create a payment intent on your server
        // 2. Redirect to Stripe Checkout
        // 3. Handle the payment confirmation

        // For demo purposes, we'll simulate the process
        const plan = PAYMENT_CONFIG.stripe.plans[selectedPlan];
        
        // Simulate API call to create payment intent
        setTimeout(() => {
            // This would be your actual Stripe Checkout redirect
            // window.location.href = `your-server-url/create-checkout-session?plan=${selectedPlan}`;
            
            // For demo, show success message
            stripeBtn.textContent = originalText;
            stripeBtn.disabled = false;
            
            alert(`✅ Payment Successful!\n\nPlan: ${plan.name}\nAmount: $${(plan.price / 100).toFixed(2)}\n\nThank you for your purchase!`);
            closePaymentModal();
            
            // Record the purchase
            recordPurchase(selectedPlan, 'stripe', plan.price);
            
        }, 2000);

    } catch (error) {
        console.error('Stripe payment error:', error);
        alert('Payment failed. Please try again.');
        
        // Reset button
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
    
    // Show loading state
    const paypalBtn = document.querySelector('.paypal-btn');
    const originalText = paypalBtn.textContent;
    paypalBtn.textContent = 'Redirecting to PayPal...';
    paypalBtn.disabled = true;

    // In a real implementation, you would:
    // 1. Create a PayPal order
    // 2. Redirect to PayPal approval flow
    // 3. Capture the payment on return
    
    // For demo, simulate the process
    setTimeout(() => {
        // Simulate successful PayPal payment
        paypalBtn.textContent = originalText;
        paypalBtn.disabled = false;
        
        alert(`✅ PayPal Payment Successful!\n\nPlan: ${plan.name}\nAmount: $${amount}\n\nThank you for your purchase!`);
        closePaymentModal();
        
        // Record the purchase
        recordPurchase(selectedPlan, 'paypal', plan.price);
        
    }, 2000);
}

// M-Pesa Payment Integration with Real API
async function processMpesaPayment() {
    if (!selectedPlan) {
        alert('Please select a plan first.');
        return;
    }
    
    const phone = prompt('Please enter your M-Pesa phone number (e.g., 254712345678):');
    if (!phone) return;
    
    // Validate phone number
    if (!phone.startsWith('254') || phone.length !== 12) {
        alert('Please enter a valid Kenyan phone number starting with 254 (e.g., 254712345678)');
        return;
    }
    
    try {
        const mpesaBtn = document.querySelector('.mpesa-btn');
        const originalText = mpesaBtn.textContent;
        mpesaBtn.textContent = 'Getting access token...';
        mpesaBtn.disabled = true;
        
        const plan = PAYMENT_CONFIG.stripe.plans[selectedPlan];
        const amount = 1; // 1 KES for testing, change to plan.price for real payments
        
        // Step 1: Get access token
        const tokenResponse = await getMpesaAccessToken();
        if (!tokenResponse.access_token) {
            throw new Error('Failed to get access token');
        }
        
        mpesaBtn.textContent = 'Initiating payment...';
        
        // Step 2: Initiate STK Push
        const stkResponse = await initiateSTKPush(
            tokenResponse.access_token,
            phone,
            amount,
            selectedPlan
        );
        
        if (stkResponse.ResponseCode === '0') {
            mpesaBtn.textContent = 'Payment initiated!';
            
            alert(`✅ M-Pesa Payment Initiated!\n\nSTK Push sent to ${phone}\nPlan: ${plan.name}\nAmount: KES ${amount}\n\nPlease check your phone to complete the payment.`);
            
            // Start polling for payment confirmation
            checkPaymentStatus(stkResponse.CheckoutRequestID, tokenResponse.access_token, phone);
            
        } else {
            throw new Error(stkResponse.ResponseDescription || 'Failed to initiate payment');
        }
        
    } catch (error) {
        console.error('M-Pesa payment error:', error);
        alert(`M-Pesa payment failed: ${error.message}`);
        
        const mpesaBtn = document.querySelector('.mpesa-btn');
        mpesaBtn.textContent = '📱 Pay with M-Pesa';
        mpesaBtn.disabled = false;
    }
}

// Get M-Pesa Access Token
async function getMpesaAccessToken() {
    const headers = new Headers();
    headers.append("Authorization", "Basic N01VR2hxalhPcnlMcGhxVmR3RktoTFJ3WjJCM1AzYlNCcjY1ZWVMbUp3Q240YzdvOjZJQ1hVSXJQMlludTZVM004S3M2Tzk4Z3FOUUFYNHBDZjlZZ3c1enNCOWxIRGpwbHk2QXZxTjZ3RVVBTE9heXA=");
    
    const response = await fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
        method: 'GET',
        headers: headers
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

// Initiate STK Push
async function initiateSTKPush(accessToken, phoneNumber, amount, planType) {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
    const password = Buffer.from(`174379bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919${timestamp}`).toString('base64');
    
    const stkData = {
        BusinessShortCode: "174379",
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: "174379",
        PhoneNumber: phoneNumber,
        CallBackURL: "https://your-domain.com/mpesa-callback", // Replace with your callback URL
        AccountReference: `DC${planType.toUpperCase()}`,
        TransactionDesc: `Payment for ${planType} plan`
    };
    
    const response = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(stkData)
    });
    
    if (!response.ok) {
        throw new Error(`STK Push failed: ${response.status}`);
    }
    
    return await response.json();
}

// Check Payment Status
async function checkPaymentStatus(checkoutRequestID, accessToken, phone) {
    const maxAttempts = 10;
    let attempts = 0;
    
    const checkStatus = async () => {
        attempts++;
        
        try {
            const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
            const password = Buffer.from(`174379bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919${timestamp}`).toString('base64');
            
            const response = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    BusinessShortCode: "174379",
                    Password: password,
                    Timestamp: timestamp,
                    CheckoutRequestID: checkoutRequestID
                })
            });
            
            const result = await response.json();
            
            if (result.ResultCode === '0') {
                // Payment successful
                alert('✅ M-Pesa Payment Confirmed! Thank you for your purchase.');
                closePaymentModal();
                
                // Record the purchase
                const plan = PAYMENT_CONFIG.stripe.plans[selectedPlan];
                recordPurchase(selectedPlan, 'mpesa', plan.price, phone);
                
                resetMpesaButton();
                return true;
            } else if (result.ResultCode === '1032') {
                // User cancelled
                if (attempts < maxAttempts) {
                    setTimeout(checkStatus, 3000); // Check again in 3 seconds
                } else {
                    alert('Payment was cancelled or timed out.');
                    resetMpesaButton();
                }
            } else {
                // Other error
                alert(`Payment failed: ${result.ResultDesc}`);
                resetMpesaButton();
            }
        } catch (error) {
            console.error('Error checking payment status:', error);
            if (attempts < maxAttempts) {
                setTimeout(checkStatus, 3000);
            } else {
                alert('Unable to confirm payment status. Please contact support.');
                resetMpesaButton();
            }
        }
    };
    
    // Start checking status
    setTimeout(checkStatus, 5000); // First check after 5 seconds
}

function resetMpesaButton() {
    const mpesaBtn = document.querySelector('.mpesa-btn');
    mpesaBtn.textContent = '📱 Pay with M-Pesa';
    mpesaBtn.disabled = false;
}
// Bank Transfer
function showBankDetails() {
    const bankDetails = document.getElementById('bank-details');
    if (bankDetails) {
        bankDetails.classList.remove('hidden');
        
        // Update bank details based on selected plan
        const plan = PAYMENT_CONFIG.stripe.plans[selectedPlan];
        if (plan) {
            const amount = (plan.price / 100).toFixed(2);
            document.getElementById('bank-reference').textContent = `DC-${selectedPlan.toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        }
    }
}

// Record purchase (for demo purposes)
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
    
    // Store in localStorage (in real app, send to your backend)
    let purchases = JSON.parse(localStorage.getItem('purchases')) || [];
    purchases.push(purchase);
    localStorage.setItem('purchases', JSON.stringify(purchases));
    
    console.log('Purchase recorded:', purchase);
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

// Global close functions for HTML onclick
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