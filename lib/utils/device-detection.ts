/**
 * Detect device type based on user agent and screen size
 */
export function detectDeviceType(): "mobile" | "desktop" | "tablet" {
  if (typeof window === "undefined") {
    return "desktop"; // Default for SSR
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;

  // Check for tablet
  if (
    (userAgent.includes("ipad") ||
      (userAgent.includes("android") && !userAgent.includes("mobile")) ||
      userAgent.includes("tablet")) &&
    width >= 768
  ) {
    return "tablet";
  }

  // Check for mobile
  if (
    userAgent.includes("mobile") ||
    userAgent.includes("android") ||
    userAgent.includes("iphone") ||
    userAgent.includes("ipod") ||
    width < 768
  ) {
    return "mobile";
  }

  return "desktop";
}
