import mongoose from "mongoose";


const likeSchema=new mongoose.Schema({
    comment:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment",
    },
    video:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    },
    tweet:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Tweet"
    },
    likeBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    }
},{timestamps:true})

export const Like = mongoose.model("Like",likeSchema)