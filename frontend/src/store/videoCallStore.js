
// import {create} from 'zustand';
// import {subscribeWithSelector} from "zustand/middleware"

// const useVideoCallStore=create (
//     subscribeWithSelector((set,get)=>({
//         //call state
//         currentCall:null,
//         incomingCall:null,
//         isCallActive:false,
//         callType:null,//video or audio


//         //media state
//         localStream:null,
//         remoteStream:null,
//         isVideoEnabled:true,
//         isAudioEnabled:true,

//         //webRTc
//         peerConnection:null,
//         iceCandidatesQueue:[],//queue for ice candidates

//         isCallModelOpen:false,
//         callStatus:"idle",//idle ,calling,ringing,connecting,connected,ended
        
//         // Function to initiate calls (registered by VideoCallManager)
//         initiateCallFn: null,

//         //actions
//         registerInitiateCall: (fn) => {
//             set({ initiateCallFn: fn });
//         },
//         // Getter to access the initiateCall function
//         initiateCall: (...args) => {
//             const { initiateCallFn } = get();
//             if (initiateCallFn) {
//                 return initiateCallFn(...args);
//             }
//             console.error('initiateCall function not registered yet');
//         },
//         setCurrentCall:(call)=>{
//             set({currentCall:call})
//         },
//         setIncomingCall:(call)=>{
//             set({incomingCall:call})
//         },
//         setCallActive:(active)=>{
//             set({isCallActive:active})
//         },
//         setCallType:(type)=>set({callType:type}),

//         setLocalStream:(stream)=>{
//             set({localStream:stream})
//         },
//         setRemoteStream:(stream)=>{
//             set({remoteStream:stream})
//         },
//         setPeerConnection:(pc)=>{
//             set({peerConnection:pc})
//         },
//         setCallModelOpen:(open)=>set({isCallModelOpen:open}),

//         setCallStatus:(status)=>{
//             set({callStatus:status})
//         },
//         addIceCandidate:(candidate)=>{
//             const {iceCandidatesQueue}=get();
//             set({iceCandidatesQueue:[...iceCandidatesQueue,candidate]})
//         },
//         processQueuedIceCandidates: async()=>{
//             const {peerConnection,iceCandidatesQueue}=get();

//             if(peerConnection && peerConnection.remoteDescription && iceCandidatesQueue.length>0){
//                 for(const candidate of iceCandidatesQueue){
//                     try {
//                         await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
//                     } catch (error) {
//                         console.error("ICE candidate error",error)
//                     }
//                 }
//                 set({iceCandidatesQueue:[]})
//             }
//         },

//         toggleVideo:()=>{
//             const {localStream,isVideoEnabled}=get();
//             if(localStream){
//                 const videoTrack=localStream.getVideoTracks()[0];
//                 if(videoTrack){
//                     videoTrack.enabled=!isVideoEnabled;
//                     set({isVideoEnabled:!isVideoEnabled})
//                 }
//             }
//         },
//          toggleAudio:()=>{
//             const {localStream,isAudioEnabled}=get();
//             if(localStream){
//                 const audioTrack=localStream.getAudioTracks()[0];
//                 if(audioTrack){
//                     audioTrack.enabled=!isAudioEnabled;
//                     set({isAudioEnabled:!isAudioEnabled})
//                 }
//             }
//         },
//         endCall:()=>{
//             const {localStream,peerConnection}=get();
//                 if(localStream){
//                     localStream.getTracks().forEach((track)=>track.stop());
//                 }
//                 if(peerConnection){
//                     peerConnection.close();
//                 }
//                 set({
//                     currentCall:null,
//                     incomingCall:null,
//                     isCallActive:false,
//                     callType:null,
//                     localStream:null,
//                     remoteStream:null,
//                     isVideoEnabled:true,
//                     isAudioEnabled:true,
//                     peerConnection:null,
//                     iceCandidatesQueue:[],
//                     isCallModelOpen:false,
//                     callStatus:"idle",
//                 })
//         },
//           clearIncomingCall:()=>{
//             set({incomingCall:null})
//             }
//     }))
// );

// export default useVideoCallStore;


import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

const useVideoCallStore = create(
  subscribeWithSelector((set, get) => ({
    /* ---------------- CALL STATE ---------------- */
    currentCall: null,
    incomingCall: null,
    callType: null, // "video" | "audio"
    callStatus: "idle", // idle | calling | ringing | accepted | connecting | connected
    isCallActive: false,
    isCallModelOpen: false,

    /* ---------------- INITIATE CALL HOOK ---------------- */
    initiateCallFn: null,

    registerInitiateCall: (fn) => {
      set({ initiateCallFn: fn });
    },

    initiateCall: (...args) => {
      const { initiateCallFn } = get();
      if (!initiateCallFn) {
        console.error("initiateCall function not registered");
        return;
      }
      initiateCallFn(...args);
    },

    /* ---------------- SETTERS ---------------- */
    setCurrentCall: (call) => set({ currentCall: call }),
    setIncomingCall: (call) => set({ incomingCall: call }),
    setCallType: (type) => set({ callType: type }),
    setCallStatus: (status) => set({ callStatus: status }),
    setCallActive: (active) => set({ isCallActive: active }),
    setCallModelOpen: (open) => set({ isCallModelOpen: open }),

    clearIncomingCall: () => set({ incomingCall: null }),

    /* ---------------- END CALL (CLEAN RESET) ---------------- */
    endCall: () => {
      set({
        currentCall: null,
        incomingCall: null,
        callType: null,
        callStatus: "idle",
        isCallActive: false,
        isCallModelOpen: false,
      });
    },
  }))
);

export default useVideoCallStore;
