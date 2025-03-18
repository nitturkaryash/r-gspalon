export interface StylistBreak {
    id: string;
    startTime: string;
    endTime: string;
    reason?: string;
}
export interface Stylist {
    id: string;
    name: string;
    specialties: string[];
    bio?: string;
    gender?: 'male' | 'female' | 'other';
    available: boolean;
    imageUrl?: string;
    email?: string;
    phone?: string;
    breaks?: StylistBreak[];
}
export declare function useStylists(): {
    stylists: Stylist[];
    isLoading: boolean;
    createStylist: import("@tanstack/react-query").UseMutateFunction<{
        name: string;
        phone?: string;
        email?: string;
        specialties: string[];
        bio?: string;
        gender?: "male" | "female" | "other";
        available: boolean;
        imageUrl?: string;
        breaks?: StylistBreak[];
        id: string;
    }, Error, Omit<Stylist, "id">, unknown>;
    updateStylist: import("@tanstack/react-query").UseMutateFunction<Stylist, Error, Partial<Stylist> & {
        id: string;
    }, unknown>;
    deleteStylist: import("@tanstack/react-query").UseMutateFunction<{
        success: boolean;
    }, Error, string, unknown>;
};
