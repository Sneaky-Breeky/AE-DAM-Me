import { API_BASE_URL } from "./apiURL.js";

const QUERY_URL = `${API_BASE_URL}/api/query`;

export async function fetchProjectsByDateRange({ StartDate, EndDate }) {
    try {

        const sD = StartDate ? new Date(StartDate).toISOString() : '0001-01-01T00:00:00Z';
        const eD = EndDate ? new Date(EndDate).toISOString() : '0001-01-01T00:00:00Z';

        const url = `${QUERY_URL}/projectQuery/null/null/${sD}/${eD}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });
        console.log(response);

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed to fetch filtered projects: ${errText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("fetchProjectsByDateRange error:", error);
        return [];
    }
}

async function searchProject(pid, requestBody) {
    try {
        const url = `${QUERY_URL}/searchProject/${pid}`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const filesResult = await response.json();
        return filesResult;
    } catch (error) {
        console.error("Error fetching project files:", error);
    }
}