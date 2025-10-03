import { Capacitor } from "@capacitor/core";
import { StatusBar, StatusBarStyle } from "@capacitor/status-bar";

export default async () => {
  // Skip on web platform
  if (Capacitor.getPlatform() === "web") {
    return;
  }

  try {
    // Configure status bar for Android with official edge-to-edge support
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setStyle({ style: StatusBarStyle.Light });
      await StatusBar.setBackgroundColor({ color: "#1976d2" });

      // Enable overlays for edge-to-edge support (Android 15+ compatible)
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
      } catch (overlayError) {
        console.log("[StatusBar] Overlay not available, using standard mode");
      }
    }
  } catch (error) {
    console.warn("[StatusBar] Configuration failed:", error);
  }
};
