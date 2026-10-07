// ============================================================
//  DOMINÓ QUÍMICO — IA simples
//  Joga sempre jogadas válidas (declaração correta), escolhendo
//  a que dá mais pontos. Sem jogada: devolve null (troca).
// ============================================================

import { SCORES } from './data.js';
import { bondOf, canBond } from './rules.js';
import { openEnds } from './engine.js';

export function chooseAiMove(s) {
  const hand = s.players[s.current].hand;
  const ends = openEnds(s);
  const best = [];

  for (let ti = 0; ti < hand.length; ti++) {
    for (const e of ends) {
      for (const flip of [false, true]) {
        const connect = flip ? hand[ti][1] : hand[ti][0];
        const actual = bondOf(e.sp, connect);
        if (actual) best.push({ tile: ti, end: e, flip, actual, pts: SCORES[actual] });
      }
    }
  }

  if (!best.length) return null;
  const mx = Math.max(...best.map(m => m.pts));
  const top = best.filter(m => m.pts === mx);
  return top[Math.floor(Math.random() * top.length)];
}