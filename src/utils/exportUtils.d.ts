import 'jspdf-autotable';
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}
/**
 * Convert data to CSV format and trigger download
 * @param data - Array of objects to convert to CSV
 * @param fileName - Name of the CSV file (without extension)
 * @param headers - Object mapping data keys to header labels
 */
export declare const exportToCSV: <T extends Record<string, any>>(data: T[], fileName: string, headers: Record<keyof T, string>) => void;
/**
 * Convert data to PDF format and trigger download
 * @param data - Array of objects to convert to PDF
 * @param fileName - Name of the PDF file (without extension)
 * @param headers - Object mapping data keys to header labels
 * @param title - Title for the PDF document
 */
export declare const exportToPDF: <T extends Record<string, any>>(data: T[], fileName: string, headers: Record<keyof T, string>, title: string) => void;
/**
 * Helper function to format order data specifically for export
 * @param orders - Array of order objects
 * @returns Formatted array for export
 */
export declare const formatOrdersForExport: (orders: any[]) => any[];
/**
 * Order export header definitions
 */
export declare const orderExportHeaders: {
    id: string;
    created_at: string;
    client_name: string;
    stylist_name: string;
    subtotal: string;
    tax: string;
    discount: string;
    total: string;
    payment_method: string;
    status: string;
    is_walk_in: string;
    services: string;
};
