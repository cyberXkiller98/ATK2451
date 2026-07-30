require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Подключение к Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.static('public'));

// ====================================================
// REST API: РЕГИСТРАЦИЯ И ВХОД
// ====================================================

// 1. Регистрация пользователя
app.post('/api/register', async (req, res) => {
    const { email, nickname, password } = req.body;

    if (!email || !nickname || !password) {
        return res.status(400).json({ error: 'Заполните все поля!' });
    }

    try {
        // Проверяем, существует ли уже такой email
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким Email уже существует' });
        }

        // Хешируем пароль для безопасности (10 солевых раундов)
        const passwordHash = await bcrypt.hash(password, 10);

        // Сохраняем пользователя в Supabase
        const { error } = await supabase
            .from('users')
            .insert([{ email, nickname, password_hash: passwordHash }]);

        if (error) throw error;

        return res.json({ success: true, message: 'Регистрация прошла успешно!' });

    } catch (err) {
        console.error('Ошибка регистрации:', err);
        return res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
});

// 2. Вход пользователя
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Введите email и пароль' });
    }

    try {
        // Ищем пользователя по email
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(400).json({ error: 'Неверный Email или пароль' });
        }

        // Сравниваем введенный пароль с захешированным в базе
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Неверный Email или пароль' });
        }

        // Отправляем успешный ответ (БЕЗ пароля)
        return res.json({
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname
            }
        });

    } catch (err) {
        console.error('Ошибка входа:', err);
        return res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
});

// ====================================================
// SOCKET.IO: ЧАТ В РЕАЛЬНОМ ВРЕМЕНИ
// ====================================================

io.on('connection', (socket) => {
    console.log(`[Socket] Пользователь подключен: ${socket.id}`);

    // Отправка истории сообщений при запросе
    socket.on('get-history', async () => {
        try {
            // Получаем последние 50 сообщений из Supabase
            const { data: messages, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(50);

            if (!error && messages) {
                socket.emit('history-loaded', messages);
            }
        } catch (err) {
            console.error('Ошибка загрузки истории:', err);
        }
    });

    // Обработка нового сообщения от пользователя
    socket.on('send-message', async (data) => {
        const { userId, nickname, text } = data;

        if (!text || !nickname) return;

        try {
            // 1. Сохраняем сообщение в базу данных Supabase
            const { data: newMessage, error } = await supabase
                .from('messages')
                .insert([{ user_id: userId, nickname, text }])
                .select()
                .single();

            if (error) throw error;

            // 2. Рассылаем новое сообщение ВСЕМ подключенным клиентам
            io.emit('new-message', newMessage);

        } catch (err) {
            console.error('Ошибка сохранения сообщения:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Пользователь отключился: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});