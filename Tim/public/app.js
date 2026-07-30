// ====================================================
// 1. БЛОКИРОВКА ПКМ И ГОРЯЧИХ КЛАВИШ (ИНСПЕКТОРА КОДА)
// ====================================================
document.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') e.preventDefault();
    if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c', 'Ш', 'ш'].includes(event.key)) e.preventDefault();
    if (e.ctrlKey && ['u', 'U', 'г', 'Г'].includes(event.key)) e.preventDefault();
});

// ====================================================
// 2. ИНИЦИАЛИЗАЦИЯ И ЭЛЕМЕНТЫ DOM
// ====================================================
const socket = io();

let currentUser = null;
let isRegisterMode = false;
let currentActiveTab = 'global'; // 'global' или 'private'
let selectedPrivateUser = null; // Пользователь, с которым открыта личка
let attachedImageBase64 = null; // Прикрепленная картинка

// DOM Элементы
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
const myProfileBtn = document.getElementById('my-profile-btn');

const tabGlobal = document.getElementById('tab-global');
const tabPrivate = document.getElementById('tab-private');
const globalChatView = document.getElementById('global-chat-view');
const privateChatView = document.getElementById('private-chat-view');

const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const imageInput = document.getElementById('image-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const removeImageBtn = document.getElementById('remove-image-btn');

const profileModal = document.getElementById('profile-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalAvatar = document.getElementById('modal-avatar');
const modalNickname = document.getElementById('modal-nickname');
const modalBio = document.getElementById('modal-bio');
const modalDate = document.getElementById('modal-date');
const editProfileSection = document.getElementById('edit-profile-section');
const editAvatarUrl = document.getElementById('edit-avatar-url');
const editBio = document.getElementById('edit-bio');
const saveProfileBtn = document.getElementById('save-profile-btn');
const startPrivateBtn = document.getElementById('start-private-btn');

const privateDialogsList = document.getElementById('private-dialogs-list');
const privateHeader = document.getElementById('private-header');
const privateWithNickname = document.getElementById('private-with-nickname');
const backToChatsBtn = document.getElementById('back-to-chats-btn');
const privateMessagesContainer = document.getElementById('private-messages-container');
const privateMessageForm = document.getElementById('private-message-form');
const privateMessageInput = document.getElementById('private-message-input');

// ====================================================
// 3. АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ
// ====================================================
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

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.classList.add('hidden');

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const nickname = nicknameInput.value.trim();

    const endpoint = isRegisterMode ? '/api/register' : '/api/login';
    const payload = isRegisterMode ? { email, password, nickname } : { email, password };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Ошибка');

        if (isRegisterMode) {
            alert('Регистрация успешна! Войдите в аккаунт.');
            toggleBtn.click();
            return;
        }

        currentUser = data.user;
        openChatScreen();

    } catch (err) {
        authError.textContent = err.message;
        authError.classList.remove('hidden');
    }
});

function openChatScreen() {
    authScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');

    updateUserHeader();

    // Подключаем пользователя к его личной комнате Socket.io
    socket.emit('join-user-room', currentUser.id);

    // Запрашиваем историю общего чата (передаем дату регистрации!)
    socket.emit('get-history', { userCreatedAt: currentUser.created_at });
}

function updateUserHeader() {
    userNickname.textContent = currentUser.nickname;
    if (currentUser.avatar_url) {
        userAvatar.style.backgroundImage = `url(${currentUser.avatar_url})`;
        userAvatar.textContent = '';
    } else {
        userAvatar.style.backgroundImage = '';
        userAvatar.textContent = currentUser.nickname.charAt(0).toUpperCase();
    }
}

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    chatScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
    messagesContainer.innerHTML = '';
});

// ====================================================
// 4. ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК (ОБЩИЙ ЧАТ / ЛИЧКА)
// ====================================================
tabGlobal.addEventListener('click', () => {
    currentActiveTab = 'global';
    tabGlobal.classList.add('active');
    tabPrivate.classList.remove('active');
    globalChatView.classList.remove('hidden');
    privateChatView.classList.add('hidden');
});

