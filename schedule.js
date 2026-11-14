export const HALL_ZONES = {
  main_stage: {
    id: "main_stage",
    name: "Main Stage",
    wing: "North Auditorium & Runway",
    category: "RUNWAY & KEYNOTES",
    description: "Central auditorium seating facing the KAFART runway stage, flanked by Control and Backstage rooms.",
    pos: { x: 0, z: -22 },
    size: { w: 28, d: 24 },
    color: 0xf3842b,
    passport: true
  },
  exhibition_3: {
    id: "exhibition_3",
    name: "Exhibition 3",
    wing: "Central Rotunda",
    category: "CENTERPIECE INSTALLATION",
    description: "Open heart of the hall featuring the circular monumental sculpture pedestal and surrounding plinths.",
    pos: { x: 0, z: 3 },
    size: { w: 30, d: 14 },
    color: 0xd8ee52,
    passport: true
  },
  fashion_exhibition: {
    id: "fashion_exhibition",
    name: "Fashion Wing",
    wing: "North-West Gallery",
    category: "CURATED GARMENTS",
    description: "Enclosed gallery adjacent to the VIP Entrance showcasing archival Northern silhouettes and slow fashion.",
    pos: { x: -20, z: -15 },
    size: { w: 12, d: 15 },
    color: 0xf3b2d0,
    passport: true
  },
  exhibition_1: {
    id: "exhibition_1",
    name: "Exhibition 1",
    wing: "South-West Corridor",
    category: "VISUAL ART & TEXTILES",
    description: "Curved gallery corridor displaying handwoven looms, documentary photography, and mixed-media works.",
    pos: { x: -16, z: 18 },
    size: { w: 18, d: 16 },
    color: 0x113c2b,
    passport: true
  },
  exhibition_2: {
    id: "exhibition_2",
    name: "Exhibition 2",
    wing: "North-East Chambers",
    category: "SCULPTURE & CERAMICS",
    description: "Twin partitioned gallery rooms housing terracotta forms and pedestal art objects.",
    pos: { x: 19, z: -7 },
    size: { w: 13, d: 13 },
    color: 0x489fb5,
    passport: false
  },
  exhibition_4: {
    id: "exhibition_4",
    name: "Exhibition 4",
    wing: "South-East Corridor",
    category: "CONTEMPORARY CRAFT",
    description: "Curved gallery corridor celebrating indigo pit-dyeing, leatherwork, and regional master artisans.",
    pos: { x: 16, z: 18 },
    size: { w: 18, d: 16 },
    color: 0x2a7b5c,
    passport: false
  },
  exhibition_5: {
    id: "exhibition_5",
    name: "Exhibition 5",
    wing: "Far East Archive Room",
    category: "SPECIAL ARCHIVE",
    description: "Intimate gallery chamber dedicated to the 'To Have and to Hold' memory preservation showcase.",
    pos: { x: 30, z: -7 },
    size: { w: 10, d: 13 },
    color: 0xe09f3e,
    passport: false
  },
  photo_zone: {
    id: "photo_zone",
    name: "Photo Zone",
    wing: "West Main Foyer",
    category: "PORTRAITS & PRESS",
    description: "Positioned immediately inside the West Main Entrance for press, designer, and visitor portraits.",
    pos: { x: -34, z: -12 },
    size: { w: 6, d: 16 },
    color: 0xf3842b,
    passport: false
  },
  makeup_tents: {
    id: "makeup_tents",
    name: "Makeup Tents",
    wing: "North-East Exterior",
    category: "BACKSTAGE PREP",
    description: "Outdoor North-East prep pavilions with changing rooms connected directly to the Backstage Entrance.",
    pos: { x: 38, z: -34 },
    size: { w: 12, d: 10 },
    color: 0x7a7974,
    passport: false
  }
};

export const ENTRY_GATES = {
  gate_main: { short: "Main Gate", name: "Main Entrance (West)", pos: { x: -42, z: 0 } },
  gate_vip: { short: "VIP Gate", name: "VIP Entrance (North-West)", pos: { x: -32, z: -32 } },
  gate_south: { short: "South Gate", name: "South Entrance", pos: { x: 0, z: 42 } },
  gate_ne: { short: "NE Gate", name: "North-East Entrance", pos: { x: 32, z: -30 } }
};

// 15-Minute Rapid Stress-Test Loop (2-min, 3-min, and 5-min blocks)
export const TEST_SCHEDULE = [
  {
    id: "ev_1",
    startSec: 0,
    durationSec: 120,
    title: "Doors Open & Arrivals",
    zoneId: "photo_zone",
    host: "KAFART Media Crew"
  },
  {
    id: "ev_2",
    startSec: 120,
    durationSec: 180,
    title: "Curator Walkthrough",
    zoneId: "exhibition_3",
    host: "Ganiyat Sani (NYH Concepts)"
  },
  {
    id: "ev_3",
    startSec: 180,
    durationSec: 120,
    title: "Spoken Word & Acoustic Set",
    zoneId: "exhibition_1",
    host: "Kaduna Poetry Collective"
  },
  {
    id: "ev_4",
    startSec: 300,
    durationSec: 300,
    title: "Heritage Runway Showcase",
    zoneId: "main_stage",
    host: "Headline Northern Designers"
  },
  {
    id: "ev_5",
    startSec: 420,
    durationSec: 180,
    title: "Designer Lineup & Fitting",
    zoneId: "makeup_tents",
    host: "Backstage Directors"
  },
  {
    id: "ev_6",
    startSec: 600,
    durationSec: 180,
    title: "Sahelian Looms Panel",
    zoneId: "fashion_exhibition",
    host: "Master Weavers & Curators"
  },
  {
    id: "ev_7",
    startSec: 780,
    durationSec: 120,
    title: "Indigo & Terracotta Demo",
    zoneId: "exhibition_4",
    host: "Artisan Guild"
  }
];

export const LOOP_TOTAL_SECONDS = 900;