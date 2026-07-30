require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Подключение к Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Настройка приема больших данных (для передача фотографий в Base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Настройка статических файлов из папки public
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------
// АНТИСПАМ: Карта хранения времени последнего сообщения
// ----------------------------------------------------
const lastMessageTimes = new Map();

function isSpamming(userId) {
    const now = Date.now();
    const lastTime = lastMessageTimes.get(userId) || 0;
    if (now - lastTime < 1500) {
        return true;
    }
    lastMessageTimes.set(userId, now);
    return false;
}

// ====================================================
// REST API: АВТОРИЗАЦИЯ И ПРОФИЛИ
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
            .maybeSingle();

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
            .select('id, email, nickname, password_hash, created_at, avatar_url, bio')
            .eq('email', email)
            .maybeSingle();

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
                nickname: user.nickname,
                created_at: user.created_at,
                avatar_url: user.avatar_url || '',
                bio: user.bio || ''
            }
        });

    } catch (err) {
        console.error('Ошибка входа:', err);
        return res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
});

app.get('/api/user/:id', async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, nickname, avatar_url, bio, created_at')
            .eq('id', req.params.id)
            .maybeSingle();

        if (error || !user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        return res.json({ user });
    } catch (err) {
        return res.status(500).json({ error: 'Ошибка получения профиля' });
    }
});

app.post('/api/user/update-profile', async (req, res) => {
    const { userId, avatarUrl, bio } = req.body;

    if (!userId) return res.status(400).json({ error: 'Не указан ID пользователя' });

    try {
        const { error } = await supabase
            .from('users')
            .update({ avatar_url: avatarUrl, bio: bio })
            .eq('id', userId);

        if (error) throw error;

        return res.json({ success: true, message: 'Профиль обновлен!' });
    } catch (err) {
        console.error('Ошибка обновления профиля:', err);
        return res.status(500).json({ error: 'Не удалось обновить профиль' });
    }
});

// ====================================================
// SOCKET.IO: ОБЩИЙ ЧАТ И ЛИЧНЫЕ СООБЩЕНИЯ (1-на-1)
// ====================================================

io.on('connection', (socket) => {
    console.log(`[Socket] Пользователь подключен: ${socket.id}`);

    socket.on('join-user-room', (userId) => {
        if (!userId) return;
        const roomName = `user_${userId}`;
        socket.join(roomName);
        console.log(`[Socket] Пользователь ${userId} вошел в комнату ${roomName}`);
    });

    socket.on('get-history', async (data) => {
        const userCreatedAt = data?.userCreatedAt;

        try {
            let query = supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(50);

            if (userCreatedAt) {
                query = query.gte('created_at', userCreatedAt);
            }

            const { data: messages, error } = await query;

            if (!error && messages) {
                socket.emit('history-loaded', messages);
            }
        } catch (err) {
            console.error('Ошибка загрузки истории общего чата:', err);
        }
    });

    socket.on('send-message', async (data) => {
        const { userId, nickname, text, imageUrl } = data;

        if (!userId || (!text && !imageUrl)) return;

        if (isSpamming(userId)) {
            return socket.emit('spam-warning', 'Слишком часто! Подождите 1.5 секунды.');
        }

        try {
            const { data: newMessage, error } = await supabase
                .from('messages')
                .insert([{ 
                    user_id: userId, 
                    nickname: nickname, 
                    text: text || '', 
                    image_url: imageUrl || '' 
                }])
                .select()
                .single();

            if (error) throw error;

            io.emit('new-message', newMessage);

        } catch (err) {
            console.error('Ошибка отправки сообщения в общий чат:', err);
        }
    });

    socket.on('get-private-history', async (data) => {
        const { myId, otherId } = data;
        if (!myId || !otherId) return;

        try {
            const { data: messages, error } = await supabase
                .from('private_messages')
                .select('*')
                .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
                .order('created_at', { ascending: true })
                .limit(100);

            if (!error && messages) {
                socket.emit('private-history-loaded', { otherId, messages });
            }
        } catch (err) {
            console.error('Ошибка загрузки личных сообщений:', err);
        }
    });

    socket.on('send-private-message', async (data) => {
        const { senderId, receiverId, senderNickname, text, imageUrl } = data;

        if (!senderId || !receiverId || (!text && !imageUrl)) return;

        if (isSpamming(senderId)) {
            return socket.emit('spam-warning', 'Слишком часто! Подождите 1.5 секунды.');
        }

        try {
            const { data: newPrivateMsg, error } = await supabase
                .from('private_messages')
                .insert([{
                    sender_id: senderId,
                    receiver_id: receiverId,
                    sender_nickname: senderNickname,
                    text: text || '',
                    image_url: imageUrl || ''
                }])
                .select()
                .single();

            if (error) throw error;

            io.to(`user_${senderId}`).emit('new-private-message', newPrivateMsg);
            io.to(`user_${receiverId}`).emit('new-private-message', newPrivateMsg);

        } catch (err) {
            console.error('Ошибка отправки личного сообщения:', err);
        }
    });

    socket.on('typing-private', (data) => {
        const { senderNickname, receiverId } = data;
        if (receiverId) {
            io.to(`user_${receiverId}`).emit('user-typing', { senderNickname });
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
