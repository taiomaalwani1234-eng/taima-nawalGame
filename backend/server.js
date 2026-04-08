const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

const gameRooms = new Map();
const playerSockets = new Map();

class GameRoom {
  constructor(roomId, hostIp) {
    this.roomId = roomId;
    this.hostIp = hostIp;
    this.status = 'waiting';
    this.players = [];
    this.infrastructure = this.initializeInfrastructure();
    this.actionLogs = [];
    this.timeRemaining = 600;
    this.gameStartTime = null;
  }

  initializeInfrastructure() {
    return {
      hospital: { sectorName: 'hospital', status: 'green', healthPercentage: 100 },
      powerGrid: { sectorName: 'powerGrid', status: 'green', healthPercentage: 100 },
      communications: { sectorName: 'communications', status: 'green', healthPercentage: 100 },
      waterPlant: { sectorName: 'waterPlant', status: 'green', healthPercentage: 100 },
      trafficLights: { sectorName: 'trafficLights', status: 'green', healthPercentage: 100 }
    };
  }
}

class Player {
  constructor(socketId, role) {
    this.socketId = socketId;
    this.role = role;
    this.credits = role === 'defender' ? 10000 : 0;
    this.isOnCooldown = false;
    this.cooldownEndsAt = null;
    this.lastAttackTime = 0;
    this.attackCount = 0;
    this.attackResetTime = null;
  }

  canAttack() {
    const now = Date.now();
    
    if (this.attackResetTime && now - this.attackResetTime >= 1000) {
      this.attackCount = 0;
      this.attackResetTime = null;
    }
    
    if (this.attackCount >= 2) {
      return { allowed: false, reason: 'rate_limit' };
    }
    
    if (this.isOnCooldown && now < this.cooldownEndsAt) {
      return { allowed: false, reason: 'cooldown', remainingTime: this.cooldownEndsAt - now };
    }
    
    return { allowed: true };
  }

