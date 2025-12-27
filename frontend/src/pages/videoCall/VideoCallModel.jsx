// import React, { useEffect, useMemo, useRef } from "react";
// import useVideoCallStore from "../../store/videoCallStore";
// import useUserStore from "../../store/useUserStore";
// import useThemeStore from "../../store/themeStore";
// import {
//   FaMicrophone,
//   FaMicrophoneSlash,
//   FaPhoneSlash,
//   FaTimes,
//   FaVideo,
//   FaVideoSlash,
// } from "react-icons/fa";

// const ICE_CONFIG = {
//   iceServers: [
//     { urls: "stun:stun.l.google.com:19302" },
//     { urls: "stun:stun1.l.google.com:19302" },
//   ],
// };

// const VideoCallModel = ({ socket }) => {
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);

//   const {
//     currentCall,
//     incomingCall,
//     isCallActive,
//     callType,
//     localStream,
//     remoteStream,
//     isVideoEnabled,
//     isAudioEnabled,
//     peerConnection,
//     iceCandidatesQueue,
//     isCallModelOpen,
//     callStatus,
//     setCurrentCall,
//     setCallModelOpen,
//     endCall,
//     setCallStatus,
//     setCallActive,
//     setLocalStream,
//     setRemoteStream,
//     setPeerConnection,
//     addIceCandidate,
//     processQueuedIceCandidates,
//     toggleVideo,
//     toggleAudio,
//     clearIncomingCall,
//   } = useVideoCallStore();

//   const { user } = useUserStore();
//   const { theme } = useThemeStore();

//   /* ---------- DISPLAY INFO ---------- */
//   const displayInfo = useMemo(() => {
//     if (incomingCall && !isCallActive) {
//       return {
//         name: incomingCall.callerName,
//         avatar: incomingCall.callerAvatar,
//       };
//     }
//     if (currentCall) {
//       return {
//         name: currentCall.participantName,
//         avatar: currentCall.participantAvatar,
//       };
//     }
//     return null;
//   }, [incomingCall, currentCall, isCallActive]);

//   /* ---------- END CALL ---------- */
//   const handleEndCall = React.useCallback(() => {
//     const participantId =
//       currentCall?.participantId || incomingCall?.callerId;

//     console.log("[Call] Ending call, notifying participant:", participantId);
    
//     socket?.emit("end_call", {
//       callId: currentCall?.callId || incomingCall?.callId,
//       participantId,
//     });

//     endCall();
//   }, [socket, currentCall, incomingCall, endCall]);

//   /* ---------- MEDIA ---------- */
//   const getMedia = React.useCallback(async (video) => {
//     try {
//       console.log("[Media] Requesting permissions:", { video, audio: true });
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: video ? { width: 640, height: 480 } : false,
//         audio: true,
//       });
//       console.log("[Media] Stream acquired:", stream.id);
//       setLocalStream(stream);
//       return stream;
//     } catch (err) {
//       console.error("[Media] Permission denied or error:", err);
//       setCallStatus("failed");
//       throw err;
//     }
//   }, [setLocalStream, setCallStatus]);

//   /* ---------- PEER CONNECTION ---------- */
//   const createPeerConnection = React.useCallback((stream) => {
//     console.log("[PC] Creating peer connection with stream:", stream?.id);
//     const pc = new RTCPeerConnection(ICE_CONFIG);

//     stream?.getTracks().forEach((t) => {
//       console.log("[PC] Adding track:", t.kind, t.id);
//       pc.addTrack(t, stream);
//     });

//     pc.onicecandidate = (e) => {
//       if (!e.candidate || !socket) return;

//       const targetId =
//         currentCall?.participantId || incomingCall?.callerId;

//       console.log("[PC] Sending ICE candidate to:", targetId);
//       socket.emit("webrtc_ice_candidate", {
//         candidate: e.candidate,
//         receiverId: targetId,
//         callId: currentCall?.callId || incomingCall?.callId,
//       });
//     };

//     pc.ontrack = (e) => {
//       console.log("[PC] Remote track received:", e.streams[0].id);
//       setRemoteStream(e.streams[0]);
//     };

//     pc.oniceconnectionstatechange = () => {
//       console.log("[PC] ICE connection state:", pc.iceConnectionState);
//       if (pc.iceConnectionState === "failed") {
//         setCallStatus("failed");
//         setTimeout(handleEndCall, 1500);
//       }
//     };

//     setPeerConnection(pc);
//     return pc;
//   }, [socket, currentCall, incomingCall, setRemoteStream, setPeerConnection, setCallStatus, handleEndCall]);

