// import React, { useEffect, useState } from 'react'
// import { useLocation } from 'react-router-dom';
// import useThemeStore from '../store/themeStore';
// import useLayoutStore from '../store/layoutStore';
// import { FaUserCircle, FaWhatsapp } from 'react-icons/fa';
// import {motion} from "framer-motion";
// import {MdRadioButtonChecked} from "react-icons/md"
// import { IoIosSettings } from "react-icons/io";
// import useUserStore from "../store/useUserStore";
// import { Link } from "react-router-dom";

// const Sidebar=()=>{
//      const location=useLocation();
//     const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
//     const {theme,setTheme}=useThemeStore();
//     const {user}=useUserStore();
//     const {activeTab,setActiveTab,selectedContact}=useLayoutStore();
//     useEffect(() =>{
//         const handleResize= () =>{
//             setIsMobile(window.innerWidth<768)
//         }
//         window.addEventListener("resize",handleResize);
//         return() => window.removeEventListener('resize',handleResize)
//     },[]);
//     useEffect(()=>{
//         if(location.pathname==='/'){
//             setActiveTab("chats")
//         }else if(location.pathname==='/status'){
//             setActiveTab("status")
//         }else if(location.pathname==="/user-profile"){
//             setActiveTab("profile")
//         }else if(location.pathname==='/setting'){
//             setActiveTab("setting")
//         }
//     },[location.pathname,setActiveTab])

//     if(isMobile && selectedContact && activeTab === "chats"){
//         return null;
//     }

//     const SidebarContent=(
//         <>
//         <Link
//         to='/'
//         className={`${isMobile?" ":"mb-8"} ${activeTab==="chats" && "bg-gray-300 shadow-sm p-2 rounded-full"} focus:outline-none`}
//         >
//         <FaWhatsapp
//         className={`h-6 w-6 
//            ${activeTab==="chats" 
//              ? theme === "dark"
//               ? "text-gray-800"
//              : ""
//              :theme==="dark"
//              ?"text-gray-300"
//             : "text-gray-800"}`}
//         />
//         </Link>

//          <Link
//         to='/status'
//         className={`${isMobile?" ":"mb-8"} ${activeTab==="status" && "bg-gray-300 shadow-sm p-2 rounded-full"} focus;outline-none`}
//         >
//         <MdRadioButtonChecked
//         className={`h-6 w-6 
//             ${activeTab==="status"?
//                 theme==='dark'?"text-gray-800":"":
//                 theme==='dark'?"text-gray-300":"text-gray-800"}`}
//         />
//         </Link>
//         {!isMobile && <div className='flex-grow'/>}

//          <Link
//         to='/user-profile'
//         className={`${isMobile?" ":"mb-8"} ${activeTab==="profile" && "bg-gray-300 shadow-sm p-2 rounded-full"} focus;outline-none`}
//         >
//             {user?.profilePicture?(
//                <img 
//                src={user?.profilePicture}
//                alt="user"
//                className='h-6 w-6 rounded-full'
//                />
//             ):(
//                  <FaUserCircle
//         className={`h-6 w-6 
//             ${activeTab==="profile"?
//                 theme==='dark'?"text-gray-800":"":
//                 theme==='dark'?"text-gray-300":"text-gray-800"}`}
//         />
//             )}
        
//         </Link>
//             <Link
//         to='/setting'
//         className={`${isMobile?" ":"mb-8"} ${activeTab==="setting" && "bg-gray-300 shadow-sm p-2 rounded-full"} focus:outline-none`}
//         >
//         <IoIosSettings
//         className={`h-6 w-6 
//             ${activeTab==="setting"?
//                 theme==='dark'?"text-gray-800":"":
//                 theme==='dark'?"text-gray-300":"text-gray-800"}`}
//         />
//         </Link>
//         </>
//     )
//     return(
//        <motion.div
//        initial={{opacity:0}}
//        animate={{opacity:1}}
//        transition={{duration:0.3}}
//        className={`${isMobile?"fixed bottom-0 left-0 right-0 h-16":"w-16 h-screen border-r-2"}
//        ${theme==='dark'?"bg-gray-800 border-gray-600" :"bg-[rgb(239,242,254 )] border-gray-300"}
//       bg-opacity-90 flex items-center py-4 shandow-lg
//       ${isMobile?"flex-row justify-around":"flex-col justify-between"}
//        `}

//        >
//         {SidebarContent}
//        </motion.div>
//     )
// }

// export default Sidebar


import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import useThemeStore from "../store/themeStore";
import useLayoutStore from "../store/layoutStore";
import useUserStore from "../store/useUserStore";
import { FaUserCircle, FaWhatsapp } from "react-icons/fa";
import { MdRadioButtonChecked } from "react-icons/md";
import { IoIosSettings } from "react-icons/io";
import { motion } from "framer-motion";

const Sidebar = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { activeTab, setActiveTab, selectedContact } = useLayoutStore();

  /* ---------- HANDLE RESIZE ---------- */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ---------- ACTIVE TAB ---------- */
  useEffect(() => {
    if (location.pathname === "/home") setActiveTab("chats");
    else if (location.pathname === "/status") setActiveTab("status");
    else if (location.pathname === "/user-profile") setActiveTab("profile");
    else if (location.pathname === "/setting") setActiveTab("setting");
  }, [location.pathname, setActiveTab]);

  /* ---------- HIDE SIDEBAR ON MOBILE CHAT ---------- */
  if (isMobile && selectedContact && activeTab === "chats") {
    return null;
  }

  const iconBase =
    theme === "dark" ? "text-gray-300" : "text-gray-800";
  const iconActive = "text-gray-800 bg-gray-300";

  const navItem = (isActive) =>
    `p-2 rounded-full transition ${
      isActive ? iconActive : iconBase
    }`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        ${isMobile ? "fixed bottom-0 left-0 right-0 h-16" : "w-16 h-screen border-r"}
        ${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-[rgb(239,242,254)] border-gray-300"}
        flex ${isMobile ? "flex-row justify-around" : "flex-col justify-between"}
        items-center py-4 shadow-lg z-50
      `}
    >
      {/* Chats */}
      <Link to="/home" className="focus:outline-none">
        <FaWhatsapp className={`h-10 w-10 ${navItem(activeTab === "chats")}`} />
      </Link>

      {/* Status */}
      <Link to="/status" className="focus:outline-none">
        <MdRadioButtonChecked
          className={`h-10 w-10 ${navItem(activeTab === "status")}`}
        />
      </Link>

      {!isMobile && <div className="flex-grow" />}

      {/* Profile */}
      <Link to="/user-profile" className="focus:outline-none">
        {user?.profilePicture ? (
          <img
            src={user.profilePicture}
            alt="User"
            className={`h-10 w-10 rounded-full ${
              activeTab === "profile" ? "ring-2 ring-gray-400" : ""
            }`}
          />
        ) : (
          <FaUserCircle
            className={`h-10 w-10 ${navItem(activeTab === "profile")}`}
          />
        )}
      </Link>

      {/* Settings */}
      <Link to="/setting" className="focus:outline-none">
        <IoIosSettings
          className={` mt-2 h-10 w-10 ${navItem(activeTab === "setting")}`}
        />
      </Link>
    </motion.div>
  );
};

export default Sidebar;
