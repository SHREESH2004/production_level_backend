import {asynchandler} from "../utills/asynchandler.js";
const registeruser=asynchandler(async(req,res,next)=>{
    res.status(200).json({
        message:"Hello developer",
    })
})
export {registeruser}