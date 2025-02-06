import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app=express();
app.use(cors({
    origin:process.env.origin,
    credentials:true
}))
app.use(express.json({limit:"16kb"}))
app.use((express.urlencoded({extended:true})))
app.use(express.static("public"))//folder name 
app.use(cookieParser())

import userRoutes from "./routes/user.routes.js"
app.use("/users",userRoutes);
export{app};