"use client";

const USER_KEY = "tth_user";
const REGISTRATIONS_KEY = "tth_registrations";

export function readUser() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveUser(user) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("tth:user-updated"));
}

export function clearUser() {
  window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("tth:user-updated"));
}

export function readRegistrations() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(REGISTRATIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRegistrations(registrations) {
  window.localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(registrations));
  window.dispatchEvent(new Event("tth:registrations-updated"));
}

export function upsertRegistration(registration) {
  const registrations = readRegistrations();
  const index = registrations.findIndex((item) => item.id === registration.id);

  if (index >= 0) {
    registrations[index] = registration;
  } else {
    registrations.unshift(registration);
  }

  saveRegistrations(registrations);
  return registration;
}

export function updateRegistration(id, patch) {
  const registrations = readRegistrations();
  const next = registrations.map((registration) =>
    registration.id === id ? { ...registration, ...patch, updatedAt: new Date().toISOString() } : registration
  );
  saveRegistrations(next);
  return next.find((registration) => registration.id === id);
}
