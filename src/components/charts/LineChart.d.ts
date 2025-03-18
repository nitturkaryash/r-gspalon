interface LineChartProps {
    data: {
        labels: string[];
        datasets: Array<{
            label: string;
            data: number[];
            borderColor?: string;
            backgroundColor?: string;
            tension?: number;
        }>;
    };
    height?: number;
    title?: string;
    options?: any;
}
export default function LineChart({ data, height, title, options }: LineChartProps): import("react/jsx-runtime").JSX.Element;
export {};
