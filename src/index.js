//require('dotenv').config();
import dotenv from 'dotenv'
import express from 'express'
import connectDB from "./db/dbConnect.js";

dotenv.config({
    path:'./env'
})

connectDB();    

const app=express();


/*
;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        app.listen(process.env.PORT,()=>{
            console.log(`App listen on ${precess.env.PORT}`)
        })
        
    } catch (error) {
        console.log("error",error)
        throw error
    }
})()
*/