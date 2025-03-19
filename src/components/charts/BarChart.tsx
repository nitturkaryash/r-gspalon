import { useRef, useEffect } from 'react';
import { Chart, BarElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register required Chart.js components
Chart.register(BarElement, LinearScale, CategoryScale, Tooltip, Legend);

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

export default function BarChart({ 
  data, 
  height = 300, 
  title, 
  options = {},
  horizontal = false,
  currencyFormat = true
}: BarChartProps) {
  const chartRef = useRef<any>(null);

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
    indexAxis: horizontal ? 'y' as const : 'x' as const,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
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
              } else {
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
          callback: function(value: any) {
            if (currencyFormat && !horizontal) {
              return '₹' + value.toLocaleString('en-IN');
            }
            return value;
          }
        }
      },
      x: {
        ticks: {
          callback: function(value: any) {
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

  return (
    <div style={{ height }}>
      <Bar 
        data={data} 
        options={mergedOptions}
        ref={chartRef}
      />
    </div>
  );
} 