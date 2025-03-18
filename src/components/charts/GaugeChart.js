import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
// Register required Chart.js components
Chart.register(ArcElement, Tooltip, Legend);
export default function GaugeChart({ value, max = 100, height = 200, title, options = {}, thresholds = {
    low: 30,
    medium: 70,
    high: 100
}, labels = {
    low: 'Low',
    medium: 'Medium',
    high: 'Good'
}, colors = {
    low: '#f44336',
    medium: '#ff9800',
    high: '#4caf50',
    background: '#f5f5f5'
} }) {
    const chartRef = useRef(null);
    // Ensure value is within bounds
    const safeValue = Math.min(Math.max(0, value), max);
    // Determine color based on thresholds
    const getColor = (value) => {
        if (value < thresholds.low)
            return colors.low;
        if (value < thresholds.medium)
            return colors.medium;
        return colors.high;
    };
    // Determine label based on thresholds
    const getLabel = (value) => {
        if (value < thresholds.low)
            return labels.low;
        if (value < thresholds.medium)
            return labels.medium;
        return labels.high;
    };
    // Data for the gauge
    const data = {
        datasets: [
            {
                data: [safeValue, max - safeValue],
                backgroundColor: [getColor(safeValue), colors.background],
                borderWidth: 0,
                circumference: 180,
                rotation: 270,
            },
        ],
    };
    useEffect(() => {
        // Clean up chart instance on unmount
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, []);
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: !!title,
                text: title,
                font: {
                    size: 16
                },
                padding: {
                    bottom: 20
                }
            },
            tooltip: {
                enabled: false,
            },
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart',
        },
    };
    const mergedOptions = { ...defaultOptions, ...options };
    return (_jsxs("div", { style: { height, position: 'relative', marginBottom: '10px' }, children: [_jsx(Doughnut, { data: data, options: mergedOptions, ref: chartRef }), _jsxs("div", { style: {
                    position: 'absolute',
                    top: '60%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    width: '100%',
                    padding: '0 15px',
                    boxSizing: 'border-box',
                }, children: [_jsxs("div", { style: {
                            fontSize: '1.75rem',
                            fontWeight: 'bold',
                            color: getColor(safeValue),
                            marginBottom: '10px',
                            lineHeight: 1.2,
                        }, children: [safeValue, "%"] }), _jsx("div", { style: {
                            fontSize: '0.875rem',
                            color: 'rgba(0, 0, 0, 0.6)',
                            marginTop: '5px',
                            letterSpacing: '0.01em',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }, children: getLabel(safeValue) })] })] }));
}
