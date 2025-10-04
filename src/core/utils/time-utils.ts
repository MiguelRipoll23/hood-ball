/**
 * Formats a timestamp (in milliseconds) into a MM/DD/YYYY date string.
 * @param timestamp The timestamp in milliseconds since epoch
 * @returns A date string in MM/DD/YYYY format (e.g., "10/05/2025")
 */
export function formatDate(timestamp: number): string {
  try {
    const date = new Date(timestamp);

    // Get month, day, and year
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // getMonth() returns 0-11
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Unknown date";
  }
}
