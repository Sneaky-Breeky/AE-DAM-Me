import { API_BASE_URL } from "./apiURL.js";
const LOG_URL = `${API_BASE_URL}/api/log`;
export async function fetchLog( userId) {
    try {
        const response = await fetch(`${LOG_URL}/fetch/${projectId}`, {
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
export async function addLog(userID, fileID, typeOfLog) {
    const logData = {
        FileId: fileId,
        UserId: userId,
        TypeOfLog: typeOfLog,
        Date: new Date().toISOString(),
    };
    try {
        const response = await fetch(`${LOG_URL}}`, {
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
