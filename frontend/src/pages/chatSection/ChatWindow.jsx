import React, { useEffect, useRef, useState } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import useChatStore from "../../store/chatStore";
import { isToday, isYesterday, format, formatDistanceToNow } from "date-fns";
import whatsappImage from "../../images/whatsappImage";
import {
  FaArrowLeft,
  FaEllipsisV,
  FaFile,
  FaImage,
  FaLock,
  FaPaperclip,
  FaPaperPlane,
  FaSmile,
  FaTimes,
  FaVideo,
} from "react-icons/fa";
import MessageBubble from "./MessageBubble";
import EmojiPicker from "emoji-picker-react";
import VideoCallManager from "../videoCall/VideoCallManager";
import { getSocket } from "../../services/chat.service";
import useVideoCallStore from "../../store/videoCallStore";
import useOutsideClick from "../../hooks/useOutsideClick";

const ChatWindow = ({ selectedContact, setSelectedContact }) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUserInfo, setShowUserInfo] = useState(false);

  const messageEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const socket = getSocket();
  const { initiateCall } = useVideoCallStore();

  const {
    messages,
    sendMessage,
    fetchMessages,
    fetchConversations,
    conversations,
    isUserTyping,
    startTyping,
    stopTyping,
    getUserLastSeen,
    isUserOnline,
    deleteMessage,
    addReaction,
    requestUserStatus,
  } = useChatStore();

  const online = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const isTyping = isUserTyping(selectedContact?._id);

  /* ---------- OUTSIDE CLICK FOR EMOJI PICKER ---------- */
  useOutsideClick(emojiPickerRef, () => setShowEmojiPicker(false));

  /* ---------- FETCH DATA ---------- */
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  /* ---------- REQUEST SELECTED CONTACT STATUS ---------- */
  useEffect(() => {
    if (selectedContact?._id) {
      requestUserStatus(selectedContact._id);
    }
  }, [selectedContact?._id, requestUserStatus]);

  useEffect(() => {
    if (!selectedContact || !conversations?.data) return;

    const convo = conversations.data.find((c) =>
      c.participants.some((p) => p._id === selectedContact._id)
    );

    if (convo?._id) fetchMessages(convo._id);
  }, [selectedContact, conversations, fetchMessages]);

  /* ---------- SCROLL ---------- */
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  /* ---------- TYPING (THROTTLED) ---------- */
  useEffect(() => {
    if (!message || !selectedContact) return;

    startTyping(selectedContact._id);

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      stopTyping(selectedContact._id);
    }, 1500);

    return () => clearTimeout(typingTimeout.current);
  }, [message, selectedContact, startTyping, stopTyping]);

  /* ---------- FILE ---------- */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setShowFileMenu(false);

    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    }
  };

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  /* ---------- SEND ---------- */
  const handleSendMessage = async () => {
    if (!selectedContact || (!message.trim() && !selectedFile)) return;

    const formData = new FormData();
    formData.append("senderId", user._id);
    formData.append("receiverId", selectedContact._id);
    formData.append("messageStatus", online ? "delivery" : "send");

    if (message.trim()) formData.append("content", message.trim());
    if (selectedFile) formData.append("media", selectedFile);

    await sendMessage(formData);

    setMessage("");
    setSelectedFile(null);
    setFilePreview(null);
  };

  /* ---------- DATE GROUP ---------- */
  const groupedMessages = Array.isArray(messages)
    ? messages.reduce((acc, msg) => {
        // Skip messages without valid createdAt
        if (!msg.createdAt) return acc;
        
        try {
          const d = new Date(msg.createdAt);
          
          // Skip invalid dates
          if (isNaN(d.getTime())) return acc;
          
          const key = format(d, "yyyy-MM-dd");
          acc[key] = acc[key] || [];
          acc[key].push(msg);
        } catch (error) {
          console.error('Error formatting date for message:', msg, error);
        }
        return acc;
      }, {})
    : {};

  const renderDate = (date) => {
    try {
      if (isToday(date)) return "Today";
      if (isYesterday(date)) return "Yesterday";
      return format(date, "EEEE, MMMM d");
    } catch (error) {
      console.error('Error rendering date:', date, error);
      return "";
    }
  };

  /* ---------- VIDEO CALL ---------- */
  const handleVideoCall = () => {
    // Request fresh status before initiating call
    requestUserStatus(selectedContact._id);
    
    // Small delay to allow status update
    setTimeout(() => {
      const currentOnlineStatus = isUserOnline(selectedContact._id);
      if (!currentOnlineStatus) {
        return alert("User is offline");
      }

      initiateCall(
        selectedContact._id,
        selectedContact.username,
        selectedContact.profilePicture,
        "video"
      );
    }, 100);
  };

  /* ---------- EMPTY ---------- */
  if (!selectedContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen text-center">
        <img src={whatsappImage} alt="chat" className="w-80 mb-6" />
        <h2 className="text-2xl font-semibold">Select a chat to start</h2>
        <p className="text-sm mt-4 flex items-center gap-2">
          <FaLock /> End-to-end encrypted
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 h-screen flex flex-col">
        {/* HEADER */}
        <div className={`p-4 flex items-center ${theme === "dark" ? "bg-[#303430]" : "bg-gray-200"}`}>
          <button onClick={() => setSelectedContact(null)}>
            <FaArrowLeft />
          </button>
          <img 
            src={selectedContact.profilePicture} 
            className="w-10 h-10 rounded-full ml-2 cursor-pointer" 
            onClick={() => setShowUserInfo(true)}
            alt="Profile"
          />
          <div className="ml-3 flex-1 cursor-pointer" onClick={() => setShowUserInfo(true)}>
            <h2>{selectedContact.username}</h2>
            <p className="text-xs text-gray-500">
              {isTyping 
                ? "Typing..." 
                : online 
                ? "Online" 
                : lastSeen && !isNaN(new Date(lastSeen).getTime())
                ? `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`
                : "Offline"}
            </p>
          </div>
          <button onClick={handleVideoCall}>
            <FaVideo className="text-green-500" />
          </button>
        </div>

        {/* MESSAGES */}
        <div className={`flex-1 overflow-y-auto p-4 ${theme === "dark" ? "bg-[#191a1a]" : "bg-[#f1ece5]"}`}>
          {Object.entries(groupedMessages).map(([d, msgs]) => (
            <React.Fragment key={d}>
              <div className="text-center my-4 text-sm">{renderDate(new Date(d))}</div>
              {msgs.map((msg) => (
                <MessageBubble
                  key={msg._id || msg.tempId}
                  message={msg}
                  currentUser={user}
                  theme={theme}
                  onReact={addReaction}
                  deleteMessage={deleteMessage}
                />
              ))}
            </React.Fragment>
          ))}
          <div ref={messageEndRef} />
        </div>

        {/* PREVIEW */}
        {filePreview && (
          <div className="relative p-2">
            {selectedFile.type.startsWith("video/") ? (
              <video src={filePreview} controls className="w-80 mx-auto" />
            ) : (
              <img src={filePreview} className="w-80 mx-auto" />
            )}
            <button
              onClick={() => {
                setFilePreview(null);
                setSelectedFile(null);
              }}
              className="absolute top-1 right-1"
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* INPUT */}
        <div className="p-4 flex items-center gap-2">
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <FaSmile />
          </button>
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-16 left-4 z-50">
              <EmojiPicker
                onEmojiClick={(e) => setMessage((m) => m + e.emoji)}
              />
            </div>
          )}

          <button onClick={() => fileInputRef.current.click()}>
            <FaPaperclip />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/*,video/*"
            onChange={handleFileChange}
          />

          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className={`flex-1 rounded-full px-4 py-2 ${
              theme === "dark" 
                ? "bg-gray-700 text-white placeholder-gray-400" 
                : "bg-white text-gray-900"
            }`}
            placeholder="Type a message"
          />
          <button onClick={handleSendMessage}>
            <FaPaperPlane />
          </button>
        </div>
      </div>

      {/* USER INFO MODAL */}
      {showUserInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUserInfo(false)}>
          <div 
            className={`p-6 rounded-lg w-full max-w-md ${
              theme === "dark" ? "bg-[#202c33] text-white" : "bg-white text-black"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Contact Info</h3>
              <button onClick={() => setShowUserInfo(false)}>
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-6">
              <img 
                src={selectedContact.profilePicture} 
                alt={selectedContact.username}
                className="w-32 h-32 rounded-full object-cover mb-4"
              />
              <h2 className="text-2xl font-semibold">{selectedContact.username}</h2>
              <p className={`text-sm mt-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>
                {selectedContact.phoneNumber ? `+${selectedContact.phoneSuffix || ''}${selectedContact.phoneNumber}` : ''}
              </p>
            </div>

            {selectedContact.about && (
              <div className={`p-4 rounded-lg mb-4 ${
                theme === "dark" ? "bg-[#0b141a]" : "bg-gray-100"
              }`}>
                <label className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}>About</label>
                <p className="mt-1">{selectedContact.about}</p>
              </div>
            )}

            <div className={`p-4 rounded-lg ${
              theme === "dark" ? "bg-[#0b141a]" : "bg-gray-100"
            }`}>
              <label className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>Status</label>
              <p className="mt-1 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  online ? "bg-green-500" : "bg-gray-400"
                }`}></span>
                {online ? "Online" : lastSeen && !isNaN(new Date(lastSeen).getTime()) 
                  ? `Last seen ${format(new Date(lastSeen), "PPp")}` 
                  : "Offline"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* USER INFO MODAL */}
      {showUserInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUserInfo(false)}>
          <div 
            className={`p-6 rounded-lg w-full max-w-md ${
              theme === "dark" ? "bg-[#202c33] text-white" : "bg-white text-black"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Contact Info</h3>
              <button onClick={() => setShowUserInfo(false)}>
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-6">
              <img 
                src={selectedContact.profilePicture} 
                alt={selectedContact.username}
                className="w-32 h-32 rounded-full object-cover mb-4"
              />
              <h2 className="text-2xl font-semibold">{selectedContact.username}</h2>
              <p className={`text-sm mt-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>
                {selectedContact.phoneNumber ? `+${selectedContact.phoneSuffix || ''}${selectedContact.phoneNumber}` : ''}
              </p>
            </div>

            {selectedContact.about && (
              <div className={`p-4 rounded-lg mb-4 ${
                theme === "dark" ? "bg-[#0b141a]" : "bg-gray-100"
              }`}>
                <label className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}>About</label>
                <p className="mt-1">{selectedContact.about}</p>
              </div>
            )}

            <div className={`p-4 rounded-lg ${
              theme === "dark" ? "bg-[#0b141a]" : "bg-gray-100"
            }`}>
              <label className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>Status</label>
              <p className="mt-1 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  online ? "bg-green-500" : "bg-gray-400"
                }`}></span>
                {online ? "Online" : lastSeen && !isNaN(new Date(lastSeen).getTime()) 
                  ? `Last seen ${format(new Date(lastSeen), "PPp")}` 
                  : "Offline"}
              </p>
            </div>
          </div>
        </div>
      )}

      <VideoCallManager socket={socket} />
    </>
  );
};

export default ChatWindow;

