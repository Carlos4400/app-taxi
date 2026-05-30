import { useState, useEffect } from "react";
import { useAppStore } from "../services/store";

export type NetworkStatus = "online" | "offline" | "error";

export function useNetworkStatus(): NetworkStatus {
  const dataLoaded = useAppStore((state) => state.dataLoaded);
  const loadTimedOut = useAppStore((state) => state.loadTimedOut);
  
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (loadTimedOut) {
    return "error";
  }

  if (!isOnline || !dataLoaded) {
    return "offline";
  }

  return "online";
}
