// ====================================================
// 1. БЛОКИРОВКА ПКМ И ГОРЯЧИХ КЛАВИШ (F12)
// ====================================================
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') e.preventDefault();
    if (e.ctrlKey && e.shiftKey && ['I','i','J','j','C','c'].includes(e.key)) e.preventDefault();
    if (e.ctrlKey && ['u','U'].includes(e.key)) e.preventDefault();
});

// ====================================================
// 2. ИНИЦИАЛИЗАЦИЯ И СОСТОЯНИЕ
// ====================================================
const socket = io();

let currentUser = null;
let isRegisterMode = false;
let activeChat = { type: 'global', id: null, nickname: 'Общий Чат (Гигачат)' };
let privateUsersMap = new Map(); // Храним загруженных пользователей
let attachedImageBase64 = null;

// DOM элементы
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
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

const myAvatar = document.getElementById('my-avatar');
const myNickname = document.getElementById('my-nickname');
const myProfileBtn = document.getElementById('my-profile-btn');
const logoutBtn = document.getElementById('logout-btn');

const chatsList = document.getElementById('chats-list');
const chatItemGlobal = document.getElementById('chat-item-global');
const privateChatsContainer = document.getElementById('private-chats-container');

const chatWindow = document.getElementById('chat-window');
const mobileBackBtn = document.getElementById('mobile-back-btn');
const chatHeaderAvatar = document.getElementById('chat-header-avatar');
const chatHeaderTitle = document.getElementById('chat-header-title');
const chatHeaderSubtitle = document.getElementById('chat-header-subtitle');
const currentChatHeaderInfo = document.getElementById('current-chat-header-info');

const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const imageInput = document.getElementById('image-input');
const imagePreview = document.getElementById('image-preview');
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

// ====================================================
// 3. АВТОРИЗАЦИЯ
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
        authTitle.textContent = 'Вход в Telegram Web';
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
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Ошибка входа');

        if (isRegisterMode) {
            alert('Регистрация успешна! Теперь войдите.');
            toggleBtn.click();
            return;
        }

        currentUser = data.user;
        openAppScreen();

    } catch (err) {
        authError.textContent = err.message;
        authError.classList.remove('hidden');
    }
});

function openAppScreen() {
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');

    updateMyProfileHeader();

    socket.emit('join-user-room', currentUser.id);
    switchChatToGlobal();
}

function updateMyProfileHeader() {
    myNickname.textContent = currentUser.nickname;
    if (currentUser.avatar_url) {
        myAvatar.style.backgroundImage = `url(${currentUser.avatar_url})`;
        myAvatar.textContent = '';
    } else {
        myAvatar.style.backgroundImage = '';
        myAvatar.textContent = currentUser.nickname.charAt(0).toUpperCase();
    }
}

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    appScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
});

// ====================================================
// 4. ПЕРЕКЛЮЧЕНИЕ ЧАТОВ (ОБЩИЙ / ЛИЧКА)
// ====================================================
chatItemGlobal.addEventListener('click', () => {
    switchChatToGlobal();
});

function switchChatToGlobal() {
    activeChat = { type: 'global', id: null, nickname: 'Общий Чат (Гигачат)' };

    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
    chatItemGlobal.classList.add('active');

    chatHeaderTitle.textContent = 'Общий Чат (Гигачат)';
    chatHeaderSubtitle.textContent = '● Все зарегистрированные пользователи';
    chatHeaderAvatar.className = 'avatar avatar-global';
    chatHeaderAvatar.style.backgroundImage = '';
    chatHeaderAvatar.textContent = '🌐';

    appScreen.classList.add('mobile-active-chat');
    messagesContainer.innerHTML = '';

    socket.emit('get-history', { userCreatedAt: currentUser.created_at });
}

