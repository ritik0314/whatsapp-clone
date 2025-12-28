const User=require("../models/User");
const sendOtpToEmail=require("../services/emailService");
const otpGenerate=require("../utils/otpGenerate");
const response=require("../utils/responsehandler");
const twilioService=require('../services/twilioService');
const generateToken = require('../utils/generateToken');
const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Conversation = require("../models/Conversation");



//send otp
const sendOtp= async(req,res)=>{
    const {phoneNumber,phoneSuffix,email}=req.body;
    const otp=otpGenerate();
    const expiry=new Date(Date.now() +5*60*1000);
    let user;
    try {
        if(email){
            user=await User.findOne({email});
            if(!user){
                user=new User({email})
            }
            user.emailOtp=otp;
            user.emailOtpExpiry=expiry;
            await user.save();
            try {
                await sendOtpToEmail(email, otp);
            } catch (err) {
                console.error('Failed to send email OTP:', err?.message || err);
                return response(res,500,'Failed to send OTP email. Please check email configuration');
            }
            return response(res,200,'Otp send to your email',{email});
        }
        if(!phoneNumber|| !phoneSuffix){
            return response(res,400,'Phone number and phone suffix are required');
        }
        const fullPhoneNumber=`${phoneSuffix}${phoneNumber}`;
        user=await User.findOne({phoneNumber})
        if(!user){
            user = await  new User ({phoneNumber,phoneSuffix})
        }
        await twilioService.sendOtpToPhoneNumber(fullPhoneNumber)
        await user.save();
         return response(res,200,'Otp send successfully',user);
    } catch (error) {
       console.error(error);
       return response(res,500,'Internal server error')
    }

}

//verify otp
const verifyOtp=async(req,res)=>{
    const {phoneNumber,phoneSuffix,email,otp}=req.body;

    try {
        let user;
        if(email){
            user=await User.findOne({email});
            if(!user){
                return response(res,404,'User not found')
            }
            const now=new Date();
            if(!user.emailOtp || String(user.emailOtp) !==String(otp) || now>new Date(user.emailOtpExpiry)){
                return response(res,400,'Invalid or expired otp')
            };
            user.isVerified=true;
            user.emailOtp=null;
            user.emailOtpExpiry=null;
            await user.save();
        }

        else{
             if(!phoneNumber|| !phoneSuffix){
            return response(res,400,'Phone number and phone suffix are required');
            }
            const fullPhoneNumber=`${phoneSuffix}${phoneNumber}`;
            user=await User.findOne({phoneNumber});
            if(!user){
                return response(res,404,'User not found')
            }
            const result=await twilioService.verifyOtp(fullPhoneNumber,otp);
            if(result.status!=='approved'){
                return response(res,400,'Invalid otp');
            }
            user.isVerified=true;
            await user.save();
        }
        const token=generateToken(user?._id);
        res.cookie("authToken",token,{
            httpOnly:true,
            maxAge:1000*60*60*24*365
        });
        return response(res,200,'Otp verified successfully',{token,user})
    } catch (error) {
        console.error(error);
        return response(res,500,"Internal server error");
    }
};

const updateProfile= async(req,res)=>{
    const {username,agreed,about}= req.body || {};
    const userId = req.userId || (req.user && (req.user.userId || req.user.id || req.user._id));

    if (!userId) {
        return response(res,401,'Unauthorized: missing user id');
    }

    try {
        const user= await User.findById(userId);
        if(!user){
            return response(res,404,'User not found');
        }

        const file=req.file;
        if (file) {
            try {
                const uploadResult = await uploadFileToCloudinary(file);
                if (!uploadResult?.secure_url) {
                    return response(res,400,'Failed to upload profile image');
                }
                user.profilePicture = uploadResult.secure_url;
            } catch (err) {
                console.error('Cloudinary upload error:', err);
                return response(res,500,'Image upload failed');
            }
        } else if (req.body && req.body.profilePicture) {
            user.profilePicture = req.body.profilePicture;
        }

        if (typeof username === 'string') user.username = username;
        if (typeof about === 'string') user.about = about;
        if (typeof agreed !== 'undefined') user.agreed = agreed;

        await user.save();
        return response(res,200,'user profile updated successfully',user);
    } catch (error) {
        console.error('Update profile error:', error);
        // Handle invalid object id
        if (error?.name === 'CastError') {
            return response(res,400,'Invalid user id');
        }
        return response(res,500,'Internal server error');
    }
}

const checkAuthenticate= async(req,res)=>{
    try {
        const userId=req.userId;
        if(!userId){
            return response(res,404,'Unauthorized !please login before accessing our app')
        }
        const user=await User.findById(userId);
        if(!user){
            return response(res,404,'User not found');
        }
        return response(res, 200, "Authenticated", {
            isAuthenticated: true,
            user,
});

    } catch (error) {
        console.error(error);
        return response(res,500,"Internal server error");
    }
}

const logout= (req,res)=>{
    try {
        res.cookie("authToken","",{expires:new Date(0)});
        return response(res,200,"user Logout successfully")
    }  catch (error) {
        console.error(error);
        return response(res,500,"Internal server error");
    }
}

const mongoose = require('mongoose');
const getAllUsers = async (req,res)=>{
    const loggedInUser = req.userId || (req.user && req.user.userId);
    if(!loggedInUser){
        return response(res,401,'Unauthorized: missing user id');
    }
    const loggedInUserId = new mongoose.Types.ObjectId(loggedInUser);
    try {
        const users=await User.find({_id:{$ne:loggedInUserId}}).select(
            "username profilePicture lastSeen isOnline about phoneNumber phoneSuffix"
        ).lean();
        const usersWithConversation= await Promise.all(
            users.map(async (user)=>{
                const conversation= await Conversation.findOne({
                    participants:{$all:[loggedInUserId,user?._id]}
                }).populate({
                    path:"lastMessage",
                    select:'content createdAt sender receiver'
                }).lean();
                return {
                    ...user,
                    conversation:conversation || null
                }
            })
        );
        return response(res,200,'users retrived successfylly',usersWithConversation)
    } catch (error) {
        console.error(error);
        return response(res,500,"Internal server error")
    }
}

module.exports={
    sendOtp,
    verifyOtp,
    updateProfile,
    logout,
    checkAuthenticate,
    getAllUsers
}