import { create } from "zustand";
import { getSocket } from "../services/chat.service";
import axiosInstance from "../services/url.service";

const useChatStore = create((set, get) => {
    return {
        // STATE
        conversations: [],
        currentConversation: null,
        messages: [],
        loading: false,
        error: null,
        onlineUsers: new Map(),
        typingUsers: new Map(),
        currentUser: null,

        // SET CURRENT USER
        setCurrentUser: (user) => set({ currentUser: user }),

        // INITIALIZE SOCKET LISTENERS
        initSocketListners: () => {
            const socket = getSocket();
            if (!socket) return;

            // Remove old listeners to avoid duplicates
            socket.off("received_message");
            socket.off("user_typing");
            socket.off("user_status");
            socket.off("message_send");
            socket.off("message_error");
            socket.off("message_deleted");
            socket.off("reaction_update");
            socket.off("message_status_update");

            // Incoming message
            socket.on("received_message", (message) => {
                get().receiveMessage(message);
            });

            // Confirm message sent (replace optimistic msg)
            socket.on("message_send", (message) => {
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg._id === message._id ? { ...msg, ...message } : msg
                    ),
                }));
            });

            // Message status update
            socket.on("message_status_update", ({ messageId, messageStatus }) => {
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg._id === messageId ? { ...msg, messageStatus } : msg
                    ),
                }));
            });

            // Reaction update
            socket.on("reaction_update", ({ messageId, reactions }) => {
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg._id === messageId ? { ...msg, reactions } : msg
                    ),
                }));
            });

            // Delete message update
            socket.on("message_deleted", ({ deletedMessageId }) => {
                set((state) => ({
                    messages: state.messages.filter(
                        (msg) => msg._id !== deletedMessageId
                    ),
                }));
            });

            socket.on("message_error", (error) => {
                console.error("Socket message error:", error);
            });

            // Typing users
            socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
                set((state) => {
                    const newTypingUsers = new Map(state.typingUsers);
                    if (!newTypingUsers.has(conversationId)) {
                        newTypingUsers.set(conversationId, new Set());
                    }
                    const typingSet = newTypingUsers.get(conversationId);

                    if (isTyping) typingSet.add(userId);
                    else typingSet.delete(userId);

                    return { typingUsers: newTypingUsers };
                });
            });

            // User online/offline
            socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
                console.log("📡 Received user_status:", { userId, isOnline, lastSeen });
                set((state) => {
                    const newOnlineUsers = new Map(state.onlineUsers);
                    newOnlineUsers.set(userId, { isOnline, lastSeen });
                    console.log("🗺️ Updated onlineUsers Map:", Array.from(newOnlineUsers.entries()));
                    return { onlineUsers: newOnlineUsers };
                });
            });

            // Emit user status for each conversation
            const { conversations } = get();
            const currentUserId = get().currentUser?._id;

            if (conversations?.data?.length > 0) {
                conversations.data.forEach((conv) => {
                    const otherUser = conv.participants.find(
                        (p) => p._id !== currentUserId
                    );

                    if (otherUser?._id) {
                        socket.emit("get_user_status", otherUser._id, (status) => {
                            set((state) => {
                                const newOnlineUsers = new Map(state.onlineUsers);
                                newOnlineUsers.set(otherUser._id, {
                                    isOnline: status?.isOnline || false,
                                    lastSeen: status?.lastSeen || null,
                                });
                                return { onlineUsers: newOnlineUsers };
                            });
                        });
                    }
                });
            }
        },

        // FETCH CONVERSATIONS
        fetchConversations: async () => {
            set({ loading: true, error: null });

            try {
                const { data } = await axiosInstance.get("/chat/conversations");
                set({ conversations: data, loading: false });

                get().initSocketListners();
                return data;
            } catch (error) {
                set({
                    error: error?.response?.data?.message || error.message,
                    loading: false,
                });
                return null;
            }
        },

        // FETCH MESSAGES
        fetchMessages: async (conversationId) => {
            if (!conversationId) return;

            set({ loading: true, error: null });

            try {
                const { data } = await axiosInstance.get(
                    `/chat/conversations/${conversationId}/messages`
                );

                const messageArray = data.data || data || [];

                set({
                    messages: messageArray,
                    currentConversation: conversationId,
                    loading: false,
                });

                get().markMessagesAsRead();

                return messageArray;
            } catch (error) {
                set({
                    error: error?.response?.data?.message || error.message,
                    loading: false,
                });
                return [];
            }
        },

        // SEND MESSAGE (Real-time)
        sendMessage: async (formData) => {
            const senderId = formData.get("senderId");
            const receiverId = formData.get("receiverId");
            const media = formData.get("media");
            const content = formData.get("content");
            const messageStatus = formData.get("messageStatus");

            const socket = getSocket();
            const { conversations } = get();

            let conversationId = null;

            if (conversations?.data?.length > 0) {
                const conversation = conversations.data.find(
                    (c) =>
                        c.participants.some((p) => p._id === senderId) &&
                        c.participants.some((p) => p._id === receiverId)
                );
                if (conversation) conversationId = conversation._id;
            }

            // Optimistic temp message
            const tempId = `temp-${Date.now()}`;
            const optimisticMessage = {
                _id: tempId,
                sender: { _id: senderId },
                receiver: { _id: receiverId },
                conversation: conversationId,
                imageOrVideoUrl:
                    media && typeof media !== "string"
                        ? URL.createObjectURL(media)
                        : null,
                content,
                contentType: media
                    ? media.type.startsWith("image")
                        ? "image"
                        : "video"
                    : "text",
                createdAt: new Date().toISOString(),
                messageStatus,
            };

            // Add optimistic msg
            set((state) => ({
                messages: [...state.messages, optimisticMessage],
            }));

            try {
                const { data } = await axiosInstance.post(
                    "/chat/send-message",
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );

                const messageData = data.data || data;

                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg._id === tempId ? messageData : msg
                    ),
                }));

                return messageData;
            } catch (error) {
                console.error("Error sending message:", error);

                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg._id === tempId
                            ? { ...msg, messageStatus: "failed" }
                            : msg
                    ),
                    error: error?.response?.data?.message || error.message,
                }));

                throw error;
            }
        },

        // RECEIVE MESSAGE
        receiveMessage: (message) => {
            if (!message) return;

            const { currentConversation, currentUser, messages } = get();

            const exists = messages.some((msg) => msg._id === message._id);
            if (exists) return;

            if (message.conversation === currentConversation) {
                set((state) => ({
                    messages: [...state.messages, message],
                }));

                if (message.receiver?._id === currentUser?._id) {
                    get().markMessagesAsRead();
                }
            }

            // Update conversation preview
            set((state) => {
                const updated = state.conversations?.data?.map((conv) => {
                    if (conv._id === message.conversation) {
                        return {
                            ...conv,
                            lastMessage: message,
                            unreadCount:
                                message.receiver?._id === currentUser?._id
                                    ? (conv.unreadCount || 0) + 1
                                    : conv.unreadCount || 0,
                        };
                    }
                    return conv;
                });

                return {
                    conversations: {
                        ...state.conversations,
                        data: updated,
                    },
                };
            });
        },

        // MARK MESSAGES AS READ
        markMessagesAsRead: async () => {
            const { messages, currentUser } = get();

            if (!messages.length || !currentUser) return;

            const unreadIds = messages
                .filter(
                    (msg) =>
                        msg.messageStatus !== "read" &&
                        msg.receiver?._id === currentUser?._id
                )
                .map((msg) => msg._id)
                .filter(Boolean);

            if (!unreadIds.length) return;

            try {
                await axiosInstance.put("/chat/messages/read", {
                    messageIds: unreadIds,
                });

                set((state) => ({
                    messages: state.messages.map((msg) =>
                        unreadIds.includes(msg._id)
                            ? { ...msg, messageStatus: "read" }
                            : msg
                    ),
                }));

                const socket = getSocket();
                if (socket) {
                    socket.emit("message-read", {
                        messageIds: unreadIds,
                        senderId: messages[0]?.sender?._id,
                    });
                }
            } catch (error) {
                console.log("Failed to mark messages read:", error);
            }
        },

        // DELETE MESSAGE
        deleteMessage: async (messageId) => {
            try {
                await axiosInstance.delete(`/chat/messages/${messageId}`);

                set((state) => ({
                    messages: state.messages.filter(
                        (msg) => msg._id !== messageId
                    ),
                }));

                return true;
            } catch (error) {
                set({
                    error: error?.response?.data?.message || error.message,
                });
                return false;
            }
        },

        // ADD REACTION
        addReaction: async (messageId, emoji) => {
            const socket = getSocket();
            const { currentUser } = get();

            if (socket && currentUser?._id) {
                socket.emit("add_reaction", {
                    messageId,
                    emoji,
                    // Align with server expected payload
                    reactionUserId: currentUser._id,
                    userId: currentUser._id,
                });
            }
        },

        // TYPING START/STOP
        startTyping: (receiverId) => {
            const { currentConversation } = get();
            const socket = getSocket();

            if (socket && currentConversation && receiverId) {
                socket.emit("typing_start", {
                    conversationId: currentConversation,
                    receiverId,
                });
            }
        },

        stopTyping: (receiverId) => {
            const { currentConversation } = get();
            const socket = getSocket();

            if (socket && currentConversation && receiverId) {
                socket.emit("typing_stop", {
                    conversationId: currentConversation,
                    receiverId,
                });
            }
        },

        // CHECK TYPING STATUS
        isUserTyping: (userId) => {
            const { typingUsers, currentConversation } = get();
            if (
                !currentConversation ||
                !typingUsers.has(currentConversation) ||
                !userId
            )
                return false;

            return typingUsers.get(currentConversation).has(userId);
        },

        isUserOnline: (userId) => {
            if (!userId) return false;
            const { onlineUsers } = get();
            const status = onlineUsers.get(userId)?.isOnline || false;
            console.log(`🟢 isUserOnline(${userId}):`, status, "Map size:", onlineUsers.size);
            return status;
        },

        getUserLastSeen: (userId) => {
            if (!userId) return null;
            const { onlineUsers } = get();
            return onlineUsers.get(userId)?.lastSeen || null;
        },

        // REQUEST USER STATUS
        requestUserStatus: (userId) => {
            const socket = getSocket();
            if (!socket || !userId) return;

            console.log("🔍 Requesting status for user:", userId);
            socket.emit("get_user_status", userId, (status) => {
                console.log("✅ Received status response:", { userId, status });
                set((state) => {
                    const newOnlineUsers = new Map(state.onlineUsers);
                    newOnlineUsers.set(userId, {
                        isOnline: status?.isOnline || false,
                        lastSeen: status?.lastSeen || null,
                    });
                    console.log("🗺️ Updated onlineUsers Map:", Array.from(newOnlineUsers.entries()));
                    return { onlineUsers: newOnlineUsers };
                });
            });
        },

        // CLEANUP ON LOGOUT
        cleanup: () => {
            set({
                conversations: [],
                currentConversation: null,
                messages: [],
                onlineUsers: new Map(),
                typingUsers: new Map(),
            });
        },
    };
});

export default useChatStore;
