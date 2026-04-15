export const SYRIA_MAP_PATH = `M 85,15 L 95,10 110,8 125,12 140,10 155,15 165,20 170,35 175,50 180,65 185,80 190,95 195,110 200,130 205,150 200,165 195,175 190,185 185,195 175,205 165,215 155,220 145,225 135,230 125,235 115,240 105,245 95,250 85,255 75,260 65,255 55,250 45,240 35,230 30,215 25,200 20,185 15,165 18,145 22,125 28,105 35,85 42,65 50,50 60,35 70,25 80,18 Z`;

export const SECTOR_TYPES = {
  hospital: { icon: '🏥', label: 'مستشفى', color: '#ef4444' },
  powerGrid: { icon: '⚡', label: 'محطة كهرباء', color: '#f59e0b' },
  communications: { icon: '📡', label: 'برج اتصالات', color: '#8b5cf6' },
  waterPlant: { icon: '💧', label: 'محطة مياه', color: '#06b6d4' },
  trafficLights: { icon: '🚦', label: 'إشارة مرور', color: '#22c55e' }
};

export const INFRASTRUCTURE_POINTS = [
  { id: 'hospital_damascus', type: 'hospital', name: 'مستشفى دمشق', x: 135, y: 218, criticality: 10 },
  { id: 'hospital_aleppo', type: 'hospital', name: 'مستشفى حلب', x: 115, y: 45, criticality: 10 },
  { id: 'hospital_homs', type: 'hospital', name: 'مستشفى حمص', x: 120, y: 130, criticality: 9 },
  { id: 'hospital_latakia', type: 'hospital', name: 'مستشفى اللاذقية', x: 55, y: 100, criticality: 8 },
  { id: 'hospital_deir', type: 'hospital', name: 'مستشفى دير الزور', x: 175, y: 140, criticality: 8 },

  { id: 'traffic_d1', type: 'trafficLights', name: 'إشارة ساحة الأمويين', x: 140, y: 225, criticality: 7 },
  { id: 'traffic_d2', type: 'trafficLights', name: 'إشارة المزة', x: 125, y: 215, criticality: 6 },
  { id: 'traffic_a1', type: 'trafficLights', name: 'إشارة ساحة سعد الله', x: 120, y: 38, criticality: 7 },
  { id: 'traffic_a2', type: 'trafficLights', name: 'إشارة الفردوس', x: 105, y: 52, criticality: 6 },
  { id: 'traffic_h1', type: 'trafficLights', name: 'إشارة حمص المركزية', x: 130, y: 125, criticality: 6 },
  { id: 'traffic_h2', type: 'trafficLights', name: 'إشارة القصور', x: 110, y: 135, criticality: 5 },
  { id: 'traffic_l1', type: 'trafficLights', name: 'إشارة اللاذقية الميناء', x: 48, y: 108, criticality: 5 },
  { id: 'traffic_de1', type: 'trafficLights', name: 'إشارة دير الزور المركزية', x: 180, y: 148, criticality: 5 },
  { id: 'traffic_hama', type: 'trafficLights', name: 'إشارة حماة', x: 115, y: 95, criticality: 5 },
  { id: 'traffic_raqqa', type: 'trafficLights', name: 'إشارة الرقة', x: 155, y: 80, criticality: 5 },

  { id: 'comm_damascus', type: 'communications', name: 'برج اتصالات دمشق', x: 145, y: 210, criticality: 9 },
  { id: 'comm_aleppo', type: 'communications', name: 'برج اتصالات حلب', x: 125, y: 50, criticality: 9 },
  { id: 'comm_homs', type: 'communications', name: 'برج اتصالات حمص', x: 128, y: 138, criticality: 8 },
  { id: 'comm_latakia', type: 'communications', name: 'برج اتصالات اللاذقية', x: 50, y: 92, criticality: 8 },
  { id: 'comm_deir', type: 'communications', name: 'برج اتصالات دير الزور', x: 182, y: 132, criticality: 7 },
  { id: 'comm_raqqa', type: 'communications', name: 'برج اتصالات الرقة', x: 158, y: 88, criticality: 7 },

  { id: 'water_euphrates', type: 'waterPlant', name: 'محطة مياه الفرات', x: 168, y: 120, criticality: 10 },
  { id: 'water_orontes', type: 'waterPlant', name: 'محطة مياه العاصي', x: 108, y: 108, criticality: 9 },
  { id: 'water_coast', type: 'waterPlant', name: 'محطة مياه الساحل', x: 42, y: 115, criticality: 8 },

  { id: 'power_north', type: 'powerGrid', name: 'محطة كهرباء الشمال', x: 100, y: 55, criticality: 9 },
  { id: 'power_south', type: 'powerGrid', name: 'محطة كهرباء الجنوب', x: 130, y: 200, criticality: 9 },
  { id: 'power_east', type: 'powerGrid', name: 'محطة كهرباء الشرق', x: 185, y: 110, criticality: 8 },
  { id: 'power_coast', type: 'powerGrid', name: 'محطة كهرباء الساحل', x: 38, y: 125, criticality: 8 }
];

