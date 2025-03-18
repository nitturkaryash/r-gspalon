interface BarChartProps {
    data: {
        labels: string[];
        datasets: Array<{
            label: string;
            data: number[];
            backgroundColor?: string | string[];
            borderColor?: string | string[];
            borderWidth?: number;
        }>;
    };
    height?: number;
    title?: string;
    options?: any;
    horizontal?: boolean;
    currencyFormat?: boolean;
}
export default function BarChart({ data, height, title, options, horizontal, currencyFormat }: BarChartProps): import("react/jsx-runtime").JSX.Element;
export {};
