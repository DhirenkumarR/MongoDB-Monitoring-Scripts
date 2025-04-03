const { MongoClient } = require('mongodb');
require('dotenv').config();
// Replace with your MongoDB connection URI
const uri = process.env.DEV_DB;
const client = new MongoClient(uri);

// Ajay_Team -> No
// Sandip_Team -> No
// Haresh_Team -> No
// IdentityData -> No
// Import_Team -> No
// Live_Practice_Business_Copy -> No

let foundArr = [];
async function checkSSN() {
    try {

        const db = client.db('Live_Practice_Business_Copy');
        const collections = await db.listCollections().toArray();


        console.log("Total Collections Found:", collections.length);

        for (const collectionInfo of collections) {
            const collection = db.collection(collectionInfo.name);

            const result = await collection.findOne({
                $or: [
                    { "fullFacePhotographicImages": { $exists: true } },
                    { "facePhotographicImages": { $exists: true } },
                    { "facialImages": { $exists: true } },
                    { "faceImages": { $exists: true } },
                    { "portraitImages": { $exists: true } },
                    { "fullFaceImages": { $exists: true } },
                    { "FullFacePhotographicImages": { $exists: true } },
                    { "FacePhotographicImages": { $exists: true } },
                    { "FacialImages": { $exists: true } },
                    { "FaceImages": { $exists: true } },
                    { "PortraitImages": { $exists: true } },
                    { "FullFaceImages": { $exists: true } },
                    { "full_face_photographic_images": { $exists: true } },
                    { "face_photographic_images": { $exists: true } },
                    { "facial_images": { $exists: true } },
                    { "face_images": { $exists: true } },
                    { "portrait_images": { $exists: true } },
                    { "full_face_images": { $exists: true } },
                    { "Full_Face_Photographic_Images": { $exists: true } },
                    { "Face_Photographic_Images": { $exists: true } },
                    { "Facial_Images": { $exists: true } },
                    { "Face_Images": { $exists: true } },
                    { "Portrait_Images": { $exists: true } },
                    { "Full_Face_Images": { $exists: true } }
                ]                
            });

            if (result) {
                console.log(`Found in collection: ${collectionInfo.name}`);
                console.log("Document:", result);
                foundArr.push(
                    {
                        "collection name": collectionInfo.name,
                         "document":  result
                    }
            )
            } else {
                // console.log(`No matching document in collection: ${collectionInfo.name}`);
            }            
        }
        console.log("data>>>>>>>>>>>>>>>>>", foundArr);

    } catch (error) {
        console.error('Error checking SSN:', error);
    } finally {
        await client.close();
    }
}

checkSSN();