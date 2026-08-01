import React, { useState, useEffect } from 'react';
import UserSearchModal from './UserSearchModal';
import CreateGroupModal from './CreateGroupModal';
import { getOrCreateDirectChat, getUserChats } from '../../services/chatService';


export default function Sidebar({
  currentUser,
  profile,
  activeChat,
  onSelectChat,
  onOpenSettings
}) {

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {

    if (currentUser?.id) {
      loadChats();
    }

  }, [currentUser?.id]);




  const loadChats = async () => {

    try {

      setLoading(true);

      const data = await getUserChats(currentUser.id);

      setChats(data);


    } catch(err){

      console.error(
        "Ошибка загрузки чатов:",
        err
      );


    } finally {

      setLoading(false);

    }

  };






  const handleSelectUserFromSearch = async (targetUser)=>{

    try {

      const chatId = await getOrCreateDirectChat(
        currentUser.id,
        targetUser.id
      );


      const chat = {

        id: chatId,

        name:
          targetUser.full_name ||
          targetUser.username ||
          "Пользователь",

        avatar:
          targetUser.avatar_url ||
          "💬",

        online:
          targetUser.is_online || false,

        isGroup:false,

        targetUserId:
          targetUser.id,

        lastMessage:
          "Нет сообщений",

        time:""

      };


      onSelectChat(chat);

      setIsSearchModalOpen(false);


      await loadChats();



    } catch(err){

      console.error(err);

      alert(
        "Не удалось открыть чат"
      );

    }

  };






  const filteredChats = chats.filter(chat =>

    chat.name
      ?.toLowerCase()
      .includes(
        searchQuery.toLowerCase()
      )

  );






  const userName =
    profile?.full_name ||
    profile?.username ||
    currentUser?.email ||
    "Пользователь";





  return (

<div className="
w-full h-full
bg-[#0f0d22]
border-r border-[#242048]
flex flex-col
">





{/* HEADER */}

<div className="
p-4
border-b border-[#242048]
flex
items-center
justify-between
">


<div className="flex items-center gap-3">


<div className="
w-10 h-10
rounded-full
bg-gradient-to-tr
from-violet-600
to-indigo-500
flex items-center
justify-center
overflow-hidden
">

{
profile?.avatar_url ?

<img
src={profile.avatar_url}
className="
w-full h-full
object-cover
"
/>

:

<span>
{
userName
.substring(0,2)
.toUpperCase()
}
</span>

}

</div>




<div className="overflow-hidden">

<h3 className="
text-xs
font-bold
text-white
truncate
">

{userName}

</h3>


<span className="
text-[10px]
text-emerald-400
">

● В сети

</span>


</div>


</div>





<div className="flex gap-1">


<button
onClick={()=>setIsGroupModalOpen(true)}
className="
p-2
text-slate-400
hover:text-white
"
>
👥
</button>



<button
onClick={()=>setIsSearchModalOpen(true)}
className="
p-2
text-slate-400
hover:text-white
"
>
🔍
</button>




<button
onClick={onOpenSettings}
className="
p-2
text-slate-400
hover:text-white
"
>
⚙️
</button>


</div>


</div>






{/* SEARCH */}

<div className="p-3">

<input

value={searchQuery}

onChange={(e)=>
setSearchQuery(e.target.value)
}

placeholder="Поиск чатов..."

className="
w-full
bg-[#14122b]
border border-[#242048]
rounded-xl
px-4
py-2
text-xs
text-white
"
/>


</div>






{/* CHATS */}

<div className="
flex-1
overflow-y-auto
p-2
space-y-1
">


{loading && (

<p className="
text-center
text-xs
text-slate-500
">

Загрузка...

</p>

)}





{!loading &&
filteredChats.map(chat=>(


<div

key={chat.id}

onClick={()=>
onSelectChat(chat)
}

className={`
p-3
rounded-2xl
flex
gap-3
cursor-pointer

${
activeChat?.id===chat.id

?

"bg-purple-600/20 border border-purple-500/30"

:

"hover:bg-white/5"
}

`}

>



<div className="
w-11 h-11
rounded-2xl
bg-[#14122b]
flex
items-center
justify-center
overflow-hidden
">

{
chat.avatar?.startsWith("http")

?

<img
src={chat.avatar}
className="
w-full h-full
object-cover
"
/>

:

chat.avatar

}


</div>






<div className="
flex-1
min-w-0
">


<div className="
flex justify-between
">

<h4 className="
text-xs
text-white
truncate
">

{chat.name}

</h4>


<span className="
text-[10px]
text-slate-500
">

{chat.time}

</span>


</div>





<p className="
text-[11px]
text-slate-400
truncate
">

{chat.isGroup &&
`(${chat.membersCount} уч.) `
}

{chat.lastMessage}


</p>


</div>



</div>


))}



</div>







{isSearchModalOpen && (

<UserSearchModal

currentUser={currentUser}

onClose={()=>
setIsSearchModalOpen(false)
}

onSelectUser={handleSelectUserFromSearch}

/>

)}




{isGroupModalOpen && (

<CreateGroupModal

currentUser={currentUser}

onClose={()=>
setIsGroupModalOpen(false)
}

onGroupCreated={()=>{
loadChats();
setIsGroupModalOpen(false);
}}

/>

)}



</div>

  );

}