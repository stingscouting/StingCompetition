import { clientAuth } from "./firebase-client";

export async function authorizedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  let token = typeof window !== "undefined" ? localStorage.getItem("idToken") : null;

  // Attempt to get fresh token if clientAuth is available
  if (typeof window !== "undefined" && clientAuth.currentUser) {
    try {
      token = await clientAuth.currentUser.getIdToken(true);
      localStorage.setItem("idToken", token); // Sync back to localStorage as cache
    } catch (e) {
      console.warn("Failed to get fresh ID token, falling back to storage", e);
    }
  }

  const headers = new Headers(init.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers
  });
}
