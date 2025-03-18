export interface ServiceCollection {
    id: string;
    name: string;
    description: string;
    created_at?: string;
}
export interface ServiceItem {
    id: string;
    collection_id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    active: boolean;
    created_at?: string;
}
