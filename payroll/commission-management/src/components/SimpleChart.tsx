import React from 'react';

interface SimpleChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  title: string;
  type?: 'bar' | 'line' | 'pie';
  maxValue?: number;
}

const SimpleChart: React.FC<SimpleChartProps> = ({ 
  data, 
  title, 
  type = 'bar', 
  maxValue 
}) => {
  const maxDataValue = maxValue || Math.max(...data.map(d => d.value));
  const chartHeight = 200;
  const chartWidth = 300;

  const renderBarChart = () => (
    <div className="w-full h-48 flex items-end justify-around space-x-2">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div className="text-xs text-gray-600 mb-1">
            AED {item.value.toLocaleString()}
          </div>
          <div 
            className="w-full bg-gradient-to-t from-blue-500 to-purple-600 rounded-t"
            style={{ 
              height: `${(item.value / maxDataValue) * chartHeight}px`,
              minHeight: '4px'
            }}
          />
          <div className="text-xs text-gray-600 mt-2 text-center">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );

  const renderLineChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * chartWidth;
      const y = chartHeight - (item.value / maxDataValue) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="w-full h-48 relative">
        <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              x1="0"
              y1={chartHeight * ratio}
              x2={chartWidth}
              y2={chartHeight * ratio}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
            />
          ))}
          
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
          />
          
          {/* Points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * chartWidth;
            const y = chartHeight - (item.value / maxDataValue) * chartHeight;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#3B82F6"
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        
        {/* Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
          {data.map((item, index) => (
            <span key={index} className="text-xs text-gray-600">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {data.map((item, index) => {
              const angle = (item.value / total) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              
              const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
              const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
              const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
              const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              const pathData = [
                `M 100 100`,
                `L ${x1} ${y1}`,
                `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `Z`
              ].join(' ');
              
              currentAngle += angle;
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={item.color || `hsl(${index * 60}, 70%, 60%)`}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
      {type === 'bar' && renderBarChart()}
      {type === 'line' && renderLineChart()}
      {type === 'pie' && renderPieChart()}
    </div>
  );
};

export default SimpleChart;