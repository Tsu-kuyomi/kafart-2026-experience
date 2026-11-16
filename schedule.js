// =========================================================
// PLUG-AND-PLAY SUPABASE CLOUD BUCKET CONFIG (OPTIONAL)
// Create a public bucket named "kafart-prints" and table "prints"
// Leave empty to run seamlessly with local storage + seeded wall!
// =========================================================
export const SUPABASE_CONFIG = {
  url: "", // e.g. "https://xyzcompany.supabase.co"
  anonKey: "", // e.g. "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  bucket: "kafart-prints",
  table: "prints"
};

export const HALL_ZONES = {
  main_stage: {
    id: "main_stage",
    name: "MAIN STAGE",
    wing: "NORTH AUDITORIUM & RUNWAY",
    category: "RUNWAY & KEYNOTES",
    description: "CENTRAL AUDITORIUM SEATING FACING THE KAFART RUNWAY STAGE, FLANKED BY CONTROL AND BACKSTAGE ROOMS.",
    pos: { x: 0, z: -22 },
    svgPos: { x: 0, y: -22 },
    size: { w: 28, d: 24 },
    color: 0xf3842b,
    passport: true
  },
  exhibition_3: {
    id: "exhibition_3",
    name: "EXHIBITION 3",
    wing: "CENTRAL ROTUNDA",
    category: "CENTERPIECE INSTALLATION",
    description: "OPEN HEART OF THE HALL FEATURING THE CIRCULAR MONUMENTAL SCULPTURE PEDESTAL AND SURROUNDING PLINTHS.",
    pos: { x: 0, z: 3 },
    svgPos: { x: 0, y: 4 },
    size: { w: 30, d: 14 },
    color: 0xd8ee52,
    passport: true
  },
  fashion_exhibition: {
    id: "fashion_exhibition",
    name: "FASHION WING",
    wing: "NORTH-WEST GALLERY",
    category: "FASHION POP-UP & ARCHIVE",
    description: "ENCLOSED GALLERY ADJACENT TO THE VIP ENTRANCE SHOWCASING CURATED NORTHERN SILHOUETTES AND DESIGNER POP-UPS.",
    pos: { x: -20, z: -15 },
    svgPos: { x: -21.7, y: -17 },
    size: { w: 12, d: 15 },
    color: 0xf3b2d0,
    passport: true
  },
  exhibition_1: {
    id: "exhibition_1",
    name: "EXHIBITION 1",
    wing: "SOUTH-WEST CORRIDOR",
    category: "VISUAL ART & WORKSHOPS",
    description: "CURVED GALLERY CORRIDOR DISPLAYING WOVEN LOOMS, PHOTOGRAPHY, AND HANDS-ON CRAFT SESSIONS.",
    pos: { x: -16, z: 18 },
    svgPos: { x: -18, y: 18 },
    size: { w: 18, d: 16 },
    color: 0x113c2b,
    passport: true
  },
  exhibition_2: {
    id: "exhibition_2",
    name: "EXHIBITION 2",
    wing: "NORTH-EAST CHAMBERS",
    category: "SCULPTURE & CERAMICS",
    description: "TWIN PARTITIONED GALLERY ROOMS HOUSING TERRACOTTA FORMS AND PEDESTAL ART OBJECTS.",
    pos: { x: 19, z: -7 },
    svgPos: { x: 20.5, y: -9.5 },
    size: { w: 13, d: 13 },
    color: 0x489fb5,
    passport: false
  },
  exhibition_4: {
    id: "exhibition_4",
    name: "EXHIBITION 4",
    wing: "SOUTH-EAST CORRIDOR",
    category: "VENDOR FAIR & DYEING CRAFT",
    description: "CURVED GALLERY CORRIDOR CELEBRATING INDIGO DYEING, HIBISCUS CRAFT, AND REGIONAL ARTISAN VENDORS.",
    pos: { x: 16, z: 18 },
    svgPos: { x: 18, y: 18 },
    size: { w: 18, d: 16 },
    color: 0x2a7b5c,
    passport: false
  },
  exhibition_5: {
    id: "exhibition_5",
    name: "EXHIBITION 5",
    wing: "FAR EAST ARCHIVE ROOM",
    category: "SPECIAL ARCHIVE & SCREENINGS",
    description: "INTIMATE GALLERY CHAMBER DEDICATED TO MEMORY PRESERVATION, TEA SESSIONS, AND FILM SCREENINGS.",
    pos: { x: 30, z: -7 },
    svgPos: { x: 32.5, y: -9.5 },
    size: { w: 10, d: 13 },
    color: 0xe09f3e,
    passport: false
  },
  photo_zone: {
    id: "photo_zone",
    name: "PHOTO ZONE",
    wing: "WEST MAIN FOYER",
    category: "REGISTRATION & ARRIVALS",
    description: "POSITIONED IMMEDIATELY INSIDE THE WEST MAIN ENTRANCE FOR REGISTRATION, PRESS, AND VISITOR PORTRAITS.",
    pos: { x: -34, z: -12 },
    svgPos: { x: -36.4, y: -9.5 },
    size: { w: 6, d: 16 },
    color: 0xf3842b,
    passport: false
  },
  makeup_tents: {
    id: "makeup_tents",
    name: "MAKEUP TENTS",
    wing: "NORTH-EAST EXTERIOR",
    category: "BACKSTAGE PREP",
    description: "OUTDOOR NORTH-EAST PREP PAVILIONS WITH CHANGING ROOMS CONNECTED DIRECTLY TO THE BACKSTAGE ENTRANCE.",
    pos: { x: 38, z: -34 },
    svgPos: { x: 35, y: -39 },
    size: { w: 12, d: 10 },
    color: 0x7a7974,
    passport: false
  }
};

