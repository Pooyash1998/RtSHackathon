export const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

export const assetUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
