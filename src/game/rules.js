// ============================================================
//  DOMINÓ QUÍMICO — Regras deriváveis de química
//  A validade e o tipo de ligação saem de 4 regras simples,
//  não de uma tabela decorada.
// ============================================================

import { SPECIES, EN_LABEL, TYPE_LABEL, SCORES } from './data.js';

export function catOf(sp) { return SPECIES[sp] ? SPECIES[sp].cat : null; }
export function elementOf(sp) { return SPECIES[sp] ? SPECIES[sp].element : sp; }
export function chargeOf(sp) { return SPECIES[sp] ? (SPECIES[sp].charge || 0) : 0; }
export function hasEN(sp) { return SPECIES[sp] && SPECIES[sp].cat !== 'cation' && SPECIES[sp].cat !== 'anion'; }

// ------------------------------------------------------------------
// Matriz de ligação (derivável):
//  metal   + metal    → Metálica
//  metal   + não-metal→ Iônica
//  cátion  + ânion    → Iônica
//  não-metal + não-metal → Covalente (iguais = apolar; diferentes = polar)
//  qualquer outro par → não ligam (repulsão de cargas iguais)
// ------------------------------------------------------------------
export function bondOf(a, b) {
  const A = catOf(a);
  const B = catOf(b);
  if (!A || !B) return null;
  if ((A === 'metal' && B === 'nonmetal') || (A === 'nonmetal' && B === 'metal')) return 'ionic';
  if ((A === 'cation' && B === 'anion') || (A === 'anion' && B === 'cation')) return 'ionic';
  if (A === 'metal' && B === 'metal') return 'metallic';
  if (A === 'nonmetal' && B === 'nonmetal') return a === b ? 'apolar' : 'polar';
  return null;
}

export function canBond(a, b) { return bondOf(a, b) !== null; }

// Explica por que dois átomos/íons não podem se ligar.
export function whyInvalid(a, b) {
  const A = catOf(a);
  const B = catOf(b);
  const sig = (c) => (c === 'cation' || c === 'anion' ? 'íon' : 'átomo');
  if (A === B && A === 'cation') return 'Dois cátions têm carga positiva igual — eles se repelem.';
  if (A === B && A === 'anion') return 'Dois ânions têm carga negativa igual — eles se repelem.';
  if (A === 'cation' && B === 'metal') return 'O cátion ' + a + ' e o metal ' + b + ' são ambos eletropositivos — não há quem receba elétrons.';
  if (A === 'metal' && B === 'cation') return 'O cátion ' + b + ' e o metal ' + a + ' são ambos eletropositivos — não há quem receba elétrons.';
  if (A === 'nonmetal' && B === 'anion') return 'O ânion ' + b + ' já ganhou elétrons; o não-metal ' + a + ' também quer receber — não se completam.';
  if (A === 'anion' && B === 'nonmetal') return 'O ânion ' + a + ' já ganhou elétrons; o não-metal ' + b + ' também quer receber — não se completam.';
  if (A === 'cation' && B === 'nonmetal') return 'O cátion ' + a + ' quer doar elétrons, mas ' + b + ' é um átomo neutro estável — sem transferência.';
  if (A === 'nonmetal' && B === 'cation') return 'O cátion ' + b + ' quer doar elétrons, mas ' + a + ' é um átomo neutro estável — sem transferência.';
  return a + ' e ' + b + ' não formam ligação nesse modelo.';
}

// ------------------------------------------------------------------
// Explicação pedagógica de uma ligação válida (para o cartão "Por quê?")
// ------------------------------------------------------------------
export function reasonOf(a, b) {
  const tp = bondOf(a, b);
  if (!tp) return null;
  const A = catOf(a);
  const B = catOf(b);
  const metal = A === 'metal' ? a : b;
  const nonmetal = A === 'nonmetal' ? a : b;
  const cation = A === 'cation' ? a : b;
  const anion = A === 'anion' ? a : b;

  if (tp === 'ionic') {
    const isMetalPair = A === 'metal' || B === 'metal';
    const text = isMetalPair
      ? `${metal} é um metal (eletropositivo) e ${nonmetal} é um não-metal (eletronegativo). O metal doa elétrons e o não-metal os recebe — transferência de elétrons → ligação iônica.`
      : `${cation} (+) e ${anion} (−) são íons de cargas opostas. A atração eletrostática entre eles forma a ligação iônica.`;
    const delta = EN_LABEL[elementOf(nonmetal)] - EN_LABEL[elementOf(metal)];
    return { type: tp, text, delta: isMetalPair ? Math.abs(delta).toFixed(1) : null };
  }

  if (tp === 'metallic') {
    return {
      type: tp,
      text: `${metal && nonmetal ? metal : a} e ${metal && nonmetal ? nonmetal : b} são metais. Seus elétrons da última camada ficam livres, formando uma "nuvem" compartilhada — ligação metálica.`,
      delta: null
    };
  }

  // covalentes
  if (tp === 'apolar') {
    return {
      type: tp,
      text: `Átomos iguais (${a} e ${b}). Eles partilham os elétrons exatamente igual — ligação covalente apolar.`,
      delta: '0.0'
    };
  }

  const enA = EN_LABEL[elementOf(a)];
  const enB = EN_LABEL[elementOf(b)];
  const en = (enA >= enB) ? a : b;
  return {
    type: tp,
    text: `Não-metais diferentes (${a} e ${b}): o mais eletronegativo (${en}) puxa mais o par de elétrons — partilha desigual → covalente polar.`,
    delta: Math.abs(enA - enB).toFixed(1)
  };
}

export function tipFor(type) {
  const tips = {
    ionic: 'Metal + não-metal (ou cátion + ânion) → elétrons são transferidos.',
    metallic: 'Dois metais → elétrons delocalizados numa nuvem comum.',
    polar: 'Não-metais diferentes → partilha desigual dos elétrons.',
    apolar: 'Não-metais iguais → partilha igual dos elétrons.'
  };
  return tips[type];
}

export function scoreLabel(tp) { return TYPE_LABEL[tp] + ' · ' + SCORES[tp] + ' pts'; }

// Símbolo da substância formada por duas espécies ligadas.
export function substanceOf(a, b) {
  const ea = elementOf(a);
  const eb = elementOf(b);
  const tp = bondOf(a, b);
  if (!tp) return ea + eb;
  if (tp === 'apolar') return ea + '\u2082';
  if (tp === 'metallic') return ea === eb ? ea : ea + eb;
  if (tp === 'polar') {
    const order = { H: 1, I: 2, Br: 3, Cl: 4, F: 5 };
    return (order[ea] || 9) <= (order[eb] || 9) ? ea + eb : eb + ea;
  }
  return ea + eb;
}