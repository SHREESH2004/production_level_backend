import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

(async function() {

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.cloud_name, 
        api_key: process.env.API_key, 
        api_secret: process.env.API_secret 
    });
    
});

const uploadonCloudinary=async(localFilepath)=>{
    try{
        if(!localFilepath){
            return null
        }
        const response= await cloudinary.uploader.upload(localFilepath,{
            resource_type:"auto"
        })
        console.log("File uploaded in Cloudinary",response.url);
        return response
    }catch(error){
        fs.unlinkSync(localFilepath)//remove the locally saved temporary files as the upload operation got failed
        return null;

    }
    
}
export {uploadonCloudinary};
