import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import { User } from '../models/user.model.js';
import { asynchandler } from '../utills/asynchandler.js';
import { ApiError } from '../utills/apierror.js';
import { Apiresponse } from '../utills/apiresponse.js';
import { uploadonCloudinary } from '../utills/cloudinary.js';
import { mongo } from 'mongoose';
import mongoose from 'mongoose';
// Register a user
const registerUser = asynchandler(async (req, res, next) => {
    const { fullname, username, email, password } = req.body;

    if (!fullname || !username || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        throw new ApiError(400, "Email or Username already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ fullname, username, email, password: hashedPassword });

    res.status(201).json(new Apiresponse(201, newUser, "User registered successfully"));
});

// Login a user
const loginUser = asynchandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and Password are required");
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new ApiError(401, "Invalid credentials");
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.status(200).json(new Apiresponse(200, { token }, "Login successful"));
});

// Logout a user
const logoutUser = asynchandler(async (req, res, next) => {
    res.status(200).json(new Apiresponse(200, null, "Logout successful"));
});

// Refresh Access Token
const refreshAcessToken = asynchandler(async (req, res, next) => {
    const { token } = req.body;
    if (!token) {
        throw new ApiError(400, "Token is required");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const newToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.status(200).json(new Apiresponse(200, { token: newToken }, "Token refreshed successfully"));
    } catch (error) {
        throw new ApiError(401, "Invalid or expired token");
    }
});

// Change Current User Password
const changeCurrentUserPassword = asynchandler(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Both old and new passwords are required");
    }

    const user = await User.findById(req.user._id);
    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
        throw new ApiError(401, "Incorrect old password");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json(new Apiresponse(200, null, "Password updated successfully"));
});

// Get Current User
const getcurrentUser = asynchandler(async (req, res, next) => {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json(new Apiresponse(200, user, "User fetched successfully"));
});

// Update Account Details
const updateAccountDetails = asynchandler(async (req, res, next) => {
    const { fullname, email } = req.body;

    if (!fullname || !email) {
        throw new ApiError(400, "Fullname and Email are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        { new: true }
    ).select("-password");

    res.status(200).json(new Apiresponse(200, user, "Account details updated successfully"));
});

// Update User Avatar
const updateUserAvatar = asynchandler(async (req, res, next) => {
    const avatarLocalPath = req.files?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file missing");
    }

    const avatar = await uploadonCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400, "Problem while uploading the avatar");
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password");

    res.status(200).json(new Apiresponse(200, updatedUser, "Avatar updated successfully"));
});

// Update User Cover Image
const updateUserCoverImage = asynchandler(async (req, res, next) => {
    const coverLocalPath = req.files?.path;
    if (!coverLocalPath) {
        throw new ApiError(400, "Cover image file missing");
    }

    const cover = await uploadonCloudinary(coverLocalPath);
    if (!cover.url) {
        throw new ApiError(400, "Problem while uploading the cover image");
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { coverImage: cover.url } },
        { new: true }
    ).select("-password");

    res.status(200).json(new Apiresponse(200, updatedUser, "Cover image updated successfully"));
});

// Get User Channel Profile
const getUserChannelProfile = asynchandler(async (req, res, next) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username missing");
    }

    const channel = await User.aggregate([
        {
            $match: { username: username.toLowerCase() }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: { $size: "$subscribers" },
                channelSubscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ]);

    if (!channel || channel.length === 0) {
        throw new ApiError(404, "Channel does not exist");
    }

    res.status(200).json(new Apiresponse(200, channel[0], "User channel fetched successfully"));
});

const getwatchHistory = asynchandler(async (req, res, next) => {
    const watchHistory = await User.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(req.user._id) }
        },
        {
            $lookup: {
                from: "videos", // Ensure the collection name is accurate
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users", // Ensure the collection name is accurate
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner"
                        }
                    },
                    {
                        $unwind: "$owner"
                    },
                    {
                        $project: {
                            title: 1,
                            description: 1,
                            createdAt: 1,
                            owner: {
                                fullname: 1,
                                username: 1,
                                avatar: 1
                            }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                watchHistory: 1
            }
        }
    ]);

    if (!watchHistory || watchHistory.length === 0) {
        throw new ApiError(404, "No watch history found");
    }

    res.status(200).json(new Apiresponse(200, watchHistory, "Watch history fetched successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAcessToken, 
    changeCurrentUserPassword,
    getcurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getwatchHistory
};
