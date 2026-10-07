// ============================================================
//  DOMINÓ QUÍMICO — Smoke test de renderização (sem DOM)
//  Garante que cada tela monta sem lançar exceção.
// ============================================================

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import App from './App.jsx';
import GameScreen from './components/GameScreen.jsx';
import EndScreen from './components/EndScreen.jsx';
import RulesModal from './components/RulesModal.jsx';
import { reducer, initialState, openEnds } from './game/engine.js';
import { bondOf } from './game/rules.js';

function newMatch(mode, names) {
  return reducer(initialState(), { type: 'NEW', mode, names });
}

describe('renderização', () => {
  it('tela de configuração renderiza', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('Dominó Químico');
    expect(html).toContain('mode-card');
  });

  it('tela de jogo renderiza com as duas linhas e a mão', () => {
    const s = newMatch('solo', ['Quiz']);
    const html = renderToStaticMarkup(
      <GameScreen s={s} dispatch={() => {}} onRules={() => {}} />
    );
    expect(html).toContain('Linha A');
    expect(html).toContain('endchip');
    expect(html).toContain('Recompor mão');
  });

  it('tela de jogo renderiza com uma jogada feita (junção na mesa)', () => {
    let s = newMatch('solo', ['Quiz']);
    const eps = openEnds(s);
    const end = eps[0];
    const pl = s.players[0];
    let move = null;
    outer: for (let i = 0; i < pl.hand.length; i++) {
      for (const flip of [false, true]) {
        const connect = flip ? pl.hand[i][1] : pl.hand[i][0];
        const t = bondOf(end.sp, connect);
        if (t) { move = { tile: i, flip, t }; break outer; }
      }
    }
    expect(move).not.toBeNull();
    s = reducer(s, { type: 'SELECT_TILE', idx: move.tile });
    s = reducer(s, { type: 'SELECT_END', line: end.line, side: end.side });
    s = reducer(s, { type: 'DECLARE', bond: move.t });
    const html = renderToStaticMarkup(<GameScreen s={s} dispatch={() => {}} onRules={() => {}} />);
    expect(html).toContain('junction');
    expect(html).toContain('feedback');
  });

  it('tela final e modal de regras renderizam', () => {
    let s = newMatch('match', ['Ana', 'Bia']);
    s = reducer(s, { type: 'FINISH_SOLO' });
    const endHtml = renderToStaticMarkup(<EndScreen s={s} onRestart={() => {}} onSetup={() => {}} />);
    expect(endHtml).toContain('rank-row');

    const rulesHtml = renderToStaticMarkup(<RulesModal onClose={() => {}} />);
    expect(rulesHtml).toContain('Como jogar');
    expect(rulesHtml).toContain('Iônica');
  });
});