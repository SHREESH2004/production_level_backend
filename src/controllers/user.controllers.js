import { asynchandler } from "../utills/asynchandler.js";
import { ApiError } from "../utills/apierror.js";
import { User } from "../models/user.model.js";
import { uploadonCloudinary } from "../utills/cloudinary.js";
import { Apiresponse } from "../utills/apiresponse.js";
import jwt from "jsonwebtoken";

const GenerateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found");

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Token generation failed");
    }
};

const registerUser = asynchandler(async (req, res, next) => {
    const { fullname, email, username, password } = req.body;

    if ([fullname, email, username, password].some(field => !field?.trim())) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) {
        throw new ApiError(409, "User with this email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) throw new ApiError(400, "Avatar is required");

    const avatar = await uploadonCloudinary(avatarLocalPath);
    if (!avatar) throw new ApiError(500, "Avatar upload failed");

    const coverImage = coverImageLocalPath ? await uploadonCloudinary(coverImageLocalPath) : null;

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) throw new ApiError(500, "User registration failed");

    return res.status(201).json(new Apiresponse(201, createdUser, "User registered successfully"));
});

const loginUser = asynchandler(async (req, res, next) => {
    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) throw new ApiError(404, "User not found");

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

    const { accessToken, refreshToken } = await GenerateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = { httpOnly: true, secure: true };

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new Apiresponse(200, { user: loggedInUser, accessToken, refreshToken }, "Login successful"));
});

const logoutUser = asynchandler(async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: "" } }, { new: true });

        const options = {
            httpOnly: true,
            secure: true,
            expires: new Date(0),
        };

        return res
            .cookie("accessToken", "", options)
            .cookie("refreshToken", "", options)
            .status(200)
            .json(new Apiresponse(200, {}, "Logout successful"));
    } catch (error) {
        next(new ApiError(500, "Logout failed"));
    }
});

const refreshAcessToken = asynchandler(async (req, res, next) => {
    const incomingRefreshtoken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshtoken) {
        throw new ApiError(400, "Unauthorized request");
    }

    try {
        const decodedtoken = jwt.verify(
            incomingRefreshtoken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedtoken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }
        if (incomingRefreshtoken != user?.refreshToken) {
            throw new ApiError(401, "Invalid refresh token or refresh token is expired");
        }

        const options = { httpOnly: true, secure: true };
        const { accessToken, newrefreshToken } = await GenerateAccessAndRefreshToken(user._id);

        return res
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .status(200)
            .json(new Apiresponse(200, { accessToken, refreshToken: newrefreshToken }, "Access Token refreshed"));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const changeCurrentUserPassword = asynchandler(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }

    const user = await User.findById(req.user?.id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new Apiresponse(200, {}, "Password changed successfully"));
});

const getcurrentUser = asynchandler(async (req, res, next) => {
    return res.status(200).json(new Apiresponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asynchandler(async (req, res, next) => {
    const{fullname,email}=req.body;
    if(!fullname||!email){
        throw new ApiError(400,"All fields required")
    }
    const user=await User.findByIdAndUpdate(
        req.user?.id,
        {
            $set:
            fullname,
            email:email
        },
        {new:true}
    ).select("-password")
    return res.status(200).json(new Apiresponse(200,{},"Account details updated succesfully"))
})
const updateUserAvatar=asynchandler(async(req,res,next)=>{
    const avatarLocalPath=req.files?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file missing")
    }
    const avatar=uploadonCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"Problem while uploading the avatar")
    }
    await User.findByIdAndUpdate(req.user?._id),{
            $set:{
            avatar:avatar.url,
            }
    },{new:true}.select("-password")
    return res.status(200).json(new  Apiresponse(200,{},"Avatar Updated successfully"))
})
const updateUserCoverImage=asynchandler(async(req,res,next)=>{
    const coverLocalPath=req.files?.path
    if(!coverLocalPath){
        throw new ApiError(400,"Avatar file missing")
    }
    const cover=uploadonCloudinary(coverLocalPath)
    if(!cover.url){
        throw new ApiError(400,"Problem while uploading the avatar")
    }
    await User.findByIdAndUpdate(req.user?._id),{
            $set:{
            coverImage:cover.url,
            }
    },{new:true}.select("-password")
    return res.status(200).json(new  Apiresponse(200,{},"Cover Image Updated successfully"))
})
export { registerUser, loginUser, logoutUser, refreshAcessToken, changeCurrentUserPassword, getcurrentUser,updateUserAvatar,updateUserCoverImage };