//   /* ---------- ANSWER CALL ---------- */
//   const handleAnswerCall = async () => {
//     try {
//       if (!socket) {
//         console.error("[Receiver] No socket available to accept call");
//         return;
//       }
//       setCallStatus("connecting");
//       console.log("[Receiver] handleAnswerCall: starting media & PC");

//       const stream = await getMedia(callType === "video");
//       const pc = createPeerConnection(stream);

//       socket.emit("accept_call", {
//         callerId: incomingCall.callerId,
//         callId: incomingCall.callId,
//         receiverInfo: {
//           username: user.username,
//           profilePicture: user.profilePicture,
//         },
//       });

//       setCurrentCall({
//         callId: incomingCall.callId,
//         participantId: incomingCall.callerId,
//         participantName: incomingCall.callerName,
//         participantAvatar: incomingCall.callerAvatar,
//       });

//       setCallActive(true);
//       clearIncomingCall();
//     } catch (err) {
//       console.error("[Receiver] handleAnswerCall failed:", err);
//       handleEndCall();
//     }
//   };

//   /* ---------- SOCKET EVENTS ---------- */
//   useEffect(() => {
//     if (!socket || !peerConnection) return;
//     console.log("[Peer] attach signaling listeners", { hasPC: !!peerConnection });

//     const onOffer = async ({ offer, senderId, callId }) => {
//       console.log("[Receiver] onOffer", { callId });
//       await peerConnection.setRemoteDescription(
//         new RTCSessionDescription(offer)
//       );

//       await processQueuedIceCandidates();

//       const answer = await peerConnection.createAnswer();
//       await peerConnection.setLocalDescription(answer);

//       socket.emit("webrtc_answer", {
//         answer,
//         receiverId: senderId,
//         callId,
//       });
//     };

//     const onAnswer = async ({ answer }) => {
//       console.log("[Caller] onAnswer");
//       if (peerConnection.signalingState !== "closed") {
//         await peerConnection.setRemoteDescription(
//           new RTCSessionDescription(answer)
//         );
//         await processQueuedIceCandidates();
//       }
//     };

//     const onIce = async ({ candidate }) => {
//       console.log("[Peer] onIce");
//       if (peerConnection.remoteDescription) {
//         await peerConnection.addIceCandidate(
//           new RTCIceCandidate(candidate)
//         );
//       } else {
//         addIceCandidate(candidate);
//       }
//     };

//     socket.on("webrtc_offer", onOffer);
//     socket.on("webrtc_answer", onAnswer);
//     socket.on("webrtc_ice_candidate", onIce);

//     return () => {
//       socket.off("webrtc_offer", onOffer);
//       socket.off("webrtc_answer", onAnswer);
//       socket.off("webrtc_ice_candidate", onIce);
//     };
//   }, [socket, peerConnection, processQueuedIceCandidates, addIceCandidate]);

//   /* ---------- CALLER FLOW: CREATE OFFER ---------- */
//   useEffect(() => {
//     const startCallerFlow = async () => {
//       try {
//         if (!socket || !currentCall || callStatus !== "accepted") {
//           return;
//         }

//         setCallStatus("connecting");
//         console.log("[Caller] accepted: starting media & creating offer");
//         let pc = peerConnection;
//         let stream = localStream;
//         if (!pc) {
//           // Reuse preview stream if present, else acquire new
//           if (!stream) {
//             stream = await getMedia(callType === "video");
//           }
//           pc = createPeerConnection(stream);
//         }

//         console.log("[Caller] Creating offer...");
//         const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callType === "video" });
//         await pc.setLocalDescription(offer);
//         console.log("[Caller] Offer created, sending to:", currentCall.participantId);

//         socket.emit("webrtc_offer", {
//           offer,
//           receiverId: currentCall.participantId,
//           callId: currentCall.callId,
//         });
        
//         setCallActive(true);
//       } catch (err) {
//         console.error("[Caller] Offer creation failed:", err);
//         setCallStatus("failed");
//         setTimeout(handleEndCall, 1500);
//       }
//     };

//     startCallerFlow();
//   }, [socket, currentCall, callStatus, callType, peerConnection, localStream, getMedia, createPeerConnection, setCallStatus, setCallActive]);

//   // Start local preview on caller while ringing, without sending offer yet
//   useEffect(() => {
//     const startCallerPreview = async () => {
//       try {
//         if (!socket || !currentCall || callStatus !== "calling") return;
//         if (localStream) {
//           console.log("[Caller] Preview stream already exists");
//           return;
//         }
        
//         console.log("[Caller] calling: starting local preview");
//         const stream = await getMedia(callType === "video");
//         if (!peerConnection) {
//           createPeerConnection(stream);
//         }
//       } catch (err) {
//         console.error("[Caller] local preview failed:", err);
//         setCallStatus("failed");
//       }
//     };
//     startCallerPreview();
//   }, [socket, currentCall, callStatus, callType, localStream, peerConnection, getMedia, createPeerConnection, setCallStatus]);

