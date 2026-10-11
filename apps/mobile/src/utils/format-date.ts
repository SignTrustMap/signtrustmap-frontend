export function formatDate(dateString?: string | null | Date): string {
    if (!dateString) return '';
    const date = typeof dateString === 'string' || typeof dateString === 'number' ? new Date(dateString) : dateString;
    if (Number.isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}