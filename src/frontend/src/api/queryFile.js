import { API_BASE_URL } from "./apiURL.js";

const QUERY_URL = `${API_BASE_URL}/api/query`;

export async function fetchProjectsByDateRange(StartDate, EndDate) {
    try {
        const isValid = (d) => {
            const date = new Date(d);
            return date instanceof Date && !isNaN(date);
        };

        const sD = isValid(StartDate) ? new Date(StartDate).toISOString() : '0001-01-01T00:00:00Z';
        const eD = isValid(EndDate) ? new Date(EndDate).toISOString() : '0001-01-01T00:00:00Z';

        const url = `${QUERY_URL}/projectQuery/null/null/${sD}/${eD}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed to fetch filtered projects: ${errText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("fetchProjectsByDateRange error:", error);
        return [];
    }
}
export async function getProjectBasicTags (pid){
    //console.log("insider query api");
    // console.log(pid);
    try {
        const url = `${QUERY_URL}/basictags/${pid}`
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
export async function getProjectMetaDataKeysUpload (pid){
    try {
        const url = `${QUERY_URL}/metadatatags/${pid}`
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
export async function getProjectMetaDataKeysFilesUpload (pid){
    try {
        const url = `${QUERY_URL}/metadatatagsFile/${pid}`
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // console.log("insdide qhery");
        // console.log(await response.json());

        return await response.json();
    } catch (error) {
        console.error('Error fetching basic tags:', error);
        return null;
    }
}
export async function getProjectMetaDataTags (pid){
    try {
        const url = `${QUERY_URL}/metadatatags/${pid}`
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
export async function getProjectMetaDataValuesTags ({pid}){
    try {
        const url = `${QUERY_URL}/metadatatagsValues/${pid}`
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
async function searchProject(pid, requestBody) {
    try {
        const url = `${QUERY_URL}/searchProject/${pid}`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP errr! Status: ${response.status}`);
        }

        const filesResult = await response.json();
        return filesResult;
    } catch (error) {
        console.error("Error fetching project files:", error);
    }
}

export async function searchProjectFiles(pid, filterPayload) {
    try {
        const response = await fetch(`${QUERY_URL}/searchProject/${pid}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filterPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const files = await response.json();
        return files;
    } catch (error) {
        console.error("Error fetching filtered project files:", error);
        return [];
    }
}
