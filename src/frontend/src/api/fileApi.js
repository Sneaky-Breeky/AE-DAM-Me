// get the keys for metadata
// upload the metadata values

import { API_BASE_URL } from "./apiURL.js";
const META_URL = `${API_BASE_URL}/api/metaData`;
const FILES_URL = `${API_BASE_URL}/api/files`;
export async function addMetaBasicTag(fid,value) {
    console.log("i am here basic");
    try {
        const response = await fetch(`${META_URL}/basic/${fid}/${value}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                return { error: errorData.message || "Unknown error" };
            } catch {
                return { error: `HTTP Error ${response.status}: ${errorText}` };
            }
        }
        return await response.json();
    } catch (error) {
        console.error("Network or fetch error:", error);
        return { error: "Network error or server unreachable", message: error.message };
    }
}
export async function addMetaAdvanceTag(fid,requestBody) {
    console.log("i am here md");
    try {
        const response = await fetch(`${META_URL}/advanced/${fid}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                return { error: errorData.message || "Unknown error" };
            } catch {
                return { error: `HTTP Error ${response.status}: ${errorText}` };
            }
        }
        return await response.json();
    } catch (error) {
        console.error("Network or fetch error:", error);
        return { error: "Network error or server unreachable", message: error.message };
    }
}

export async function assignSuggestedProjectToFile(projectId, fileId) {
    try {
        const response = await fetch(`${META_URL}/projectSuggestion/${projectId}/${fileId}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to assign suggested project: ${errorText}`);
        }

        return await response.text();
    } catch (error) {
        console.error('Error assigning suggested project to file:', error);
        return { error: error.message };
    }
}

export async function downloadFilesZip(files) {
    try {
        const response = await fetch(`${FILES_URL}/download-zip`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(files)
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                return {error: errorData.message || "Unknown error"};
            } catch {
                return {error: `HTTP Error ${response.status}: ${errorText}`};
            }
        }
        const blob = await response.blob(); // Convert response to binary (blob)

        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "DownloadedFiles.zip"; // Set filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url); // Clean up memory
        return true;
    } catch (error) {
        console.error("Network or fetch error:", error);
        return {error: "Network error or server unreachable", message: error.message};
    }
}
export async function deleteFiles(filesNAME) {
    try {
        const response = await fetch(`${FILES_URL}/delete-files`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(filesNAME)
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                return { error: errorData.message || "Unknown error" };
            } catch {
                return { error: `HTTP Error ${response.status}: ${errorText}` };
            }
        }
        return true;
    } catch (error) {
        console.error("Network or fetch error:", error);
        return { error: "Network error or server unreachable", message: error.message };
    }
}

export async function deleteFilesDB(fileIds) {
    try {
        const response = await fetch(`${FILES_URL}/delete-files-db`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(fileIds)
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                return { error: errorData.message || "Unknown error" };
            } catch {
                return { error: `HTTP Error ${response.status}: ${errorText}` };
            }
        }
        return true;
    } catch (error) {
        console.error("Network or fetch error:", error);
        return { error: "Network error or server unreachable", message: error.message };
    }
}



