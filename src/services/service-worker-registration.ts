export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const isLocalDev = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

  if (isLocalDev) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => console.log("SW unregistered in dev"))
        .catch((err) => console.warn("SW unregister failed", err));
    });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("SW registered"))
      .catch((err) => console.warn("SW registration failed", err));
  });
}
