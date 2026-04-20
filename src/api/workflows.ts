import { http } from "./httpClient";
import { api } from "./config";

export async function saveWorkflow(workflowData: {
    name: string;
    trigger: string;
    actions: any[];
}) {
    return http.post(api.workflows, workflowData);
}

export async function getWorkflows() {
    return http.get(api.workflows);
}

export async function deployWorkflow(workflowId: string) {
    return http.post(`${api.workflows}/${workflowId}/deploy`, {});
}