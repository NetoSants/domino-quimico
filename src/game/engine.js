// ============================================================
//  DOMINÓ QUÍMICO — Motor do jogo (reducer puro)
// ============================================================

import { PIECES, SCORES } from './data.js';
import { bondOf, canBond, reasonOf, whyInvalid, substanceOf } from './rules.js';

export const MAX_HAND = 5;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function clone(s) { return structuredClone(s); }

// ---------- Helpers de mesa ----------
export function endSpecies(lines, lineIdx, side) {
  const line = lines[lineIdx];
  return side === 'left' ? line[0].halfL : line[line.length - 1].halfR;
}

// Pontas disponíveis para encaixe (durante combo, apenas o último encaixe).
export function openEnds(s) {
  if (s.playsThisTurn > 0 && s.comboTarget) {
    return [{
      line: s.comboTarget.line,
      side: s.comboTarget.side,
      sp: endSpecies(s.lines, s.comboTarget.line, s.comboTarget.side)
    }];
  }
  const arr = [];
  for (let l = 0; l < s.lines.length; l++) {
    if (!s.lines[l].length) continue;
    arr.push({ line: l, side: 'left', sp: s.lines[l][0].halfL });
    arr.push({ line: l, side: 'right', sp: s.lines[l][s.lines[l].length - 1].halfR });
  }
  return arr;
}

// Como uma peça encaixa numa ponta: flip requerido, ou null.
export function fitOf(tile, sp) {
  const a = canBond(sp, tile[0]);
  const b = canBond(sp, tile[1]);
  if (a && b) return 'both';
  if (a) return false;
  if (b) return true;
  return null;
}

export function legalMovesExist(s) {
  const hand = s.players[s.current].hand;
  const ends = openEnds(s);
  for (const t of hand) for (const e of ends) {
    if (canBond(e.sp, t[0]) || canBond(e.sp, t[1])) return true;
  }
  return false;
}

// Quantas pontas uma peça da mão consegue "alcançar"
export function playableEndsFor(s, tileIdx) {
  const tile = s.players[s.current].hand[tileIdx];
  return openEnds(s).filter(e => canBond(e.sp, tile[0]) || canBond(e.sp, tile[1]));
}

// ---------- Estado inicial ----------
export function initialState() {
  return {
    screen: 'setup',
    mode: null,
    players: [],
    bag: [],
    lines: [[], []],
    discarded: [],
    current: 0,
    round: 1,
    roundPlays: 0,
    roundTrades: 0,
    playsThisTurn: 0,
    comboTarget: null,
    zerosStreak: 0,
    tradeOnlyStreak: 0,
    lastRoundPlayer: null,
    sel: { tile: null, end: null, flipped: false, declared: null },
    trading: false,
    tradeSel: [],
    feedback: null,
    message: '',
    finished: null,
    log: [],
    stats: { attempts: 0, correct: 0 }
  };
}

function log(s, msg, isErr) {
  s.log.unshift({ msg, err: !!isErr });
  if (s.log.length > 40) s.log.length = 40;
}

// ---------- Fluxo ----------
function resetTurnState(s) {
  s.sel = { tile: null, end: null, flipped: false, declared: null };
  s.trading = false;
  s.tradeSel = [];
  s.playsThisTurn = 0;
  s.comboTarget = null;
}

function refill(s, pIdx) {
  const p = s.players[pIdx];
  while (p.hand.length < MAX_HAND && s.bag.length) p.hand.push(s.bag.pop());
}

function checkLastRound(s, pIdx) {
  const p = s.players[pIdx];
  if (s.bag.length === 0 && p.hand.length < MAX_HAND && s.lastRoundPlayer === null && s.players.length > 1) {
    s.lastRoundPlayer = pIdx;
    log(s, p.name + ' não completou a mão: última rodada!');
  }
}

function finishGame(s, reason) {
  s.finished = reason;
  s.screen = 'end';
  resetTurnState(s);
}

