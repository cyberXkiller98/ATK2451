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
let attachedCompressedImageBase64 = null;

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// DOM Элементы
const landingScreen = document.getElementById('landing-screen');
const authModal = document.getElementById('auth-modal');
const appScreen = document.getElementById('app-screen');

const openAppBtn = document.getElementById('open-app-btn');
const landingLoginBtn = document.getElementById('landing-login-btn');
const closeAuthModal = document.getElementById('close-auth-modal');

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
const myIdBadge = document.getElementById('my-id-badge');
const myProfileTrigger = document.getElementById('my-profile-trigger');
const logoutBtn = document.getElementById('logout-btn');

const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

const globalChatCard = document.getElementById('global-chat-card');
const directChatsList = document.getElementById('direct-chats-list');

const backToSidebarBtn = document.getElementById('back-to-sidebar-btn');
const headerAvatar = document.getElementById('header-avatar');
const headerTitle = document.getElementById('header-title');
const headerUidBadge = document.getElementById('header-uid-badge');
const headerSubtitle = document.getElementById('header-subtitle');
const activeChatInfo = document.getElementById('active-chat-info');

const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const imageInput = document.getElementById('image-input');
const imagePreviewBar = document.getElementById('image-preview-bar');
const removeImageBtn = document.getElementById('remove-image-btn');
const voiceRecBtn = document.getElementById('voice-rec-btn');
const typingIndicator = document.getElementById('typing-indicator');

const profileModal = document.getElementById('profile-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalAvatar = document.getElementById('modal-avatar');
const modalNickname = document.getElementById('modal-nickname');
const modalUidBadge = document.getElementById('modal-uid-badge');
const modalBio = document.getElementById('modal-bio');
const modalDate = document.getElementById('modal-date');
const editProfileBlock = document.getElementById('edit-profile-block');
const actionProfileBlock = document.getElementById('action-profile-block');
const editAvatarUrl = document.getElementById('edit-avatar-url');
const editBio = document.getElementById('edit-bio');
const saveProfileBtn = document.getElementById('save-profile-btn');
const startPrivateBtn = document.getElementById('start-private-btn');

// ====================================================
// 3. ПЕРЕХОД К АВТОРИЗАЦИИ
// ====================================================
openAppBtn.addEventListener('click', () => authModal.classList.remove('hidden'));
landingLoginBtn.addEventListener('click', () => authModal.classList.remove('hidden'));
closeAuthModal.addEventListener('click', () => authModal.classList.add('hidden'));

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
        authTitle.textContent = 'Вход в систему';
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
            alert('Регистрация успешна! Войдите.');
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
    authModal.classList.add('hidden');
    landingScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');

    updateMyProfileHeader();

    socket.emit('join-user-room', currentUser.id);
    switchChatToGlobal();
}

function updateMyProfileHeader() {
    myNickname.textContent = currentUser.nickname;
    myIdBadge.textContent = `#${currentUser.id}`;

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
