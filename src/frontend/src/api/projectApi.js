import { API_BASE_URL } from "./apiURL.js";

const PROJECTS_URL = `${API_BASE_URL}/api/damprojects`;

export async function fetchProjects() {
    try {
        const response = await fetch(`${PROJECTS_URL}/getallprojs`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log(`Fetching projects from: ${PROJECTS_URL}/getprojs`);

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

export async function fetchUsersForProject(projectId) {
    try {
        const url = `${PROJECTS_URL}/${projectId}/users`;
        console.log(`Fetching users for project ${projectId} from: ${url}`);

        const response = await fetch(url, {
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

