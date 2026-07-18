// Helper function for making IOL API requests
const makeIOLTokenRequest = async <T>(url: string, body: Record<string, string>): Promise<T | null> => {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(body)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return (await response.json()) as T;
    } catch (error) {
        console.error("Error making IOL token request:", error);
        return null;
    }
};

const makeIOLGetRequest = async <T>(url: string, accessToken: string): Promise<T | null> => {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return (await response.json()) as T;
    } catch (error) {
        console.error("Error making IOL GET request:", error);
        return null;
    }
};

const makeIOLPostRequest = async <T>(url: string, accessToken: string, body?: unknown): Promise<T | null> => {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return (await response.json()) as T;
        }
        return null;
    } catch (error) {
        console.error("Error making IOL POST request:", error);
        return null;
    }
};

const makeIOLDeleteRequest = async <T>(url: string, accessToken: string): Promise<T | null> => {
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return (await response.json()) as T;
        }
        return null;
    } catch (error) {
        console.error("Error making IOL DELETE request:", error);
        return null;
    }
};

export { makeIOLTokenRequest, makeIOLGetRequest, makeIOLPostRequest, makeIOLDeleteRequest };
