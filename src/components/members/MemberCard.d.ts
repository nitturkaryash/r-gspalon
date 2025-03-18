import { Member } from '../../types/member';
interface MemberCardProps {
    member: Member;
    onTopUp: (memberId: string, amount: number) => void;
    onDelete: (memberId: string) => void;
    formatCurrency: (amount: number) => string;
}
export default function MemberCard({ member, onTopUp, onDelete, formatCurrency }: MemberCardProps): import("react/jsx-runtime").JSX.Element;
export {};
