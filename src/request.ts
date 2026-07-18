// Helper function for making IOL API requests
const makeIOLPostRequest = async <T>(url: string, body: any): Promise<T | null> => {
    try {
        const response: any = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return (await response.json()) as T;
    } catch (error) {
        console.error("Error making IOL post request:", error);
        return null;
    }
};

const makeIOLTokenRequest = async <T>(url: string, body: any): Promise<T | null> => {
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
        console.error("Error making IOL request:", error);
        return null;
    }
};

export { makeIOLPostRequest, makeIOLTokenRequest };