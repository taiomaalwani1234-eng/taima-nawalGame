import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const GameContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function GameProvider({ children }) {
  const [socket, setSocket] = useState(null);
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

    newSocket.on('connect', () => {
      console.log('متصل بالخادم');
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

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const hostGame = useCallback((role) => {
    if (socket) {
      socket.emit('host-game', { role });
    }
  }, [socket]);

  const joinGame = useCallback((roomId) => {
    if (socket) {
      socket.emit('join-game', { roomId });
    }
  }, [socket]);

  const launchAttack = useCallback((attackType, targetSector) => {
    if (socket) {
      socket.emit('launch-attack', { attackType, targetSector });
    }
  }, [socket]);

  const deployDefense = useCallback((defenseType, targetSector) => {
    if (socket) {
      socket.emit('deploy-defense', { defenseType, targetSector });
    }
  }, [socket]);

  const value = {
    gameState,
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
