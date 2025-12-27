// import React, { useCallback, useEffect } from "react";
// import useVideoCallStore from "../../store/videoCallStore";
// import useUserStore from "../../store/useUserStore";
// import VideoCallModel from "./VideoCallModel";

// const VideoCallManager = ({ socket }) => {
//   const {
//     setIncomingCall,
//     setCurrentCall,
//     setCallType,
//     setCallModelOpen,
//     endCall,
//     setCallStatus,
//     registerInitiateCall, // ✅ NEW store action
//   } = useVideoCallStore();

//   const { user } = useUserStore();

//   /* ---------- SOCKET LISTENERS ---------- */
//   useEffect(() => {
//     if (!socket) return;

//     const handleIncomingCall = ({
//       callerId,
//       callerName,
//       callerAvatar,
//       callType,
//       callId,
//     }) => {
//       const callData = {
//         // Caller info (used by receiver side UI and accept logic)
//         callerId,
//         callerName,
//         callerAvatar,
//         // Shared identifiers
//         callId,
//         // Normalize also as participant for model display
//         participantId: callerId,
//         participantName: callerName,
//         participantAvatar: callerAvatar,
//       };

//       setIncomingCall(callData);
//       setCurrentCall(callData);
//       setCallType(callType);
//       setCallModelOpen(true);
//       setCallStatus("ringing");
//     };

//     const handleCallFailed = ({ reason }) => {
//       setCallStatus("failed");
//       setTimeout(() => endCall(), 1500);
//     };

//     const handleCallAccepted = ({ callId }) => {
//       // Receiver accepted — advance caller to accepted state
//       setCallStatus("accepted");
//       // Sync server callId into currentCall so both sides refer to the same ID
//       setCurrentCall((prev) => (prev ? { ...prev, callId } : prev));
//     };

//     const handleCallEnded = () => {
//       console.log("[Manager] Call ended by remote participant");
//       endCall();
//     };

//     const handleCallRejected = () => {
//       console.log("[Manager] Call rejected by remote participant");
//       setCallStatus("rejected");
//       setTimeout(() => endCall(), 1500);
//     };

//     socket.on("incoming_call", handleIncomingCall);
//     socket.on("call_failed", handleCallFailed);
//     socket.on("call_accepted", handleCallAccepted);
//     socket.on("call_ended", handleCallEnded);
//     socket.on("call_rejected", handleCallRejected);

//     return () => {
//       socket.off("incoming_call", handleIncomingCall);
//       socket.off("call_failed", handleCallFailed);
//       socket.off("call_accepted", handleCallAccepted);
//       socket.off("call_ended", handleCallEnded);
//       socket.off("call_rejected", handleCallRejected);
//     };
//   }, [
//     socket,
//     setIncomingCall,
//     setCurrentCall,
//     setCallType,
//     setCallModelOpen,
//     setCallStatus,
//     endCall,
//   ]);

//   /* ---------- INITIATE CALL ---------- */
//   const initiateCall = useCallback(
//     (receiverId, receiverName, receiverAvatar, callType = "video") => {
//       if (!socket || !user?._id) return;

//       const callId = `${user._id}-${receiverId}-${Date.now()}`;

//       const callData = {
//         callId,
//         participantId: receiverId,
//         participantName: receiverName,
//         participantAvatar: receiverAvatar,
//       };

//       setCurrentCall(callData);
//       setCallType(callType);
//       setCallModelOpen(true);
//       setCallStatus("calling");

//       socket.emit("initiate_call", {
//         callId,
//         callerId: user._id,
//         receiverId,
//         callType,
//         callerInfo: {
//           username: user.username,
//           profilePicture: user.profilePicture,
//         },
//       });
//     },
//     [
//       socket,
//       user,
//       setCurrentCall,
//       setCallType,
//       setCallModelOpen,
//       setCallStatus,
//     ]
//   );

//   /* ---------- REGISTER WITH STORE ---------- */
//   useEffect(() => {
//     registerInitiateCall(initiateCall);
//   }, [initiateCall, registerInitiateCall]);

//   return <VideoCallModel socket={socket} />;
// };

// export default VideoCallManager;



import React, { useCallback, useEffect } from "react";
import useVideoCallStore from "../../store/videoCallStore";
import useUserStore from "../../store/useUserStore";
import VideoCallModel from "./VideoCallModel";

const VideoCallManager = ({ socket }) => {
  const {
    setIncomingCall,
    setCurrentCall,
    setCallType,
    setCallModelOpen,
    endCall,
    setCallStatus,
    registerInitiateCall,
  } = useVideoCallStore();

  const { user } = useUserStore();

  /* ---------- SOCKET LISTENERS ---------- */
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      setIncomingCall(data);
      setCurrentCall({
        callId: data.callId,
        participantId: data.callerId,
        participantName: data.callerName,
        participantAvatar: data.callerAvatar,
      });
      setCallType(data.callType);
      setCallModelOpen(true);
      setCallStatus("ringing");
    };

    socket.on("incoming_call", handleIncomingCall);
    socket.on("call_accepted", () => setCallStatus("accepted"));
    socket.on("call_rejected", () => endCall());
    socket.on("call_ended", () => endCall());
    socket.on("call_failed", () => endCall());

    return () => {
      socket.off("incoming_call", handleIncomingCall);
      socket.off("call_accepted");
      socket.off("call_rejected");
      socket.off("call_ended");
      socket.off("call_failed");
    };
  }, [socket, endCall]);

  /* ---------- INITIATE CALL ---------- */
  const initiateCall = useCallback(
    (receiverId, receiverName, receiverAvatar, callType = "video") => {
      if (!socket || !user?._id) return;

      const callId = `${user._id}-${receiverId}-${Date.now()}`;

      setCurrentCall({
        callId,
        participantId: receiverId,
        participantName: receiverName,
        participantAvatar: receiverAvatar,
      });

      setCallType(callType);
      setCallModelOpen(true);
      setCallStatus("calling");

      socket.emit("initiate_call", {
        callId,
        callerId: user._id,
        receiverId,
        callType,
        callerInfo: {
          username: user.username,
          profilePicture: user.profilePicture,
        },
      });
    },
    [socket, user]
  );

  useEffect(() => {
    registerInitiateCall(initiateCall);
  }, [initiateCall, registerInitiateCall]);

  return <VideoCallModel socket={socket} />;
};

export default VideoCallManager;

