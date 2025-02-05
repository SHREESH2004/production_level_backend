import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import bcrypt from "bcrypt";
import jwt, { JsonWebTokenError } from "jsonwebtoken";

const userSchema=new Schema({
    username:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
            type:String,
            required:true,
    },
    coverImage:{
        type:String,
    },
    watchistory:[
        {
        type:Schema.Types.ObjectId,
        ref:"Video"
    }],
    password:{
        type:String,
        required:true,
    },
    refreshToken:{
type:String,
    }

},{
    timestamps:true
})

//middleware using hooks to hash password
userSchema.pre("save",async function(next){
    if(!this.isModified("password"));
    this.password=bcrypt.hash(this.password,10)
    next()
})

//hooks to make custom method async await as it takes time to compare the cryptographed password
userSchema.methods.isPasswordcorrect=async function(password) {
    await bcrypt.compare(password,this.password)
    
}

//jwt is a bearer tokens
userSchema.method.generateacesstoken=async function(){
jwt.sign({
    _id:this._id,
    email:this.email,
    username:this.username,
    fullname:this.fullname,

},
process.env.ACCESS_TOKEN_SECRET,{
expiresIn:process.env.ACCESS_TOKEN_EXPIRY
})
}
userSchema.method.generaterefreshtoken=async function(){
    jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname,
    
    },
    process.env.REFRESH_TOKEN_SECRET,{
    expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    })
    }




export const user=mongoose.model("User",userSchema)