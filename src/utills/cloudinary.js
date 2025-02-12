import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from 'dotenv';
dotenv.config();
if (!process.env.CLOUD_NAME || !process.env.API_KEY || !process.env.API_SECRET) {
    throw new Error("Cloudinary API credentials are missing. Check your .env file.");
}

cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECRET 
});

const uploadonCloudinary = async (localFilepath) => {
    try {
        if (!localFilepath) {
            return null;
        }
        const response = await cloudinary.uploader.upload(localFilepath, {
            resource_type: "auto"
        });
        console.log("File uploaded to Cloudinary:", response.url);
        return response;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        if (fs.existsSync(localFilepath)) {
            fs.unlinkSync(localFilepath); 
        }
        return null;
    }
};

export { uploadonCloudinary };