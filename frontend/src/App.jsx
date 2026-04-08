import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import Lobby from './components/Lobby';
import DefenderDashboard from './components/DefenderDashboard';
import AttackerDashboard from './components/AttackerDashboard';
import GameReport from './components/GameReport';

function GameContent() {
  const { gameState } = useGame();

  if (gameState.status === 'finished') {
    return <GameReport />;
  }

  if (gameState.status === 'playing') {
    return gameState.role === 'defender' 
      ? <DefenderDashboard /> 
      : <AttackerDashboard />;
  }

  return <Lobby />;
}

export default function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
