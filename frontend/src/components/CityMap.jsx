import React, { useState, useEffect, useRef } from 'react';
import { INFRASTRUCTURE_POINTS, SECTOR_TYPES, ROADS, CITY_LABELS, SYRIA_MAP_PATH } from '../data/infrastructureData';
import { useAudioAlerts } from '../hooks/useAudioAlerts';

export default function CityMap({ infrastructure, onSectorClick, role }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [prevStatuses, setPrevStatuses] = useState({});
  const svgRef = useRef(null);
  const { handleStatusChange } = useAudioAlerts();

  const getStatusColor = (status) => {
    switch (status) {
      case 'green': return '#22c55e';
      case 'yellow': return '#eab308';
      case 'red': return '#ef4444';
      default: return '#22c55e';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'green': return 'rgba(34,197,94,0.15)';
      case 'yellow': return 'rgba(234,179,8,0.2)';
      case 'red': return 'rgba(239,68,68,0.25)';
      default: return 'rgba(34,197,94,0.15)';
    }
  };

  useEffect(() => {
    if (!infrastructure) return;
    const newStatuses = {};
    Object.entries(infrastructure).forEach(([id, data]) => {
      const newStatus = data?.status || 'green';
      const oldStatus = prevStatuses[id];
      newStatuses[id] = newStatus;
      if (oldStatus && oldStatus !== newStatus) {
        handleStatusChange(oldStatus, newStatus);
      }
    });
    setPrevStatuses(newStatuses);
  }, [infrastructure, handleStatusChange]);

  const handleClick = (point) => {
    setSelectedId(point.id);
    if (onSectorClick) {
      onSectorClick(point.id);
    }
  };

  const handleMouseEnter = (point, e) => {
    setHoveredPoint(point.id);
    const svg = svgRef.current;
    if (svg) {
      const rect = svg.getBoundingClientRect();
      const scaleX = 220 / rect.width;
      const scaleY = 260 / rect.height;
      setTooltip({
        x: point.x / scaleX,
        y: point.y / scaleY,
        point
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setTooltip(null);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'green': return 'آمن';
      case 'yellow': return 'تحت الضغط';
      case 'red': return 'حرج';
      default: return 'آمن';
    }
  };

  return (
    <div className="w-full relative">
      <svg
        ref={svgRef}
        viewBox="0 0 220 260"
        className="w-full h-auto max-h-[520px]"
        style={{ filter: 'drop-shadow(0 0 20px rgba(34,197,94,0.1))' }}
      >
        <defs>
          <filter id="glow-green">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-yellow">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a2a3a" />
            <stop offset="100%" stopColor="#0f1923" />
          </linearGradient>
          <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2a3a4a" />
            <stop offset="100%" stopColor="#1a2a3a" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="220" height="260" fill="url(#mapGrad)" rx="8" />

        <path
          d={SYRIA_MAP_PATH}
          fill="#1e3a5f"
          stroke="#3b82f6"
          strokeWidth="1"
          opacity="0.6"
        />

        <path
          d={SYRIA_MAP_PATH}
          fill="none"
          stroke="#60a5fa"
          strokeWidth="0.5"
          opacity="0.3"
        />

        <text x="110" y="145" textAnchor="middle" fontSize="5" fill="#60a5fa" opacity="0.25" fontWeight="bold">
          سوريا
        </text>

        {ROADS.map((road, idx) => {
          const isAttacked = Object.entries(infrastructure || {}).some(([id, data]) => {
            const point = INFRASTRUCTURE_POINTS.find(p => p.id === id);
            return point && data?.status !== 'green' && (
              (Math.abs(point.x - road.x1) < 25 && Math.abs(point.y - road.y1) < 25) ||
              (Math.abs(point.x - road.x2) < 25 && Math.abs(point.y - road.y2) < 25)
            );
          });

          return (
            <line
              key={idx}
              x1={road.x1}
              y1={road.y1}
              x2={road.x2}
              y2={road.y2}
              stroke={isAttacked ? '#f59e0b' : '#2a3a4a'}
              strokeWidth={isAttacked ? "1.2" : "0.8"}
              strokeDasharray={isAttacked ? "3,2" : "none"}
              opacity={isAttacked ? 0.8 : 0.5}
              className="road-line"
            />
          );
        })}

        {CITY_LABELS.map((city, idx) => (
          <text
            key={idx}
            x={city.x}
            y={city.y}
            textAnchor="middle"
            fontSize={city.fontSize}
            fill="#94a3b8"
            fontWeight="bold"
            opacity="0.6"
          >
            {city.name}
          </text>
        ))}

        {INFRASTRUCTURE_POINTS.map((point) => {
          const data = infrastructure?.[point.id];
          const status = data?.status || 'green';
          const health = data?.healthPercentage ?? 100;
          const color = getStatusColor(status);
          const isSelected = selectedId === point.id;
          const isHovered = hoveredPoint === point.id;
          const filterId = status === 'red' ? 'glow-red' : status === 'yellow' ? 'glow-yellow' : 'glow-green';
          const statusClass = `sector-${status}-live`;
          const r = point.criticality >= 9 ? 7 : point.criticality >= 7 ? 6 : 5;
          const iconSize = point.criticality >= 9 ? 8 : point.criticality >= 7 ? 7 : 6;

          return (
            <g
              key={point.id}
              onClick={() => handleClick(point)}
              onMouseEnter={(e) => handleMouseEnter(point, e)}
              onMouseLeave={handleMouseLeave}
              className="cursor-pointer"
              style={{ transition: 'all 0.3s ease' }}
            >
              {isSelected && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={r + 6}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="1.5"
                  opacity="0.6"
                  className="sector-selected-ring"
                />
              )}

              <circle
                cx={point.x}
                cy={point.y}
                r={r + 3}
                fill={getStatusBgColor(status)}
                className={statusClass}
              />

              <circle
                cx={point.x}
                cy={point.y}
                r={r}
                fill={color}
                opacity="0.85"
                stroke={color}
                strokeWidth="1"
                filter={`url(#${filterId})`}
                className={statusClass}
                style={{ transition: 'fill 1.2s ease-in-out, opacity 0.8s ease-in-out' }}
              />

              <text
                x={point.x}
                y={point.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={iconSize}
              >
                {SECTOR_TYPES[point.type].icon}
              </text>

              <text
                x={point.x}
                y={point.y + r + 6}
                textAnchor="middle"
                fontSize="3.5"
                fill="white"
                opacity="0.7"
                fontWeight="bold"
              >
                {health}%
              </text>
            </g>
          );
        })}

        {hoveredPoint && tooltip && (
          <g>
            <rect
              x={tooltip.point.x + 12}
              y={tooltip.point.y - 18}
              width="75"
              height="28"
              rx="4"
              fill="rgba(0,0,0,0.85)"
              stroke={getStatusColor(infrastructure?.[tooltip.point.id]?.status || 'green')}
              strokeWidth="0.5"
            />
            <text
              x={tooltip.point.x + 16}
              y={tooltip.point.y - 8}
              fontSize="4"
              fill="white"
              fontWeight="bold"
            >
              {tooltip.point.name}
            </text>
            <text
              x={tooltip.point.x + 16}
              y={tooltip.point.y - 1}
              fontSize="3.5"
              fill={getStatusColor(infrastructure?.[tooltip.point.id]?.status || 'green')}
            >
              {getStatusLabel(infrastructure?.[tooltip.point.id]?.status || 'green')} - {infrastructure?.[tooltip.point.id]?.healthPercentage ?? 100}%
            </text>
            <text
              x={tooltip.point.x + 16}
              y={tooltip.point.y + 5}
              fontSize="3"
              fill="#94a3b8"
            >
              {SECTOR_TYPES[tooltip.point.type].label} | أهمية: {tooltip.point.criticality}/10
            </text>
          </g>
        )}
      </svg>

      <div className="grid grid-cols-5 gap-1.5 mt-3">
        {Object.entries(SECTOR_TYPES).map(([type, info]) => {
          const points = INFRASTRUCTURE_POINTS.filter(p => p.type === type);
          const damagedCount = points.filter(p => {
            const data = infrastructure?.[p.id];
            return data?.status !== 'green';
          }).length;

          return (
            <div
              key={type}
              className={`p-2 rounded text-center text-xs ${
                damagedCount > 0
                  ? damagedCount === points.length
                    ? 'bg-red-900/50 text-red-400 border border-red-800'
                    : 'bg-yellow-900/40 text-yellow-400 border border-yellow-800'
                  : 'bg-green-900/30 text-green-400 border border-green-800'
              }`}
            >
              <div className="text-lg">{info.icon}</div>
              <div className="font-semibold">{info.label}</div>
              <div className="text-[10px] opacity-75">
                {points.length - damagedCount}/{points.length} سليم
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
