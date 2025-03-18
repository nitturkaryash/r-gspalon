import { PaymentDetail } from '../../hooks/usePOS';
import { Order } from '../../hooks/usePOS';
interface CompletePaymentDialogProps {
    open: boolean;
    onClose: () => void;
    order: Order | null;
    onCompletePayment: (orderId: string, paymentDetails: PaymentDetail) => Promise<void>;
}
export default function CompletePaymentDialog({ open, onClose, order, onCompletePayment, }: CompletePaymentDialogProps): import("react/jsx-runtime").JSX.Element;
export {};
