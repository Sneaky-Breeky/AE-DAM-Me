const API_BASE_URL = "https://ae-dam-be-h3dtgrehbcgxfpar.westus2-01.azurewebsites.net/api/auth";

/**
 * Login user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Response>}
 */
export async function loginUser(email, password) {
    const response = await fetch(`${API_BASE_URL}/login`, {
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