export const ENTRY_GATES = {
  gate_main: { short: "MAIN", name: "MAIN ENTRANCE (WEST)", pos: { x: -42, z: 0 }, svgPos: { x: -42, y: 0 } },
  gate_vip: { short: "VIP", name: "VIP ENTRANCE (NORTH-WEST)", pos: { x: -32, z: -32 }, svgPos: { x: -30, y: -30 } },
  gate_south: { short: "SOUTH", name: "SOUTH ENTRANCE", pos: { x: 0, z: 42 }, svgPos: { x: 0, y: 39 } },
  gate_ne: { short: "NE", name: "NORTH-EAST ENTRANCE", pos: { x: 32, z: -30 }, svgPos: { x: 30, y: -30 } }
};

// 10 PROCEDURAL FRAMES (6 OPEN + 4 QR SECRET INCLUDING 1 TRUE HD FRAME)
export const BOOTH_FRAMES = [
  { id: "f1", name: "TO HAVE & TO HOLD", tag: "OPEN", secretCode: null, isHD: false },
  { id: "f2", name: "SAHELIAN LOOM", tag: "OPEN", secretCode: null, isHD: false },
  { id: "f3", name: "RUNWAY ALL-ACCESS", tag: "OPEN", secretCode: null, isHD: false },
  { id: "f4", name: "INDIGO & CLAY", tag: "OPEN", secretCode: null, isHD: false },
  { id: "f5", name: "BIENNALE '26", tag: "OPEN", secretCode: null, isHD: false },
  { id: "f6", name: "DOUBLE ORB", tag: "OPEN", secretCode: null, isHD: false },
  { id: "f7", name: "LOOM MASTER", tag: "QR • EXHIB 1", secretCode: "LOOM", isHD: false },
  { id: "f8", name: "NOK TERRACOTTA", tag: "QR • ROTUNDA", secretCode: "NOK", isHD: false },
  { id: "f9", name: "ZARIA INDIGO", tag: "QR • EXHIB 4", secretCode: "INDIGO", isHD: false },
  { id: "f10", name: "CURATOR GOLD", tag: "QR • HD 2160P", secretCode: "CURATOR", isHD: true }
];

