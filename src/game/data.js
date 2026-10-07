// ============================================================
//  DOMINÓ QUÍMICO — Dados de espécies, pontuação e peças
// ============================================================

// Cada espécie tem: elemento base, categoria química e
// eletronegatividade (Pauling) quando aplicável.
export const SPECIES = {
  'Li':   { element: 'Li', cat: 'metal',    EN: 1.0 },
  'Na':   { element: 'Na', cat: 'metal',    EN: 0.9 },
  'K':    { element: 'K',  cat: 'metal',    EN: 0.8 },
  'Li⁺':  { element: 'Li', cat: 'cation',   charge: 1 },
  'Na⁺':  { element: 'Na', cat: 'cation',   charge: 1 },
  'K⁺':   { element: 'K',  cat: 'cation',   charge: 1 },
  'H':    { element: 'H',  cat: 'nonmetal', EN: 2.2 },
  'F':    { element: 'F',  cat: 'nonmetal', EN: 4.0 },
  'Cl':   { element: 'Cl', cat: 'nonmetal', EN: 3.0 },
  'Br':   { element: 'Br', cat: 'nonmetal', EN: 2.8 },
  'I':    { element: 'I',  cat: 'nonmetal', EN: 2.5 },
  'F⁻':   { element: 'F',  cat: 'anion',    charge: -1 },
  'Cl⁻':  { element: 'Cl', cat: 'anion',    charge: -1 },
  'Br⁻':  { element: 'Br', cat: 'anion',    charge: -1 },
  'I⁻':   { element: 'I',  cat: 'anion',    charge: -1 }
};

export const CAT_LABEL = {
  metal:    'metal',
  cation:   'cátion',
  nonmetal: 'não-metal',
  anion:    'ânion'
};

// Matiz por elemento (usado nas cores de cada espécie em tema claro).
export const ELEMENT_HUE = {
  'H': 210, 'Li': 0, 'Na': 35, 'K': 268,
  'F': 200, 'Cl': 115, 'Br': 25, 'I': 305
};

export const SCORES = { ionic: 5, polar: 5, apolar: 10, metallic: 6 };

export const TYPE_LABEL = {
  ionic:    'Iônica',
  polar:    'Covalente polar',
  apolar:   'Covalente apolar',
  metallic: 'Metálica'
};

export const TYPE_SYMBOL = {
  ionic: 'ion', polar: 'pol', apolar: 'apo', metallic: 'met'
};

export const BOND_TYPES = ['ionic', 'polar', 'apolar', 'metallic'];

export const EN_LABEL = {
  'Li': 1.0, 'Na': 0.9, 'K': 0.8, 'H': 2.2,
  'F': 4.0, 'Cl': 3.0, 'Br': 2.8, 'I': 2.5
};

// As ~50 peças do saco (cada peça = duas metades com uma espécie).
export const PIECES = [
  ['Na', 'Li⁺'], ['Na', 'Li⁺'], ['Na', 'Li⁺'],
  ['Cl', 'Na'], ['Cl', 'Na'],
  ['F', 'Cl⁻'], ['F', 'Cl⁻'],
  ['H', 'Na⁺'], ['H', 'Na⁺'],
  ['H', 'Br⁻'], ['H', 'Br⁻'],
  ['I', 'I⁻'], ['I', 'I⁻'],
  ['F', 'F⁻'], ['F', 'F⁻'],
  ['Br', 'F⁻'], ['Br', 'F⁻'],
  ['Li', 'Na⁺'], ['Li', 'Na⁺'],
  ['Li', 'Cl⁻'],
  ['Cl', 'Li⁺'],
  ['K', 'Li⁺'],
  ['Cl', 'K'],
  ['F', 'Li⁺'],
  ['Li', 'K⁺'],
  ['K', 'Na⁺'],
  ['Cl', 'Cl⁻'],
  ['Br', 'K⁺'],
  ['F', 'K⁺'],
  ['Na⁺', 'K⁺'],
  ['Br', 'Na⁺'],
  ['Li⁺', 'Na⁺'],
  ['K', 'Br⁻'],
  ['H', 'K⁺'],
  ['I', 'Li⁺'],
  ['Br', 'I'],
  ['I', 'K⁺'],
  ['Cl⁻', 'I⁻'],
  ['K', 'Cl⁻'],
  ['Li', 'K⁺'],
  ['Na', 'Cl⁻'],
  ['H', 'I⁻'],
  ['I', 'Br⁻'],
  ['Cl', 'Li'],
  ['Br', 'Li'],
  ['Br⁻', 'I⁻'],
  ['Li⁺', 'K⁺'],
  ['F⁻', 'I⁻'],
  ['H', 'F'],
  ['Na', 'K']
];

export const MODES = {
  solo: { label: 'Treino livre',      icon: '🎯', desc: 'Pratique sem adversário, com correção e explicação a cada jogada.' },
  ai:   { label: 'Solo vs Robô',      icon: '🤖', desc: 'Jogue uma partida contra um robô que joga jogadas válidas.' },
  match:{ label: 'Partida 2-4',       icon: '🏆', desc: 'Hot-seat: amigos jogam no mesmo aparelho, com pontuação.' }
};