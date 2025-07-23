import React from 'react';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartProps {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area';
  data: ChartDataPoint[];
  title?: string;
  height?: number;
  width?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showAxis?: boolean;
  className?: string;
  onDataPointClick?: (dataPoint: ChartDataPoint, index: number) => void;
}

const Chart: React.FC<ChartProps> = ({
  type,
  data,
  title,
  height = 300,
  width = '100%',
  showLegend = true,
  showGrid = true,
  showAxis = true,
  className = '',
  onDataPointClick
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));

  const defaultColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  const getColor = (index: number, customColor?: string) => {
    return customColor || defaultColors[index % defaultColors.length];
  };

  const renderBarChart = () => {
    const barWidth = 100 / data.length;
    const range = maxValue - minValue;

    return (
      <div className="relative" style={{ height, width }}>
        {showGrid && (
          <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 pointer-events-none">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="border-t border-gray-200" />
            ))}
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="border-l border-gray-200" />
            ))}
          </div>
        )}
        
        <div className="relative h-full flex items-end justify-between px-4 pb-8">
          {data.map((point, index) => {
            const percentage = range > 0 ? ((point.value - minValue) / range) * 100 : 50;
            const color = getColor(index, point.color);
            
            return (
              <div
                key={index}
                className="relative flex flex-col items-center"
                style={{ width: `${barWidth}%` }}
              >
                <div
                  className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-200 cursor-pointer rounded-t"
                  style={{
                    height: `${percentage}%`,
                    backgroundColor: color,
                    minHeight: '4px'
                  }}
                  onClick={() => onDataPointClick?.(point, index)}
                  title={`${point.label}: ${point.value}`}
                />
                {showAxis && (
                  <div className="text-xs text-gray-600 mt-2 text-center transform -rotate-45 origin-left">
                    {point.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {showAxis && (
          <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-between px-4 text-xs text-gray-500">
            <span>{minValue}</span>
            <span>{maxValue}</span>
          </div>
        )}
      </div>
    );
  };

  const renderPieChart = () => {
    const total = data.reduce((sum, point) => sum + point.value, 0);
    let currentAngle = 0;

    return (
      <div className="relative" style={{ height, width }}>
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="2" />
          {data.map((point, index) => {
            const percentage = total > 0 ? (point.value / total) : 0;
            const angle = percentage * 360;
            const color = getColor(index, point.color);
            
            const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
            const x2 = 50 + 40 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
            const y2 = 50 + 40 * Math.sin(((currentAngle + angle) * Math.PI) / 180);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M 50 50`,
              `L ${x1} ${y1}`,
              `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            currentAngle += angle;
            
            return (
              <path
                key={index}
                d={pathData}
                fill={color}
                stroke="white"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onDataPointClick?.(point, index)}
              />
            );
          })}
        </svg>
        
        {showLegend && (
          <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-2 mt-2">
            {data.map((point, index) => (
              <div key={index} className="flex items-center text-xs">
                <div
                  className="w-3 h-3 rounded mr-1"
                  style={{ backgroundColor: getColor(index, point.color) }}
                />
                <span className="text-gray-600">{point.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderLineChart = () => {
    const points = data.map((point, index) => ({
      x: (index / (data.length - 1)) * 100,
      y: 100 - ((point.value - minValue) / (maxValue - minValue)) * 100
    }));

    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    return (
      <div className="relative" style={{ height, width }}>
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {showGrid && (
            <>
              {Array.from({ length: 5 }, (_, i) => (
                <line
                  key={`grid-y-${i}`}
                  x1="0"
                  y1={i * 20}
                  x2="100"
                  y2={i * 20}
                  stroke="#e5e7eb"
                  strokeWidth="0.5"
                />
              ))}
              {Array.from({ length: 5 }, (_, i) => (
                <line
                  key={`grid-x-${i}`}
                  x1={i * 20}
                  y1="0"
                  x2={i * 20}
                  y2="100"
                  stroke="#e5e7eb"
                  strokeWidth="0.5"
                />
              ))}
            </>
          )}
          
          <path
            d={pathData}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            className="cursor-pointer"
          />
          
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="2"
              fill="#3B82F6"
              className="cursor-pointer hover:r-3 transition-all"
              onClick={() => onDataPointClick?.(data[index], index)}
            />
          ))}
        </svg>
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'pie':
      case 'doughnut':
        return renderPieChart();
      case 'line':
      case 'area':
        return renderLineChart();
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {title && (
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      )}
      {renderChart()}
    </div>
  );
};

export default Chart; 