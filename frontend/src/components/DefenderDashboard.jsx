import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import CityMap from './CityMap';

export default function DefenderDashboard() {
  const { gameState, deployDefense } = useGame();
  const [selectedSector, setSelectedSector] = useState(null);
  const [cooldowns, setCooldowns] = useState({});

  const defenses = [
    { type: 'firewall', name: 'جدار حماية', cost: 500, icon: '🛡️' },
    { type: 'patch', name: 'تصحيح أمني', cost: 300, icon: '🔧' },
    { type: 'reboot', name: 'إعادة تشغيل', cost: 1000, icon: '🔄' },
    { type: 'isolate', name: 'عزل الشبكة', cost: 1500, icon: '🔌' }
  ];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDefense = (defenseType) => {
    if (selectedSector) {
      deployDefense(defenseType, selectedSector);
      setCooldowns(prev => ({
        ...prev,
        [defenseType]: true
      }));
      setTimeout(() => {
        setCooldowns(prev => ({
          ...prev,
          [defenseType]: false
        }));
      }, 2000);
    }
  };

  const handleSectorClick = (sectorKey) => {
    setSelectedSector(sectorKey);
  };

  const getSectorName = (key) => {
    const names = {
      hospital: 'المستشفى',
      powerGrid: 'شبكة الكهرباء',
      communications: 'الاتصالات',
      waterPlant: 'محطة المياه',
      trafficLights: 'إشارات المرور'
    };
    return names[key] || key;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const attacked = Object.entries(gameState.infrastructure || {})
        .filter(([_, data]) => data.status !== 'green')
        .map(([key, _]) => key);
      
      if (attacked.length > 0 && !selectedSector) {
        setSelectedSector(attacked[0]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.infrastructure, selectedSector]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-4 shadow-lg">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">🛡️ مركز القيادة</h1>
            <span className="text-blue-200">|</span>
            <span className="text-blue-100">المدافع</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-white">
              <span className="text-sm text-blue-200">الوقت المتبقي:</span>
              <span className="ml-2 text-xl font-bold">{formatTime(gameState.timeRemaining)}</span>
            </div>
            <div className="bg-green-600 px-6 py-2 rounded-lg">
              <span className="text-green-100 text-sm">الرصيد:</span>
              <span className="text-white text-xl font-bold ml-2">
                ${gameState.credits.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 max-w-7xl mx-auto w-full p-4 gap-4">
        <div className="flex-1 flex flex-col">
          <div className="glass-effect rounded-lg p-4 mb-4">
            <h2 className="text-white text-lg mb-2">خريطة المدينة</h2>
            <CityMap
              infrastructure={gameState.infrastructure}
              onSectorClick={handleSectorClick}
              role="defender"
            />
          </div>

          <div className="glass-effect rounded-lg p-4">
            <h3 className="text-white mb-3">ترسانة الدفاع</h3>
            <div className="grid grid-cols-4 gap-3">
              {defenses.map((defense) => (
                <button
                  key={defense.type}
                  onClick={() => handleDefense(defense.type)}
                  disabled={
                    gameState.credits < defense.cost ||
                    !selectedSector ||
                    cooldowns[defense.type]
                  }
                  className={`p-4 rounded-lg transition-all ${
                    gameState.credits >= defense.cost && selectedSector && !cooldowns[defense.type]
                      ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="text-2xl mb-1">{defense.icon}</div>
                  <div className="text-sm font-semibold">{defense.name}</div>
                  <div className="text-xs opacity-75">-${defense.cost}</div>
                </button>
              ))}
            </div>
            {selectedSector && (
              <div className="mt-3 text-center text-blue-300">
                القطاع المحدد: {getSectorName(selectedSector)}
              </div>
            )}
          </div>
        </div>

        <div className="w-80">
          <div className="glass-effect rounded-lg p-4 h-full">
            <h3 className="text-white mb-3">📋 سجل الأحداث</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
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
