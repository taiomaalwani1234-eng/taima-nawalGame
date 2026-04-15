import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { INFRASTRUCTURE_POINTS, SECTOR_TYPES } from '../data/infrastructureData';

export default function AttackerDashboard() {
  const { gameState, launchAttack } = useGame();
  const [selectedId, setSelectedId] = useState(null);
  const [isCasting, setIsCasting] = useState(false);
  const [castTime, setCastTime] = useState(0);
  const [cooldowns, setCooldowns] = useState({});
  const [filterType, setFilterType] = useState('all');

  const attacks = [
    { type: 'ddos', name: 'DDoS', damage: 20, cooldown: 3, castTime: 0, icon: 'DDoS', desc: 'إغراق شبكة' },
    { type: 'ransomware', name: 'Ransomware', damage: 35, cooldown: 5, castTime: 2, icon: 'RANS', desc: 'فدية' },
    { type: 'phishing', name: 'Phishing', damage: 15, cooldown: 2, castTime: 0, icon: 'PHSH', desc: 'تصيد' },
    { type: 'apt', name: 'APT', damage: 50, cooldown: 10, castTime: 10, icon: 'APT', desc: 'تهديد متقدم' }
  ];

  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  };

  const filteredPoints = filterType === 'all'
    ? INFRASTRUCTURE_POINTS
    : INFRASTRUCTURE_POINTS.filter(p => p.type === filterType);

  const stats = useMemo(() => {
    const infra = gameState.infrastructure || {};
    const green = INFRASTRUCTURE_POINTS.filter(p => infra[p.id]?.status === 'green').length;
    const yellow = INFRASTRUCTURE_POINTS.filter(p => infra[p.id]?.status === 'yellow').length;
    const red = INFRASTRUCTURE_POINTS.filter(p => infra[p.id]?.status === 'red').length;
    return { green, yellow, red, total: INFRASTRUCTURE_POINTS.length };
  }, [gameState.infrastructure]);

  const handleAttack = (attackType) => {
    if (selectedId && !gameState.isOnCooldown && !isCasting) {
      launchAttack(attackType, selectedId);
      const attack = attacks.find(a => a.type === attackType);
      if (attack.castTime > 0) {
        setIsCasting(true);
        setCastTime(attack.castTime);
      }
      setCooldowns(prev => ({ ...prev, [attackType]: true }));
      setTimeout(() => {
        setCooldowns(prev => ({ ...prev, [attackType]: false }));
      }, attack.cooldown * 1000);
    }
  };

  useEffect(() => {
    let interval;
    if (isCasting && castTime > 0) {
      interval = setInterval(() => {
        setCastTime(prev => {
          if (prev <= 1) {
            setIsCasting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCasting, castTime]);

  const getHealthColor = (status) => {
    if (status === 'green') return 'text-green-400';
    if (status === 'yellow') return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusBadge = (status) => {
    if (status === 'green') return 'bg-green-900/50 text-green-400';
    if (status === 'yellow') return 'bg-yellow-900/50 text-yellow-400';
    return 'bg-red-900/50 text-red-400';
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 shadow-lg border-b border-green-900">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-green-400">[ HACKER_TERMINAL ]</h1>
            <span className="text-green-300">Attacker</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">🟢 {stats.green}</span>
              <span className="text-xs text-yellow-400">🟡 {stats.yellow}</span>
              <span className="text-xs text-red-400">🔴 {stats.red}</span>
              <span className="text-xs text-gray-500">/ {stats.total}</span>
            </div>
            <div className="text-gray-300">
              <span className="text-xl font-bold text-green-400">{formatTime(gameState.localTime)}</span>
            </div>
            {gameState.isOnCooldown && (
              <div className="bg-red-900/50 px-4 py-2 rounded border border-red-700">
                <span className="text-red-400 font-bold">{gameState.cooldownRemaining}s</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto p-4 gap-4">
        <div className="w-72">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <h3 className="text-green-400 mb-3">TARGETS:</h3>
            <div className="flex gap-1 mb-3 flex-wrap">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-1 rounded text-xs ${filterType === 'all' ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}
              >
                الكل ({INFRASTRUCTURE_POINTS.length})
              </button>
              {Object.entries(SECTOR_TYPES).map(([type, info]) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2 py-1 rounded text-xs ${filterType === type ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}
                >
                  {info.icon}
                </button>
              ))}
            </div>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {filteredPoints.map((point) => {
                const data = gameState.infrastructure?.[point.id];
                const health = data?.healthPercentage ?? 100;
                const status = data?.status || 'green';
                return (
                  <button
                    key={point.id}
                    onClick={() => setSelectedId(point.id)}
                    className={'w-full p-2 rounded text-right transition-all text-sm ' + (selectedId === point.id ? 'bg-green-900/50 border border-green-600' : 'bg-gray-800 hover:bg-gray-700 border border-gray-700')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-200 text-xs">{SECTOR_TYPES[point.type].icon} {point.name}</span>
                      <span className={'text-xs font-bold ' + getHealthColor(status)}>{health}%</span>
                    </div>
                    <div className="mt-1 h-1 bg-gray-700 rounded overflow-hidden">
                      <div
                        className={'h-full transition-all duration-700 ' + (status === 'green' ? 'bg-green-500' : status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500')}
                        style={{ width: health + '%' }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-green-400 mb-4">ATTACK_ARSENAL:</h3>
            {selectedId && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-4">
                <span className="text-green-400">TARGET: </span>
                <span className="text-white">{INFRASTRUCTURE_POINTS.find(p => p.id === selectedId)?.name || selectedId}</span>
                <span className="text-gray-500 text-sm mr-2">
                  ({SECTOR_TYPES[INFRASTRUCTURE_POINTS.find(p => p.id === selectedId)?.type]?.label})
                </span>
              </div>
            )}
            {isCasting && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full" />
                  <span className="text-red-400">Casting... {castTime}s</span>
                </div>
                <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-1000"
                    style={{ width: `${((attacks.find(a => a.castTime > 0)?.castTime - castTime) / attacks.find(a => a.castTime > 0)?.castTime) * 100}%` }}
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {attacks.map((attack) => {
                const isDisabled = gameState.isOnCooldown || isCasting || cooldowns[attack.type];
                return (
                  <button
                    key={attack.type}
                    onClick={() => handleAttack(attack.type)}
                    disabled={isDisabled}
                    className={'p-6 rounded-lg border transition-all ' + (isDisabled ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-800 border-green-700 hover:bg-gray-700 hover:border-green-500 text-green-400 cursor-pointer')}
                  >
                    <div className="text-3xl mb-2">{attack.icon}</div>
                    <div className="text-lg font-bold mb-1">{attack.name}</div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>Damage: {attack.damage}%</div>
                      <div>Cooldown: {attack.cooldown}s</div>
                      {attack.castTime > 0 && <div className="text-yellow-400">Cast: {attack.castTime}s</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-72">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 h-full">
            <h3 className="text-green-400 mb-3">TERMINAL:</h3>
            <div className="font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
              {gameState.logs.slice().reverse().map((log, idx) => (
                <div key={log.id || idx} className={log.type === 'attack' ? 'text-red-400' : log.type === 'defense' ? 'text-blue-400' : 'text-gray-400'}>
                  {log.message}
                </div>
              ))}
              <div className="text-green-600">_</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