function advanceTurn(s) {
  if (s.mode === 'solo') {
    refill(s, s.current);
    if (s.discarded.length) {
      s.bag = s.bag.concat(s.discarded);
      s.discarded = [];
      log(s, 'Peças trocadas voltaram ao saco.');
    }
    resetTurnState(s);
    return;
  }

  refill(s, s.current);
  if (s.discarded.length) {
    s.bag = s.bag.concat(s.discarded);
    s.discarded = [];
    log(s, 'Peças trocadas voltaram ao saco.');
  }
  checkLastRound(s, s.current);

  const wasLast = s.current === s.players.length - 1;
  const noPlaysThisRound = s.roundPlays === 0;

  s.current = (s.current + 1) % s.players.length;

  if (wasLast) {
    s.round++;
    s.zerosStreak = noPlaysThisRound ? (s.zerosStreak || 0) + 1 : 0;
    s.tradeOnlyStreak = (s.tradeOnlyStreak || 0) +
      (noPlaysThisRound && s.roundTrades > 0 ? 1 : 0);
    if (s.zerosStreak >= 3) { finishGame(s, 'Ninguém conseguiu jogar por 3 rodadas. Fim de jogo!'); return; }
    if (s.tradeOnlyStreak >= 2) { finishGame(s, 'As pontas da mesa não permitem mais jogadas. Fim de jogo!'); return; }
    s.roundPlays = 0;
    s.roundTrades = 0;
  }

  if (s.lastRoundPlayer !== null && s.lastRoundPlayer === s.current) {
    finishGame(s, 'A última rodada terminou. Fim de jogo!');
    return;
  }

  resetTurnState(s);
}

// Aplicar uma jogada já validada (usada por humanos e pela IA).
function applyPlay(s, handIdx, end, flip, declared) {
  const p = s.players[s.current];
  const tile = p.hand[handIdx];
  const connect = flip ? tile[1] : tile[0];
  const outer = flip ? tile[0] : tile[1];
  const endSp = endSpecies(s.lines, end.line, end.side);
  const actual = bondOf(endSp, connect);

  if (!actual) {
    const msg = endSp + ' não liga com ' + connect + '. ' + whyInvalid(endSp, connect);
    if (s.mode === 'solo') {
      s.feedback = { kind: 'err', a: endSp, b: connect, declared, actual: null, pts: 0, invalid: whyInvalid(endSp, connect) };
      s.message = 'Isso não forma ligação.';
      s.sel.declared = null;
      return;
    }
    failTurn(s, 'Jogada inválida: ' + msg);
    return;
  }
  if (declared !== actual) {
    const reason = reasonOf(endSp, connect);
    if (s.mode === 'solo') {
      s.feedback = { kind: 'err', a: endSp, b: connect, declared, actual, pts: 0, reason };
      s.message = 'Quase! O correto é ' + actual + '. Tente de novo =)';
      s.sel.declared = null;
      return;
    }
    failTurn(s, null, { a: endSp, b: connect, declared, actual, reason });
    return;
  }

  // Ligação confirmada — coloca a peça.
  if (end.side === 'left') s.lines[end.line].unshift({ halfL: outer, halfR: connect });
  else s.lines[end.line].push({ halfL: connect, halfR: outer });

  s.comboTarget = { line: end.line, side: end.side };
  p.hand.splice(handIdx, 1);

  const pts = SCORES[actual];
  p.score += pts;
  s.playsThisTurn++;
  s.roundPlays++;
  const name = p.name;
  log(s, name + ' jogou ' + connect + ' ↔ ' + endSp + ' (+' + pts + ' pts)');

  const reason = reasonOf(endSp, connect);
  s.feedback = {
    kind: p.isAI ? 'info' : 'ok',
    a: endSp, b: connect,
    declared: actual, actual, pts, reason,
    substance: substanceOf(endSp, connect)
  };
  if (s.mode === 'solo') s.stats.correct++;
  s.message = (p.isAI ? name + ' jogou' : 'Jogada válida! +' + pts + ' pts (' + actual + ')') +
    (s.mode === 'solo' ? '' : ' · continue em combo ou encerre a vez.');
  s.sel = { tile: null, end: null, flipped: false, declared: null };

  if (p.hand.length === 0 && s.mode !== 'solo' && s.players.length > 1) {
    finishGame(s, name + ' esvaziou a mão e venceu!');
  }
}

function failTurn(s, msg, feed) {
  const name = s.players[s.current].name;
  if (msg) log(s, 'ERRO: ' + msg, true);
  if (feed) {
    s.feedback = { kind: 'err', a: feed.a, b: feed.b, declared: feed.declared, actual: feed.actual, pts: 0, reason: feed.reason };
    s.message = 'Jogada inválida. O correto é ' + feed.actual + '.';
    log(s, name + ' declarou ' + feed.declared + ' — o correto é ' + feed.actual + '.', true);
  }
  if (s.playsThisTurn === 0) log(s, name + ' errou: peça mantida na mão e turno encerrado.', true);
  else log(s, name + ' errou no combo: turno encerrado.', true);
  advanceTurn(s);
}

