import React from 'react';
import { useGame } from '../context/GameContext';

export default function GameReport() {
  const { gameState } = useGame();
  const report = gameState.gameReport;

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">جاري تحميل التقرير...</div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          تقرير نهاية اللعبة
        </h1>

        <div className="glass-effect rounded-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className={'text-6xl mb-4 ' + (report.winner === 'defender' ? 'text-blue-400' : 'text-red-400')}>
              {report.winner === 'defender' ? '🛡️' : '💀'}
            </div>
            <h2 className={'text-3xl font-bold ' + (report.winner === 'defender' ? 'text-blue-400' : 'text-red-400')}>
              {report.winner === 'defender' ? 'الفائز: المدافع' : 'الفائز: المهاجم'}
            </h2>
            <p className="text-gray-400 mt-2">
              مدة اللعبة: {formatTime(report.totalDuration)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-blue-900/30 rounded-lg p-6 border border-blue-700">
              <h3 className="text-blue-400 text-xl mb-4">🛡️ إحصائيات المدافع</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">الرصيد المتبقي:</span>
                  <span className="text-blue-400 font-bold">${report.defenderStats.creditsRemaining.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">الدفاعات المنشورة:</span>
                  <span className="text-blue-400 font-bold">{report.defenderStats.defensesDeployed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">القطاعات المحمية:</span>
                  <span className="text-green-400 font-bold">{report.defenderStats.sectorsProtected}</span>
                </div>
              </div>
            </div>

            <div className="bg-red-900/30 rounded-lg p-6 border border-red-700">
              <h3 className="text-red-400 text-xl mb-4">💀 إحصائيات المهاجم</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">الهجمات المنفذة:</span>
                  <span className="text-red-400 font-bold">{report.attackerStats.attacksLaunched}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">القطاعات المخترقة:</span>
                  <span className="text-red-400 font-bold">{report.attackerStats.sectorsCompromised}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">القطاعات المتضررة:</span>
                  <span className="text-yellow-400 font-bold">{report.attackerStats.sectorsDamaged}/5</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-white text-xl mb-4">حالة البنية التحتية النهائية</h3>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(report.infrastructureStatus).map(([key, sector]) => (
                <div
                  key={key}
                  className={'p-4 rounded-lg text-center ' + 
                    (sector.status === 'green' ? 'bg-green-900/50 border border-green-700' :
                     sector.status === 'yellow' ? 'bg-yellow-900/50 border border-yellow-700' :
                     'bg-red-900/50 border border-red-700')
                  }
                >
                  <div className="text-2xl mb-2">
                    {key === 'hospital' ? '🏥' :
                     key === 'powerGrid' ? '⚡' :
                     key === 'communications' ? '📡' :
                     key === 'waterPlant' ? '💧' : '🚦'}
                  </div>
                  <div className={'font-bold ' + 
                    (sector.status === 'green' ? 'text-green-400' :
                     sector.status === 'yellow' ? 'text-yellow-400' :
                     'text-red-400')
                  }>
                    {sector.healthPercentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-white text-xl mb-4">📋 سجل الأحداث</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {report.actionLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={'p-3 rounded ' + 
                    (log.actor === 'defender' ? 'bg-blue-900/30 text-blue-300' :
                     'bg-red-900/30 text-red-300')
                  }
                >
                  <span className="text-gray-400 text-sm">
                    {new Date(log.timestamp).toLocaleTimeString('ar-SA')}
                  </span>
                  <span className="mx-2">|</span>
                  <span>{log.actionType} - {log.targetSector}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
