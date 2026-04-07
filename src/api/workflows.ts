import { api } from "./config";

// Helper that adds JWT token to every request
function authHeaders() {
    const token = localStorage.getItem("access_token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function saveWorkflow(workflowData: {
    name: string;
    trigger: string;
    actions: any[];
}) {
    const res = await fetch(api.workflows, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(workflowData),
    });

    if (res.status === 401) {
        throw new Error("Not authenticated. Please login again.");
    }

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to save workflow");
    }

    return res.json();
}

export async function getWorkflows() {
    const res = await fetch(api.workflows, {
        method: "GET",
        headers: authHeaders(),
    });

    if (res.status === 401) {
        throw new Error("Not authenticated. Please login again.");
    }

    if (!res.ok) {
        throw new Error("Failed to fetch workflows");
    }

    return res.json();
}

export async function deployWorkflow(workflowId: string) {
    const res = await fetch(`${api.workflows}/${workflowId}/deploy`, {
        method: "POST",
        headers: authHeaders(),
    });

    if (res.status === 401) {
        throw new Error("Not authenticated. Please login again.");
    }

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to deploy workflow");
    }

    return res.json();
}