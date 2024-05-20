import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs';

cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRETE // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloudinary=async(localFilePath)=>{
    try {

        if(!localFilePath)
            return null
    
        //upload the file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        });
    
        //file uploaded successfully
        // console.log('file uploaded successfully',response.url);
        fs.unlinkSync(localFilePath);
    
        return response;

    } catch (error) {
        //remove the loacally saved temporary file as the upload operation got failed
        fs.unlinkSync();
        return null;
    }
}

export {uploadOnCloudinary}

// (async function() {

//     // Configuration
//     cloudinary.config({ 
//         cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
//         api_key:process.env.CLOUDINARY_API_KEY, 
//         api_secret:process.env.CLOUDINARY_API_SECRETE // Click 'View Credentials' below to copy your API secret
//     });
    
//     // Upload an image
//     const uploadResult = await cloudinary.uploader.upload("https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg", {
//         public_id: "shoes"
//     }).catch((error)=>{console.log(error)});
    
//     console.log(uploadResult);
    
//     // Optimize delivery by resizing and applying auto-format and auto-quality
//     const optimizeUrl = cloudinary.url("shoes", {
//         fetch_format: 'auto',
//         quality: 'auto'
//     });
    
//     console.log(optimizeUrl);
    
//     // Transform the image: auto-crop to square aspect_ratio
//     const autoCropUrl = cloudinary.url("shoes", {
//         crop: 'auto',
//         gravity: 'auto',
//         width: 500,
//         height: 500,
//     });
    
//     console.log(autoCropUrl);    
// })();