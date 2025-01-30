import mongoose from "mongoose";
import { DB_name } from "../constants.js";
const connectDb=async()=>{
try{
    await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_name}`)
    console.log('MongoDB connected successfully,DB:HOST');
}
catch(error){
    console.error('MongoDB connection error:', error);
    process.exit(1);
}
}
export default connectDb