import React from 'react';
import { useGame } from '../context/GameContext';

export default function Lobby() {
  const { gameState, hostGame, joinGame } = useGame();
  const [selectedRole, setSelectedRole] = React.useState('defender');
  const [joinRoomId, setJoinRoomId] = React.useState('');

  const handleHost = () => {
    hostGame(selectedRole);
  };

  const handleJoin = () => {
    if (joinRoomId.trim()) {
      joinGame(joinRoomId.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="glass-effect rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          🏙️ SecureCity
        </h1>
        <p className="text-gray-300 text-center mb-8">
          محاكاة الدفاع السيبراني للبنية التحتية الذكية
        </p>

        {gameState.status === 'lobby' && (
          <>
            <div className="mb-6">
              <label className="text-white mb-2 block">اختر دورك:</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedRole('defender')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    selectedRole === 'defender'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🛡️ مدافع
                </button>
                <button
                  onClick={() => setSelectedRole('attacker')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    selectedRole === 'attacker'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  💻 مهاجم
                </button>
              </div>
            </div>

            <button
              onClick={handleHost}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-bold text-lg mb-4 hover:opacity-90 transition-opacity"
            >
              استضافة لعبة جديدة
            </button>

            <div className="border-t border-gray-600 pt-6 mt-6">
              <label className="text-white mb-2 block">أدخل رمز الغرفة:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="مثال: ABC123"
                  className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  maxLength={6}
                />
                <button
                  onClick={handleJoin}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  انضمام
                </button>
              </div>
            </div>
          </>
        )}

        {gameState.status === 'waiting' && (
          <div className="text-center">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <p className="text-gray-300 mb-2">رمز الغرفة:</p>
              <p className="text-4xl font-bold text-white mb-4">{gameState.roomId}</p>
              <p className="text-gray-400">شارك هذا الرمز مع لاعب آخر</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <p className="text-gray-300">في انتظار انضمام لاعب آخر...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
