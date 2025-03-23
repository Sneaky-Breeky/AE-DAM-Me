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

// create new project
export async function postProject(projectData) {
    try {
        const response = await fetch(`${PROJECTS_URL}/postproj`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(projectData)
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


// edit a project
export async function putProject(projectId, updatedProjectData) {
    try {
        const response = await fetch(`${PROJECTS_URL}/${projectId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedProjectData)
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

export async function deleteProject(projectId) {
    try {
        const response = await fetch(`${PROJECTS_URL}/${projectId}`, {
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

        return { success: true };
    } catch (error) {
        console.error("Network or fetch error:", error);
        return { error: "Network error or server unreachable", message: error.message };
    }
}


export async function fetchTagsForProject(projectId) {
    try {
        const url = `${PROJECTS_URL}/${projectId}/tags`;

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

        return await response.json(); // array of tag objects
    } catch (error) {
        console.error("Network or fetch error:", error);
        return { error: "Network error or server unreachable", message: error.message };
    }
}




export async function addProjectTag(ProjectId, Key, Value, type) {
    try {
        const url = new URL(`${PROJECTS_URL}/addprojtag`);
        url.searchParams.append("ProjectId", ProjectId);
        url.searchParams.append("Key", Key);
        url.searchParams.append("Value", Value);
        url.searchParams.append("type", type);

        const response = await fetch(url.toString(), {
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




export async function deleteProjectTag(key, projectId) {
    try {
        const url = `${PROJECTS_URL}/${key}/${projectId}`;
        console.log(`Deleting project tag from: ${url}`);

        const response = await fetch(url, {
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

        return { success: true };
    } catch (error) {
        console.error("Network or fetch error:", error);
        return { error: "Network error or server unreachable", message: error.message };
    }
}



