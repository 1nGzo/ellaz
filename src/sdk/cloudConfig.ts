// Cloud access is opt-in. Never fall back to an upstream project.
export interface CloudConfig {
  apiKey: string;
  projectId: string;
}

export function cloudConfig(): CloudConfig {
  const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY || "").trim();
  const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || "").trim();
  // Partial configuration is also offline, so an API key cannot select a
  // project while document requests accidentally target another default.
  return apiKey && projectId ? { apiKey, projectId } : { apiKey: "", projectId: "" };
}
