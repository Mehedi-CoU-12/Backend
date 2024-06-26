import { asyncHandler } from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js'
import {User} from '../models/users.models.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose';

const generateAccessAndRefreshToken=async(userId)=>{
    try {

        const user=await User.findById(userId);

        const accessToken=await user.generateAccessToken();
        const refreshToken=await user.generateRefreshToken();

        user.refreshToken=refreshToken;

        //this will save refresh token without validate the user;
        await user.save({ validateBeforeSave:false });

        return {accessToken,refreshToken};
    
        
    } catch (error) {
        throw new ApiError(500,'something went wrong while generating refresh and access token')
    }
}

const registerUser = asyncHandler( async(req,res)=>{
    
    //get user validation from frontend
    //validation -not empty
    //check if user already exist :username ,email
    //check for image and check for avatar
    //upload them to cloudinary, avatar
    //create user object- create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res;

    const {fullName,email,userName,password}=req.body

    // console.log("email: ",email)

    // res.status(200).json({
    //     success:true,
    //     message:"got the data"
    // })

    if( [fullName,email,userName,password].some((field)=>field?.trim()==="") )
    {
        throw new ApiError(400,"all fields are required")
    }

    const existedUser =await User.findOne({
        $or:[{ userName }, { email }]
    })

    if(existedUser)
        throw new ApiError(409,"User with email or username already exists")

    // console.log('files------->: ',req.files?.avatar[0]?.path)

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
        coverImageLocalPath=req.files.coverImage[0].path;

    if(!avatarLocalPath)
        throw new ApiError(400,"Avatar files is Required")


    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);



    if(!avatar)
        throw new ApiError(400,"avatar files is required")

    const user= await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url ||"",
        email,
        password,
        userName: userName.toLowerCase(),
    })

    // console.log("User.------------->",user);

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser)
        throw new ApiError(500,"something went wrong while registering the user")


    return res.status(201).json(
        new ApiResponse(200,createdUser,"User register successfully")
    )

} )

const loginUser=asyncHandler(async(req,res)=>{
    //req body->data
    //check username or email
    //password
    //access token and refresh token
    //send cookies

    const { userName,email,password }=req.body

    if(!userName && !email)
        throw new ApiError(400,"username or password is required")

    const user=await User.findOne({
        $or:[{userName},{email}]
    })

    if(!user)
        throw new ApiError(404,"User doesn't exist");

    const isPasswordValid= await user.isPasswordCorrect(password);

    if(!isPasswordValid)
        throw new ApiError(401,"Invalid user credentials")


    const {accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken");

    const options={
        httpOnly:true,
        secure:true,
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,{user:refreshToken,accessToken,loggedInUser},"user logged In successfully"))

})

const logoutUser=asyncHandler(async(req,res)=>{

    await User.findByIdAndUpdate(req.user._id,{ $unset:{ refreshToken:1 } },{new:true})

    const options={
        httpOnly:true,
        secure:true,
    }

    // console.log(refreshToken);

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logged out successfully"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incommingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;

    if(!incommingRefreshToken)
        throw new ApiError(401,"unauthorized request")

    try {
        const decodedToken= jwt.verify(incommingRefreshToken,process.env.REFRESH_TOKEN_SECRETE);
    
        const user= await User.findById(decodedToken?._id);
    
        if(!user)
            throw new ApiError(401,"invalid refresh token")
    
        if(incommingRefreshToken !== user?.refreshToken)
            throw new ApiError(401,"Refresh token is expired or used")
    
        const options={
            httpOnly:true,
            secure:true,
        }
    
        const {accessToken,newRefreshToken}= await generateAccessAndRefreshToken(user?._id);
    
        res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options).
        json(ApiResponse(200, {accessToken,refreshToken:newRefreshToken} , "AccessToken refresh successfully"))
    
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid refresh token")
    }
    
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body

    try {
        const user= await User.findById(req.user?._id);
        const isPasswordValid= await user.isPasswordCorrect(oldPassword);

        if(!isPasswordValid)
            throw new ApiError(400,"Invalid old Password")

        user.password = newPassword;
        await user.save({validateBeforeSave:false})

        return res.status(200).json(new ApiResponse(200,{},"password updated successfully"))

    } catch (error) {
        throw new ApiError(401,error?.message || "something went wrong")
    }
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body;

    const user= await User.findByIdAndUpdate(req.user?._id,{$set:{fullName,email}},{new:true} )
    .select("-password");

    return res.status(200).json(new ApiResponse(200,user,"account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path

    if(!avatarLocalPath)
        throw new ApiError(400,"Avatar file is missing")

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url)
        throw new ApiError(400,"Error while uploading avatar")

    const user= await User.findByIdAndUpdate(req.user?._id,{ $set:{ avatar:avatar.url } },{new:true}).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path

    if(!coverImageLocalPath)
        throw new ApiError(400,"coverImage file is missing")

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url)
        throw new ApiError(400,"Error while uploading avatar")

    const user= await User.findByIdAndUpdate(req.user?._id,{ $set:{ coverImage:coverImage.url } },{new:true}).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"Cover image updated successfully"))
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const { userName } = req.params;

    if(!userName?.trim())
        throw new ApiError(400,"username is missing")

    const channel=await User.aggregate([
        {
            $match:{
                userName:userName?.toLowerCase(),
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers",
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo",
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelIsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{ $in:[req.user?._id,"$subscribers.subscriber"] },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                userName:1,
                subscribersCount:1,
                channelIsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1,

            }
        }
    ])

    if(!channel?.length)
        throw new ApiError(404,"channel does not exist");

    return res.status(200)
    .json(new ApiResponse(200,channel[0],"User channel fatched successfully"))
})

const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        userName:1,
                                        avatar:1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
            
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"watch History fatched successfully"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    getCurrentUser,
}