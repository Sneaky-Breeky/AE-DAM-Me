// get the keys for metadata
// upload the metadata values

import { API_BASE_URL } from "./apiURL.js";

// const QUERY_URL = `${API_BASE_URL}/api/query`;
const META_URL = `${API_BASE_URL}/api`;
export async function addMetaBasicTag(fid,value) {
    console.log("enter basic tag fn");
    console.log(fid);
    console.log(value);
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
    console.log("enter advance tag fn");
    console.log(fid);
    console.log(requestBody);
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