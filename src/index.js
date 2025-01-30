import mongoose from "mongoose";
import connectDb from "./db/index.js";
import dotenv from "dotenv";
dotenv.config({
    path:'./env'
})
connectDb();






















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