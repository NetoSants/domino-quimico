// ============================================================
//  DOMINÓ QUÍMICO — Dados do jogo
// ============================================================

// Tabela de combinações válidas (simétrica).
// Cada espécie lista as espécies com as quais pode formar ligação.
var COMBO_TABLE = {
  'Li':  ['Li', 'Li⁺'],
  'Li⁺': ['Li', 'Li⁺', 'F⁻', 'Cl⁻', 'Br⁻', 'I⁻'],
  'Na':  ['Na', 'Na⁺'],
  'Na⁺': ['Na', 'Na⁺', 'F⁻', 'Cl⁻', 'Br⁻', 'I⁻'],
  'K':   ['K', 'K⁺'],
  'K⁺':  ['K', 'K⁺', 'F⁻', 'Cl⁻', 'Br⁻', 'I⁻'],
  'H':   ['H', 'F', 'Cl', 'Br', 'I'],
  'F':   ['H', 'F', 'Cl', 'Br', 'I'],
  'Cl':  ['H', 'F', 'Cl', 'Br', 'I'],
  'Br':  ['H', 'F', 'Cl', 'Br', 'I'],
  'I':   ['H', 'F', 'Cl', 'Br', 'I'],
  'F⁻':  ['Li⁺', 'Na⁺', 'K⁺'],
  'Cl⁻': ['Li⁺', 'Na⁺', 'K⁺'],
  'Br⁻': ['Li⁺', 'Na⁺', 'K⁺'],
  'I⁻':  ['Li⁺', 'Na⁺', 'K⁺']
};

// Espécies eletropositivas (metais e cátions).
var ELECTRO = ['Li', 'Na', 'K', 'Li⁺', 'Na⁺', 'K⁺'];

// Pontuação por tipo de ligação.
var SCORES = {
  ionic:    5,
  polar:    5,
  apolar:   10,
  metallic: 6
};

// Rótulos dos tipos de ligação.
var TYPE_LABEL = {
  ionic:    'Iônica',
  polar:    'Covalente polar',
  apolar:   'Covalente apolar',
  metallic: 'Metálica'
};

// Cores dos tipos de ligação (legenda / tabela de consulta).
var TYPE_COLOR = {
  ionic:    '#e57373',
  polar:    '#64b5f6',
  apolar:   '#81c784',
  metallic: '#ba68c8'
};

// Ordem de exibição na tabela de consulta.
var SPECIES_ORDER = ['Li', 'Li⁺', 'Na', 'Na⁺', 'K', 'K⁺', 'H', 'F', 'Cl', 'Br', 'I', 'F⁻', 'Cl⁻', 'Br⁻', 'I⁻'];

// Matiz por elemento (hue). Cada elemento tem uma cor própria e distinta.
var ELEMENT_HUE = {
  'H':  130,
  'Li': 0,
  'Na': 35,
  'K':  265,
  'F':  205,
  'Cl': 80,
  'Br': 20,
  'I':  300
};

function elementOf(sp) {
  return String(sp).replace(/[⁺⁻]/g, '');
}

function chargeOf(sp) {
  if (String(sp).indexOf('⁺') !== -1) return 1;
  if (String(sp).indexOf('⁻') !== -1) return -1;
  return 0;
}

// Cor da espécie: matiz do elemento; cátions mais escuros e ânions mais escuros ainda.
function colorOf(sp) {
  var h = ELEMENT_HUE[elementOf(sp)] || 0;
  var l = chargeOf(sp) === 1 ? 62 : chargeOf(sp) === -1 ? 45 : 74;
  return 'hsl(' + h + ', 70%, ' + l + '%)';
}

// Cor do texto legível sobre a cor de fundo da espécie.
function textColorOf(sp) {
  var h = ELEMENT_HUE[elementOf(sp)] || 0;
  var l = chargeOf(sp) === 1 ? 62 : chargeOf(sp) === -1 ? 45 : 74;
  return l > 55 ? '#222' : '#fff';
}

function chargeClass(sp) {
  var c = chargeOf(sp);
  if (c === 1) return 'charge-p';
  if (c === -1) return 'charge-m';
  return 'charge-0';
}

// Ordem de eletronegatividade (ascendente) para fórmulas covalentes.
var EN_ORDER = { 'H': 1, 'I': 2, 'Br': 3, 'Cl': 4, 'F': 5 };

function hslToRgb(h, s, l) {
  h = h / 360; s = s / 100; l = l / 100;
  var c = (1 - Math.abs(2 * l - 1)) * s;
  var x = c * (1 - Math.abs((h * 6) % 2 - 1));
  var m = l - c / 2;
  var r, g, b;
  if (h < 1 / 6) { r = c; g = x; b = 0; }
  else if (h < 2 / 6) { r = x; g = c; b = 0; }
  else if (h < 3 / 6) { r = 0; g = c; b = x; }
  else if (h < 4 / 6) { r = 0; g = x; b = c; }
  else if (h < 5 / 6) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

function speciesRgb(sp) {
  var h = ELEMENT_HUE[elementOf(sp)] || 0;
  var c = chargeOf(sp);
  var l = c === 1 ? 62 : c === -1 ? 45 : 74;
  return hslToRgb(h, 70, l);
}

// Cor resultante da combinação de duas metades ligadas (média das cores).
function blendColor(a, b) {
  var ra = speciesRgb(a);
  var rb = speciesRgb(b);
  var r = (ra[0] + rb[0]) / 2;
  var g = (ra[1] + rb[1]) / 2;
  var blue = (ra[2] + rb[2]) / 2;
  var lum = 0.299 * r + 0.587 * g + 0.114 * blue;
  return {
    bg: 'rgb(' + Math.round(r) + ', ' + Math.round(g) + ', ' + Math.round(blue) + ')',
    fg: lum > 140 ? '#222' : '#fff'
  };
}

// Símbolo da substância formada por duas espécies ligadas.
function substanceOf(a, b) {
  var tp = bondOf(a, b);
  var ea = elementOf(a);
  var eb = elementOf(b);
  if (!tp) return ea + eb;
  if (tp === 'metallic') return ea === eb ? ea : ea + eb;
  if (tp === 'ionic') {
    var cat = chargeOf(a) > 0 ? a : b;
    var an = chargeOf(a) > 0 ? b : a;
    return elementOf(cat) + elementOf(an);
  }
  // covalente
  if (ea === eb) return ea + '\u2082';
  return (EN_ORDER[ea] || 9) <= (EN_ORDER[eb] || 9) ? ea + eb : eb + ea;
}

// As 50 peças do saco (cada peça = duas metades com uma espécie).
var PIECES = [
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
  ['F⁻', 'F⁻'],
  ['Br⁻', 'Br⁻']
];

// Funções de regra de ligação.
function canBond(a, b) {
  return (COMBO_TABLE[a] || []).indexOf(b) !== -1;
}

// Retorna o tipo de ligação entre duas espécies, ou null se não ligam.
function bondOf(a, b) {
  if (!canBond(a, b)) return null;
  var ae = ELECTRO.indexOf(a) !== -1;
  var be = ELECTRO.indexOf(b) !== -1;
  if (ae && be) return 'metallic';
  if (!ae && !be) return a === b ? 'apolar' : 'polar';
  return 'ionic';
}