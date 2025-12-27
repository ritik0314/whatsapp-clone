
import {io} from 'socket.io-client'
import useUserStore from '../store/useUserStore'

let socket=null;

// const token=localStorage.getItem("authtoken")

export const initializeSocket=()=>{
    if(socket) return socket;

     const user= useUserStore.getState().user;
     const token = document.cookie.split('authToken=')[1]?.split(';')[0];
   

    const BACKEND_URL=process.env.REACT_APP_API_URL;

    socket=io(BACKEND_URL,{
        auth: { token },
        withCredentials:true,
        // transports:["websocket","polling"],
        reconnectionAttempts:5,
        reconnectionDelay:1000,

    });

    //connection events
    socket.on("connect",()=>{
        console.log("socket connected",socket.id)
        if (user?._id) {
      socket.emit("user_connected", user._id);
    } else {
      console.warn("⚠️ user._id not available yet — skipping user_connected emit");
    }
    })

    socket.on("connect_error",(error)=>{
        console.error("socket connection error",error)
    })

    //disconnected events
     socket.on("disconnect",(reason)=>{
        console.log("socket disconnected",reason)
        
    })

    return socket;

};

export const getSocket=()=>{
    if(!socket){
        return initializeSocket();
    }
    return socket;
}


export const disconnectSocket=()=>{
    if(socket){
        socket.disconnect();
        socket=null;
    }
};

