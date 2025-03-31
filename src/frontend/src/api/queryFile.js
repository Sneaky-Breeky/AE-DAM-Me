import { API_BASE_URL } from "./apiURL.js";

const QUERY_URL = `${API_BASE_URL}/api/query/projectQuery`;

export async function fetchProjectsByDateRange({ StartDate, EndDate }) {
    try {
        // const defaultDate = '0001-01-01T00:00:00Z';

        // const body = {
        //     StartDate: StartDate || defaultDate,
        //     EndDate: EndDate || defaultDate,
        //     Status: null,
        //     Location: null
        // };
        // const response = await fetch(QUERY_URL, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         Accept: 'application/json',
        //     },
        //     body: JSON.stringify(body),
        // });
        
        const sD = StartDate ? new Date(StartDate).toISOString() : '0001-01-01T00:00:00Z';
        const eD = EndDate ? new Date(EndDate).toISOString() : '0001-01-01T00:00:00Z';
        const url = `${QUERY_URL}/${null}/${null}/${sD}/${eD}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

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