tabPrivate.addEventListener('click', () => {
    currentActiveTab = 'private';
    tabPrivate.classList.add('active');
    tabGlobal.classList.remove('active');
    privateChatView.classList.remove('hidden');
    globalChatView.classList.add('hidden');
});

// ====================================================
// 5. ОБЩИЙ ЧАТ И АНТИСПАМ
// ====================================================

// Обработка выбора картинки
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        attachedImageBase64 = evt.target.result;
        imagePreviewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

removeImageBtn.addEventListener('click', () => {
    attachedImageBase64 = null;
    imageInput.value = '';
    imagePreviewContainer.classList.add('hidden');
});

// Отправка сообщения в общий чат
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();

    if (!text && !attachedImageBase64) return;

    socket.emit('send-message', {
        userId: currentUser.id,
        nickname: currentUser.nickname,
        text: text,
        imageUrl: attachedImageBase64
    });

    messageInput.value = '';
    attachedImageBase64 = null;
    imageInput.value = '';
    imagePreviewContainer.classList.add('hidden');

    // Таймер визуального антиспама на кнопке (1.5 сек)
    triggerSpamCooldown();
});

function triggerSpamCooldown() {
    sendBtn.disabled = true;
    let secondsLeft = 1.5;
    sendBtn.querySelector('span').textContent = '...';

    setTimeout(() => {
        sendBtn.disabled = false;
        sendBtn.querySelector('span').textContent = 'Отправить';
    }, 1500);
}

socket.on('spam-warning', (msg) => {
    alert(msg);
});