// ---------- Ações ----------
export function reducer(s, action) {
  switch (action.type) {
    case 'NEW': {
      const s2 = clone(initialState());
      s2.mode = action.mode;
      s2.screen = 'game';
      s2.stats = { attempts: 0, correct: 0 };
      if (action.mode === 'solo') {
        s2.players = [{ name: action.names[0] || 'Você', hand: [], score: 0, isAI: false }];
      } else {
        const names = action.names || [];
        const n = s2.mode === 'ai' ? 2 : (names.length || 2);
        for (let i = 0; i < n; i++) {
          const isAI = s2.mode === 'ai' && i === n - 1;
          s2.players.push({ name: isAI ? 'Robô' : (names[i] || 'Jogador ' + (i + 1)), hand: [], score: 0, isAI });
        }
      }
      s2.bag = shuffle(PIECES.slice());
      for (const p of s2.players) {
        for (let h = 0; h < MAX_HAND; h++) p.hand.push(s2.bag.pop());
      }
      for (let ln = 0; ln < 2; ln++) {
        if (s2.bag.length) {
          const t = s2.bag.pop();
          const flip = Math.random() < 0.5;
          s2.lines[ln] = [{ halfL: flip ? t[1] : t[0], halfR: flip ? t[0] : t[1] }];
        }
      }
      log(s2, 'Partida iniciada! Saco com ' + s2.bag.length + ' peças.');
      s2.message = action.mode === 'solo'
        ? 'Clique numa peça destacada e depois numa ponta acesa. Boa sorte!'
        : s2.players[0].name + ', é a sua vez: clique numa peça e numa ponta.';
      return s2;
    }

    case 'SELECT_TILE': {
      const s2 = clone(s);
      if (s2.trading) {
        const pos = s2.tradeSel.indexOf(action.idx);
        if (pos === -1) s2.tradeSel.push(action.idx);
        else s2.tradeSel.splice(pos, 1);
        return s2;
      }
      const pl = s2.players[s2.current];
      if (pl.isAI || pl.hand[action.idx] === undefined) return s2;
      if (s2.sel.tile === action.idx) {
        s2.sel = { tile: null, end: null, flipped: false, declared: null };
      } else {
        s2.sel = { tile: action.idx, end: null, flipped: false, declared: null };
      }
      s2.feedback = null;
      s2.message = 'Agora clique numa ponta acesa da mesa.';
      return s2;
    }

    case 'FLIP': {
      const s2 = clone(s);
      if (s2.sel.tile === null) return s2;
      s2.sel.flipped = !s2.sel.flipped;
      s2.sel.declared = null;
      return s2;
    }

    case 'SELECT_END': {
      const s2 = clone(s);
      if (s2.sel.tile === null) {
        s2.message = 'Primeiro escolha uma peça da sua mão.';
        return s2;
      }
      const tile = s2.players[s2.current].hand[s2.sel.tile];
      const sp = endSpecies(s2.lines, action.line, action.side);
      if (s2.playsThisTurn > 0 && s2.comboTarget &&
        (s2.comboTarget.line !== action.line || s2.comboTarget.side !== action.side)) {
        s2.message = 'No combo, ligue à última peça colocada.';
        return s2;
      }
      const fit = fitOf(tile, sp);
      if (fit === null) {
        s2.message = sp + ' não liga com nenhuma metade dessa peça.';
        return s2;
      }
      s2.sel.end = { line: action.line, side: action.side };
      s2.sel.flipped = fit === true ? true : fit; // both → mantém orientação atual
      if (s2.sel.flipped !== true && fit === 'both') s2.sel.flipped = false;
      s2.sel.declared = null;
      s2.feedback = null;
      s2.message = 'Escolha o tipo de ligação entre ' + sp + ' e ' + tile[s2.sel.flipped ? 1 : 0] + '.';
      return s2;
    }

    case 'DECLARE': {
      const s2 = clone(s);
      if (s2.sel.tile === null || s2.sel.end === null) {
        s2.message = 'Selecione peça e ponta antes de declarar.';
        return s2;
      }
      const pl = s2.players[s2.current];
      if (pl.isAI || pl.hand[s2.sel.tile] === undefined) return s2;
      if (s2.mode === 'solo') s2.stats.attempts++;
      applyPlay(s2, s2.sel.tile, s2.sel.end, s2.sel.flipped, action.bond);
      if (s2.mode === 'solo') s2.sel = { tile: null, end: null, flipped: false, declared: null };
      return s2;
    }

    case 'END_TURN': {
      const s2 = clone(s);
      if (s2.mode === 'solo') advanceTurn(s2);
      else {
        log(s2, s2.players[s2.current].name + ' encerrou a vez.');
        advanceTurn(s2);
      }
      s2.feedback = null;
      if (s2.screen !== 'end' && s2.mode !== 'solo') {
        const pl = s2.players[s2.current];
        s2.message = pl.isAI ? (pl.name + ' está pensando…') : (pl.name + ', é a sua vez.');
      }
      return s2;
    }

    case 'TRY_TRADE': {
      const s2 = clone(s);
      s2.trading = true;
      s2.sel = { tile: null, end: null, flipped: false, declared: null };
      s2.feedback = null;
      s2.message = 'Modo troca: clique nas peças que deseja descartar.';
      return s2;
    }

    case 'CANCEL_TRADE': {
      const s2 = clone(s);
      s2.trading = false;
      s2.tradeSel = [];
      s2.message = '';
      return s2;
    }

    case 'TRADE': {
      const s2 = clone(s);
      if (s2.tradeSel.length === 0) {
        s2.message = 'Selecione pelo menos uma peça para trocar.';
        return s2;
      }
      const hand = s2.players[s2.current].hand;
      const sel = s2.tradeSel.slice().sort((a, b) => b - a);
      const removed = [];
      for (const i of sel) removed.push(hand.splice(i, 1)[0]);
      s2.discarded = s2.discarded.concat(removed);
      log(s2, s2.players[s2.current].name + ' trocou ' + removed.length + ' peça(s).');
      s2.roundTrades++;
      if (s2.mode === 'solo') advanceTurn(s2);
      else {
        log(s2, s2.players[s2.current].name + ' encerrou a vez (troca).');
        advanceTurn(s2);
      }
      return s2;
    }

    case 'DROP_ON_END': {
      const s2 = clone(s);
      if (s2.trading) return s2;
      const pl = s2.players[s2.current];
      if (pl.isAI || pl.hand[action.tile] === undefined) return s2;
      s2.sel.tile = action.tile;
      const tile = pl.hand[action.tile];
      const sp = endSpecies(s2.lines, action.line, action.side);
      if (s2.playsThisTurn > 0 && s2.comboTarget &&
        (s2.comboTarget.line !== action.line || s2.comboTarget.side !== action.side)) {
        s2.message = 'No combo, ligue à última peça colocada.';
        return s2;
      }
      const fit = fitOf(tile, sp);
      if (fit === null) {
        s2.message = sp + ' não liga com nenhuma metade dessa peça.';
        s2.sel = { tile: null, end: null, flipped: false, declared: null };
        return s2;
      }
      s2.sel.end = { line: action.line, side: action.side };
      s2.sel.flipped = fit === true ? true : (fit === false ? false : s2.sel.flipped);
      s2.sel.declared = null;
      s2.feedback = null;
      s2.message = 'Escolha o tipo de ligação entre ' + sp + ' e ' + tile[s2.sel.flipped ? 1 : 0] + '.';
      return s2;
    }

    case 'AI_MOVE': {
      const s2 = clone(s);
      const pl = s2.players[s2.current];
      if (!pl || !pl.isAI || s2.finished || s2.screen !== 'game') return s2;
      if (!action.move) {
        // IA sem jogadas: descarta 1 peça e passa a vez.
        if (pl.hand.length) {
          s2.discarded = s2.discarded.concat(pl.hand.splice(Math.floor(Math.random() * pl.hand.length), 1));
          log(s2, pl.name + ' trocou uma peça.');
        }
        advanceTurn(s2);
        s2.feedback = null;
        return s2;
      }
      applyPlay(s2, action.move.tile, action.move.end, action.move.flip, action.move.actual);
      // IA joga apenas uma peça por vez.
      if (s2.screen !== 'end') {
        if (s2.playsThisTurn > 0) {
          log(s2, pl.name + ' encerrou a vez.');
        }
        advanceTurn(s2);
        s2.feedback = null;
        const next = s2.players[s2.current];
        s2.message = next.isAI ? (next.name + ' está pensando…') : (next.name + ', é a sua vez.');
      }
      return s2;
    }

    case 'DISMISS_FEEDBACK': {
      const s2 = clone(s);
      if (s2.feedback) s2.feedback = { ...s2.feedback, hidden: true };
      return s2;
    }

    case 'FINISH_SOLO': {
      const s2 = clone(s);
      finishGame(s2, 'Treino encerrado!');
      return s2;
    }

    case 'BACK_TO_SETUP': {
      const s2 = clone(initialState());
      s2.screen = 'setup';
      return s2;
    }

    case 'RESTART': {
      const names = s.players.map(p => p.name);
      return reducer(s, { type: 'NEW', mode: s.mode, names });
    }

    default:
      return s;
  }
}