const { Server } = require("socket.io");
const User = require("../models/User");
const Message = require("../models/Message");
const handleVideoCallEvent = require("./video-call-events");
const socketMiddleware = require("../middleware/socketMiddleware");

//map to store online users->userId,socketId
const onlineUsers = new Map();

//map to track typing status->userId->[conversation]:boolean

const typingUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
    //  transports: ["websocket"],
    pingTimeout: 60000, //disconnect inactive users or sockets after 60 seconds
  });

  //middleware 
  io.use(socketMiddleware);


  //when a new socket connection is established
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    let userId = null;

    //handle user connection and mark them online in db
    socket.on("user_connected", async (connectingUserId) => {
      try {
        userId = connectingUserId;
        socket.userId=userId;
        onlineUsers.set(userId, socket.id);
        socket.join(userId); //join a personal room for direct emit

        //update user status in db
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        //notify all users that this user is now online
        io.emit("user_status", { userId, isOnline: true });
      } catch (error) {
        console.error("Error handling user connection ", error);
      }
    });

    //return online status of requested user
    socket.on("get_user_status", async (requestedUserId, callback) => {
      try {
        const isOnline = onlineUsers.has(requestedUserId);
        let lastSeen = null;

        if (!isOnline) {
          // Fetch lastSeen from database for offline users
          const user = await User.findById(requestedUserId).select("lastSeen");
          lastSeen = user?.lastSeen || null;
        }

        callback({
          userId: requestedUserId,
          isOnline,
          lastSeen: isOnline ? null : lastSeen,
        });
      } catch (error) {
        console.error("Error getting user status:", error);
        callback({
          userId: requestedUserId,
          isOnline: false,
          lastSeen: null,
        });
      }
    });

    //forward message to receiver if online
    socket.on("send_message", async (message) => {
      try {
        const receiverSocketId = onlineUsers.get(message.receiver?._id);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("received_message", message);
        }
      } catch (error) {
        console.error("Error sending message", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    //update message as read and notify sender
    socket.on("message_read", async ({ messageIds, senderId }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { messageStatus: "read" } }
        );

        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          messageIds.forEach((messageId) => {
            io.to(senderSocketId).emit("message_status_update", {
              messageId,
              messageStatus: "read",
            });
          });
        }
      } catch (error) {
        console.error("Error updating message read status", error);
      }
    });

    //handle typing start event and auto-stop after 3s
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (!typingUsers.has(userId)) typingUsers.set(userId, {});

      const userTyping = typingUsers.get(userId);

      userTyping[conversationId] = true;

      //clear any existing timeout
      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
      }

      //auto-stop after 3s
      userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        userTyping[conversationId] = false;
        socket.to(receiverId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }, 3000);

      //notify receiver
      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (typingUsers.has(userId)) {
        const userTyping = typingUsers.get(userId);
        userTyping[conversationId] = false;

        if (userTyping[`${conversationId}_timeout`]) {
          clearTimeout(userTyping[`${conversationId}_timeout`]);
          delete userTyping[`${conversationId}_timeout`];
        }
      }
      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    //add or update reaction on message
    socket.on(
      "add_reaction",
      async ({ messageId, emoji, userId,reactionUserId }) => {
        try {
          const message = await Message.findById(messageId);
          if (!message) return;

          const existingIndex = message.reactions.findIndex(
            (r) => r.user.toString() === reactionUserId
          );
          if (existingIndex > -1) {
            const existing = message.reactions[existingIndex];
            if (existing.emoji === emoji) {
              //remove same reactions
              message.reactions.splice(existingIndex, 1);
            } else {
              //change emojis
              message.reactions[existingIndex].emoji = emoji;
            }
          } else {
            //add new reactions
            message.reactions.push({ user:reactionUserId, emoji });
          }
          await message.save();

          const populatedMessage = await Message.findById(message._id)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")
            .populate("reactions.user", "username");

          const reactionUpdated = {
            messageId,
            reactions: populatedMessage.reactions,
          };
          const senderSocket = onlineUsers.get(
            populatedMessage.sender._id.toString()
          );
          const receiverSocket = onlineUsers.get(
            populatedMessage.receiver?._id.toString()
          );

          if (senderSocket)
            io.to(senderSocket).emit("reaction_update", reactionUpdated);

          if (receiverSocket)
            io.to(receiverSocket).emit("reaction_update", reactionUpdated);
        } catch (error) {
          console.log("Error handling reaction", error);
        }
      }
    );

    //handle video call events
    handleVideoCallEvent(socket,io,onlineUsers)

    //handle disconnection and mark user offline
    const handleDisconnected = async () => {
      if (!userId) return;
      try {
        onlineUsers.delete(userId);
        //clear all typing timeouts
        if (typingUsers.has(userId)) {
          const userTyping = typingUsers.get(userId);
          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith("_timeout")) clearTimeout(userTyping[key]);
          });
          typingUsers.delete(userId);
        }
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("user_status", {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });

        socket.leave(userId), console.log(`user ${userId} disconnected `);
      } catch (error) {
        console.error("Error handling disconnection", error);
      }
    };

    //disconnect event
    socket.on("disconnect", handleDisconnected);
  });

  //attact the online user map to the socket server for external use
  io.socketUserMap = onlineUsers;
  return io;
};

module.exports = initializeSocket;
