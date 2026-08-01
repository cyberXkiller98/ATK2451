import React, { useState, useEffect } from 'react';
import Sidebar from '../sidebar/Sidebar';
import ChatWindow from './ChatWindow';
import ProfileModal from '../settings/ProfileModal';
import { getMyProfile } from '../../services/profileService';


export default function Messenger({ currentUser, onLogout }) {

  const [activeChat, setActiveChat] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);



  // Загрузка профиля
  useEffect(() => {

    if (!currentUser?.id) return;


    const loadProfile = async () => {

      try {

        setLoadingProfile(true);

        const data = await getMyProfile(currentUser.id);

        setProfile(data);


      } catch (err) {

        console.error(
          'Ошибка загрузки профиля:',
          err
        );


      } finally {

        setLoadingProfile(false);

      }

    };


    loadProfile();


  }, [currentUser?.id]);





  const handleLogout = () => {

    setIsSettingsOpen(false);
    setActiveChat(null);

    if (onLogout) {
      onLogout();
    }

  };





  return (

    <div className="
      h-[100dvh]
      w-screen
      bg-[#080711]
      flex
      overflow-hidden
      font-sans
      text-slate-100
    ">


      {/* Sidebar */}

      <div
        className={`
          h-full
          ${activeChat 
            ? 'hidden md:flex'
            : 'flex w-full'
          }
          md:w-80
          lg:w-96
          flex-shrink-0
        `}
      >

        <Sidebar

          currentUser={currentUser}

          profile={profile}

          activeChat={activeChat}

          onSelectChat={(chat)=>setActiveChat(chat)}

          onOpenSettings={()=>
            setIsSettingsOpen(true)
          }

        />

      </div>






      {/* Chat */}

      <div
        className={`
          h-full
          ${!activeChat 
            ? 'hidden md:flex'
            : 'flex w-full'
          }
          flex-1
        `}
      >

        <ChatWindow

          activeChat={activeChat}

          currentUser={currentUser}

          onBack={()=>
            setActiveChat(null)
          }

        />

      </div>






      {/* Profile settings */}

      {isSettingsOpen && (

        <ProfileModal

          currentUser={currentUser}

          profile={profile}

          onClose={()=>
            setIsSettingsOpen(false)
          }


          onUpdate={(updatedProfile)=>{

            setProfile(updatedProfile);

          }}


          onLogout={handleLogout}

        />

      )}



    </div>

  );

}