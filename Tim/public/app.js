// ====================================================
// 1. БЛОКИРОВКА ПКМ И F12
// ====================================================
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') e.preventDefault();
    if (e.ctrlKey && e.shiftKey && ['I','i','J','j','C','c'].includes(e.key)) e.preventDefault();
    if (e.ctrlKey && ['u','U'].includes(e.key)) e.preventDefault();
});

// ====================================================
// 2. ИНИЦИАЛИЗАЦИЯ И СТАТУС
// ====================================================
const socket = io();

let currentUser = null;
let isRegisterMode = false;
let activeChat = { type: 'global', id: null, nickname: 'Общий чат' };
let attachedImageBase64 = null;

// DOM ЭЛЕМЕНТЫ
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
const myProfileTrigger = document.getElementById('my-profile-trigger');
const logoutBtn = document.getElementById('logout-btn');

const globalChatCard = document.getElementById('global-chat-card');
const directChatsList = document.getElementById('direct-chats-list');

const backToSidebarBtn = document.getElementById('back-to-sidebar-btn');
const headerAvatar = document.getElementById('header-avatar');
const headerTitle = document.getElementById('header-title');
const headerSubtitle = document.getElementById('header-subtitle');
const activeChatInfo = document.getElementById('active-chat-info');

const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const imageInput = document.getElementById('image-input');
const imagePreviewBar = document.getElementById('image-preview-bar');
const removeImageBtn = document.getElementById('remove-image-btn');

