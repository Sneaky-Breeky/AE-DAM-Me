import { API_BASE_URL } from "./apiURL.js";
const LOG_URL = `${API_BASE_URL}/api/log`;
export async function fetchLog(userId) {
    try {
        const response = await fetch(`${LOG_URL}/fetch/${userId}`, {
            method: "GET",
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
export async function fetchProjectLog(projectId) {
    try {
        const response = await fetch(`${LOG_URL}/fetchProjectLog/${projectId}`, {
            method: "GET",
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

export async function addLog(userID, fileID, projectId, typeOfLog) {

    const logData = {
        FileId: fileID,
        ProjectId: projectId,
        UserId: userID,
        TypeOfLog: typeOfLog,
        Date: new Date().toISOString(),
    };
    console.log("inside log");
    console.log(logData);
    try {
        const response = await fetch(`${LOG_URL}/addLog`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(logData)
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
        return { success: true };
    } catch (error) {
        console.error("Network or fetch error:", error);
        return { error: "Network error or server unreachable", message: error.message };
    }
}
