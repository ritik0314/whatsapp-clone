import React, { useRef, useState } from "react";
import {
  FaCheck,
  FaCheckDouble,
  FaPlus,
  FaRegCopy,
  FaSmile,
} from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { RxCross2 } from "react-icons/rx";
import { format } from "date-fns";
import EmojiPicker from "emoji-picker-react";
import useOutsideClick from "../../hooks/useOutsideClick";

const MessageBubble = ({
  message,
  theme,
  onReact,
  currentUser,
  deleteMessage,
}) => {
  /* ---------------- HOOKS (ALWAYS FIRST) ---------------- */
  const [showReactions, setShowReactions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const reactionsMenuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const optionRef = useRef(null);

  useOutsideClick(reactionsMenuRef, () => setShowReactions(false));
  useOutsideClick(emojiPickerRef, () => setShowEmojiPicker(false));
  useOutsideClick(optionRef, () => setShowOptions(false));

  /* ---------------- SAFETY CHECK AFTER HOOKS ---------------- */
  if (!message) return null;

  const isUserMessage = message?.sender?._id === currentUser?._id;

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const bubbleTheme = isUserMessage
    ? theme === "dark"
      ? "bg-[#144d38] text-white"
      : "bg-[#d9fdd3] text-black"
    : theme === "dark"
    ? "bg-[#202c33] text-white"
    : "bg-white text-black";

  const handleReact = (emoji) => {
    onReact(message._id, emoji);
    setShowReactions(false);
    setShowEmojiPicker(false);
  };

  return (
    <div className={`flex w-full ${isUserMessage ? "justify-end" : "justify-start"} my-1`}>
      <div className={`flex flex-col ${isUserMessage ? "items-end" : "items-start"} max-w-[75%]`}>
        <div
          className={`relative group inline-block p-3 rounded-lg ${bubbleTheme}`}
        >
        {/* MESSAGE CONTENT */}
        {message.contentType === "text" && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {message.contentType === "image" && (
          <img
            src={message.imageOrVideoUrl}
            alt="media"
            className="rounded-lg max-w-xs"
          />
        )}

        {message.contentType === "video" && (
          <video
            src={message.imageOrVideoUrl}
            controls
            className="rounded-lg max-w-xs"
          />
        )}

        {/* REACTIONS DISPLAY moved below bubble */}

        {/* TIME + STATUS */}
        <div className="flex justify-end gap-1 text-xs opacity-60 mt-2">
          <span>{format(new Date(message.createdAt), "HH:mm")}</span>

          {isUserMessage && (
            <>
              {message.messageStatus === "send" && <FaCheck size={12} />}
              {message.messageStatus === "delivered" && (
                <FaCheckDouble size={12} />
              )}
              {message.messageStatus === "read" && (
                <FaCheckDouble size={12} className="text-blue-500" />
              )}
            </>
          )}
        </div>

        {/* OPTIONS BUTTON */}
        <button
          onClick={() => setShowOptions((p) => !p)}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition"
        >
          <HiDotsVertical />
        </button>

        {/* REACTION BUTTON */}
        <button
          onClick={() => setShowReactions((p) => !p)}
          className={`absolute top-1/2 -translate-y-1/2 ${
            isUserMessage ? "-left-10" : "-right-10"
          } p-2 rounded-full shadow ${
            theme === "dark" ? "bg-[#202c33]" : "bg-white"
          }`}
        >
          <FaSmile />
        </button>

        {/* QUICK REACTIONS */}
        {showReactions && (
          <div
            ref={reactionsMenuRef}
            className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 px-2 py-1 rounded-full bg-black/80 z-50"
          >
            {quickReactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="hover:scale-125 transition"
              >
                {emoji}
              </button>
            ))}
            <button onClick={() => setShowEmojiPicker(true)}>
              <FaPlus />
            </button>
          </div>
        )}

        {/* EMOJI PICKER */}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute top-full mt-2 z-50">
            <EmojiPicker
              onEmojiClick={(e) => handleReact(e.emoji)}
              theme={theme}
            />
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="absolute top-1 right-1"
            >
              <RxCross2 />
            </button>
          </div>
        )}

        {/* OPTIONS MENU */}
        {showOptions && (
          <div
            ref={optionRef}
            className={`absolute top-8 right-1 w-36 rounded shadow z-50 ${
              theme === "dark"
                ? "bg-[#1d1f1f] text-white"
                : "bg-gray-100 text-black"
            }`}
          >
            {message.contentType === "text" && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(message.content);
                  setShowOptions(false);
                }}
                className="w-full px-4 py-2 flex gap-2"
              >
                <FaRegCopy /> Copy
              </button>
            )}

            {isUserMessage && (
              <button
                onClick={() => {
                  deleteMessage(message._id);
                  setShowOptions(false);
                }}
                className="w-full px-4 py-2 flex gap-2 text-red-500"
              >
                <FaRegCopy /> Delete
              </button>
            )}
          </div>
        )}
        </div>

        {Array.isArray(message.reactions) && message.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isUserMessage ? "justify-end" : "justify-start"}`}>
            {Object.entries(
              message.reactions.reduce((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              }, {})
            ).map(([emoji, count]) => (
              <span
                key={emoji}
                className={`px-2 py-0.5 rounded-full text-xs ${
                  theme === "dark" ? "bg-[#2a2f32] text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                {emoji} {count > 1 ? count : ""}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;



