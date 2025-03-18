import { jsx as _jsx } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
// Register required Chart.js components
Chart.register(ArcElement, Tooltip, Legend);
export default function PieChart({ data, height = 300, title, options = {}, showPercentage = true }) {
    const chartRef = useRef(null);
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
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    padding: 20,
                    boxWidth: 12
                }
            },
            title: {
                display: !!title,
                text: title,
                font: {
                    size: 16
                },
                padding: {
                    bottom: 16
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            label += context.parsed.toLocaleString('en-IN');
                            if (showPercentage) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.parsed / total) * 100);
                                label += ` (${percentage}%)`;
                            }
                        }
                        return label;
                    }
                }
            }
        },
        animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1000,
            easing: 'easeOutQuart',
        },
    };
    const mergedOptions = { ...defaultOptions, ...options };
    return (_jsx("div", { style: { height }, children: _jsx(Pie, { data: data, options: mergedOptions, ref: chartRef }) }));
}
