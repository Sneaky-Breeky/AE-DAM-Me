import { API_BASE_URL } from "./apiURL.js";
const IMAGE_URL = `${API_BASE_URL}/api/imageQuery`;
// shows all the basic tags of image
export async function getProjectImageBasicTags ({pid,fid}){
    try {
        const url = `${IMAGE_URL}/basicTagsForImage/${pid}/${fid}`
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching basic tags:', error);
        return null;
    }
}
// shows all the metadata
export async function getProjectImageMetaDataTags ({pid,fid}){
    try {
        const url = `${IMAGE_URL}/metaDataTagsForImage/${pid}/${fid}`
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching basic tags:', error);
        return null;
    }
}
export async function getProjectImageMetaDataValuesTags ({pid,fid}){
    try {
        const url = `${IMAGE_URL}/metaDataTagsValuesForImage/${pid}/${fid}`
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching basic tags:', error);
        return null;
    }
}
async function getFilesByDate({StartDate, EndDate}) {
    const sD = StartDate ? new Date(StartDate).toISOString() : '0001-01-01T00:00:00Z';
    const eD = EndDate ? new Date(EndDate).toISOString() : '0001-01-01T00:00:00Z';
    try {
        const url = `${IMAGE_URL}/date/${sD}/${eD}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP errr! Status: ${response.status}`);
        }
        return await response.json();
        ;
    } catch (error) {
        console.error("Error fetching project files:", error);
    }


}



