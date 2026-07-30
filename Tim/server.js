require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path'); // Подключаем встроенный модуль path
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Подключение к Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());

// НАДЕЖНЫЙ ПУТЬ К ПАПКЕ PUBLIC ДЛЯ LINUX (Используем path.join)
app.use(express.static(path.join(__dirname, 'public')));

// ====================================================
// REST API: РЕГИСТРАЦИЯ И ВХОД
// ====================================================

app.post('/api/register', async (req, res) => {
    const { email, nickname, password } = req.body;

    if (!email || !nickname || !password) {
        return res.status(400).json({ error: 'Заполните все поля!' });
    }

    try {
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким Email уже существует' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

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

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Введите email и пароль' });
    }

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(400).json({ error: 'Неверный Email или пароль' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Неверный Email или пароль' });
        }

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

    socket.on('get-history', async () => {
        try {
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

    socket.on('send-message', async (data) => {
        const { userId, nickname, text } = data;

        if (!text || !nickname) return;

        try {
            const { data: newMessage, error } = await supabase
                .from('messages')
                .insert([{ user_id: userId, nickname, text }])
                .select()
                .single();

            if (error) throw error;

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
