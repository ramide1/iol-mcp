class IOLMaintenanceError extends Error {
    retryAfter?: number;
    constructor(message: string, retryAfter?: number) {
        super(message);
        this.name = "IOLMaintenanceError";
        this.retryAfter = retryAfter;
    }
}

const checkMaintenanceStatus = (data: unknown): void => {
    if (data && typeof data === "object" && "status" in data) {
        const obj = data as Record<string, unknown>;
        if (obj.status === "maintenance") {
            const retryAfter = typeof obj.retry_after === "number" ? obj.retry_after : undefined;
            throw new IOLMaintenanceError(
                "API is under scheduled maintenance. Please try again later.",
                retryAfter
            );
        }
    }
};

const makeIOLTokenRequest = async <T>(url: string, body: Record<string, string>): Promise<T> => {
    const response: any = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(body)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data: any = await response.json();
    checkMaintenanceStatus(data);
    return data as T;
};

const makeIOLGetRequest = async <T>(url: string, accessToken: string): Promise<T> => {
    const response: any = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data: any = await response.json();
    checkMaintenanceStatus(data);
    return data as T;
};

const makeIOLPostRequest = async <T>(url: string, accessToken: string, body?: unknown): Promise<T | null> => {
    const response: any = await fetch(url, {
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
        const data: any = await response.json();
        checkMaintenanceStatus(data);
        return data as T;
    }
    return null;
};

const makeIOLDeleteRequest = async <T>(url: string, accessToken: string): Promise<T | null> => {
    const response: any = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const data: any = await response.json();
        checkMaintenanceStatus(data);
        return data as T;
    }
    return null;
};

export { IOLMaintenanceError, makeIOLTokenRequest, makeIOLGetRequest, makeIOLPostRequest, makeIOLDeleteRequest };