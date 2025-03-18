export declare const initLocalStorageData: () => {
    stylists: {
        id: string;
        name: string;
        email: string;
        phone: string;
        specialties: string;
        schedule: string;
        created_at: string;
    }[];
    services: {
        id: string;
        name: string;
        description: string;
        duration: number;
        price: number;
        category: string;
        active: boolean;
        created_at: string;
    }[];
    products: {
        id: string;
        name: string;
        description: string;
        price: number;
        category: string;
        stock: number;
        active: boolean;
        created_at: string;
    }[];
    purchases: {
        id: string;
        date: string;
        product_name: string;
        hsn_code: string;
        units: string;
        purchase_invoice_number: string;
        purchase_qty: number;
        mrp_incl_gst: number;
        discount_on_purchase_percentage: number;
        gst_percentage: number;
        mrp_excl_gst: number;
        purchase_taxable_value: number;
        purchase_igst: number;
        purchase_cgst: number;
        purchase_sgst: number;
        purchase_invoice_value_rs: number;
    }[];
    clients: {
        id: string;
        full_name: string;
        email: string;
        phone: string;
        address: string;
        notes: string;
        created_at: string;
    }[];
};
export default initLocalStorageData;
