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

const INFRASTRUCTURE_POINTS = [
  { id: 'hospital_damascus', type: 'hospital', name: 'مستشفى دمشق', criticality: 10 },
  { id: 'hospital_aleppo', type: 'hospital', name: 'مستشفى حلب', criticality: 10 },
  { id: 'hospital_homs', type: 'hospital', name: 'مستشفى حمص', criticality: 9 },
  { id: 'hospital_latakia', type: 'hospital', name: 'مستشفى اللاذقية', criticality: 8 },
  { id: 'hospital_deir', type: 'hospital', name: 'مستشفى دير الزور', criticality: 8 },
  { id: 'traffic_d1', type: 'trafficLights', name: 'إشارة ساحة الأمويين', criticality: 7 },
  { id: 'traffic_d2', type: 'trafficLights', name: 'إشارة المزة', criticality: 6 },
  { id: 'traffic_a1', type: 'trafficLights', name: 'إشارة ساحة سعد الله', criticality: 7 },
  { id: 'traffic_a2', type: 'trafficLights', name: 'إشارة الفردوس', criticality: 6 },
  { id: 'traffic_h1', type: 'trafficLights', name: 'إشارة حمص المركزية', criticality: 6 },
  { id: 'traffic_h2', type: 'trafficLights', name: 'إشارة القصور', criticality: 5 },
  { id: 'traffic_l1', type: 'trafficLights', name: 'إشارة اللاذقية الميناء', criticality: 5 },
  { id: 'traffic_de1', type: 'trafficLights', name: 'إشارة دير الزور المركزية', criticality: 5 },
  { id: 'traffic_hama', type: 'trafficLights', name: 'إشارة حماة', criticality: 5 },
  { id: 'traffic_raqqa', type: 'trafficLights', name: 'إشارة الرقة', criticality: 5 },
  { id: 'comm_damascus', type: 'communications', name: 'برج اتصالات دمشق', criticality: 9 },
  { id: 'comm_aleppo', type: 'communications', name: 'برج اتصالات حلب', criticality: 9 },
  { id: 'comm_homs', type: 'communications', name: 'برج اتصالات حمص', criticality: 8 },
  { id: 'comm_latakia', type: 'communications', name: 'برج اتصالات اللاذقية', criticality: 8 },
  { id: 'comm_deir', type: 'communications', name: 'برج اتصالات دير الزور', criticality: 7 },
  { id: 'comm_raqqa', type: 'communications', name: 'برج اتصالات الرقة', criticality: 7 },
  { id: 'water_euphrates', type: 'waterPlant', name: 'محطة مياه الفرات', criticality: 10 },
  { id: 'water_orontes', type: 'waterPlant', name: 'محطة مياه العاصي', criticality: 9 },
  { id: 'water_coast', type: 'waterPlant', name: 'محطة مياه الساحل', criticality: 8 },
  { id: 'power_north', type: 'powerGrid', name: 'محطة كهرباء الشمال', criticality: 9 },
  { id: 'power_south', type: 'powerGrid', name: 'محطة كهرباء الجنوب', criticality: 9 },
  { id: 'power_east', type: 'powerGrid', name: 'محطة كهرباء الشرق', criticality: 8 },
  { id: 'power_coast', type: 'powerGrid', name: 'محطة كهرباء الساحل', criticality: 8 }
];

const gameRooms = new Map();
const playerSockets = new Map();

class GameRoom {
  constructor(roomId, hostIp) {
    this.roomId = roomId;
    this.hostIp = hostIp;
    this.status = 'waiting';
    this.players = [];
    this.infrastructure = this.initializeInfrastructure();
    this.resources = {
      cpu: { current: 100, max: 100 },
      bandwidth: { current: 100, max: 100 },
      budget: { current: 10000, max: 10000 }
    };
    this.actionLogs = [];
    this.timeRemaining = 600;
    this.gameStartTime = null;
    this.resourceTickInterval = null;
  }

  initializeInfrastructure() {
    const infra = {};
    INFRASTRUCTURE_POINTS.forEach(point => {
      infra[point.id] = {
        id: point.id,
        type: point.type,
        name: point.name,
        criticality: point.criticality,
        status: 'green',
        healthPercentage: 100
      };
    });
    return infra;
  }

  getResources() {
    return {
      cpu: { ...this.resources.cpu },
      bandwidth: { ...this.resources.bandwidth },
      budget: { ...this.resources.budget }
    };
  }

  consumeResources(cpuDelta, bandwidthDelta, budgetDelta) {
    this.resources.cpu.current = Math.max(0, Math.min(this.resources.cpu.max, this.resources.cpu.current + cpuDelta));
    this.resources.bandwidth.current = Math.max(0, Math.min(this.resources.bandwidth.max, this.resources.bandwidth.current + bandwidthDelta));
    this.resources.budget.current = Math.max(0, Math.min(this.resources.budget.max, this.resources.budget.current + budgetDelta));
  }

