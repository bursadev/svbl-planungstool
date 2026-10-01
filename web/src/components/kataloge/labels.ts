import type { DeviceCategory } from "@/lib/api/device-types";

export const DEVICE_CATEGORY_LABELS: Record<DeviceCategory, string> = {
  forklift: "Stapler",
  aerial_platform: "Hebebühne",
  crane: "Kran",
  other: "Andere",
};
