import { jsx as _jsx } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
// Register required Chart.js components
Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);
export default function LineChart({ data, height = 300, title, options = {} }) {
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
            },
            title: {
                display: !!title,
                text: title,
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                            }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return '₹' + value.toLocaleString('en-IN');
                    }
                }
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart',
        },
    };
    const mergedOptions = { ...defaultOptions, ...options };
    return (_jsx("div", { style: { height }, children: _jsx(Line, { data: data, options: mergedOptions, ref: chartRef }) }));
}
