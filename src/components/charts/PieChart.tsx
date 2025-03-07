import { useRef, useEffect } from 'react';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register required Chart.js components
Chart.register(ArcElement, Tooltip, Legend);

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

export default function PieChart({ 
  data, 
  height = 300, 
  title, 
  options = {},
  showPercentage = true
}: PieChartProps) {
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
    plugins: {
      legend: {
        position: 'top' as const,
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
          label: function(context: any) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            
            if (context.parsed !== null) {
              label += context.parsed.toLocaleString('en-IN');
              
              if (showPercentage) {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
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

  return (
    <div style={{ height }}>
      <Pie 
        data={data} 
        options={mergedOptions}
        ref={chartRef}
      />
    </div>
  );
} 