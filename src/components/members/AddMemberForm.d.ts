import { Member } from '../../types/member';
interface AddMemberFormProps {
    onAddMember: (newMember: Omit<Member, 'id' | 'joinDate'>) => void;
}
export default function AddMemberForm({ onAddMember }: AddMemberFormProps): import("react/jsx-runtime").JSX.Element;
export {};
