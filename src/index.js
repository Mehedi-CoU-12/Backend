//require('dotenv').config();
import dotenv from 'dotenv'
import connectDB from "./db/dbConnect.js";
import { app } from './app.js';


dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`server is running at port: ${process.env.PORT}`)
    })
})
.catch((error)=>{console.log("MONGODB CONNECTION FAILED !!!",error)});    









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