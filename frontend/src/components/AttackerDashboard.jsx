import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

export default function AttackerDashboard() {
  const { gameState, launchAttack } = useGame();
  const [selectedSector, setSelectedSector] = useState('hospital');
  const [isCasting, setIsCasting] = useState(false);
  const [castTime, setCastTime] = useState(0);
  const [cooldowns, setCooldowns] = useState({});

  const attacks = [
    { type: 'ddos', name: 'DDoS', damage: 20, cooldown: 3, castTime: 0, icon: 'DDoS' },
    { type: 'ransomware', name: 'Ransomware', damage: 35, cooldown: 5, castTime: 2, icon: 'RANS' },
    { type: 'phishing', name: 'Phishing', damage: 15, cooldown: 2, castTime: 0, icon: 'PHSH' },
    { type: 'apt', name: 'APT', damage: 50, cooldown: 10, castTime: 10, icon: 'APT' }
  ];

  const sectors = [
    { key: 'hospital', name: 'المستشفى', icon: 'H' },
    { key: 'powerGrid', name: 'شبكة الكهرباء', icon: 'P' },
    { key: 'communications', name: 'الاتصالات', icon: 'C' },
    { key: 'waterPlant', name: 'محطة المياه', icon: 'W' },
    { key: 'trafficLights', name: 'إشارات المرور', icon: 'T' }
  ];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  };

  const handleAttack = (attackType) => {
    if (selectedSector && !gameState.isOnCooldown && !isCasting) {
      launchAttack(attackType, selectedSector);
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

  const getHealthColor = (health) => {
    if (health > 70) return 'text-green-400';
    if (health > 30) return 'text-yellow-400';
    return 'text-red-400';
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
            <div className="text-gray-300">
              <span className="text-xl font-bold text-green-400">{formatTime(gameState.timeRemaining)}</span>
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
        <div className="w-64">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <h3 className="text-green-400 mb-3">TARGETS:</h3>
            <div className="space-y-2">
              {sectors.map((sector) => {
                const sectorData = gameState.infrastructure?.[sector.key];
                const health = sectorData?.healthPercentage ?? 100;
                const status = sectorData?.status || 'green';
                return (
                  <button
                    key={sector.key}
                    onClick={() => setSelectedSector(sector.key)}
                    className={'w-full p-3 rounded text-right transition-all ' + (selectedSector === sector.key ? 'bg-green-900/50 border border-green-600' : 'bg-gray-800 hover:bg-gray-700 border border-gray-700')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-200">{sector.icon} {sector.name}</span>
                      <span className={'text-sm font-bold ' + getHealthColor(health)}>{health}%</span>
                    </div>
                    <div className="mt-2 h-1 bg-gray-700 rounded overflow-hidden">
                      <div className={'h-full ' + (status === 'green' ? 'bg-green-500' : status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: health + '%' }} />
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
            {isCasting && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
                <span className="text-red-400">Casting... {castTime}s</span>
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