  startCooldown(durationMs) {
    this.isOnCooldown = true;
    this.cooldownEndsAt = Date.now() + durationMs;
    this.attackCount++;
    
    if (!this.attackResetTime) {
      this.attackResetTime = Date.now();
    }
    
    setTimeout(() => {
      this.isOnCooldown = false;
      this.cooldownEndsAt = null;
    }, durationMs);
  }
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getLocalIP() {
  const interfaces = require('os').networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

io.on('connection', (socket) => {
  console.log(`اللاعب متصل: ${socket.id}`);

  socket.on('host-game', (data) => {
    const roomId = generateRoomId();
    const hostIp = getLocalIP();
    const room = new GameRoom(roomId, hostIp);
    
    const player = new Player(socket.id, data.role);
    room.players.push(player);
    
    gameRooms.set(roomId, room);
    playerSockets.set(socket.id, { roomId, role: data.role });
    
    socket.join(roomId);
    
    socket.emit('room-created', {
      roomId,
      hostIp,
      role: data.role,
      credits: player.credits
    });
    
    console.log(`غرفة جديدة أنشئت: ${roomId} بواسطة ${socket.id}`);
  });

  socket.on('join-game', (data) => {
    const room = gameRooms.get(data.roomId);
    
    if (!room) {
      socket.emit('error', { message: 'الغرفة غير موجودة' });
      return;
    }
    
    if (room.players.length >= 2) {
      socket.emit('error', { message: 'الغرفة ممتلئة' });
      return;
    }
    
    const existingRole = room.players[0].role;
    const playerRole = existingRole === 'defender' ? 'attacker' : 'defender';
    
    const player = new Player(socket.id, playerRole);
    room.players.push(player);
    
    playerSockets.set(socket.id, { roomId: data.roomId, role: playerRole });
    
    socket.join(data.roomId);
    
    socket.emit('room-joined', {
      roomId: data.roomId,
      role: playerRole,
      credits: player.credits,
      infrastructure: room.infrastructure
    });
    
    if (room.players.length === 2) {
      room.status = 'playing';
      room.gameStartTime = Date.now();
      
      io.to(data.roomId).emit('game-start', {
        infrastructure: room.infrastructure,
        timeRemaining: room.timeRemaining,
        players: room.players.map(p => ({
          socketId: p.socketId,
          role: p.role,
          credits: p.credits
        }))
      });
      
      startGameTimer(data.roomId);
    }
    
    console.log(`لاعب انضم للغرفة ${data.roomId}: ${socket.id}`);
  });

  socket.on('launch-attack', (data) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;
    
    const room = gameRooms.get(playerInfo.roomId);
    if (!room || room.status !== 'playing') return;
    
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || player.role !== 'attacker') return;
    
    const attackCheck = player.canAttack();
    if (!attackCheck.allowed) {
      socket.emit('attack-blocked', {
        reason: attackCheck.reason,
        remainingTime: attackCheck.remainingTime || 0
      });
      return;
    }
    
    const attackConfig = getAttackConfig(data.attackType);
    if (!attackConfig) return;
    
    if (attackConfig.castTime > 0) {
      socket.emit('attack-casting', {
        attackType: data.attackType,
        targetSector: data.targetSector,
        castTime: attackConfig.castTime
      });
      
      setTimeout(() => {
        executeAttack(socket, room, player, data, attackConfig);
      }, attackConfig.castTime * 1000);
    } else {
      executeAttack(socket, room, player, data, attackConfig);
    }
  });

  socket.on('deploy-defense', (data) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;
    
    const room = gameRooms.get(playerInfo.roomId);
    if (!room || room.status !== 'playing') return;
    
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || player.role !== 'defender') return;
    
    const defenseConfig = getDefenseConfig(data.defenseType);
    if (!defenseConfig) return;
    
    if (player.credits < defenseConfig.cost) {
      socket.emit('defense-failed', {
        reason: 'insufficient_credits',
        required: defenseConfig.cost,
        available: player.credits
      });
      return;
    }
    
    player.credits -= defenseConfig.cost;
    
    const targetSector = room.infrastructure[data.targetSector];
    
    const logEntry = {
      timestamp: new Date(),
      actor: 'defender',
      actionType: `${data.defenseType}_deployed`,
      targetSector: data.targetSector,
      outcome: 'success',
      creditsRemaining: player.credits
    };
    room.actionLogs.push(logEntry);
    
    if (targetSector.status === 'yellow') {
      targetSector.status = 'green';
      targetSector.healthPercentage = 100;
    }
    
    io.to(playerInfo.roomId).emit('defense-deployed', {
      defenseType: data.defenseType,
      targetSector: data.targetSector,
      credits: player.credits,
      sectorStatus: targetSector
    });
    
    io.to(playerInfo.roomId).emit('game-log', {
      message: `🛡️ تم نشر ${defenseConfig.name} على ${getSectorName(data.targetSector)}`,
      type: 'defense'
    });
  });

  socket.on('disconnect', () => {
    const playerInfo = playerSockets.get(socket.id);
    if (playerInfo) {
      const room = gameRooms.get(playerInfo.roomId);
      if (room) {
        io.to(playerInfo.roomId).emit('player-disconnected', {
          message: 'انقطع اتصال اللاعب الآخر'
        });
        gameRooms.delete(playerInfo.roomId);
      }
      playerSockets.delete(socket.id);
    }
    console.log(`اللاعب قطع الاتصال: ${socket.id}`);
  });
});

function executeAttack(socket, room, player, data, attackConfig) {
  const targetSector = room.infrastructure[data.targetSector];
  
  const logEntry = {
    timestamp: new Date(),
    actor: 'attacker',
    actionType: `${data.attackType}_launched`,
    targetSector: data.targetSector,
    outcome: targetSector.status === 'green' ? 'success' : 'blocked'
  };
  room.actionLogs.push(logEntry);
  
  if (targetSector.status === 'green') {
    targetSector.status = 'yellow';
    targetSector.healthPercentage -= attackConfig.damage;
  } else if (targetSector.status === 'yellow') {
    targetSector.healthPercentage -= attackConfig.damage;
    if (targetSector.healthPercentage <= 0) {
      targetSector.status = 'red';
      targetSector.healthPercentage = 0;
    }
  }
  
  player.startCooldown(attackConfig.cooldown * 1000);
  
  const playerInfo = playerSockets.get(socket.id);
  
  io.to(playerInfo.roomId).emit('attack-executed', {
    attackType: data.attackType,
    targetSector: data.targetSector,
    sectorStatus: targetSector,
    cooldown: attackConfig.cooldown
  });
  
  io.to(playerInfo.roomId).emit('game-log', {
    message: `⚠️ هجوم ${attackConfig.name} على ${getSectorName(data.targetSector)} - الحالة: ${targetSector.status === 'green' ? '🟢' : targetSector.status === 'yellow' ? '🟡' : '🔴'}`,
    type: 'attack'
  });
  
  checkGameEnd(playerInfo.roomId);
}

