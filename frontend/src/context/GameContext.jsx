import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const GameContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function GameProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState({
    status: 'lobby',
    roomId: null,
    role: null,
    credits: 10000,
    infrastructure: null,
    timeRemaining: 600,
    logs: [],
    isOnCooldown: false,
    cooldownRemaining: 0,
    gameReport: null
  });

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('متصل بالخادم');
      setConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      console.error('خطأ في الاتصال:', error);
    });

    newSocket.on('room-created', (data) => {
      setGameState(prev => ({
        ...prev,
        status: 'waiting',
        roomId: data.roomId,
        role: data.role,
        credits: data.credits
      }));
    });

    newSocket.on('room-joined', (data) => {
      setGameState(prev => ({
        ...prev,
        status: 'waiting',
        roomId: data.roomId,
        role: data.role,
        credits: data.credits,
        infrastructure: data.infrastructure
      }));
    });

    newSocket.on('game-start', (data) => {
      setGameState(prev => ({
        ...prev,
        status: 'playing',
        infrastructure: data.infrastructure,
        timeRemaining: data.timeRemaining
      }));
    });

    newSocket.on('attack-executed', (data) => {
      setGameState(prev => ({
        ...prev,
        infrastructure: {
          ...prev.infrastructure,
          [data.targetSector]: data.sectorStatus
        },
        isOnCooldown: true,
        cooldownRemaining: data.cooldown
      }));
    });

    newSocket.on('defense-deployed', (data) => {
      setGameState(prev => ({
        ...prev,
        credits: data.credits,
        infrastructure: {
          ...prev.infrastructure,
          [data.targetSector]: data.sectorStatus
        }
      }));
    });

    newSocket.on('attack-blocked', (data) => {
      if (data.reason === 'cooldown') {
        setGameState(prev => ({
          ...prev,
          isOnCooldown: true,
          cooldownRemaining: Math.ceil(data.remainingTime / 1000)
        }));
      }
    });

    newSocket.on('attack-casting', (data) => {
      setGameState(prev => ({
        ...prev,
        isCasting: true,
        castingTime: data.castTime
      }));
    });

    newSocket.on('timer-update', (data) => {
      setGameState(prev => ({
        ...prev,
        timeRemaining: data.timeRemaining
      }));
    });

    newSocket.on('game-log', (data) => {
      setGameState(prev => ({
        ...prev,
        logs: [...prev.logs, { ...data, id: Date.now() }]
      }));
    });

    newSocket.on('game-end', (data) => {
      setGameState(prev => ({
        ...prev,
        status: 'finished',
        gameReport: data.report
      }));
    });

    newSocket.on('error', (data) => {
      console.error('خطأ:', data.message);
    });

    newSocket.on('player-disconnected', (data) => {
      setGameState(prev => ({
        ...prev,
        status: 'lobby',
        logs: [...prev.logs, { message: data.message, type: 'error', id: Date.now() }]
      }));
    });

    return () => newSocket.close();
  }, []);

  const hostGame = useCallback((role) => {
    const s = socketRef.current;
    if (s && s.connected) {
      console.log('إرسال حدث host-game:', role);
      s.emit('host-game', { role });
    } else {
      console.error('السوكت غير متصل');
    }
  }, []);

  const joinGame = useCallback((roomId) => {
    const s = socketRef.current;
    if (s) {
      s.emit('join-game', { roomId });
    }
  }, []);

  const launchAttack = useCallback((attackType, targetSector) => {
    const s = socketRef.current;
    if (s) {
      s.emit('launch-attack', { attackType, targetSector });
    }
  }, []);

  const deployDefense = useCallback((defenseType, targetSector) => {
    const s = socketRef.current;
    if (s) {
      s.emit('deploy-defense', { defenseType, targetSector });
    }
  }, []);

  const value = {
    gameState,
    connected,
    hostGame,
    joinGame,
    launchAttack,
    deployDefense
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