  startResourceTick(roomId) {
    this.resourceTickInterval = setInterval(() => {
      if (this.status !== 'playing') return;
      this.resources.cpu.current = Math.min(this.resources.cpu.max, this.resources.cpu.current + 2);
      this.resources.bandwidth.current = Math.min(this.resources.bandwidth.max, this.resources.bandwidth.current + 1);
      io.to(roomId).emit('resource-update', { resources: this.getResources() });
    }, 5000);
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

  canAttack(room) {
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
      infrastructure: room.infrastructure,
      resources: room.getResources()
    });

    if (room.players.length === 2) {
      room.status = 'playing';
      room.gameStartTime = Date.now();

      io.to(data.roomId).emit('game-start', {
        infrastructure: room.infrastructure,
        timeRemaining: room.timeRemaining,
        resources: room.getResources(),
        players: room.players.map(p => ({
          socketId: p.socketId,
          role: p.role,
          credits: p.credits
        }))
      });

      startGameTimer(data.roomId);
      room.startResourceTick(data.roomId);
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

    const attackCheck = player.canAttack(room);
    if (!attackCheck.allowed) {
      socket.emit('attack-blocked', {
        reason: attackCheck.reason,
        remainingTime: attackCheck.remainingTime || 0
      });
      return;
    }

    if (!room.infrastructure[data.targetId]) {
      socket.emit('attack-blocked', { reason: 'invalid_target' });
      return;
    }

    const attackConfig = getAttackConfig(data.attackType);
    if (!attackConfig) return;

    const effectiveCooldown = room.resources.cpu.current <= 0 ? attackConfig.cooldown * 2 : attackConfig.cooldown;

    if (attackConfig.castTime > 0) {
      socket.emit('attack-casting', {
        attackType: data.attackType,
        targetId: data.targetId,
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

    if (room.resources.budget.current < defenseConfig.cost) {
      socket.emit('defense-failed', {
        reason: 'insufficient_credits',
        required: defenseConfig.cost,
        available: room.resources.budget.current
      });
      return;
    }

    if (!room.infrastructure[data.targetId]) return;

    room.consumeResources(
      defenseConfig.cpuRecovery,
      defenseConfig.bandwidthRecovery,
      -defenseConfig.cost
    );

    const targetPoint = room.infrastructure[data.targetId];

    const logEntry = {
      timestamp: new Date(),
      actor: 'defender',
      actionType: `${data.defenseType}_deployed`,
      targetSector: data.targetId,
      outcome: 'success',
      creditsRemaining: room.resources.budget.current
    };
    room.actionLogs.push(logEntry);

    if (targetPoint.status === 'yellow') {
      targetPoint.status = 'green';
      targetPoint.healthPercentage = 100;
    } else if (targetPoint.status === 'red') {
      targetPoint.healthPercentage = Math.min(100, targetPoint.healthPercentage + 50);
      if (targetPoint.healthPercentage > 60) {
        targetPoint.status = 'yellow';
      }
    }

    io.to(playerInfo.roomId).emit('defense-deployed', {
      defenseType: data.defenseType,
      targetId: data.targetId,
      resources: room.getResources(),
      sectorStatus: targetPoint
    });

    io.to(playerInfo.roomId).emit('resource-update', {
      resources: room.getResources()
    });

    io.to(playerInfo.roomId).emit('game-log', {
      message: `🛡️ تم نشر ${defenseConfig.name} على ${targetPoint.name}`,
      type: 'defense'
    });
  });

  socket.on('disconnect', () => {
    const playerInfo = playerSockets.get(socket.id);
    if (playerInfo) {
      const room = gameRooms.get(playerInfo.roomId);
      if (room) {
        if (room.resourceTickInterval) {
          clearInterval(room.resourceTickInterval);
        }
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
  const targetPoint = room.infrastructure[data.targetId];

  const logEntry = {
    timestamp: new Date(),
    actor: 'attacker',
    actionType: `${data.attackType}_launched`,
    targetSector: data.targetId,
    outcome: targetPoint.status === 'green' ? 'success' : 'blocked'
  };
  room.actionLogs.push(logEntry);

  const effectiveCooldown = room.resources.cpu.current <= 0 ? attackConfig.cooldown * 2 : attackConfig.cooldown;

  room.consumeResources(-attackConfig.cpuCost, -attackConfig.bandwidthCost, 0);

  if (targetPoint.status === 'green') {
    targetPoint.status = 'yellow';
    targetPoint.healthPercentage -= attackConfig.damage;
    if (targetPoint.healthPercentage < 0) targetPoint.healthPercentage = 0;
  } else if (targetPoint.status === 'yellow') {
    targetPoint.healthPercentage -= attackConfig.damage;
    if (targetPoint.healthPercentage <= 0) {
      targetPoint.status = 'red';
      targetPoint.healthPercentage = 0;
    }
  }

  player.startCooldown(effectiveCooldown * 1000);

  const playerInfo = playerSockets.get(socket.id);

  io.to(playerInfo.roomId).emit('attack-executed', {
    attackType: data.attackType,
    targetId: data.targetId,
    sectorStatus: targetPoint,
    cooldown: effectiveCooldown
  });

  io.to(playerInfo.roomId).emit('resource-update', {
    resources: room.getResources()
  });

  io.to(playerInfo.roomId).emit('game-log', {
    message: `⚠️ هجوم ${attackConfig.name} على ${targetPoint.name} - الحالة: ${targetPoint.status === 'green' ? '🟢' : targetPoint.status === 'yellow' ? '🟡' : '🔴'}`,
    type: 'attack'
  });

  checkGameEnd(playerInfo.roomId);
}

function getAttackConfig(attackType) {
  const configs = {
    ddos: { name: 'DDoS', damage: 20, cooldown: 3, castTime: 0, cpuCost: 5, bandwidthCost: 20 },
    ransomware: { name: 'Ransomware', damage: 35, cooldown: 5, castTime: 2, cpuCost: 15, bandwidthCost: 5 },
    phishing: { name: 'Phishing', damage: 15, cooldown: 2, castTime: 0, cpuCost: 3, bandwidthCost: 3 },
    apt: { name: 'APT', damage: 50, cooldown: 10, castTime: 10, cpuCost: 25, bandwidthCost: 10 }
  };
  return configs[attackType];
}

function getDefenseConfig(defenseType) {
  const configs = {
    firewall: { name: 'جدار حماية', cost: 500, protection: 30, cpuRecovery: 5, bandwidthRecovery: 10 },
    patch: { name: 'تصحيح أمني', cost: 300, protection: 20, cpuRecovery: 10, bandwidthRecovery: 5 },
    reboot: { name: 'إعادة تشغيل الخادم', cost: 1000, protection: 50, cpuRecovery: 25, bandwidthRecovery: 15 },
    isolate: { name: 'عزل الشبكة', cost: 1500, protection: 100, cpuRecovery: 15, bandwidthRecovery: 30 }
  };
  return configs[defenseType];
}

function startGameTimer(roomId) {
  const room = gameRooms.get(roomId);
  if (!room) return;

  const timerInterval = setInterval(() => {
    const currentRoom = gameRooms.get(roomId);
    if (!currentRoom || currentRoom.status !== 'playing') {
      clearInterval(timerInterval);
      return;
    }

    currentRoom.timeRemaining -= 1;

    io.to(roomId).emit('timer-update', { timeRemaining: currentRoom.timeRemaining });

    if (currentRoom.timeRemaining <= 0) {
      endGame(roomId, 'defender');
      clearInterval(timerInterval);
    }
  }, 1000);
}

function checkGameEnd(roomId) {
  const room = gameRooms.get(roomId);
  if (!room) return;

  const allRed = Object.values(room.infrastructure).every(point => point.status === 'red');

  const bankrupt = room.resources.budget.current <= 0;

  const cpuDead = room.resources.cpu.current <= 0;
  const bandwidthDead = room.resources.bandwidth.current <= 0;

  if (allRed) {
    endGame(roomId, 'attacker');
  } else if (bankrupt) {
    endGame(roomId, 'attacker');
  } else if (cpuDead && bandwidthDead) {
    endGame(roomId, 'attacker');
  }
}

function endGame(roomId, winner) {
  const room = gameRooms.get(roomId);
  if (!room) return;

  room.status = 'finished';

  if (room.resourceTickInterval) {
    clearInterval(room.resourceTickInterval);
  }

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

  return {
    winner: room.status === 'finished' ? 'attacker' : 'defender',
    totalDuration: room.gameStartTime ? Math.floor((Date.now() - room.gameStartTime) / 1000) : 0,
    defenderStats: {
      creditsRemaining: room.resources.budget.current,
      defensesDeployed: defenderLogs.length,
      sectorsProtected: defenderLogs.filter(log => log.outcome === 'success').length,
      finalCpu: room.resources.cpu.current,
      finalBandwidth: room.resources.bandwidth.current
    },
    attackerStats: {
      attacksLaunched: attackerLogs.length,
      sectorsCompromised: Object.values(room.infrastructure).filter(s => s.status === 'red').length,
      sectorsDamaged: Object.values(room.infrastructure).filter(s => s.status !== 'green').length,
      totalPoints: INFRASTRUCTURE_POINTS.length
    },
    actionLogs: room.actionLogs,
    infrastructureStatus: room.infrastructure,
    resources: room.getResources()
  };
}

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 خادم SecureCity يعمل على المنفذ ${PORT}`);
  console.log(`📡 عنوان IP المحلي: ${getLocalIP()}`);
});
