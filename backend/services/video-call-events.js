

// const handleVideoCallEvent=(socket,io,onlineUsers)=>{

//     //initiate video or audio call
//     socket.on("initiate_call",({callId,callerId,receiverId,callType,callerInfo})=>{
//         const receiverSocketId=onlineUsers.get(receiverId);
//         if(!receiverSocketId){
//             const callId=`${callerId}-${receiverId}-${Date.now()}`;

//             io.to(receiverSocketId).emit("incoming_call",{
//                 callerId,
//                 callerName:callerInfo.username,
//                 callerAvatar:callerInfo.profilePicture,
//                 callId,
//                 callType
//             })
//         }else{
//             console.log(`server:Receiver ${receiverId} is offline`)
//             socket.emit("call_failed",{reason:"user is offline"})
//         }
//     })

//     //accept call
//      socket.on("accept_call",({callerId,callId,receiverInfo})=>{
//         const callerSocketId=onlineUsers.get(callerId);
//         if(callerSocketId){

//             io.to(callerSocketId).emit("call_accepted",{
//                 callerId,
//                 callerName:receiverInfo.username,
//                 callerAvatar:receiverInfo.profilePicture,
//                 callId,
//             })
//         }else{
//             console.log(`server:Caller ${callerId} not found`)
//         }
//     })

//     //reject call
//     socket.on("reject_call",({callerId,callId})=>{
//         const callerSocketId=onlineUsers.get(callerId);
//         if(callerSocketId){

//             io.to(callerSocketId).emit("call_rejected",{callId})
//         }
//     });

//     //end call
//     socket.on("end_call",({callId,participantId})=>{
//         const participantSocketId=onlineUsers.get(participantId);
//         if(participantSocketId){
//             io.to(participantSocketId).emit("call_ended",{callId})
//         }
//     });

//     //webRct signalling event with proper userid

//     socket.on("webrtc_offer",({offer,receiverId,callId})=>{
//         const receiverSocketId=onlineUsers.get(receiverId);

//         if(receiverSocketId){
//             io.to(receiverSocketId).emit("webrtc_offer",{
//                 offer,
//                 senderId:socket.userId,
//                 callId
//             })
//             console.log(`server offer forwarded to ${receiverId}`)
//         }else{
//             console.log(`server:Receiver ${receiverId} not found the offer`)
//         }
//     })


//      socket.on("webrtc_answer",({answer,receiverId,callId})=>{
//         const receiverSocketId=onlineUsers.get(receiverId);

//         if(receiverSocketId){
//             io.to(receiverSocketId).emit("webrtc_answer",{
//                 answer,
//                 senderId:socket.userId,
//                 callId
//             })
//             console.log(`server answer forwarded to ${receiverId}`)
//         }else{
//              console.log(`server:Receiver ${receiverId} not found the answer`)
//         }
//     })

//     socket.on("webrtc_ice_candidate",({candidate,receiverId,callId})=>{
//         const receiverSocketId=onlineUsers.get(receiverId);

//         if(receiverSocketId){
//             io.to(receiverSocketId).emit("webrtc_ice_candidate",{
//                 candidate,
//                 senderId:socket.userId,
//                 callId
//             })
//         }else{
//              console.log(`server:Receiver ${receiverId} not found the ice candidate`)
//         }
//     })


// };


// module.exports= handleVideoCallEvent;


const handleVideoCallEvent = (socket, io, onlineUsers) => {

  socket.on("initiate_call", ({ callId, callerId, receiverId, callType, callerInfo }) => {
    const receiverSocket = onlineUsers.get(receiverId);
    if (!receiverSocket) {
      socket.emit("call_failed", { reason: "User is offline" });
      return;
    }

    io.to(receiverSocket).emit("incoming_call", {
      callId,
      callerId,
      callerName: callerInfo.username,
      callerAvatar: callerInfo.profilePicture,
      callType,
    });
  });

  socket.on("accept_call", ({ callId, callerId }) => {
    const callerSocket = onlineUsers.get(callerId);
    if (callerSocket) {
      io.to(callerSocket).emit("call_accepted", { callId });
    }
  });

  socket.on("reject_call", ({ callId, callerId }) => {
    const callerSocket = onlineUsers.get(callerId);
    if (callerSocket) {
      io.to(callerSocket).emit("call_rejected", { callId });
    }
  });

  socket.on("webrtc_offer", ({ receiverId, ...data }) => {
    const s = onlineUsers.get(receiverId);
    if (s) io.to(s).emit("webrtc_offer", data);
  });

  socket.on("webrtc_answer", ({ receiverId, ...data }) => {
    const s = onlineUsers.get(receiverId);
    if (s) io.to(s).emit("webrtc_answer", data);
  });

  socket.on("webrtc_ice_candidate", ({ receiverId, ...data }) => {
    const s = onlineUsers.get(receiverId);
    if (s) io.to(s).emit("webrtc_ice_candidate", data);
  });

  socket.on("end_call", ({ participantId }) => {
    const s = onlineUsers.get(participantId);
    if (s) io.to(s).emit("call_ended");
  });
};

module.exports = handleVideoCallEvent;