export const SHARE_CAPTIONS = [
  "TO HAVE AND TO HOLD — EXPERIENCING NORTHERN NIGERIAN ART, CRAFT & RUNWAY AT KAFART 6 IN KADUNA. #KAFART6 #TOHAVEANDTOHOLD #KADUNAART #KAFART2026",
  "WHERE HERITAGE LOOMS MEET AVANT-GARDE RUNWAYS. LIVE AT UMARU MUSA YAR'ADUA HALL FOR THE KAFART BIENNALE. #KAFART6 #TOHAVEANDTOHOLD #NIGERIANFASHION",
  "COLLECTING MEMORIES THAT ENDURE AT KAFART 6. SWAPPED MY PRINT ON THE BIENNALE WALL! #KAFART6 #TOHAVEANDTOHOLD #KADUNA #AFRICANART"
];

export const FESTIVAL_DAYS = {
  1: { label: "DAY 1", dateLabel: "THURSDAY, NOV 19, 2026", isoDate: "2026-11-19" },
  2: { label: "DAY 2", dateLabel: "FRIDAY, NOV 20, 2026", isoDate: "2026-11-20" },
  3: { label: "DAY 3", dateLabel: "SATURDAY, NOV 21, 2026", isoDate: "2026-11-21" },
  4: { label: "DAY 4", dateLabel: "SUNDAY, NOV 22, 2026", isoDate: "2026-11-22" }
};

