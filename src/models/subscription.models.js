import mongoose, { Schema } from "mongoose";
import { asynchandler } from "../utills/asynchandler";
import { ApiError } from "../utills/apierror";
import { User } from "./user.model";

const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        channel: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
