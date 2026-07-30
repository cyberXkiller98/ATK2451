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

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Антиспам (задержка 1.5 секунды)
const lastMessageTimes = new Map();
function isSpamming(userId) {
    const now = Date.now();
    const lastTime = lastMessageTimes.get(userId) || 0;
    if (now - lastTime < 1500) return true;
    lastMessageTimes.set(userId, now);
    return false;
}

const onlineUsers = new Map();

// ====================================================
// REST API
// ====================================================

app.post('/api/register', async (req, res) => {
    const { email, nickname, password } = req.body;

    if (!email || !nickname || !password) {
        return res.status(400).json({ error: 'Заполните все обязательные поля!' });
    }

    try {
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) {
            return res.status(400).json({ error: 'Email уже зарегистрирован!' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const { error } = await supabase
            .from('users')
            .insert([{ email, nickname, password_hash: passwordHash }]);

        if (error) throw error;

        return res.json({ success: true, message: 'Регистрация успешна!' });

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
                id: user.id, // Гарантированный уникальный ID из базы
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

// Поиск по ID или Никнейму
app.get('/api/users/search', async (req, res) => {
    const query = req.query.q?.trim().toLowerCase();
    if (!query) return res.json({ users: [] });

    try {
        let queryBuilder = supabase
            .from('users')
            .select('id, nickname, avatar_url, bio');

        if (!isNaN(query)) {
            queryBuilder = queryBuilder.eq('id', Number(query));
        } else {
            queryBuilder = queryBuilder.ilike('nickname', `%${query}%`);
        }

        const { data: users } = await queryBuilder.limit(10);
        return res.json({ users: users || [] });
    } catch (err) {
        return res.status(500).json({ error: 'Ошибка поиска' });
    }
});

app.get('/api/user/:id', async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, nickname, avatar_url, bio, created_at')
            .eq('id', req.params.id)
            .maybeSingle();

        if (error || !user) return res.status(404).json({ error: 'Пользователь не найден' });
        user.is_online = onlineUsers.has(String(user.id));
        return res.json({ user });
    } catch (err) {
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/user/update-profile', async (req, res) => {
    const { userId, avatarUrl, bio } = req.body;
    if (!userId) return res.status(400).json({ error: 'Нет ID' });

    try {
        const { error } = await supabase
            .from('users')
            .update({ avatar_url: avatarUrl, bio: bio })
            .eq('id', userId);

        if (error) throw error;
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Не удалось обновить профиль' });
    }
});

// ====================================================
// SOCKET.IO REALTIME
// ====================================================

io.on('connection', (socket) => {
    let currentUserId = null;

    socket.on('join-user-room', (userId) => {
        if (!userId) return;
        currentUserId = String(userId);
        socket.join(`user_${userId}`);
        onlineUsers.set(currentUserId, socket.id);
        io.emit('user-status-changed', { userId: currentUserId, isOnline: true });
    });

    socket.on('get-history', async (data) => {
        try {
            let query = supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(50);

            if (data?.userCreatedAt) {
                query = query.gte('created_at', data.userCreatedAt);
            }

            const { data: messages } = await query;
            if (messages) socket.emit('history-loaded', messages);
        } catch (err) {
            console.error('Ошибка истории:', err);
        }
    });

    socket.on('send-message', async (data) => {
        const { userId, nickname, text, imageUrl, voiceUrl } = data;
        if (!userId || (!text && !imageUrl && !voiceUrl)) return;

        if (isSpamming(userId)) {
            return socket.emit('spam-warning', 'Слишком часто! Подождите 1.5 сек.');
        }

        try {
            const { data: newMessage, error } = await supabase
                .from('messages')
                .insert([{
                    user_id: userId,
                    nickname: nickname,
                    text: text || '',
                    image_url: imageUrl || '',
                    voice_url: voiceUrl || ''
                }])
                .select()
                .single();

            if (error) throw error;
            io.emit('new-message', newMessage);

        } catch (err) {
            console.error('Ошибка отправки сообщения:', err);
        }
    });

    socket.on('get-private-history', async (data) => {
        const { myId, otherId } = data;
        if (!myId || !otherId) return;

        try {
            const { data: messages } = await supabase
                .from('private_messages')
                .select('*')
                .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
                .order('created_at', { ascending: true })
                .limit(100);

            if (messages) socket.emit('private-history-loaded', { otherId, messages });
        } catch (err) {
            console.error(err);
        }
    });

    socket.on('send-private-message', async (data) => {
        const { senderId, receiverId, senderNickname, text, imageUrl, voiceUrl } = data;
        if (!senderId || !receiverId || (!text && !imageUrl && !voiceUrl)) return;

        if (isSpamming(senderId)) {
            return socket.emit('spam-warning', 'Слишком часто! Подождите 1.5 сек.');
        }

        try {
            const { data: newPrivateMsg, error } = await supabase
                .from('private_messages')
                .insert([{
                    sender_id: senderId,
                    receiver_id: receiverId,
                    sender_nickname: senderNickname,
                    text: text || '',
                    image_url: imageUrl || '',
                    voice_url: voiceUrl || ''
                }])
                .select()
                .single();

            if (error) throw error;

            io.to(`user_${senderId}`).emit('new-private-message', newPrivateMsg);
            io.to(`user_${receiverId}`).emit('new-private-message', newPrivateMsg);

        } catch (err) {
            console.error(err);
        }
    });

    socket.on('typing-start', (data) => {
        if (data.receiverId) {
            io.to(`user_${data.receiverId}`).emit('user-typing', { senderId: data.senderId });
        }
    });

    socket.on('disconnect', () => {
        if (currentUserId) {
            onlineUsers.delete(currentUserId);
            io.emit('user-status-changed', { userId: currentUserId, isOnline: false });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