//   /* ---------- VIDEO BIND ---------- */
//   useEffect(() => {
//     if (localStream && localVideoRef.current)
//       localVideoRef.current.srcObject = localStream;
//   }, [localStream]);

//   useEffect(() => {
//     if (remoteStream && remoteVideoRef.current) {
//       remoteVideoRef.current.srcObject = remoteStream;
//       setCallActive(true);
//       setCallStatus("connected");
//     }
//   }, [remoteStream]);

//   if (!isCallModelOpen && !incomingCall) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
//       <div
//         className={`relative w-full h-full max-w-4xl rounded-lg overflow-hidden ${
//           theme === "dark" ? "bg-gray-900" : "bg-white"
//         }`}
//       >
//         {/* Incoming */}
//         {incomingCall && !isCallActive && (
//           <div className="flex flex-col items-center justify-center h-full">
//             <img
//               src={displayInfo?.avatar}
//               className="w-32 h-32 rounded-full mb-4"
//             />
//             <h2 className="text-white text-2xl">
//               {displayInfo?.name}
//             </h2>
//             <p className="text-gray-300 mb-6">
//               Incoming {callType} call
//             </p>

//             <div className="flex gap-6">
//               <button
//                 onClick={handleEndCall}
//                 className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center"
//               >
//                 <FaPhoneSlash />
//               </button>
//               <button
//                 onClick={handleAnswerCall}
//                 className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center"
//               >
//                 <FaVideo />
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Active */}
//         {(isCallActive || callStatus === "connecting") && (
//           <>
//             {callType === "video" && (
//               <video
//                 ref={remoteVideoRef}
//                 autoPlay
//                 playsInline
//                 className="w-full h-full object-cover"
//               />
//             )}

//             {localStream && callType === "video" && (
//               <video
//                 ref={localVideoRef}
//                 autoPlay
//                 muted
//                 playsInline
//                 className="absolute top-4 right-4 w-40 h-28 rounded-lg border"
//               />
//             )}

//             {/* Controls */}
//             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
//               {callType === "video" && (
//                 <button
//                   onClick={toggleVideo}
//                   className="w-12 h-12 rounded-full bg-gray-700 text-white"
//                 >
//                   {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
//                 </button>
//               )}
//               <button
//                 onClick={toggleAudio}
//                 className="w-12 h-12 rounded-full bg-gray-700 text-white"
//               >
//                 {isAudioEnabled ? (
//                   <FaMicrophone />
//                 ) : (
//                   <FaMicrophoneSlash />
//                 )}
//               </button>
//               <button
//                 onClick={handleEndCall}
//                 className="w-12 h-12 rounded-full bg-red-500 text-white"
//               >
//                 <FaPhoneSlash />
//               </button>
//             </div>
//           </>
//         )}

//         {/* Close */}
//         <button
//           onClick={handleEndCall}
//           className="absolute top-4 right-4 text-white"
//         >
//           <FaTimes />
//         </button>
//       </div>
//     </div>
//   );
// };

// export default VideoCallModel;



import React, { useEffect, useRef } from "react";
import useVideoCallStore from "../../store/videoCallStore";
import useUserStore from "../../store/useUserStore";

