import { useState, useRef, useEffect } from 'react'
import { supabase } from './lib/supabase'

interface Profile {
  id: string
  display_name: string
  username: string
  avatar: string
}

interface Message {
  id: number
  sender_id: string
  receiver_id: string
  text: string
  created_at: string
}

const s = {
  bg: '#0C0D16',
  surface: '#111220',
  surfaceHover: '#161728',
  card: '#1E2035',
  border: 'rgba(255,255,255,0.06)',
  accent: '#A855F7',
  accentDim: 'rgba(168,85,247,0.15)',
  text: '#E8E9F3',
  textMuted: '#6B7280',
  bubbleMine: 'linear-gradient(135deg,#7C3AED,#A855F7)',
  bubbleTheirs: '#1E2035',
  green: '#34D399',
}

const EMOJIS = ['😊', '😂', '❤️', '👍', '🔥', '🎉', '😅', '🤔', '👋', '✨']

export default function App() {
  const [myProfile, setMyProfile] = useState<Profile | null>(() => {
    const saved = localStorage.getItem('aura_user')
    return saved ? JSON.parse(saved) : null
  })

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 700)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 700)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [isAuthModal, setIsAuthModal] = useState(!myProfile)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register')
  
  // Форма регистрации
  const [displayName, setDisplayName] = useState('')
  const [tag, setTag] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [copied, setCopied] = useState(false)

  const [users, setUsers] = useState<Profile[]>([])
  const [activeUser, setActiveUser] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchUsers = async () => {
    if (!myProfile) return
    const { data } = await supabase.from('profiles').select('*').neq('id', myProfile.id)
    if (data) setUsers(data)
  }

  useEffect(() => {
    fetchUsers()
  }, [myProfile])

  useEffect(() => {
    if (!myProfile || !activeUser) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${myProfile.id},receiver_id.eq.${activeUser.id}),and(sender_id.eq.${activeUser.id},receiver_id.eq.${myProfile.id})`)
        .order('created_at', { ascending: true })

      if (data) setMessages(data)
    }

    fetchMessages()

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as Message
        if (
          (newMsg.sender_id === myProfile.id && newMsg.receiver_id === activeUser.id) ||
          (newMsg.sender_id === activeUser.id && newMsg.receiver_id === myProfile.id)
        ) {
          setMessages(prev => [...prev, newMsg])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeUser, myProfile])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    const cleanTag = tag.trim().toLowerCase().replace('@', '')

    if (authMode === 'register') {
      if (!displayName.trim() || !cleanTag || !password) {
        setAuthError('Заполните все поля')
        return
      }

      // Проверка на занятость @тега
      const { data: existing } = await supabase.from('profiles').select('id').eq('username', cleanTag).single()
      if (existing) {
        setAuthError('Этот @тег уже занят другом! Придумайте другой.')
        return
      }

      const avatarLetter = displayName.trim().slice(0, 2).toUpperCase()
      const { data, error } = await supabase
        .from('profiles')
        .insert([{ display_name: displayName.trim(), username: cleanTag, password, avatar: avatarLetter }])
        .select()
        .single()

      if (error) {
        setAuthError(error.message || 'Ошибка создания аккаунта')
        return
      }

      setMyProfile(data)
      localStorage.setItem('aura_user', JSON.stringify(data))
      setIsAuthModal(false)
    } else {
      // Вход по тегу и паролю
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', cleanTag)
        .eq('password', password)
        .single()

      if (error || !data) {
        setAuthError('Неверный @тег или пароль')
        return
      }

      setMyProfile(data)
      localStorage.setItem('aura_user', JSON.stringify(data))
      setIsAuthModal(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('aura_user')
    setMyProfile(null)
    setActiveUser(null)
    setIsAuthModal(true)
  }

  const copyMyTag = () => {
    if (!myProfile) return
    navigator.clipboard.writeText(`@${myProfile.username}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeUser || !myProfile) return
    const textToSend = input.trim()
    setInput('')
    setShowEmoji(false)

    await supabase.from('messages').insert([
      {
        sender_id: myProfile.id,
        receiver_id: activeUser.id,
        text: textToSend
      }
    ])
  }

  // Фильтр поиска по Имени или по @Тегу
  const filteredUsers = users.filter(u => 
    u.display_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase().replace('@', ''))
  )

  const showSidebar = !isMobile || activeUser === null
  const showChat = !isMobile || activeUser !== null

  return (
    <div style={{ display: 'flex', height: '100dvh', background: s.bg, overflow: 'hidden', color: s.text }}>
      
      {/* СИДЕБАР */}
      {showSidebar && (
        <aside style={{ width: isMobile ? '100%' : 320, flexShrink: 0, display: 'flex', flexDirection: 'column', background: s.surface, borderRight: `1px solid ${s.border}` }}>
          
          {/* Шапка профиля */}
          <div style={{ padding: 16, borderBottom: `1px solid ${s.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.bubbleMine, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {myProfile?.avatar || '👤'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{myProfile?.display_name || 'Аура'}</div>
                  <div 
                    onClick={copyMyTag}
                    style={{ fontSize: 12, color: s.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    title="Нажмите, чтобы скопировать ваш тег"
                  >
                    @{myProfile?.username || 'гость'} {copied ? '✓ Скопировано' : '📋'}
                  </div>
                </div>
              </div>
              {myProfile ? (
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: s.textMuted, cursor: 'pointer', fontSize: 13 }}>Выйти</button>
              ) : (
                <button onClick={() => setIsAuthModal(true)} style={{ background: s.accent, border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Войти</button>
              )}
            </div>
          </div>

          {/* Поиск собеседника */}
          <div style={{ padding: 12 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Поиск по имени или @тегу..."
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: s.card, border: `1px solid ${s.border}`, color: s.text, outline: 'none', fontSize: 13 }}
            />
          </div>

          {/* Список пользователей */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredUsers.map(u => (
              <div
                key={u.id}
                onClick={() => setActiveUser(u)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer',
                  background: activeUser?.id === u.id ? s.accentDim : 'transparent',
                  borderLeft: `3px solid ${activeUser?.id === u.id ? s.accent : 'transparent'}`
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.card, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                  {u.avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.display_name}</div>
                  <div style={{ fontSize: 12, color: s.accent }}>@{u.username}</div>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: s.textMuted, fontSize: 13 }}>
                {myProfile ? 'Собеседник не найден. Спросите его @тег!' : 'Авторизуйтесь для общения'}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Окно ЧАТА */}
      {showChat && (
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: s.bg }}>
          {activeUser ? (
            <>
              <div style={{ padding: '12px 20px', borderBottom: `1px solid ${s.border}`, background: s.surface, display: 'flex', alignItems: 'center', gap: 12 }}>
                {isMobile && (
                  <button onClick={() => setActiveUser(null)} style={{ background: 'none', border: 'none', color: s.text, fontSize: 18, cursor: 'pointer', paddingRight: 8 }}>
                    ←
                  </button>
                )}
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.card, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                  {activeUser.avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{activeUser.display_name}</div>
                  <div style={{ fontSize: 11, color: s.accent }}>@{activeUser.username}</div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map(m => {
                  const isMine = m.sender_id === myProfile?.id
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '75%', padding: '10px 14px', borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        background: isMine ? s.bubbleMine : s.bubbleTheirs, color: '#fff', fontSize: 14
                      }}>
                        <div>{m.text}</div>
                        <div style={{ fontSize: 10, opacity: 0.6, textAlign: 'right', marginTop: 4 }}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ padding: 16, background: s.surface, borderTop: `1px solid ${s.border}`, display: 'flex', gap: 10, position: 'relative' }}>
                {showEmoji && (
                  <div style={{ position: 'absolute', bottom: 70, left: 16, background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: 8, display: 'flex', gap: 6, zIndex: 10 }}>
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => { setInput(i => i + e); setShowEmoji(false) }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>{e}</button>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowEmoji(v => !v)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>😊</button>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Напишите сообщение..."
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: s.card, border: `1px solid ${s.border}`, color: s.text, outline: 'none' }}
                />
                <button onClick={sendMessage} style={{ padding: '0 20px', borderRadius: 10, background: s.accent, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                  Отправить
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: s.textMuted }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
              <div>Выберите пользователя слева, чтобы начать переписку</div>
            </div>
          )}
        </main>
      )}

      {/* Окно Регистрации / Входа */}
      {isAuthModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: s.surface, padding: 24, borderRadius: 16, width: 340, border: `1px solid ${s.border}` }}>
            <h3 style={{ marginBottom: 16, textAlign: 'center' }}>{authMode === 'register' ? 'Создание аккаунта' : 'Вход в Аура'}</h3>
            {authError && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10, textAlign: 'center' }}>{authError}</div>}
            
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {authMode === 'register' && (
                <input
                  required
                  placeholder="Ваше имя (например: Тимур)"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  style={{ padding: 10, borderRadius: 8, background: s.card, border: `1px solid ${s.border}`, color: s.text, outline: 'none' }}
                />
              )}
              <input
                required
                placeholder="Уникальный @тег (например: timur09)"
                value={tag}
                onChange={e => setTag(e.target.value)}
                style={{ padding: 10, borderRadius: 8, background: s.card, border: `1px solid ${s.border}`, color: s.text, outline: 'none' }}
              />
              <input
                required
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ padding: 10, borderRadius: 8, background: s.card, border: `1px solid ${s.border}`, color: s.text, outline: 'none' }}
              />
              <button type="submit" style={{ padding: 10, borderRadius: 8, background: s.accent, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
                {authMode === 'register' ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </form>

            <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12, color: s.textMuted, cursor: 'pointer' }} onClick={() => setAuthMode(m => m === 'register' ? 'login' : 'register')}>
              {authMode === 'register' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}