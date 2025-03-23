import { API_BASE_URL } from "./apiURL.js"

const AUTH_URL = `${API_BASE_URL}/api/auth`;
// const LOCAL_AUTH_URL = `${LOCAL_AUTH_URL}/api/auth`;
/**
 * Login user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Response>}
 */
export async function loginUser(email, password) {
    const response = await fetch(`${AUTH_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        // Handle errors and parse JSON safely
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        return errorData;
    }

    return response.json();
}

export async function fetchUsers() {
    const response = await fetch(`${AUTH_URL}/fetchusers`, { 
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        return errorData;
    }

    return response.json();
}

export async function addUser(values) {
    try {
        const response = await fetch(`${AUTH_URL}/addUser`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values)
        });

        if (!response.ok) {
            // Attempt to extract error details
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(errorData.error || "Failed to add user.");
        }

        return await response.json();
    } catch (err) {
        console.error("Error adding user:", err);
        throw err;
    }
}

export async function deleteUser(email) {
    try {
        const response = await fetch(`${AUTH_URL}/deleteuser/${email}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(errorData.error || "Failed to delete user.");
        }

        return await response.json();
    } catch (err) {
        console.error("Error deleting user:", err);
        throw err;
    }
}