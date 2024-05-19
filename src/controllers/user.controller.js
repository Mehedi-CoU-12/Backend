import { asyncHandler } from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js'
import {User} from '../models/users.models.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';

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
    console.log("email: ",email)
    res.status(200).json({
        success:true,
        message:"got the data"
    })

    if( [fullName,email,userName,password].some((field)=>field?.trim()==="") )
    {
        throw new ApiError(400,"all fields are required")
    }

    const existedUser =User.findOne({
        $or:[{ userName }, { email }]
    })

    if(existedUser)
        throw new ApiError(409,"User with email or username already exists")

    const avatarLocalPath=req.files?.avater[0]?.path
    const coverImageLocalPath= req.files?.coverImage[0]?.path;

    if(!avatarLocalPath)
        throw new ApiError(400,"Avatar files is Required")


    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=uploadOnCloudinary(coverImageLocalPath);

    if(!avatar)
        throw new ApiError(400,"avatar files is required")

    const user= await User.create({
        userName,
        avatar: avatar.url,
        coverImage: coverImage?.url ||"",
        email,
        password,
        userName: userName.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser)
        throw new ApiError(500,"something went wrong while registering the user")


    return res.status(201).json(
        new ApiResponse(200,createdUser,"User register successfully")
    )

} )

export {registerUser}