export const ROADS = [
  { x1: 115, y1: 45, x2: 115, y2: 95, label: 'حلب-حماة' },
  { x1: 115, y1: 95, x2: 120, y2: 130, label: 'حماة-حمص' },
  { x1: 120, y1: 130, x2: 135, y2: 218, label: 'حمص-دمشق' },
  { x1: 55, y1: 100, x2: 115, y2: 95, label: 'اللاذقية-حماة' },
  { x1: 120, y1: 130, x2: 175, y2: 140, label: 'حمص-دير الزور' },
  { x1: 115, y1: 45, x2: 155, y2: 80, label: 'حلب-الرقة' },
  { x1: 155, y1: 80, x2: 175, y2: 140, label: 'الرقة-دير الزور' },
  { x1: 135, y1: 218, x2: 175, y2: 140, label: 'دمشق-دير الزور' },
  { x1: 55, y1: 100, x2: 120, y2: 130, label: 'اللاذقية-حمص' },
  { x1: 115, y1: 95, x2: 120, y2: 130, label: 'حماة-حمص' }
];

export const CITY_LABELS = [
  { name: 'دمشق', x: 135, y: 235, fontSize: 7 },
  { name: 'حلب', x: 115, y: 30, fontSize: 7 },
  { name: 'حمص', x: 120, y: 148, fontSize: 6 },
  { name: 'حماة', x: 115, y: 85, fontSize: 5.5 },
  { name: 'اللاذقية', x: 45, y: 80, fontSize: 5.5 },
  { name: 'دير الزور', x: 178, y: 162, fontSize: 5.5 },
  { name: 'الرقة', x: 155, y: 70, fontSize: 5.5 },
  { name: 'طرطوس', x: 40, y: 135, fontSize: 5 },
  { name: 'إدلب', x: 85, y: 58, fontSize: 5 },
  { name: 'درعا', x: 120, y: 248, fontSize: 5 },
  { name: 'السويداء', x: 155, y: 235, fontSize: 5 },
  { name: 'القنيطرة', x: 100, y: 230, fontSize: 5 },
  { name: 'الحسكة', x: 190, y: 60, fontSize: 5 }
];

export function getPointById(id) {
  return INFRASTRUCTURE_POINTS.find(p => p.id === id);
}

export function getPointsByType(type) {
  return INFRASTRUCTURE_POINTS.filter(p => p.type === type);
}

export function getAllPointIds() {
  return INFRASTRUCTURE_POINTS.map(p => p.id);
}

export function getPointDisplayName(id) {
  const point = getPointById(id);
  return point ? point.name : id;
}

export function getPointTypeLabel(type) {
  return SECTOR_TYPES[type]?.label || type;
}
