// Инициализируем подключение к Socket.io
const socket = io();

// Состояние приложения (храним данные текущего пользователя)
let currentUser = null;
let isRegisterMode = false;

// ----------------------------------------------------
// Находим элементы DOM (интерфейса)
// ----------------------------------------------------
const authScreen = document.getElementById('auth-screen');
const chatScreen = document.getElementById('chat-screen');

const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const nicknameGroup = document.getElementById('nickname-group');
const nicknameInput = document.getElementById('nickname');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authError = document.getElementById('auth-error');
const authBtn = document.getElementById('auth-btn');
const toggleBtn = document.getElementById('toggle-btn');
const toggleText = document.getElementById('toggle-text');

const userNickname = document.getElementById('user-nickname');
const userAvatar = document.getElementById('user-avatar');
const logoutBtn = document.getElementById('logout-btn');

const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

// ----------------------------------------------------
// 1. Переключение между Входом и Регистрацией
// ----------------------------------------------------
toggleBtn.addEventListener('click', () => {
    isRegisterMode = !isRegisterMode;
    authError.classList.add('hidden');

    if (isRegisterMode) {
        authTitle.textContent = 'Регистрация';
        authBtn.textContent = 'Зарегистрироваться';
        nicknameGroup.classList.remove('hidden');
        nicknameInput.required = true;
        toggleText.textContent = 'Уже есть аккаунт?';
        toggleBtn.textContent = 'Войти';
    } else {
        authTitle.textContent = 'Вход в чат';
        authBtn.textContent = 'Войти';
        nicknameGroup.classList.add('hidden');
        nicknameInput.required = false;
        toggleText.textContent = 'Ещё нет аккаунта?';
        toggleBtn.textContent = 'Зарегистрироваться';
    }
});

// ----------------------------------------------------
// 2. Обработка формы Входа / Регистрации
// ----------------------------------------------------
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.classList.add('hidden');

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const nickname = nicknameInput.value.trim();

    // Определяем URL в зависимости от режима
    const endpoint = isRegisterMode ? '/api/register' : '/api/login';
    const payload = isRegisterMode ? { email, password, nickname } : { email, password };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Произошла ошибка');
        }

        // Если регистрация прошла успешно в режиме регистрации -> переключаем на вход
        if (isRegisterMode) {
            alert('Регистрация успешна! Теперь войдите в аккаунт.');
            toggleBtn.click();
            return;
        }

        // Авторизация успешна
        currentUser = data.user;
        openChatScreen();

    } catch (err) {
        authError.textContent = err.message;
        authError.classList.remove('hidden');
    }
});

// ----------------------------------------------------
// 3. Открытие экрана чата
// ----------------------------------------------------
function openChatScreen() {
    authScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');

    userNickname.textContent = currentUser.nickname;
    userAvatar.textContent = currentUser.nickname.charAt(0).toUpperCase();

    // Запрашиваем историю сообщений из базы данных
    socket.emit('get-history');
}

// Выход из аккаунта
logoutBtn.addEventListener('click', () => {
    currentUser = null;
    chatScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
    messagesContainer.innerHTML = '';
});

// ----------------------------------------------------
// 4. Логика чата в реальном времени (Socket.io)
// ----------------------------------------------------

// Отправка нового сообщения
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();

    if (!text || !currentUser) return;

    // Отправляем событие на сервер
    socket.emit('send-message', {
        userId: currentUser.id,
        nickname: currentUser.nickname,
        text: text
    });

    messageInput.value = '';
});

// Получение истории сообщений при входе
socket.on('history-loaded', (messages) => {
    messagesContainer.innerHTML = '';
    messages.forEach(msg => renderMessage(msg));
    scrollToBottom();
});

// Получение нового сообщения в реальном времени
socket.on('new-message', (msg) => {
    renderMessage(msg);
    scrollToBottom();
});

// Отрисовка сообщения на экране
function renderMessage(msg) {
    const messageDiv = document.createElement('div');
    
    // Проверяем, наше это сообщение или чужое
    const isMyMessage = currentUser && msg.nickname === currentUser.nickname;
    
    messageDiv.classList.add('message');
    messageDiv.classList.add(isMyMessage ? 'my-message' : 'other-message');

    // Форматируем время (например: 14:35)
    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        ${!isMyMessage ? `<div class="author">${escapeHtml(msg.nickname)}</div>` : ''}
        <div class="text">${escapeHtml(msg.text)}</div>
        <div class="time">${time}</div>
    `;

    messagesContainer.appendChild(messageDiv);
}

// Автоскролл вниз к последним сообщениям
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Защита от XSS-атак (экранирование HTML тегов)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}