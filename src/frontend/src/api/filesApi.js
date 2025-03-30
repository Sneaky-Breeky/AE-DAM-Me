// import { API_BASE_URL } from "./apiURL.js"

// const FILE_URL = `${API_BASE_URL}/api/files`;

// export async function fetchUserPalette(userId, projectId) {
//     try {
//         const response = await fetch(`${FILE_URL}/`);
//     } catch (err) {

//     }
// }

// export async function uploadToBlob(file, userId, projectId) {
//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("userId", userId);
//     formData.append("projectId", projectId);

//     const response = await fetch(`${FILE_URL}/upload-single`, {
//         method: "POST",
//         body: formData,
//     });

//     if (!response.ok) {
//         const err = await response.text();
//         throw new Error(`Upload failed: ${err}`);
//     }

//     return await response.json(); // returns { originalUrl, thumbnailUrl, metadata }
// }