socket.on('history-loaded', (messages) => {
    messagesContainer.innerHTML = '';
    messages.forEach(msg => renderGlobalMessage(msg));
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

socket.on('new-message', (msg) => {
    renderGlobalMessage(msg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

function renderGlobalMessage(msg) {
    const messageDiv = document.createElement('div');
    const isMyMessage = currentUser && msg.nickname === currentUser.nickname;

    messageDiv.classList.add('message');
    messageDiv.classList.add(isMyMessage ? 'my-message' : 'other-message');

    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        ${!isMyMessage ? `
            <div class="author-box" onclick="openUserProfile('${msg.user_id}')">
                <span class="avatar-mini">${msg.nickname.charAt(0).toUpperCase()}</span>
                <span class="author">${escapeHtml(msg.nickname)}</span>
            </div>
        ` : ''}
        ${msg.text ? `<div class="text">${escapeHtml(msg.text)}</div>` : ''}
        ${msg.image_url ? `<img src="${msg.image_url}" class="message-img" onclick="window.open('${msg.image_url}')">` : ''}
        <div class="time">${time}</div>
    `;

    messagesContainer.appendChild(messageDiv);
}

// ====================================================
// 6. ЛИЧНЫЕ СООБЩЕНИЯ (1-на-1)
// ====================================================

function openPrivateChatWith(otherUser) {
    selectedPrivateUser = otherUser;
    
    // Закрываем модальное окно профиля
    profileModal.classList.add('hidden');

    // Переключаем на вкладку Личка
    tabPrivate.click();

    privateDialogsList.classList.add('hidden');
    privateHeader.classList.remove('hidden');
    privateMessagesContainer.classList.remove('hidden');
    privateMessageForm.classList.remove('hidden');

    privateWithNickname.textContent = `Чат с ${otherUser.nickname}`;
    privateMessagesContainer.innerHTML = '';

    // Запрашиваем историю лички
    socket.emit('get-private-history', { myId: currentUser.id, otherId: otherUser.id });
}

backToChatsBtn.addEventListener('click', () => {
    selectedPrivateUser = null;
    privateHeader.classList.add('hidden');
    privateMessagesContainer.classList.add('hidden');
    privateMessageForm.classList.add('hidden');
    privateDialogsList.classList.remove('hidden');
});

privateMessageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = privateMessageInput.value.trim();
    if (!text || !selectedPrivateUser) return;

    socket.emit('send-private-message', {
        senderId: currentUser.id,
        receiverId: selectedPrivateUser.id,
        senderNickname: currentUser.nickname,
        text: text
    });

    privateMessageInput.value = '';
});

socket.on('private-history-loaded', (data) => {
    privateMessagesContainer.innerHTML = '';
    data.messages.forEach(msg => renderPrivateMessage(msg));
    privateMessagesContainer.scrollTop = privateMessagesContainer.scrollHeight;
});

socket.on('new-private-message', (msg) => {
    // Если открыта личка с этим собеседником -> рисуем сообщение
    if (selectedPrivateUser && (msg.sender_id == selectedPrivateUser.id || msg.receiver_id == selectedPrivateUser.id)) {
        renderPrivateMessage(msg);
        privateMessagesContainer.scrollTop = privateMessagesContainer.scrollHeight;
    } else {
        alert(`🔔 Новое личное сообщение от ${msg.sender_nickname}!`);
    }
});

function renderPrivateMessage(msg) {
    const messageDiv = document.createElement('div');
    const isMyMessage = msg.sender_id == currentUser.id;

    messageDiv.classList.add('message');
    messageDiv.classList.add(isMyMessage ? 'my-message' : 'other-message');

    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        <div class="text">${escapeHtml(msg.text)}</div>
        <div class="time">${time}</div>
    `;

    privateMessagesContainer.appendChild(messageDiv);
}

// ====================================================
// 7. ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ
// ====================================================

// Открыть свой профиль для редактирования
myProfileBtn.addEventListener('click', () => {
    if (!currentUser) return;

    modalNickname.textContent = currentUser.nickname;
    modalBio.textContent = currentUser.bio || 'Нет описания';
    modalDate.textContent = `Зарегистрирован: ${new Date(currentUser.created_at).toLocaleDateString()}`;

    if (currentUser.avatar_url) {
        modalAvatar.style.backgroundImage = `url(${currentUser.avatar_url})`;
        modalAvatar.textContent = '';
    } else {
        modalAvatar.style.backgroundImage = '';
        modalAvatar.textContent = currentUser.nickname.charAt(0).toUpperCase();
    }

    editAvatarUrl.value = currentUser.avatar_url || '';
    editBio.value = currentUser.bio || '';

    editProfileSection.classList.remove('hidden');
    startPrivateBtn.classList.add('hidden');
    profileModal.classList.remove('hidden');
});

// Сохранение своего профиля
saveProfileBtn.addEventListener('click', async () => {
    const avatarUrl = editAvatarUrl.value.trim();
    const bio = editBio.value.trim();

    try {
        const res = await fetch('/api/user/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, avatarUrl, bio })
        });
        const data = await res.json();

        if (res.ok) {
            currentUser.avatar_url = avatarUrl;
            currentUser.bio = bio;
            updateUserHeader();
            profileModal.classList.add('hidden');
            alert('Профиль сохранен!');
        }
    } catch (err) {
        alert('Ошибка сохранения профиля');
    }
});

// Открыть чужой профиль при клике на сообщение
async function openUserProfile(userId) {
    if (!userId) return;

    // Если кликнули на себя — открываем редактирование
    if (userId == currentUser.id) {
        myProfileBtn.click();
        return;
    }

    try {
        const res = await fetch(`/api/user/${userId}`);
        const data = await res.json();

        if (!res.ok) return alert('Не удалось загрузить профиль');

        const user = data.user;
        modalNickname.textContent = user.nickname;
        modalBio.textContent = user.bio || 'Пользователь ничего не написал о себе.';
        modalDate.textContent = `Зарегистрирован: ${new Date(user.created_at).toLocaleDateString()}`;

        if (user.avatar_url) {
            modalAvatar.style.backgroundImage = `url(${user.avatar_url})`;
            modalAvatar.textContent = '';
        } else {
            modalAvatar.style.backgroundImage = '';
            modalAvatar.textContent = user.nickname.charAt(0).toUpperCase();
        }

        editProfileSection.classList.add('hidden');
        startPrivateBtn.classList.remove('hidden');

        // Вешаем событие на кнопку "Написать в личку"
        startPrivateBtn.onclick = () => openPrivateChatWith(user);

        profileModal.classList.remove('hidden');

    } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
    }
}

closeModalBtn.addEventListener('click', () => {
    profileModal.classList.add('hidden');
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}
