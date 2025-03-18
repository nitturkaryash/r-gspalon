interface PieChartProps {
    data: {
        labels: string[];
        datasets: Array<{
            label: string;
            data: number[];
            backgroundColor?: string[];
            borderColor?: string[];
            borderWidth?: number;
        }>;
    };
    height?: number;
    title?: string;
    options?: any;
    showPercentage?: boolean;
}
export default function PieChart({ data, height, title, options, showPercentage }: PieChartProps): import("react/jsx-runtime").JSX.Element;
export {};
