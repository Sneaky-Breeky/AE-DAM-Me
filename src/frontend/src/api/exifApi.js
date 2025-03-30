import { API_BASE_URL } from "./apiURL.js";
const LOG_URL = `${API_BASE_URL}/api/exif`;


export async function addUploadExif(imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile);

    try {
        const response = await fetch(`${LOG_URL}/upload}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: formData
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

