import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema=mongoose.Schema({
    videofile:{
        type:String,
        required:true
    },
    thuumbnail:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
duration:{
        type:Number
    },
    views:{
        type:Number,
      default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }


},{
    timestamps:true
})
videoSchema.plugin(mongooseAggregatePaginate);
export const video=mongoose.model("video",videoSchema)