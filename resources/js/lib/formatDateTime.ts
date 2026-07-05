/**
 * Formats a date string/Date into: "15 Jan 1935 : 12:15:20 Pm"
 */
export function formatDateTime(
    value: string | Date | null | undefined,
): string {
    if (!value) return "—";

    const date = typeof value === "string" ? new Date(value) : value;
    if (isNaN(date.getTime())) return "—";

    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    const ampm = hours >= 12 ? "Pm" : "Am";
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours;
    const hoursStr = hours.toString().padStart(2, "0");

    return `${day} ${month} ${year} : ${hoursStr}:${minutes}:${seconds} ${ampm}`;
}
