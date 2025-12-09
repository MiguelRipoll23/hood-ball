/**
 * Formats a timestamp (in milliseconds) into a "Month Day, Year" date string.
 * @param timestamp The timestamp in milliseconds since epoch
 * @returns A date string in "Month Day, Year" format (e.g., "December 5, 2025")
 */
export function formatDate(timestamp: number): string {
  try {
    const date = new Date(timestamp);

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    return date.toLocaleDateString("en-US", options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Unknown date";
  }
}