function switchChatToPrivate(user) {
    activeChat = { type: 'private', id: user.id, nickname: user.nickname, avatar_url: user.avatar_url };

    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
    
    let chatEl = document.getElementById(`private-chat-item-${user.id}`);
    if (chatEl) chatEl.classList.add('active');

    chatHeaderTitle.textContent = user.nickname;
    chatHeaderSubtitle.textContent = '● личный диалог';
    chatHeaderAvatar.className = 'avatar';
    
    if (user.avatar_url) {
        chatHeaderAvatar.style.backgroundImage = `url(${user.avatar_url})`;
        chatHeaderAvatar.textContent = '';
    } else {
        chatHeaderAvatar.style.backgroundImage = '';
        chatHeaderAvatar.textContent = user.nickname.charAt(0).toUpperCase();
    }

    appScreen.classList.add('mobile-active-chat');
    messagesContainer.innerHTML = '';

    socket.emit('get-private-history', { myId: currentUser.id, otherId: user.id });
}

mobileBackBtn.addEventListener('click', () => {
    appScreen.classList.remove('mobile-active-chat');
});

// ====================================================
// 5. ОТПРАВКА СООБЩЕНИЙ И АНТИСПАМ
// ====================================================
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        attachedImageBase64 = evt.target.result;
        imagePreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

removeImageBtn.addEventListener('click', () => {
    attachedImageBase64 = null;
    imageInput.value = '';
    imagePreview.classList.add('hidden');
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();

    if (!text && !attachedImageBase64) return;

    if (activeChat.type === 'global') {
        socket.emit('send-message', {
            userId: currentUser.id,
            nickname: currentUser.nickname,
            text: text,
            imageUrl: attachedImageBase64
        });
    } else {
        socket.emit('send-private-message', {
            senderId: currentUser.id,
            receiverId: activeChat.id,
            senderNickname: currentUser.nickname,
            text: text,
            imageUrl: attachedImageBase64
        });
    }

    messageInput.value = '';
    attachedImageBase64 = null;
    imageInput.value = '';
    imagePreview.classList.add('hidden');

    triggerSpamCooldown();
});

function triggerSpamCooldown() {
    sendBtn.disabled = true;
    setTimeout(() => { sendBtn.disabled = false; }, 1500);
}

socket.on('spam-warning', (msg) => alert(msg));

// ====================================================
// 6. ПРИЕМ СООБЩЕНИЙ И ОБНОВЛЕНИЕ ТАБЛИЦЫ ЧАТОВ
// ====================================================

socket.on('history-loaded', (messages) => {
    if (activeChat.type !== 'global') return;
    messagesContainer.innerHTML = '';
    messages.forEach(msg => renderBubble(msg));
    scrollToBottom();
});

socket.on('new-message', (msg) => {
    document.getElementById('global-last-preview').textContent = `${msg.nickname}: ${msg.text || '📷 Фотография'}`;
    document.getElementById('global-last-time').textContent = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (activeChat.type === 'global') {
        renderBubble(msg);
        scrollToBottom();
    }
});

socket.on('private-history-loaded', (data) => {
    if (activeChat.type === 'private' && activeChat.id == data.otherId) {
        messagesContainer.innerHTML = '';
        data.messages.forEach(msg => renderPrivateBubble(msg));
        scrollToBottom();
    }
});

socket.on('new-private-message', (msg) => {
    const otherId = msg.sender_id == currentUser.id ? msg.receiver_id : msg.sender_id;
    const otherNickname = msg.sender_id == currentUser.id ? activeChat.nickname : msg.sender_nickname;

    ensurePrivateChatItem(otherId, otherNickname, msg.text || '📷 Фотография', msg.created_at);

    if (activeChat.type === 'private' && (activeChat.id == msg.sender_id || activeChat.id == msg.receiver_id)) {
        renderPrivateBubble(msg);
        scrollToBottom();
    }
});

