import { jsx as _jsx } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import { Chart, BarElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
// Register required Chart.js components
Chart.register(BarElement, LinearScale, CategoryScale, Tooltip, Legend);
export default function BarChart({ data, height = 300, title, options = {}, horizontal = false, currencyFormat = true }) {
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
        indexAxis: horizontal ? 'y' : 'x',
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
                        if (context.parsed.y !== null && context.parsed.x !== null) {
                            const value = horizontal ? context.parsed.x : context.parsed.y;
                            if (currencyFormat) {
                                label += new Intl.NumberFormat('en-IN', {
                                    style: 'currency',
                                    currency: 'INR',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                }).format(value);
                            }
                            else {
                                label += value.toLocaleString('en-IN');
                            }
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
                        if (currencyFormat && !horizontal) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                        return value;
                    }
                }
            },
            x: {
                ticks: {
                    callback: function (value) {
                        if (currencyFormat && horizontal) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                        return value;
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
    return (_jsx("div", { style: { height }, children: _jsx(Bar, { data: data, options: mergedOptions, ref: chartRef }) }));
}
