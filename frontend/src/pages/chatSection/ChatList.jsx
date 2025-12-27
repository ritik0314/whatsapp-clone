import React, { useState } from "react";
import useLayoutStore from "../../store/layoutStore";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { FaPlus, FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/formatTime";

const ChatList = ({ contacts = [] }) => {
  const { selectedContact, setSelectedContact } = useLayoutStore();
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const [searchTerms, setSearchTerms] = useState("");

  const filteredContacts = contacts.filter((contact) =>
    contact?.username?.toLowerCase().includes(searchTerms.toLowerCase())
  );

  return (
    <div
      className={`w-full border-r h-screen ${
        theme === "dark"
          ? "bg-[rgb(17,27,33)] border-gray-600"
          : "bg-white border-gray-200"
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 flex justify-between ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        <h2 className="text-xl font-semibold">Chats</h2>
        <button className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition">
          <FaPlus />
        </button>
      </div>

      {/* Search */}
      <div className="p-2">
        <div className="relative">
          <FaSearch
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-800"
            }`}
          />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
              theme === "dark"
                ? "bg-gray-800 text-white border-gray-700 placeholder-gray-500"
                : "bg-gray-100 text-black border-gray-200 placeholder-gray-400"
            }`}
          />
        </div>
      </div>

      {/* Contact List */}
      <div className="overflow-y-auto h-[calc(100vh-120px)]">
        {filteredContacts.length === 0 && (
          <p className="text-center text-gray-400 mt-6">No chats found</p>
        )}

        {filteredContacts.map((contact) => {
          const isSelected = selectedContact?._id === contact?._id;

          return (
            <motion.div
              key={contact?._id}
              onClick={() => setSelectedContact(contact)}
              whileHover={{ scale: 1.01 }}
              className={`p-3 flex items-center cursor-pointer transition ${
                isSelected
                  ? theme === "dark"
                    ? "bg-gray-700"
                    : "bg-gray-200"
                  : theme === "dark"
                  ? "hover:bg-gray-800"
                  : "hover:bg-gray-100"
              }`}
            >
              <img
                src={contact?.profilePicture}
                alt={contact?.username}
                className="w-12 h-12 rounded-full object-cover"
              />

              <div className="ml-3 flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                  <h2
                    className={`font-semibold truncate ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    {contact?.username}
                  </h2>

                  {contact?.conversation?.lastMessage?.createdAt && (
                    <span
                      className={`text-xs ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {formatTimestamp(
                        contact.conversation.lastMessage.createdAt
                      )}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center mt-1">
                  <p
                    className={`text-sm truncate ${
                      theme === "dark"
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    {contact?.conversation?.lastMessage?.content ||
                      "No messages yet"}
                  </p>

                  {contact?.conversation?.unreadCount > 0 && (
                    <span
                      className={`ml-2 text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        theme === "dark"
                          ? "bg-yellow-500 text-gray-800"
                          : "bg-yellow-400 text-black"
                      }`}
                    >
                      {contact.conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;

