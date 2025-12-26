const { default: mongoose } = require("mongoose");
const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const response = require("../utils/responsehandler");

// -----------------------------
// SEND MESSAGE
// -----------------------------
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.userId; // ✅ FROM JWT
    const { receiverId, content, messageStatus } = req.body;
    const file = req.file;

    if (!receiverId) {
      return response(res, 400, "Receiver ID is required");
    }

    const participants = [senderId, receiverId].sort();

    // Check if conversation already exists
     let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = new Conversation({ participants });
      await conversation.save();
    }

    let imageOrVideoUrl = null;
    let contentType = null;

    // Handle file upload
    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);
      if (!uploadFile?.secure_url) {
        return response(res, 400, "Failed to upload media");
      }
      imageOrVideoUrl = uploadFile?.secure_url;

      if (file.mimetype.startsWith("image")) {
        contentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        contentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (content?.trim()) {
      contentType = "text";
    } else {
      return response(res, 400, "Message content is required");
    }

    // Create message
    const message = new Message({
      conversation: conversation?._id,
      sender: senderId,
      receiver: receiverId,
      content,
      contentType,
      imageOrVideoUrl,
      messageStatus: messageStatus || "sent",
    });

    await message.save();

    // Update conversation
    if(message?.content){
      conversation.lastMessage = message?._id;
    }
    conversation.unreadCount +=1;
    await conversation.save();

    const populatedMessage = await Message.findById(message?._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture");

      //emit socket event for realtime
      if (req.io && req.socketUserMap) {
        const receiverSocketId=req.socketUserMap.get(receiverId);
        if(receiverSocketId){
          req.io.to(receiverSocketId).emit("receive_message",populatedMessage);
          message.messageStatus="delivered";
          await message.save();
        }
    }

    return response(res, 201, "Message sent successfully", populatedMessage);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};


// GET all  CONVERSATIONS

exports.getConversation = async (req, res) => {
  try {
     const userId = new mongoose.Types.ObjectId(req.userId);
    const conversations = await Conversation.find({
      participants: { $elemMatch: { $eq: userId } }
    })
      .populate("participants", "username profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "username profilePicture",
        }
      }).sort({ updatedAt: -1 });
      console.log("AUTH USER ID:", req.userId);
      const all = await Conversation.find();
console.log("TOTAL CONVERSATIONS IN API DB:", all.length);



    return response(res, 200, "Conversations retrieved successfully", conversations);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// -----------------------------
// GET MESSAGES OF A CONVERSATION
// -----------------------------
exports.getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.userId;

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return response(res, 404, "Conversation not found");
    }

    if (!conversation.participants.includes(userId)) {
      return response(res, 403, "Not authorized to view this conversation");
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .sort("createdAt");

    // Mark as read for this user
    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        messageStatus: { $in: ["sent", "delivered"] },
      },
      { $set: { messageStatus: "read" } }
    );

    conversation.unreadCount = 0;
    await conversation.save();

    return response(res, 200, "Messages retrieved successfully", messages);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// -----------------------------
// MARK AS READ
// -----------------------------
exports.markAsRead = async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.userId;

    //get relavent message to determine senders
  try {
    let messages= await Message.find({
      _id:{$in:messageIds},
      receiver:userId
    });

    await Message.updateMany(
      { _id: { $in: messageIds }, receiver: userId },
      { $set: { messageStatus: "read" } }
    );

    //notify to original sender
     if (req.io && req.socketUserMap) {
        for(const message of messages){
            const senderSocketId=req.socketUserMap.get(message.sender.toString());
            if(senderSocketId){
              const updatedMessage={
                _id:message._id,
                messageStatus:"read",
              };
              req.io.to(senderSocketId).emit("message_read",updatedMessage);
              await message.save();
            }
        }
    }

    const updatedMessages = await Message.find({ _id: { $in: messageIds } });
    return response(res, 200, "Messages marked as read", updatedMessages);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// -----------------------------
// DELETE MESSAGE
// -----------------------------
exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.userId;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return response(res, 404, "Message not found");
    }

    if (message.sender.toString() !== userId) {
      return response(res, 403, "Not authorized to delete this message");
    }

    await message.deleteOne();

    if (req.io && req.socketUserMap) {
      const receiverSocketId=req.socketUserMap.get(message.receiver.toString())
      if(receiverSocketId){
        req.io.to(receiverSocketId).emit("message_deleted",messageId)
      }
    }

    return response(res, 200, "Message deleted successfully");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};
