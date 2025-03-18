import { StylistBreak } from '../hooks/useStylists';
export interface Break extends StylistBreak {
    startTime: string;
    endTime: string;
    reason?: string;
    id: string;
}
interface Stylist {
    id: string;
    name: string;
    breaks: Break[];
}
interface StylistDayViewProps {
    stylists: Stylist[];
    appointments: any[];
    services: any[];
    selectedDate: Date;
    onSelectTimeSlot: (stylistId: string, time: Date) => void;
    onUpdateAppointment?: (appointmentId: string, updates: any) => Promise<void>;
    onDeleteAppointment?: (appointmentId: string) => Promise<void>;
    onAddBreak: (stylistId: string, breakData: Break) => Promise<void>;
    onDateChange?: (date: Date) => void;
    onStylistsChange?: (updatedStylists: Stylist[]) => void;
}
declare const StylistDayView: React.FC<StylistDayViewProps>;
export default StylistDayView;
