import mongoose from "mongoose";
import connectDb from "./db/index.js";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { app } from "./app.js";
dotenv.config({
    path:'./env'
})
connectDb()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log('Server is connecting on port',process.env.PORT);
    });
})
.catch((err)=>{
    console.log("MONGO DB connect failed",err);
})


//for db connection


















//use try-catch as during db connection is always chances of facing issues as it takes time while communicating
//(()=>{})()
/*    import { DB_name } from "../src/constants";
    import e from "express";
    import 'dotenv/config'
    const app=e()
    (async()=>{
        try{
await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_name}`)
console.log('MongoDB connected successfully');
app.on("error",(error)=>{
    console.log("app not able to talk to database",error);
})
app.listen(process.env.PORT,()=>{
    console.log("App working on port",PORT);
})
        }
        catch(error){
            console.error('MongoDB connection error:', error);
        }
        
    })()*/