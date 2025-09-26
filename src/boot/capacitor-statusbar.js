import { SafeArea } from "@capacitor-community/safe-area";
import { Capacitor } from "@capacitor/core";

export default async () => {
  // Skip safe area insets on web platform as it's not supported
  if (Capacitor.getPlatform() === "web") {
    return;
  }

  try {
    await SafeArea.getSafeAreaInsets().then((data) => {
      const { insets } = data;
      document.body.style.setProperty("--ion-safe-area-top", `${insets.top}px`);
      document.body.style.setProperty(
        "--ion-safe-area-right",
        `${insets.right}px`,
      );
      document.body.style.setProperty(
        "--ion-safe-area-bottom",
        `${insets.bottom}px`,
      );
      document.body.style.setProperty(
        "--ion-safe-area-left",
        `${insets.left}px`,
      );
    });
  } catch (err) {
    console.error("[SafeArea] Errore nel recupero degli insets:", err);
  }
};
