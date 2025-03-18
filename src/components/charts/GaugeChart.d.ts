interface GaugeChartProps {
    value: number;
    max?: number;
    height?: number;
    title?: string;
    options?: any;
    thresholds?: {
        low: number;
        medium: number;
        high: number;
    };
    labels?: {
        low: string;
        medium: string;
        high: string;
    };
    colors?: {
        low: string;
        medium: string;
        high: string;
        background: string;
    };
}
export default function GaugeChart({ value, max, height, title, options, thresholds, labels, colors }: GaugeChartProps): import("react/jsx-runtime").JSX.Element;
export {};
