import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import CityMap from './CityMap';
import { INFRASTRUCTURE_POINTS, SECTOR_TYPES, getPointDisplayName } from '../data/infrastructureData';

export default function DefenderDashboard() {
  const { gameState, deployDefense } = useGame();
  const [selectedId, setSelectedId] = useState(null);
  const [cooldowns, setCooldowns] = useState({});
  const [filterType, setFilterType] = useState('all');

  const defenses = [
    { type: 'firewall', name: 'جدار حماية', cost: 500, icon: '🛡️' },
    { type: 'patch', name: 'تصحيح أمني', cost: 300, icon: '🔧' },
    { type: 'reboot', name: 'إعادة تشغيل', cost: 1000, icon: '🔄' },
    { type: 'isolate', name: 'عزل الشبكة', cost: 1500, icon: '🔌' }
  ];

  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDefense = (defenseType) => {
    if (selectedId) {
      deployDefense(defenseType, selectedId);
      setCooldowns(prev => ({ ...prev, [defenseType]: true }));
      setTimeout(() => {
        setCooldowns(prev => ({ ...prev, [defenseType]: false }));
      }, 2000);
    }
  };

  const handleSectorClick = (pointId) => {
    setSelectedId(pointId);
  };

  const getResourceColor = (current, max) => {
    const pct = (current / max) * 100;
    if (pct > 60) return 'bg-green-500';
    if (pct > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getResourceTextColor = (current, max) => {
    const pct = (current / max) * 100;
    if (pct > 60) return 'text-green-400';
    if (pct > 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const resources = gameState.resources || {
    cpu: { current: 100, max: 100 },
    bandwidth: { current: 100, max: 100 },
    budget: { current: 10000, max: 10000 }
  };

  const filteredPoints = filterType === 'all'
    ? INFRASTRUCTURE_POINTS
    : INFRASTRUCTURE_POINTS.filter(p => p.type === filterType);

  const damagedCount = INFRASTRUCTURE_POINTS.filter(p => {
    const data = gameState.infrastructure?.[p.id];
    return data?.status !== 'green';
  }).length;

  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedId) {
        const attacked = Object.entries(gameState.infrastructure || {})
          .filter(([_, data]) => data.status === 'yellow' || data.status === 'red')
          .sort((a, b) => {
            const aC = INFRASTRUCTURE_POINTS.find(p => p.id === a[0])?.criticality || 0;
            const bC = INFRASTRUCTURE_POINTS.find(p => p.id === b[0])?.criticality || 0;
            return bC - aC;
          });
        if (attacked.length > 0) {
          setSelectedId(attacked[0][0]);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.infrastructure, selectedId]);

  const selectedData = selectedId ? gameState.infrastructure?.[selectedId] : null;
  const selectedPoint = INFRASTRUCTURE_POINTS.find(p => p.id === selectedId);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-3 shadow-lg">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">🛡️ مركز القيادة - سوريا الذكية</h1>
            <span className="text-blue-200">|</span>
            <span className="text-blue-100">المدافع</span>
            {damagedCount > 0 && (
              <span className="bg-red-600 px-3 py-1 rounded-full text-sm text-white animate-pulse">
                {damagedCount} نقطة متضررة
              </span>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="text-white">
              <span className="text-sm text-blue-200">الوقت:</span>
              <span className="ml-2 text-xl font-bold">{formatTime(gameState.localTime)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border-b border-gray-700 p-2">
        <div className="flex items-center gap-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-gray-400 w-20">CPU المعالج</span>
            <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full resource-bar ${getResourceColor(resources.cpu.current, resources.cpu.max)} ${resources.cpu.current <= 30 ? 'resource-bar-critical' : ''}`}
                style={{ width: `${(resources.cpu.current / resources.cpu.max) * 100}%` }}
              />
            </div>
            <span className={`text-xs font-bold w-12 ${getResourceTextColor(resources.cpu.current, resources.cpu.max)}`}>
              {Math.round(resources.cpu.current)}%
            </span>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-gray-400 w-20">عرض النطاق</span>
            <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full resource-bar ${getResourceColor(resources.bandwidth.current, resources.bandwidth.max)} ${resources.bandwidth.current <= 30 ? 'resource-bar-critical' : ''}`}
                style={{ width: `${(resources.bandwidth.current / resources.bandwidth.max) * 100}%` }}
              />
            </div>
            <span className={`text-xs font-bold w-12 ${getResourceTextColor(resources.bandwidth.current, resources.bandwidth.max)}`}>
              {Math.round(resources.bandwidth.current)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">الميزانية</span>
            <span className="text-lg font-bold text-green-400">
              ${resources.budget.current.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 max-w-7xl mx-auto w-full p-4 gap-4">
        <div className="flex-1 flex flex-col">
          <div className="glass-effect rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white text-lg">خريطة سوريا الذكية</h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-1 rounded text-xs ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                >
                  الكل
                </button>
                {Object.entries(SECTOR_TYPES).map(([type, info]) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-2 py-1 rounded text-xs ${filterType === type ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                  >
                    {info.icon}
                  </button>
                ))}
              </div>
            </div>
            <CityMap
              infrastructure={gameState.infrastructure}
              onSectorClick={handleSectorClick}
              role="defender"
            />
          </div>

          <div className="glass-effect rounded-lg p-4">
            <h3 className="text-white mb-3">ترسانة الدفاع</h3>
            {selectedId && selectedData && (
              <div className={`mb-3 p-3 rounded-lg ${
                selectedData.status === 'green' ? 'bg-green-900/30 border border-green-700' :
                selectedData.status === 'yellow' ? 'bg-yellow-900/30 border border-yellow-700' :
                'bg-red-900/30 border border-red-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">{selectedPoint?.name || selectedId}</span>
                    <span className="text-gray-400 text-sm mr-2">({SECTOR_TYPES[selectedPoint?.type]?.label})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">الصحة: <strong>{selectedData.healthPercentage}%</strong></span>
                    <span className={`text-sm font-bold ${
                      selectedData.status === 'green' ? 'text-green-400' :
                      selectedData.status === 'yellow' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {selectedData.status === 'green' ? '🟢 آمن' : selectedData.status === 'yellow' ? '🟡 تحت الضغط' : '🔴 حرج'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 gap-3">
              {defenses.map((defense) => {
                const disabled = resources.budget.current < defense.cost || !selectedId || cooldowns[defense.type];
                return (
                  <button
                    key={defense.type}
                    onClick={() => handleDefense(defense.type)}
                    disabled={disabled}
                    className={`p-4 rounded-lg transition-all ${
                      !disabled
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-2xl mb-1">{defense.icon}</div>
                    <div className="text-sm font-semibold">{defense.name}</div>
                    <div className="text-xs opacity-75">-${defense.cost}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-80">
          <div className="glass-effect rounded-lg p-4 h-full flex flex-col">
            <h3 className="text-white mb-3">📋 سجل الأحداث</h3>
            <div className="space-y-2 flex-1 overflow-y-auto max-h-[600px]">
              {gameState.logs.slice().reverse().map((log) => (
                <div
                  key={log.id}
                  className={`text-sm p-2 rounded ${
                    log.type === 'attack' ? 'bg-red-900/30 text-red-300' :
                    log.type === 'defense' ? 'bg-blue-900/30 text-blue-300' :
                    'bg-gray-700/50 text-gray-300'
                  }`}
                >
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
