interface KPICardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    changeValue?: number;
    isLoading?: boolean;
    icon?: React.ReactNode;
    isCurrency?: boolean;
    tooltipText?: string;
    height?: number | string;
}
export default function KPICard({ title, value, subtitle, changeValue, isLoading, icon, isCurrency, tooltipText, height }: KPICardProps): import("react/jsx-runtime").JSX.Element;
export {};