export const OFFICIAL_PROGRAM = [
  // DAY 1 — THURSDAY NOV 19
  {
    id: "d1_1", day: 1, timeLabel: "2:00 PM – 4:00 PM", startMin: 840, endMin: 960,
    title: "REGISTRATION / FASHION POP UP & VENDOR FAIR OPENS",
    zoneId: "photo_zone", access: "OPEN ACCESS",
    featuring: "KAFART HOSPITALITY & ARTISAN VENDORS",
    moderator: "WEST MAIN FOYER",
    overview: "ATTENDEE CHECK-IN OPENS AT THE WEST MAIN FOYER ALONGSIDE THE OFFICIAL LAUNCH OF THE KAFART 6 FASHION POP-UP AND VENDOR FAIR ACROSS THE GALLERY WINGS."
  },
  {
    id: "d1_2", day: 1, timeLabel: "4:00 PM – 5:50 PM", startMin: 960, endMin: 1070,
    title: "WELCOME CEREMONY",
    zoneId: "main_stage", access: "MAIN AUDITORIUM",
    featuring: "NYH CONCEPTS & FESTIVAL DIGNITARIES",
    moderator: "MAIN STAGE • NORTH HALL",
    overview: "OFFICIAL OPENING CEREMONY WELCOMING ARTISTS, DESIGNERS, PARTNERS, AND GUESTS TO THE 6TH EDITION OF THE KADUNA FASHION AND ART FESTIVAL BIENNALE."
  },
  {
    id: "d1_3", day: 1, timeLabel: "5:50 PM – 6:10 PM", startMin: 1070, endMin: 1090,
    title: "EXHIBITION OPENING AND TOUR",
    zoneId: "exhibition_3", access: "GUIDED TOUR",
    featuring: "HIS EXCELLENCY, DR SENATOR UBA SANI (EXECUTIVE GOVERNOR, KADUNA STATE) & CURATORIAL TEAM",
    moderator: "CENTRAL ROTUNDA • EXHIBITION 3",
    overview: "CEREMONIAL RIBBON CUTTING AND GUIDED WALKTHROUGH OF THE CENTRAL ROTUNDA INSTALLATIONS AND GALLERY WINGS LED BY THE KAFART CURATORIAL TEAM."
  },
  {
    id: "d1_4", day: 1, timeLabel: "6:10 PM – 6:40 PM", startMin: 1090, endMin: 1120,
    title: "NETWORKING",
    zoneId: "exhibition_3", access: "OPEN ACCESS",
    featuring: "EXHIBITING ARTISTS, DESIGNERS & GUESTS",
    moderator: "CENTRAL ROTUNDA & FASHION WING",
    overview: "INFORMAL GALLERY MIXER CONNECTING REGIONAL CREATIVES, COLLECTORS, CULTURAL PRODUCERS, AND VISITORS ACROSS THE CENTRAL EXHIBITION FLOOR."
  },
  {
    id: "d1_5", day: 1, timeLabel: "6:40 PM – 7:30 PM", startMin: 1120, endMin: 1170,
    title: "WHAT IS THE ROLE OF ART IN SOCIETY?",
    zoneId: "main_stage", access: "OPENING PANEL DISCUSSION",
    featuring: "IFESINACHI COMEDY, PROF. JACOB JARI, PROF. GAMBO DUNIYA GILES, OLUWABUKUNMI OLUKITIBI",
    moderator: "MODERATOR: DR FAIDA SAMUEL",
    overview: "OPENING PANEL EXAMINING THE CIVIC, HISTORICAL, AND SOCIAL POWER OF CONTEMPORARY NIGERIAN VISUAL ART AND CULTURAL PRESERVATION."
  },
  {
    id: "d1_6", day: 1, timeLabel: "7:30 PM – 7:50 PM", startMin: 1170, endMin: 1190,
    title: "AWARD PRESENTATION: KADUNA STATE CREATIVES GRANT",
    zoneId: "main_stage", access: "CEREMONY",
    featuring: "MINISTRY OF BUSINESS, INNOVATION AND TECHNOLOGY",
    moderator: "MAIN STAGE",
    overview: "PRESENTATION OF THE KADUNA STATE CREATIVES GRANT RECOGNIZING EMERGING REGIONAL TALENT IN ART, CRAFT, AND FASHION ENTERPRISE."
  },
  {
    id: "d1_7", day: 1, timeLabel: "7:50 PM – 8:00 PM", startMin: 1190, endMin: 1200,
    title: "DAY 1 CLOSING REMARKS",
    zoneId: "main_stage", access: "MAIN STAGE",
    featuring: "PERMANENT SECRETARY, MBIT",
    moderator: "MAIN STAGE",
    overview: "CLOSING REMARKS CONCLUDING THE OPENING DAY OF KAFART 6."
  },

  // DAY 2 — FRIDAY NOV 20
  {
    id: "d2_1", day: 2, timeLabel: "FROM 11:00 AM", startMin: 660, endMin: 720,
    title: "EXHIBITION DOORS OPEN / VENDOR FAIR & FASHION POP-UP",
    zoneId: "exhibition_4", access: "OPEN ACCESS",
    featuring: "ALL EXHIBITING GALLERIES & VENDORS",
    moderator: "HALL-WIDE ACCESS",
    overview: "FULL EXHIBITION HALLS, ARTISAN VENDOR BOOTHS, AND THE CURATED FASHION POP-UP OPEN TO THE PUBLIC FOR DAY 2."
  },
  {
    id: "d2_2", day: 2, timeLabel: "12:00 PM – 2:00 PM", startMin: 720, endMin: 840,
    title: "TOUR OF PUBLIC ART INSTALLATIONS",
    zoneId: "exhibition_3", access: "GUIDED TOUR",
    featuring: "KAFART CURATORIAL GUIDES",
    moderator: "STARTS AT CENTRAL ROTUNDA",
    overview: "GUIDED WALKTHROUGH EXPLORING LARGE-SCALE PUBLIC ART INSTALLATIONS AND SPATIAL INTERVENTIONS ACROSS THE VENUE."
  },
  {
    id: "d2_3", day: 2, timeLabel: "12:00 PM – 4:00 PM", startMin: 720, endMin: 960,
    title: "COLLECTIVE COOKING & TALKS — JUTE & CLAYPOTS",
    zoneId: "exhibition_1", access: "REGISTRATION ONLY",
    featuring: "MOBOLAJI OTUYELU, FATIMA ILIYASU, MARIYA HABILA, MARIAM BOCTOR, NOUR KAME",
    moderator: "SANCTUARY BY AGBO ILE & KUSBARRA COLLECTIVE • HINATA ENERGY",
    overview: "AN IMMERSIVE CULINARY AND MATERIAL CULTURE SESSION EXPLORING INDIGENOUS CLAY VESSELS, JUTE CRAFT, AND SHARED FOOD HISTORIES."
  },
  {
    id: "d2_4", day: 2, timeLabel: "3:00 PM – 5:00 PM", startMin: 900, endMin: 1020,
    title: "MEET THE ARTISTS",
    zoneId: "exhibition_2", access: "OPEN ACCESS",
    featuring: "KAFART 6 VISUAL ARTISTS",
    moderator: "EXHIBITION GALLERIES 1–5",
    overview: "DIRECT GALLERY CONVERSATIONS WITH PARTICIPATING PAINTERS, SCULPTORS, CERAMICISTS, AND MIXED-MEDIA ARTISTS INSIDE THEIR EXHIBITION SPACES."
  },
  {
    id: "d2_5", day: 2, timeLabel: "4:00 PM – 5:00 PM", startMin: 960, endMin: 1020,
    title: "JUTE ART WORKSHOP",
    zoneId: "exhibition_1", access: "REGISTRATION ONLY",
    featuring: "BARASKETCHBOOK",
    moderator: "WORKSHOP SESSION • EXHIBITION 1",
    overview: "HANDS-ON TACTILE FIBER WORKSHOP LED BY BARASKETCHBOOK TEACHING EXPERIMENTAL TEXTURES AND FORMS USING NATURAL JUTE."
  },
  {
    id: "d2_6", day: 2, timeLabel: "5:00 PM – 5:45 PM", startMin: 1020, endMin: 1065,
    title: "BELONGING ACROSS BORDERS",
    zoneId: "main_stage", access: "FIRESIDE CHAT",
    featuring: "NAMSE UDOSEN, ANTA GUEYE-JAMES",
    moderator: "MAIN STAGE",
    overview: "A CROSS-REGIONAL FIRESIDE CONVERSATION REFLECTING ON SAHELIAN ARTISTIC KINSHIP, MIGRATION, AND CREATIVE EXCHANGE ACROSS WEST AFRICA."
  },
  {
    id: "d2_7", day: 2, timeLabel: "5:45 PM – 6:30 PM", startMin: 1065, endMin: 1110,
    title: "INTERMISSION",
    zoneId: "exhibition_3", access: "BREAK",
    featuring: "GALLERY & VENDOR FAIR OPEN",
    moderator: "CENTRAL ROTUNDA",
    overview: "EVENING TRANSITION BREAK BEFORE THE BOUBOU & TEA SALON AND MARA SYSTEM NIGHT."
  },
  {
    id: "d2_8", day: 2, timeLabel: "6:30 PM – 8:00 PM", startMin: 1110, endMin: 1200,
    title: "BOUBOU AND TEA SESSION",
    zoneId: "fashion_exhibition", access: "SALON SESSION",
    featuring: "MOBOLAJI OTUYELU, FATIMA AWAISU, FATIMA ILIYASU, GANIYAH SANI",
    moderator: "SANCTUARY BY AGBO ILE & GARLAND MAGAZINE",
    overview: "AN INTIMATE EVENING SALON CELEBRATING THE ARCHITECTURAL GRACE OF THE BOUBOU GARMENT OVER CURATED TEAS AND STORYTELLING."
  },
  {
    id: "d2_9", day: 2, timeLabel: "FROM 8:00 PM", startMin: 1200, endMin: 1320,
    title: "MARA SYSTEM NIGHT",
    zoneId: "main_stage", access: "EVENING MUSIC",
    featuring: "DJ KHALIPHA",
    moderator: "MAIN STAGE",
    overview: "LATE-EVENING SOUNDSCAPE AND LIVE DJ SET BY DJ KHALIPHA CLOSING OUT DAY 2."
  },

  // DAY 3 — SATURDAY NOV 21
  {
    id: "d3_1", day: 3, timeLabel: "FROM 11:00 AM", startMin: 660, endMin: 720,
    title: "EXHIBITION DOORS OPEN / VENDOR FAIR & FASHION POP-UP",
    zoneId: "exhibition_4", access: "OPEN ACCESS",
    featuring: "ALL GALLERIES & ARTISAN VENDORS",
    moderator: "HALL-WIDE ACCESS",
    overview: "SATURDAY DOORS OPEN ACROSS ALL EXHIBITION ROOMS, CRAFT VENDORS, AND THE KAFART FASHION POP-UP."
  },
  {
    id: "d3_2", day: 3, timeLabel: "12:00 PM – 3:00 PM", startMin: 720, endMin: 900,
    title: "COLLECTIVE COOKING SESSION & TALKS — HIBISCUS & TURMERIC",
    zoneId: "exhibition_1", access: "REGISTRATION ONLY",
    featuring: "MOBOLAJI OTUYELU, FATIMA ILIYASU, MARIYA HABILA, MARIAM BOCTOR, NOUR KAME",
    moderator: "SUPPORTED BY HINATA ENERGY",
    overview: "SENSORY COOKING AND BOTANICAL DIALOGUE CENTERED ON HIBISCUS (ZOBO) AND TURMERIC AS CULINARY STAPLES AND NATURAL PIGMENTS."
  },
  {
    id: "d3_3", day: 3, timeLabel: "3:00 PM – 5:00 PM", startMin: 900, endMin: 1020,
    title: "HIBISCUS DYEING WORKSHOP",
    zoneId: "exhibition_4", access: "REGISTRATION ONLY",
    featuring: "JESUDARA HINMIKAIYE",
    moderator: "WORKSHOP SESSION • EXHIBITION 4",
    overview: "NATURAL BOTANICAL TEXTILE DYEING WORKSHOP LED BY JESUDARA HINMIKAIYE EXPLORING ORGANIC CRIMSON AND EARTH TONES FROM HIBISCUS."
  },
  {
    id: "d3_4", day: 3, timeLabel: "5:00 PM – 6:00 PM", startMin: 1020, endMin: 1080,
    title: "EXPLORING BOLLYWOOD VS KANNYWOOD",
    zoneId: "main_stage", access: "DISCUSSION SESSION",
    featuring: "HASHIM ABDULLAHI TANKO, HAUWA ISYAKU, AMATALLAH SAULAWA",
    moderator: "MODERATORS: GANIYAH SANI & MAHMOUD SHAHO",
    overview: "CULTURAL TRANSFORMATIONS AND KNOWLEDGE OF SELF — UNPACKING CINEMA AESTHETICS, MUSIC, AND VISUAL IDENTITY BETWEEN BOLLYWOOD AND KANNYWOOD."
  },
  {
    id: "d3_5", day: 3, timeLabel: "6:00 PM – 6:30 PM", startMin: 1080, endMin: 1110,
    title: "INTERMISSION",
    zoneId: "exhibition_3", access: "BREAK",
    featuring: "GALLERY & REFRESHMENTS",
    moderator: "CENTRAL ROTUNDA",
    overview: "EVENING INTERMISSION AHEAD OF THE SATURDAY FASHION PRESENTATION AND FILM SCREENING."
  },
  {
    id: "d3_6", day: 3, timeLabel: "6:30 PM – 8:00 PM", startMin: 1110, endMin: 1200,
    title: "FASHION PRESENTATION",
    zoneId: "main_stage", access: "REGISTRATION ONLY",
    featuring: "FEATURED BIENNALE DESIGNERS",
    moderator: "MAIN STAGE RUNWAY",
    overview: "CURATED SATURDAY EVENING FASHION PRESENTATION SHOWCASING SLOW, NARRATIVE-DRIVEN COLLECTIONS ON THE KAFART RUNWAY."
  },
  {
    id: "d3_7", day: 3, timeLabel: "7:00 PM – 8:00 PM", startMin: 1140, endMin: 1200,
    title: "FILM SCREENING",
    zoneId: "exhibition_5", access: "SCREENING",
    featuring: "CLAN YUJO",
    moderator: "EXHIBITION 5 • ARCHIVE ROOM",
    overview: "SPECIAL CINEMA SCREENING CURATED WITH CLAN YUJO EXPLORING VISUAL MEMORY AND CONTEMPORARY AFRICAN STORYTELLING."
  },

  // DAY 4 — SUNDAY NOV 22
  {
    id: "d4_1", day: 4, timeLabel: "FROM 11:00 AM", startMin: 660, endMin: 720,
    title: "EXHIBITION DOORS OPEN / VENDOR FAIR & FASHION POP-UP",
    zoneId: "exhibition_4", access: "OPEN ACCESS",
    featuring: "FINAL DAY GALLERY & MARKET ACCESS",
    moderator: "HALL-WIDE ACCESS",
    overview: "FINAL FESTIVAL DAY OPENS ACROSS ALL ART EXHIBITIONS, CRAFT STALLS, AND DESIGNER POP-UP RACKS."
  },
  {
    id: "d4_2", day: 4, timeLabel: "12:00 PM – 2:00 PM", startMin: 720, endMin: 840,
    title: "INDIGO DYEING & HAND EMBROIDERY WORKSHOP",
    zoneId: "exhibition_4", access: "REGISTRATION ONLY",
    featuring: "YUSIF SANI & YAKUBU AHMAD",
    moderator: "WORKSHOP SESSION • EXHIBITION 4",
    overview: "MASTERCLASS IN TRADITIONAL NORTHERN INDIGO RESIST-DYEING AND INTRICATE HAND EMBROIDERY TECHNIQUES."
  },
  {
    id: "d4_3", day: 4, timeLabel: "2:00 PM – 4:00 PM", startMin: 840, endMin: 960,
    title: "FASHION RUNWAY SHOW (FREE SHOW)",
    zoneId: "main_stage", access: "FREE PUBLIC SHOW",
    featuring: "EMERGING & REGIONAL DESIGNERS",
    moderator: "MAIN STAGE RUNWAY",
    overview: "OPEN-TO-ALL AFTERNOON RUNWAY SHOWCASE CELEBRATING BOLD CONTEMPORARY NORTHERN NIGERIAN FASHION AND CRAFT."
  },
  {
    id: "d4_4", day: 4, timeLabel: "4:00 PM – 5:00 PM", startMin: 960, endMin: 1020,
    title: "FASHION AS AN EMBODIMENT OF COLLECTIVE MEMORY",
    zoneId: "main_stage", access: "DISCUSSION SESSION",
    featuring: "DR BALARABE ABUBAKAR HUSSAINI, SILDEK DEKOSUN, BEZAWIT TIBEBU",
    moderator: "MODERATOR: TOPE AKINTAYO",
    overview: "DISCUSSION EXAMINING HOW TEXTILES, SILHOUETTES, AND ANCESTRAL DRESS PRESERVE SHARED HISTORY ACROSS GENERATIONS."
  },
  {
    id: "d4_5", day: 4, timeLabel: "5:00 PM – 6:00 PM", startMin: 1020, endMin: 1080,
    title: "HOLDING TOGETHER: MEMORY, IDENTITY AND COEXISTENCE IN KADUNA",
    zoneId: "main_stage", access: "DISCUSSION SESSION",
    featuring: "DR NADIR NASIDI, DR KEHINDE CHRISTOPHER",
    moderator: "MODERATOR: NANA FATIMA BELLO",
    overview: "A REFLECTIVE DIALOGUE ON KADUNA'S CULTURAL TAPESTRY, SHARED HERITAGE, AND THE UNIFYING ROLE OF ART IN COMMUNITY LIFE."
  },
  {
    id: "d4_6", day: 4, timeLabel: "6:00 PM – 7:00 PM", startMin: 1080, endMin: 1140,
    title: "MEET THE ARTISTS",
    zoneId: "exhibition_3", access: "OPEN ACCESS",
    featuring: "KAFART 6 EXHIBITING COHORT",
    moderator: "CENTRAL ROTUNDA & GALLERIES",
    overview: "FINAL OPPORTUNITY TO MEET EXHIBITING ARTISTS, ACQUIRE WORKS, AND TOUR THE INSTALLATIONS BEFORE CLOSING."
  },
  {
    id: "d4_7", day: 4, timeLabel: "7:00 PM – 8:30 PM", startMin: 1140, endMin: 1230,
    title: "GRAND FINALE FASHION PRESENTATION & CLOSING REMARKS",
    zoneId: "main_stage", access: "REGISTRATION ONLY",
    featuring: "HEADLINE BIENNALE DESIGNERS & NYH CONCEPTS",
    moderator: "MAIN STAGE • FINALE",
    overview: "THE CLOSING RUNWAY PRESENTATION AND OFFICIAL FAREWELL REMARKS WRAPPING UP THE 2026 KAFART BIENNALE."
  }
];