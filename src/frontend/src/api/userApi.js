import { API_BASE_URL } from "./apiURL.js";

const PROJECTS_URL = `${API_BASE_URL}/api/damprojects`;


export async function giveUserAccess(userId, projectId) {
    try {
        const response = await fetch(`${PROJECTS_URL}/AccessList/${userId}/${projectId}`, {
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
        console.error("Error giving user access:", error);
        return { error: "Network error or server unreachable", message: error.message };
    }
}

export async function removeAllUserAccess(projectId) {
    try {
        const response = await fetch(`${PROJECTS_URL}/AccessList/${projectId}`, {
            method: "DELETE",
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

        return { message: "All access removed." };
    } catch (error) {
        console.error("Error removing all access:", error);
        return { error: "Network error or server unreachable", message: error.message };
    }
}
