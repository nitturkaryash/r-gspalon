import { Member } from '../types/member';
export declare function useMembers(): {
    members: Member[];
    isLoading: boolean;
    createMember: (newMember: Omit<Member, "id" | "joinDate">) => Member;
    updateMember: (memberId: string, updates: Partial<Omit<Member, "id">>) => Member;
    topUpMember: (memberId: string, amount: number) => Member;
    deleteMember: (memberId: string) => void;
    formatCurrency: (amount: number) => string;
};
