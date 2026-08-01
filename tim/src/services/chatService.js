import { supabase } from './supabaseClient';


// 1. Найти или создать личный чат
export const getOrCreateDirectChat = async (
  currentUserId,
  targetUserId
) => {

  try {


    const { data: myChats, error: myChatsError } =
      await supabase
        .from('chat_members')
        .select(`
          chat_id,
          chats!inner(is_group)
        `)
        .eq('user_id', currentUserId)
        .eq('chats.is_group', false);



    if (myChatsError)
      throw myChatsError;



    const myChatIds =
      myChats?.map(
        item => item.chat_id
      ) || [];



    if(myChatIds.length > 0){

      const { data: sharedChat, error: sharedError } =
        await supabase
          .from('chat_members')
          .select('chat_id')
          .in('chat_id', myChatIds)
          .eq('user_id', targetUserId)
          .maybeSingle();



      if(sharedError)
        throw sharedError;



      if(sharedChat)
        return sharedChat.chat_id;

    }






    const { data:newChat, error:createError } =
      await supabase
        .from('chats')
        .insert({
          is_group:false
        })
        .select()
        .single();



    if(createError)
      throw createError;



    const { error:membersError } =
      await supabase
        .from('chat_members')
        .insert([

          {
            chat_id:newChat.id,
            user_id:currentUserId,
            role:'member'
          },

          {
            chat_id:newChat.id,
            user_id:targetUserId,
            role:'member'
          }

        ]);



    if(membersError)
      throw membersError;



    return newChat.id;



  } catch(err){

    console.error(
      'Ошибка создания личного чата:',
      err
    );

    throw err;

  }

};






// 2. Создать групповой чат

export const createGroupChat = async (
  ownerId,
  groupName,
  memberIds = []
)=>{


  try{


    const { data:newChat, error:chatError } =
      await supabase
        .from('chats')
        .insert({

          is_group:true,

          name:groupName,

          owner_id:ownerId

        })
        .select()
        .single();



    if(chatError)
      throw chatError;





    const allMembers =
      Array.from(
        new Set([
          ownerId,
          ...memberIds
        ])
      );




    const members =
      allMembers.map(userId=>({

        chat_id:newChat.id,

        user_id:userId,

        role:
          userId === ownerId
          ? 'owner'
          : 'member'

      }));




    const {error:membersError} =
      await supabase
        .from('chat_members')
        .insert(members);



    if(membersError)
      throw membersError;



    return newChat.id;



  }catch(err){

    console.error(
      'Ошибка создания группы:',
      err
    );

    throw err;

  }

};







// 3. Получить список чатов пользователя

export const getUserChats = async(userId)=>{


  try{


    const {data:memberships,error:memberError}=

      await supabase

        .from('chat_members')

        .select('chat_id')

        .eq(
          'user_id',
          userId
        );



    if(memberError)
      throw memberError;



    if(!memberships?.length)
      return [];



    const chatIds =
      memberships.map(
        item=>item.chat_id
      );





    const {data:chats,error:chatError}=

      await supabase

        .from('chats')

        .select(`

          *,

          chat_members(

            user_id,

            profiles(
              username,
              full_name,
              avatar_url,
              is_online
            )

          ),

          messages(

            id,

            content,

            created_at,

            sender_id

          )

        `)

        .in(
          'id',
          chatIds
        )

        .order(
          'updated_at',
          {
            ascending:false
          }
        );



    if(chatError)
      throw chatError;







    return chats.map(chat=>{


      const messages =
        chat.messages || [];



      const lastMessage =
        messages.sort(
          (a,b)=>
          new Date(b.created_at)
          -
          new Date(a.created_at)
        )[0];



      const lastText =
        lastMessage?.content ||
        'Нет сообщений';



      const time =
        lastMessage
        ?
        new Date(
          lastMessage.created_at
        )
        .toLocaleTimeString(
          [],
          {
            hour:'2-digit',
            minute:'2-digit'
          }
        )
        :
        '';





      if(!chat.is_group){


        const other =
          chat.chat_members?.find(
            m =>
            m.user_id !== userId
          );



        const profile =
          other?.profiles;



        return {

          id:chat.id,

          name:
            profile?.full_name ||
            profile?.username ||
            'Собеседник',

          avatar:
            profile?.avatar_url ||
            '💬',

          online:
            profile?.is_online ||
            false,

          isGroup:false,

          targetUserId:
            other?.user_id,


          lastMessage:lastText,

          time,

          updated_at:
            chat.updated_at

        };


      }





      return {


        id:chat.id,

        name:
          chat.name ||
          'Группа',


        avatar:
          chat.avatar_url ||
          '👥',


        online:false,


        isGroup:true,


        membersCount:
          chat.chat_members?.length || 0,


        lastMessage:lastText,


        time,


        updated_at:
          chat.updated_at


      };



    });



  }catch(err){


    console.error(
      'Ошибка загрузки чатов:',
      err
    );


    throw err;

  }

};







// 4. История сообщений

export const getChatMessages = async(chatId)=>{


  try{


    const {data,error}=

      await supabase

        .from('messages')

        .select(`

          id,

          content,

          created_at,

          sender_id,

          message_type,

          profiles(
            username,
            full_name,
            avatar_url
          )

        `)

        .eq(
          'chat_id',
          chatId
        )

        .order(
          'created_at',
          {
            ascending:true
          }
        );



    if(error)
      throw error;



    return data || [];



  }catch(err){


    console.error(
      'Ошибка загрузки сообщений:',
      err
    );


    throw err;

  }

};







// 5. Отправка сообщения

export const sendMessage = async(
  chatId,
  senderId,
  content
)=>{


  try{


    if(!content.trim()){

      throw new Error(
        'Пустое сообщение'
      );

    }




    const {data,error}=

      await supabase

        .from('messages')

        .insert({

          chat_id:chatId,

          sender_id:senderId,

          content:
            content.trim(),

          message_type:'text'

        })

        .select()

        .single();




    if(error)
      throw error;



    return data;



  }catch(err){


    console.error(
      'Ошибка отправки сообщения:',
      err
    );


    throw err;

  }

};