function getAttackConfig(attackType) {
  const configs = {
    ddos: { name: 'DDoS', damage: 20, cooldown: 3, castTime: 0 },
    ransomware: { name: 'Ransomware', damage: 35, cooldown: 5, castTime: 2 },
    phishing: { name: 'Phishing', damage: 15, cooldown: 2, castTime: 0 },
    apt: { name: 'APT', damage: 50, cooldown: 10, castTime: 10 }
  };
  return configs[attackType];
}

function getDefenseConfig(defenseType) {
  const configs = {
    firewall: { name: 'جدار حماية', cost: 500, protection: 30 },
    patch: { name: 'تصحيح أمني', cost: 300, protection: 20 },
    reboot: { name: 'إعادة تشغيل الخادم', cost: 1000, protection: 50 },
    isolate: { name: 'عزل الشبكة', cost: 1500, protection: 100 }
  };
  return configs[defenseType];
}

function getSectorName(sectorKey) {
  const names = {
    hospital: 'المستشفى',
    powerGrid: 'شبكة الكهرباء',
    communications: 'الاتصالات',
    waterPlant: 'محطة المياه',
    trafficLights: 'إشارات المرور'
  };
  return names[sectorKey] || sectorKey;
}

function startGameTimer(roomId) {
  const room = gameRooms.get(roomId);
  if (!room) return;
  
  const timerInterval = setInterval(() => {
    const room = gameRooms.get(roomId);
    if (!room || room.status !== 'playing') {
      clearInterval(timerInterval);
      return;
    }
    
    room.timeRemaining -= 1;
    
    io.to(roomId).emit('timer-update', { timeRemaining: room.timeRemaining });
    
    if (room.timeRemaining <= 0) {
      endGame(roomId, 'defender');
      clearInterval(timerInterval);
    }
  }, 1000);
}

function checkGameEnd(roomId) {
  const room = gameRooms.get(roomId);
  if (!room) return;
  
  const allRed = Object.values(room.infrastructure).every(sector => sector.status === 'red');
  
  const defender = room.players.find(p => p.role === 'defender');
  const bankrupt = defender && defender.credits <= 0;
  
  if (allRed) {
    endGame(roomId, 'attacker');
  } else if (bankrupt) {
    endGame(roomId, 'attacker');
  }
}

function endGame(roomId, winner) {
  const room = gameRooms.get(roomId);
  if (!room) return;
  
  room.status = 'finished';
  
  const report = generateGameReport(room);
  
  io.to(roomId).emit('game-end', {
    winner,
    report
  });
  
  gameRooms.delete(roomId);
}

function generateGameReport(room) {
  const defenderLogs = room.actionLogs.filter(log => log.actor === 'defender');
  const attackerLogs = room.actionLogs.filter(log => log.actor === 'attacker');
  
  const defender = room.players.find(p => p.role === 'defender');
  
  return {
    winner: room.status === 'finished' ? 'attacker' : 'defender',
    totalDuration: room.gameStartTime ? Math.floor((Date.now() - room.gameStartTime) / 1000) : 0,
    defenderStats: {
      creditsRemaining: defender ? defender.credits : 0,
      defensesDeployed: defenderLogs.length,
      sectorsProtected: defenderLogs.filter(log => log.outcome === 'success').length
    },
    attackerStats: {
      attacksLaunched: attackerLogs.length,
      sectorsCompromised: Object.values(room.infrastructure).filter(s => s.status === 'red').length,
      sectorsDamaged: Object.values(room.infrastructure).filter(s => s.status !== 'green').length
    },
    actionLogs: room.actionLogs,
    infrastructureStatus: room.infrastructure
  };
}

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 خادم SecureCity يعمل على المنفذ ${PORT}`);
  console.log(`📡 عنوان IP المحلي: ${getLocalIP()}`);
});
