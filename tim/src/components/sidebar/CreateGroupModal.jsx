import React, { useState, useEffect } from 'react';
import { searchUsersByUsername } from '../../services/userService';
import { createGroupChat } from '../../services/chatService';

export default function CreateGroupModal({ currentUser, onClose, onGroupCreated }) {

  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');


  // Автоочистка при закрытии
  useEffect(() => {
    return () => {
      setSearchResults([]);
    };
  }, []);


  // Поиск пользователей с задержкой
  useEffect(() => {

    const timer = setTimeout(async () => {

      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      try {

        setSearchLoading(true);

        const users = await searchUsersByUsername(
          searchQuery.replace('@',''),
          currentUser.id
        );


        const filtered = users.filter(user =>
          user.id !== currentUser.id &&
          !selectedMembers.some(member => member.id === user.id)
        );


        setSearchResults(filtered);


      } catch(err){

        console.error("Search error:", err);
        setError("Ошибка поиска пользователей");

      } finally {
        setSearchLoading(false);
      }


    },500);


    return () => clearTimeout(timer);


  },[searchQuery, selectedMembers, currentUser.id]);



  const handleAddMember = (user)=>{

    setSelectedMembers(prev => [
      ...prev,
      user
    ]);

    setSearchQuery('');
    setSearchResults([]);

  };



  const handleRemoveMember=(userId)=>{

    setSelectedMembers(prev =>
      prev.filter(user=>user.id !== userId)
    );

  };



  const handleCreate = async(e)=>{

    e.preventDefault();


    if(loading) return;


    if(!groupName.trim()){

      setError("Введите название группы");
      return;

    }


    if(selectedMembers.length===0){

      setError("Добавьте участников");
      return;

    }



    try{

      setLoading(true);
      setError('');


      const memberIds = selectedMembers.map(
        user=>user.id
      );


      const chatId = await createGroupChat(
        currentUser.id,
        groupName.trim(),
        memberIds
      );


      onGroupCreated(chatId);
      onClose();



    }catch(err){

      console.error(err);
      setError(
        err.message || "Ошибка создания группы"
      );


    }finally{

      setLoading(false);

    }

  };



return (
<div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">

<div className="w-full max-w-md bg-[#0f0d22] border border-[#242048] rounded-3xl p-6 text-white">


<div className="flex justify-between mb-4">

<h3 className="font-bold text-lg">
Создать группу
</h3>

<button onClick={onClose}>
✕
</button>

</div>



{error &&
<div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4">
{error}
</div>
}




<input
value={groupName}
onChange={e=>setGroupName(e.target.value)}
placeholder="Название группы"
className="w-full mb-4 bg-[#14122b] border border-[#242048] rounded-xl p-3 text-xs"
/>



<div className="mb-4">

<div className="text-xs text-slate-400 mb-2">
Участники: {selectedMembers.length}
</div>


<div className="flex flex-wrap gap-2">

{selectedMembers.map(user=>(

<span
key={user.id}
className="bg-purple-600/30 px-2 py-1 rounded-lg text-xs"
>

{user.username}

<button
type="button"
onClick={()=>handleRemoveMember(user.id)}
className="ml-2"
>
×
</button>

</span>

))}

</div>

</div>




<input

value={searchQuery}

onChange={e=>setSearchQuery(e.target.value)}

placeholder="@username"

className="w-full bg-[#14122b] border border-[#242048] rounded-xl p-3 text-xs"

/>



{searchLoading &&
<div className="text-xs text-slate-400 mt-2">
Поиск...
</div>
}



{searchResults.length>0 &&

<div className="mt-2 bg-[#14122b] rounded-xl overflow-hidden">

{searchResults.map(user=>(

<div

key={user.id}

onClick={()=>handleAddMember(user)}

className="p-3 hover:bg-purple-600/20 cursor-pointer text-xs"

>

<b>{user.username}</b>

</div>

))}

</div>

}




<button

disabled={loading}

onClick={handleCreate}

className="w-full mt-5 bg-purple-600 py-3 rounded-xl text-xs disabled:opacity-50"

>

{loading?'Создание...':'Создать группу'}

</button>


</div>

</div>

);


}