const profileModal = document.getElementById('profile-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalAvatar = document.getElementById('modal-avatar');
const modalNickname = document.getElementById('modal-nickname');
const modalBio = document.getElementById('modal-bio');
const modalDate = document.getElementById('modal-date');
const editProfileBlock = document.getElementById('edit-profile-block');
const actionProfileBlock = document.getElementById('action-profile-block');
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
        authTitle.textContent = 'Вход в аккаунт';
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
            alert('Регистрация успешна! Войдите в аккаунт.');
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
// 4. ПЕРЕКЛЮЧЕНИЕ ЧАТОВ
// ====================================================
globalChatCard.addEventListener('click', () => {
    switchChatToGlobal();
});

function switchChatToGlobal() {
    activeChat = { type: 'global', id: null, nickname: 'Общий чат' };

    document.querySelectorAll('.chat-card').forEach(el => el.classList.remove('active'));
    globalChatCard.classList.add('active');

    headerTitle.textContent = 'Общий чат';
    headerSubtitle.textContent = 'Публичная комната';
    headerAvatar.className = 'avatar';
    headerAvatar.style.backgroundImage = '';
    headerAvatar.textContent = '🌐';

    appScreen.classList.add('mobile-chat-open');
    messagesContainer.innerHTML = '';

    socket.emit('get-history', { userCreatedAt: currentUser.created_at });
}

function switchChatToPrivate(user) {
    activeChat = { type: 'private', id: user.id, nickname: user.nickname, avatar_url: user.avatar_url };

    document.querySelectorAll('.chat-card').forEach(el => el.classList.remove('active'));
    
    let chatCard = document.getElementById(`direct-card-${user.id}`);
    if (chatCard) chatCard.classList.add('active');

    headerTitle.textContent = user.nickname;
    headerSubtitle.textContent = 'Личный диалог';
    headerAvatar.className = 'avatar';

    if (user.avatar_url) {
        headerAvatar.style.backgroundImage = `url(${user.avatar_url})`;
        headerAvatar.textContent = '';
    } else {
        headerAvatar.style.backgroundImage = '';
        headerAvatar.textContent = user.nickname.charAt(0).toUpperCase();
    }

    appScreen.classList.add('mobile-chat-open');
    messagesContainer.innerHTML = '';

    socket.emit('get-private-history', { myId: currentUser.id, otherId: user.id });
}

backToSidebarBtn.addEventListener('click', () => {
    appScreen.classList.remove('mobile-chat-open');
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
        imagePreviewBar.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

removeImageBtn.addEventListener('click', () => {
    attachedImageBase64 = null;
    imageInput.value = '';
    imagePreviewBar.classList.add('hidden');
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
    imagePreviewBar.classList.add('hidden');

    triggerSpamCooldown();
});

function triggerSpamCooldown() {
    sendBtn.disabled = true;
    setTimeout(() => { sendBtn.disabled = false; }, 1500);
}

socket.on('spam-warning', (msg) => alert(msg));

// ====================================================
// 6. ПРИЕМ СООБЩЕНИЙ
// ====================================================
socket.on('history-loaded', (messages) => {
    if (activeChat.type !== 'global') return;
    messagesContainer.innerHTML = '';
    messages.forEach(msg => renderBubble(msg));
    scrollToBottom();
});

socket.on('new-message', (msg) => {
    document.getElementById('global-preview').textContent = `${msg.nickname}: ${msg.text || '📷 Фотография'}`;
    document.getElementById('global-time').textContent = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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

    ensureDirectChatCard(otherId, otherNickname, msg.text || '📷 Фотография', msg.created_at);

    if (activeChat.type === 'private' && (activeChat.id == msg.sender_id || activeChat.id == msg.receiver_id)) {
        renderPrivateBubble(msg);
        scrollToBottom();
    }
});

function ensureDirectChatCard(userId, nickname, lastText, createdAt) {
    let card = document.getElementById(`direct-card-${userId}`);
    const timeStr = createdAt ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    if (!card) {
        card = document.createElement('div');
        card.id = `direct-card-${userId}`;
        card.className = 'chat-card';
        card.dataset.id = userId;

        card.innerHTML = `
            <div class="avatar">${nickname.charAt(0).toUpperCase()}</div>
            <div class="card-info">
                <div class="card-title-row">
                    <span class="card-title">${escapeHtml(nickname)}</span>
                    <span class="card-time" id="card-time-${userId}">${timeStr}</span>
                </div>
                <span class="card-preview" id="card-preview-${userId}">${escapeHtml(lastText)}</span>
            </div>
        `;

        card.onclick = () => switchChatToPrivate({ id: userId, nickname: nickname });
        directChatsList.prepend(card);
    } else {
        document.getElementById(`card-preview-${userId}`).textContent = lastText;
        if (timeStr) document.getElementById(`card-time-${userId}`).textContent = timeStr;
        directChatsList.prepend(card);
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
// 7. ЧЕТКАЯ ЛОГИКА ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ
// ====================================================

// Открытие СВОЕГО профиля (ТОЛЬКО для редактирования)
myProfileTrigger.addEventListener('click', () => {
    if (!currentUser) return;

    modalNickname.textContent = currentUser.nickname;
    modalBio.textContent = currentUser.bio || 'Пока ничего о себе не написали.';
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

    // Включаем редактирование, отключаем кнопку лички
    editProfileBlock.classList.remove('hidden');
    actionProfileBlock.classList.add('hidden');
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

        if (res.ok) {
            currentUser.avatar_url = avatarUrl;
            currentUser.bio = bio;
            updateMyProfileHeader();
            profileModal.classList.add('hidden');
            alert('Профиль сохранен!');
        }
    } catch (err) {
        alert('Ошибка сохранения профиля');
    }
});

// Открытие ЧУЖОГО профиля (ТОЛЬКО для лички)
async function openProfileById(userId) {
    if (!userId) return;
    if (userId == currentUser.id) return myProfileTrigger.click();

    try {
        const res = await fetch(`/api/user/${userId}`);
        const data = await res.json();
        if (!res.ok) return alert('Не удалось загрузить профиль');

        const user = data.user;
        modalNickname.textContent = user.nickname;
        modalBio.textContent = user.bio || 'Пользователь пока ничего не написал о себе.';
        modalDate.textContent = `Зарегистрирован: ${new Date(user.created_at).toLocaleDateString()}`;

        if (user.avatar_url) {
            modalAvatar.style.backgroundImage = `url(${user.avatar_url})`;
            modalAvatar.textContent = '';
        } else {
            modalAvatar.style.backgroundImage = '';
            modalAvatar.textContent = user.nickname.charAt(0).toUpperCase();
        }

        // Отключаем поля редактирования, показываем ТОЛЬКО кнопку лички
        editProfileBlock.classList.add('hidden');
        actionProfileBlock.classList.remove('hidden');

        startPrivateBtn.onclick = () => {
            profileModal.classList.add('hidden');
            ensureDirectChatCard(user.id, user.nickname, 'Начать диалог', null);
            switchChatToPrivate(user);
        };

        profileModal.classList.remove('hidden');
    } catch (err) {
        console.error(err);
    }
}

activeChatInfo.addEventListener('click', () => {
    if (activeChat.type === 'private') {
        openProfileById(activeChat.id);
    }
});

closeModalBtn.addEventListener('click', () => profileModal.classList.add('hidden'));

function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}
