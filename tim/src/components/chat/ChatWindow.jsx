import React, { useState, useEffect, useRef } from 'react';
import { getChatMessages, sendMessage } from '../../services/chatService';
import { supabase } from '../../services/supabaseClient';

export default function ChatWindow({ activeChat, currentUser, onBack }) {

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);



  // Загрузка сообщений + Realtime
  useEffect(() => {

    if (!activeChat?.id || !currentUser?.id) {
      return;
    }


    loadMessages(activeChat.id);



    const channel = supabase
      .channel(`chat-${activeChat.id}`)

      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${activeChat.id}`,
        },

        (payload) => {

          const newMessage = payload.new;


          setMessages((prev) => {

            // защита от дублей
            if (
              prev.some(
                msg => msg.id === newMessage.id
              )
            ) {
              return prev;
            }


            return [
              ...prev,
              newMessage
            ];

          });

        }

      )

      .subscribe();



    return () => {

      supabase.removeChannel(channel);

    };


  }, [
    activeChat?.id,
    currentUser?.id
  ]);





  // Автоскролл вниз
  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior:'smooth'
    });

  }, [messages]);







  const loadMessages = async (chatId) => {

    try {

      setLoading(true);

      const data = await getChatMessages(chatId);

      setMessages(data || []);


    } catch(err) {

      console.error(
        'Ошибка загрузки сообщений:',
        err
      );


    } finally {

      setLoading(false);

    }

  };








  const handleSend = async (e) => {

    e.preventDefault();


    const text =
      messageText.trim();



    if (
      !text ||
      !activeChat?.id ||
      !currentUser?.id
    ) {
      return;
    }



    setMessageText('');



    try {


      const newMessage =
        await sendMessage(
          activeChat.id,
          currentUser.id,
          text
        );



      // добавляем своё сообщение сразу
      setMessages((prev)=>{


        if(
          prev.some(
            msg=>msg.id === newMessage.id
          )
        ){
          return prev;
        }



        return [
          ...prev,
          newMessage
        ];

      });



    } catch(err) {


      console.error(
        'Ошибка отправки:',
        err
      );


      setMessageText(text);

      alert(
        'Не удалось отправить сообщение'
      );

    }

  };







  if (!activeChat) {

    return (

      <div className="flex-1 bg-[#080711] flex flex-col items-center justify-center text-center p-6 h-full">

        <div className="w-20 h-20 rounded-3xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-3xl mb-4 text-purple-400">

          💬

        </div>


        <h3 className="text-lg font-bold text-white">

          Выберите чат для начала общения

        </h3>


        <p className="text-xs text-slate-400 mt-2">

          Выберите диалог слева или найдите пользователя

        </p>


      </div>

    );

  }







  return (

    <div className="flex-1 bg-[#080711] flex flex-col h-full w-full">



      {/* Шапка */}

      <div className="p-3 md:p-4 bg-[#0f0d22] border-b border-[#242048] flex items-center justify-between">


        <div className="flex items-center gap-3">


          <button

            onClick={onBack}

            className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl"

          >

            ←

          </button>




          <div className="w-10 h-10 rounded-2xl bg-[#14122b] border border-[#242048] flex items-center justify-center text-lg overflow-hidden">


            {activeChat.avatar?.startsWith('http') ? (

              <img

                src={activeChat.avatar}

                alt=""

                className="w-full h-full object-cover rounded-2xl"

              />

            ) : (

              activeChat.avatar || '💬'

            )}


          </div>




          <div>


            <h3 className="text-xs font-bold text-white">

              {activeChat.name || 'Чат'}

            </h3>


            <span className="text-[10px] text-emerald-400">

              {activeChat.online
                ? 'в сети'
                : 'был(а) недавно'}

            </span>


          </div>


        </div>



        <button className="text-slate-400 p-2">

          ⋮

        </button>


      </div>








      {/* Сообщения */}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">


        {loading && (

          <p className="text-center text-xs text-slate-500">

            Загрузка сообщений...

          </p>

        )}






        {!loading &&
        messages.length === 0 && (

          <div className="text-center py-12 text-slate-500 text-xs">

            Здесь пока нет сообщений 👋

          </div>

        )}







        {!loading &&
        messages.map((msg)=>{


          const isMe =
            msg.sender_id === currentUser?.id;



          const time =
            new Date(
              msg.created_at
            )
            .toLocaleTimeString([],{

              hour:'2-digit',
              minute:'2-digit'

            });




          return (

            <div

              key={msg.id}

              className={`flex flex-col ${
                isMe
                ? 'items-end'
                : 'items-start'
              }`}

            >



              <div

                className={`max-w-[85%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs ${
                  isMe
                  ?
                  'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none'
                  :
                  'bg-[#14122b] border border-[#242048] text-slate-200 rounded-tl-none'
                }`}

              >

                {msg.content}

              </div>



              <span className="text-[9px] text-slate-500 mt-1">

                {time}

              </span>



            </div>

          );


        })}



        <div ref={messagesEndRef}/>


      </div>








      {/* Ввод */}

      <form

        onSubmit={handleSend}

        className="p-3 bg-[#0f0d22] border-t border-[#242048] flex gap-2"

      >


        <input

          type="text"

          value={messageText}

          onChange={(e)=>setMessageText(e.target.value)}

          placeholder="Напишите сообщение..."

          className="flex-1 bg-[#14122b] border border-[#242048] rounded-xl px-4 py-2.5 text-xs text-white"

        />



        <button

          type="submit"

          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 rounded-xl text-xs"

        >

          Отправить

        </button>


      </form>



    </div>

  );

}