const ICE_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const VideoCallModel = ({ socket }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const {
    currentCall,
    incomingCall,
    callType,
    callStatus,
    setCallStatus,
    endCall,
    isCallModelOpen,
  } = useVideoCallStore();

  const { user } = useUserStore();

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  /* ---------- CLEANUP ---------- */
  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  };

  /* ---------- END CALL ---------- */
  const handleEndCall = () => {
    const participantId = currentCall?.participantId || incomingCall?.callerId;
    
    socket?.emit("end_call", {
      callId: currentCall?.callId || incomingCall?.callId,
      participantId,
    });

    cleanup();
    endCall();
  };

  /* ---------- ACCEPT CALL ---------- */
  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    console.log("Accepting call, getting media...");
    
    try {
      // Get media first
      await getMedia();
      
      socket.emit("accept_call", {
        callId: incomingCall.callId,
        callerId: incomingCall.callerId,
      });

      setCallStatus("accepted");
    } catch (err) {
      console.error("Failed to accept call:", err);
      handleRejectCall();
    }
  };

  /* ---------- REJECT CALL ---------- */
  const handleRejectCall = () => {
    if (!incomingCall) return;

    socket.emit("reject_call", {
      callId: incomingCall.callId,
      callerId: incomingCall.callerId,
    });

    cleanup();
    endCall();
  };

  /* ---------- MEDIA ---------- */
  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video" ? { width: 1280, height: 720 } : false,
        audio: true,
      });
      console.log("Media stream acquired:", stream.getTracks());
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Error getting media:", err);
      alert("Could not access camera/microphone. Please check permissions.");
      throw err;
    }
  };

  /* ---------- PEER CONNECTION ---------- */
  const createPC = async () => {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    pc.ontrack = (e) => {
      console.log("Received remote track:", e.track.kind);
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
        console.log("Remote stream set to video element");
      }
      setCallStatus("connected");
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log("Sending ICE candidate");
        socket.emit("webrtc_ice_candidate", {
          callId: currentCall.callId,
          receiverId: currentCall.participantId,
          senderId: user._id,
          candidate: e.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallStatus("connected");
      }
    };

    pcRef.current = pc;
    return pc;
  };

  /* ---------- CALLER: CREATE OFFER ---------- */
  useEffect(() => {
    if (callStatus !== "accepted" || !currentCall) return;

    (async () => {
      try {
        const stream = await getMedia();
        const pc = await createPC();

        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("webrtc_offer", {
          callId: currentCall.callId,
          receiverId: currentCall.participantId,
          senderId: user._id,
          offer,
        });
      } catch (err) {
        console.error("Error creating offer:", err);
        handleEndCall();
      }
    })();

    return cleanup;
  }, [callStatus, currentCall]);

  /* ---------- SOCKET SIGNALING ---------- */
  useEffect(() => {
    if (!socket || !currentCall) return;

    socket.on("webrtc_offer", async ({ offer, senderId }) => {
      try {
        console.log("Received offer from:", senderId);
        
        // Use existing stream if already have one (from accept call)
        let stream = localStreamRef.current;
        if (!stream) {
          stream = await getMedia();
        }
        
        const pc = await createPC();

        // Add local tracks to peer connection
        stream.getTracks().forEach((t) => {
          console.log("Adding local track to PC:", t.kind);
          pc.addTrack(t, stream);
        });

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log("Sending answer to:", senderId);
        socket.emit("webrtc_answer", {
          callId: currentCall.callId,
          receiverId: senderId,
          senderId: user._id,
          answer,
        });
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    socket.on("webrtc_answer", async ({ answer }) => {
      try {
        console.log("Received answer");
        if (pcRef.current && answer) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          console.log("Remote description set from answer");
        }
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    });

    socket.on("webrtc_ice_candidate", async ({ candidate }) => {
      try {
        if (pcRef.current && candidate) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    return () => {
      socket.off("webrtc_offer");
      socket.off("webrtc_answer");
      socket.off("webrtc_ice_candidate");
    };
  }, [socket, currentCall, user]);

  if (!isCallModelOpen) return null;

  /* ---------- INCOMING CALL UI ---------- */
  if (callStatus === "ringing" && incomingCall) {
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        zIndex: 9999,
      }}>
        <img
          src={incomingCall.callerAvatar}
          alt={incomingCall.callerName}
          style={{ width: 100, height: 100, borderRadius: "50%", marginBottom: 20 }}
        />
        <h2>{incomingCall.callerName}</h2>
        <p>Incoming {callType} call...</p>
        <div style={{ display: "flex", gap: 20, marginTop: 40 }}>
          <button
            onClick={handleAcceptCall}
            style={{
              padding: "15px 30px",
              background: "green",
              color: "white",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Accept
          </button>
          <button
            onClick={handleRejectCall}
            style={{
              padding: "15px 30px",
              background: "red",
              color: "white",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Reject
          </button>
        </div>
      </div>
    );
  }

  /* ---------- CALLING/CONNECTING UI ---------- */
  if (callStatus === "calling" || callStatus === "connecting") {
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        zIndex: 9999,
      }}>
        <img
          src={currentCall?.participantAvatar}
          alt={currentCall?.participantName}
          style={{ width: 100, height: 100, borderRadius: "50%", marginBottom: 20 }}
        />
        <h2>{currentCall?.participantName}</h2>
        <p>Calling...</p>
        <button
          onClick={handleEndCall}
          style={{
            marginTop: 40,
            padding: "15px 30px",
            background: "red",
            color: "white",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  /* ---------- ACTIVE CALL UI ---------- */
  if (!incomingCall && !currentCall) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "#000",
      zIndex: 9999,
    }}>
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: 200,
          height: 150,
          position: "absolute",
          right: 20,
          top: 20,
          borderRadius: 10,
          objectFit: "cover",
        }}
      />
      <button
        onClick={handleEndCall}
        style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "15px 40px",
          background: "red",
          color: "white",
          border: "none",
          borderRadius: 50,
          cursor: "pointer",
          fontSize: 18,
          fontWeight: "bold",
        }}
      >
        End Call
      </button>
    </div>
  );
};

export default VideoCallModel;


