import { API_BASE_URL } from "./apiURL.js";

const PROJECTS_URL = `${API_BASE_URL}/api/damprojects`;


export async function fetchProject(projectId) {
    try {
        const response = await fetch(`${PROJECTS_URL}/${projectId}`);
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || "Failed to fetch project");
        }
        return await response.json();
    } catch (err) {
        console.error("Error fetching project by ID:", err);
        return { error: err.message };
    }
}

export async function fetchProjects() {
    try {
        const response = await fetch(`${PROJECTS_URL}/getallprojs`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log(`Fetching projects from: ${PROJECTS_URL}/getallprojs`);

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                return { error: errorData.message || "Unknown error" };
            } catch {
                return { error: `HTTP Error ${response.status}: ${errorText}` };
            }
        }

        const projects = await response.json();
        

        const processedProjects = await Promise.all(
            projects.map(async (project) => {
                const fileModel = await getFirstImageForProject({ projectId: project.id });
                //console.log(fileModel);

                return {
                    ...project,
                    ImagePath: fileModel?.thumbnailPath
                        ? fileModel.thumbnailPath
                        : "/images/emptyProject.png",
                };
            })
        );
        //console.log(processedProjects);
        
        //console.log("Processed Image Paths:", processedProjects.map(p => p.ImagePath));

        return processedProjects;
    } catch (error) {
        console.error("Network or fetch error:", error);
        return { error: "Network error or server unreachable", message: error.message };
    }
}

export async function fetchProjectsForUser(userId) {
    try {
        const response = await fetch(`${PROJECTS_URL}/AccessList/${userId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to fetch user's projects");
        }

        // 1. Get the actual project data (array)
        const projects = result.data || [];

        // 2. Remap the 'imagePath' to a valid URL
        const processedProjects = await Promise.all(
            projects.map(async (project) => {
                const fileModel = await getFirstImageForProject({ projectId: project.id });
                //console.log(fileModel);

                return {
                    ...project,
                    ImagePath: fileModel?.thumbnailPath
                        ? fileModel.thumbnailPath
                        : "/images/emptyProject.png",
                };
            })
        );

        return processedProjects;
    } catch (error) {
        console.error("Error fetching user projects:", error);
        return { error: error.message };
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

export async function addFavorite(userId, projectId) {
    try {
        const response = await fetch(`${PROJECTS_URL}/AccessList/favorite/${userId}/${projectId}`, {
            method: 'PUT',
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || "Failed to add favorite");
        }

        return await response.json();
    } catch (err) {
        console.error("Error adding favorite:", err);
        return { error: err.message };
    }
}

export async function removeFavorite(userId, projectId) {
    try {
        const response = await fetch(`${PROJECTS_URL}/AccessList/removefavorite/${userId}/${projectId}`, {
            method: 'PUT',
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || "Failed to remove favorite");
        }

        return await response.json();
    } catch (err) {
        console.error("Error removing favorite:", err);
        return { error: err.message };
    }
}

export async function fetchFavoriteProjects(userId) {
    try {
        const response = await fetch(`${PROJECTS_URL}/AccessList/FavProjects/${userId}`);

        if (!response.ok) {
            const error = await response.text();
            return { error };
        }

        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Error fetching favorite projects:", err);
        return { error: err.message };
    }
}


export async function addWorkingOn(userId, projectId) {
    try {
        const response = await fetch(`${PROJECTS_URL}/AccessList/workingon/${userId}/${projectId}`, {
            method: 'PUT',
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || "Failed to add working on");
        }

        return await response.json();
    } catch (err) {
        console.error("Error adding working on:", err);
        return { error: err.message };
    }
}


export async function removeWorkingOn(userId, projectId) {
    try {
        const response = await fetch(`${PROJECTS_URL}/AccessList/removeworkingon/${userId}/${projectId}`, {
            method: 'PUT',
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || "Failed to remove working on");
        }

        return await response.json();
    } catch (err) {
        console.error("Error removing working on:", err);
        return { error: err.message };
    }
}

export async function fetchWorkingProjects(userId) {
    try {
        const response = await fetch(`${PROJECTS_URL}/AccessList/WorkingProjects/${userId}`);

        if (!response.ok) {
            const error = await response.text();
            return { error };
        }

        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Error fetching working projects:", err);
        return { error: err.message };
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
export async function putProject({ projectId, updatedProjectData }) {
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
        const response = await fetch(`${PROJECTS_URL}/tag/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ProjectId: ProjectId,
                Key: Key,
                Value: Value,
                Type: type
            })
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

export async function getFilesForProject({ projectId }) {
    try {
        const url = `${PROJECTS_URL}/files/${projectId}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed to fetch images: ${errText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("getFilesForImages error:", error);
        return [];
    }
}

// for thumbnail
export async function getFirstImageForProject({ projectId }) {
    try {
        const url = `${PROJECTS_URL}/files/${projectId}/first-image`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errText = await response.text();
            console.warn(`No image found for project ${projectId}: ${errText}`);
            return null;
        }

        const text = await response.text();
        if (!text) {
            console.warn(`Empty image response for project ${projectId}`);
            return null;
        }

        return JSON.parse(text);
    } catch (error) {
        console.error("getFirstImageForProject error:", error);
        return null; // Use fallback
    }
}


export async function archiveProject(projectId) {
    try {


        const response = await fetch(`${PROJECTS_URL}/${projectId}/archive`, {
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

        return { success: true };
    } catch (error) {
        console.error("Network or archive error:", error);
        return { error: "Network error or server unreachable", message: error.message };
    }
}

export async function exportProject(projectId) {
    try {
        const url = `${PROJECTS_URL}/${projectId}/export`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errText = await response.json();
            throw new Error(`Failed to fetch images: ${errText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("getFilesForImages error:", error);
        return [];
    }
}
export async function deleteFileFromProject(projectId, fileId) {
    try {
        const response = await fetch(`${PROJECTS_URL}/deleteFile/${projectId}/${fileId}`, {
            method: "DELETE",
            headers: {
                "Accept": "application/json"
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

        const result = await response.text();
        return { success: true, message: result };
    } catch (error) {
        console.error("Network or fetch error:", error);
        return { error: "Network error or server unreachable", message: error.message };
    }
}