function ensurePrivateChatItem(userId, nickname, lastText, createdAt) {
    let chatEl = document.getElementById(`private-chat-item-${userId}`);

    const timeStr = createdAt ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    if (!chatEl) {
        chatEl = document.createElement('div');
        chatEl.id = `private-chat-item-${userId}`;
        chatEl.className = 'chat-item';
        chatEl.dataset.type = 'private';
        chatEl.dataset.id = userId;

        chatEl.innerHTML = `
            <div class="avatar" id="avatar-item-${userId}">${nickname.charAt(0).toUpperCase()}</div>
            <div class="chat-item-info">
                <div class="chat-item-top">
                    <span class="chat-name">${escapeHtml(nickname)}</span>
                    <span class="chat-time" id="time-item-${userId}">${timeStr}</span>
                </div>
                <div class="chat-item-bottom">
                    <span class="chat-preview" id="preview-item-${userId}">${escapeHtml(lastText)}</span>
                </div>
            </div>
        `;

        chatEl.onclick = () => switchChatToPrivate({ id: userId, nickname: nickname });
        privateChatsContainer.prepend(chatEl);
    } else {
        document.getElementById(`preview-item-${userId}`).textContent = lastText;
        if (timeStr) document.getElementById(`time-item-${userId}`).textContent = timeStr;
        privateChatsContainer.prepend(chatEl);
    }
}

function renderBubble(msg) {
    const isMy = msg.nickname === currentUser.nickname;
    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const bubble = document.createElement('div');
    bubble.className = `msg-bubble ${isMy ? 'my' : 'other'}`;

    bubble.innerHTML = `
        ${!isMy ? `<div class="msg-author" onclick="openProfileById('${msg.user_id}')">${escapeHtml(msg.nickname)}</div>` : ''}
        ${msg.text ? `<div>${escapeHtml(msg.text)}</div>` : ''}
        ${msg.image_url ? `<img src="${msg.image_url}" class="msg-img" onclick="window.open('${msg.image_url}')">` : ''}
        <span class="msg-time">${time}</span>
    `;

    messagesContainer.appendChild(bubble);
}

function renderPrivateBubble(msg) {
    const isMy = msg.sender_id == currentUser.id;
    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const bubble = document.createElement('div');
    bubble.className = `msg-bubble ${isMy ? 'my' : 'other'}`;

    bubble.innerHTML = `
        ${msg.text ? `<div>${escapeHtml(msg.text)}</div>` : ''}
        ${msg.image_url ? `<img src="${msg.image_url}" class="msg-img" onclick="window.open('${msg.image_url}')">` : ''}
        <span class="msg-time">${time}</span>
    `;

    messagesContainer.appendChild(bubble);
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ====================================================
// 7. МОДАЛЬНОЕ ОКНО ПРОФИЛЯ
// ====================================================
myProfileBtn.addEventListener('click', () => {
    openMyProfile();
});

currentChatHeaderInfo.addEventListener('click', () => {
    if (activeChat.type === 'private') {
        openProfileById(activeChat.id);
    }
});

function openMyProfile() {
    modalNickname.textContent = currentUser.nickname;
    modalBio.textContent = currentUser.bio || 'Описание отсутствует';
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
}

async function openProfileById(userId) {
    if (userId == currentUser.id) return openMyProfile();

    try {
        const res = await fetch(`/api/user/${userId}`);
        const data = await res.json();
        if (!res.ok) return alert('Не удалось загрузить профиль');

        const user = data.user;
        modalNickname.textContent = user.nickname;
        modalBio.textContent = user.bio || 'Пользователь ничего о себе не написал.';
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

        startPrivateBtn.onclick = () => {
            profileModal.classList.add('hidden');
            ensurePrivateChatItem(user.id, user.nickname, 'Начать диалог', null);
            switchChatToPrivate(user);
        };

        profileModal.classList.remove('hidden');
    } catch (err) {
        console.error(err);
    }
}

saveProfileBtn.addEventListener('click', async () => {
    const avatarUrl = editAvatarUrl.value.trim();
    const bio = editBio.value.trim();

    try {
        const res = await fetch('/api/user/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, avatarUrl, bio })
        });

        if (res.ok) {
            currentUser.avatar_url = avatarUrl;
            currentUser.bio = bio;
            updateMyProfileHeader();
            profileModal.classList.add('hidden');
            alert('Профиль обновлен!');
        }
    } catch (err) {
        alert('Ошибка сохранения');
    }
});

closeModalBtn.addEventListener('click', () => profileModal.classList.add('hidden'));

function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}
