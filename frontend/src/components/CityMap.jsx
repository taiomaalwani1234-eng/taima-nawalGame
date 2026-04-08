import React from 'react';

export default function CityMap({ infrastructure, onSectorClick, role }) {
  const sectors = [
    { key: 'hospital', name: 'المستشفى', icon: '🏥', x: 150, y: 50 },
    { key: 'powerGrid', name: 'شبكة الكهرباء', icon: '⚡', x: 50, y: 150 },
    { key: 'communications', name: 'الاتصالات', icon: '📡', x: 250, y: 150 },
    { key: 'waterPlant', name: 'محطة المياه', icon: '💧', x: 100, y: 250 },
    { key: 'trafficLights', name: 'إشارات المرور', icon: '🚦', x: 200, y: 250 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'green': return '#22c55e';
      case 'yellow': return '#eab308';
      case 'red': return '#ef4444';
      default: return '#22c55e';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'green': return 'sector-green';
      case 'yellow': return 'sector-yellow';
      case 'red': return 'sector-red';
      default: return 'sector-green';
    }
  };

  const handleClick = (sectorKey) => {
    if (onSectorClick) {
      onSectorClick(sectorKey);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <svg viewBox="0 0 300 320" className="w-full h-auto">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width="300" height="320" fill="#1a1a2e" rx="10"/>

        {sectors.map((sector) => {
          const sectorData = infrastructure?.[sector.key];
          const status = sectorData?.status || 'green';
          const health = sectorData?.healthPercentage || 100;
          const color = getStatusColor(status);
          const statusClass = getStatusClass(status);

          return (
            <g
              key={sector.key}
              onClick={() => handleClick(sector.key)}
              className={`cursor-pointer ${role === 'defender' ? 'hover:opacity-80' : ''}`}
              style={{ filter: `url(#glow)` }}
            >
              <circle
                cx={sector.x}
                cy={sector.y}
                r="35"
                fill={color}
                opacity="0.3"
                className={statusClass}
              />
              <circle
                cx={sector.x}
                cy={sector.y}
                r="30"
                fill={color}
                opacity="0.6"
                stroke={color}
                strokeWidth="2"
                className={statusClass}
              />
              <text
                x={sector.x}
                y={sector.y - 5}
                textAnchor="middle"
                fontSize="24"
              >
                {sector.icon}
              </text>
              <text
                x={sector.x}
                y={sector.y + 15}
                textAnchor="middle"
                fontSize="10"
                fill="white"
                fontWeight="bold"
              >
                {health}%
              </text>
            </g>
          );
        })}

        <line x1="150" y1="85" x2="100" y2="150" stroke="#4a5568" strokeWidth="2" opacity="0.5"/>
        <line x1="150" y1="85" x2="200" y2="150" stroke="#4a5568" strokeWidth="2" opacity="0.5"/>
        <line x1="100" y1="180" x2="100" y2="250" stroke="#4a5568" strokeWidth="2" opacity="0.5"/>
        <line x1="200" y1="180" x2="200" y2="250" stroke="#4a5568" strokeWidth="2" opacity="0.5"/>
        <line x1="130" y1="260" x2="170" y2="260" stroke="#4a5568" strokeWidth="2" opacity="0.5"/>
      </svg>

      <div className="grid grid-cols-2 gap-2 mt-4">
        {sectors.map((sector) => {
          const sectorData = infrastructure?.[sector.key];
          const status = sectorData?.status || 'green';
          
          return (
            <div
              key={sector.key}
              className={`p-2 rounded text-center ${
                status === 'green' ? 'bg-green-900/50 text-green-400' :
                status === 'yellow' ? 'bg-yellow-900/50 text-yellow-400' :
                'bg-red-900/50 text-red-400'
              }`}
            >
              {sector.icon} {sector.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
