// ============================================================
//  DOMINÓ QUÍMICO — Testes do motor (regras deriváveis)
// ============================================================

import { describe, it, expect } from 'vitest';
import { bondOf, canBond, whyInvalid, reasonOf } from './rules.js';
import { reducer, initialState, openEnds, fitOf } from './engine.js';
import { SPECIES } from './data.js';

describe('matriz de ligação derivável', () => {
  it('metal + não-metal → iônica', () => {
    expect(bondOf('Na', 'Cl')).toBe('ionic');
    expect(bondOf('Cl', 'Li')).toBe('ionic');
  });

  it('cátion + ânion → iônica', () => {
    expect(bondOf('Na⁺', 'F⁻')).toBe('ionic');
    expect(bondOf('Cl⁻', 'K⁺')).toBe('ionic');
  });

  it('metal + metal → metálica', () => {
    expect(bondOf('Na', 'K')).toBe('metallic');
    expect(bondOf('Li', 'Li')).toBe('metallic');
  });

  it('não-metal + não-metal → covalente (igual apolar, diferente polar)', () => {
    expect(bondOf('F', 'F')).toBe('apolar');
    expect(bondOf('H', 'H')).toBe('apolar');
    expect(bondOf('H', 'F')).toBe('polar');
    expect(bondOf('Cl', 'Br')).toBe('polar');
  });

  it('pares de cargas iguais não ligam (repulsão)', () => {
    expect(canBond('Na⁺', 'K⁺')).toBe(false);
    expect(canBond('F⁻', 'Cl⁻')).toBe(false);
    expect(canBond('Na⁺', 'Na')).toBe(false);
    expect(canBond('F', 'Cl⁻')).toBe(false);
    expect(canBond('Na', 'Cl⁻')).toBe(false);
    expect(canBond('Na⁺', 'F')).toBe(false);
  });

  it('todo par válido tem exatamente um tipo', () => {
    const species = Object.keys(SPECIES);
    for (const a of species) {
      for (const b of species) {
        const t = bondOf(a, b);
        if (t !== null) {
          const unique = (t === 'ionic' || t === 'metallic' || t === 'polar' || t === 'apolar');
          expect(unique).toBe(true);
        }
      }
    }
  });

  it('razões pedagógicas existem para ligações válidas', () => {
    expect(reasonOf('Na', 'Cl')).toBeTruthy();
    expect(reasonOf('H', 'F').delta).toBe('1.8');
    expect(whyInvalid('F⁻', 'Cl⁻')).toContain('repelem');
  });
});

describe('motor — fluxo básico', () => {
  it('partida solo inicia com 2 linhas e jogadores', () => {
    let s = initialState();
    s = reducer(s, { type: 'NEW', mode: 'solo', names: ['Quiz'] });
    expect(s.screen).toBe('game');
    expect(s.players.length).toBe(1);
    expect(s.players[0].hand.length).toBe(5);
    expect(s.lines[0].length).toBe(1);
    expect(s.lines[1].length).toBe(1);
    expect(openEnds(s).length).toBe(4);
  });

  it('fitOf calcula a orientação da peça', () => {
    expect(fitOf(['Cl', 'Na'], 'Na')).toBe('both');
    expect(fitOf(['F⁻', 'Cl⁻'], 'Na⁺')).toBe('both'); // ânions só com cátions
    expect(fitOf(['Na⁺', 'K⁺'], 'Na')).toBe(null);    // nenhuma metade liga com metal
    expect(fitOf(['F', 'H'], 'F')).toBe('both');      // F/F apolar + H/F polar
    expect(fitOf(['F⁻', 'H'], 'Cl')).toBe(true);      // só o H liga (polar) ⇒ precisa virar
  });

  it('declaração correta em modos competitivos pontua e move o turno', () => {
    let s = initialState();
    s = reducer(s, { type: 'NEW', mode: 'match', names: ['A', 'B'] });
    const sp = openEnds(s)[0].sp;
    // encontra uma peça jogável nessa ponta
    const pl = s.players[0];
    let hit = null;
    outer: for (let i = 0; i < pl.hand.length; i++) {
      for (const flip of [false, true]) {
        const connect = flip ? pl.hand[i][1] : pl.hand[i][0];
        const t = bondOf(sp, connect);
        if (t) { hit = { tile: i, flip, t }; break outer; }
      }
    }
    expect(hit).not.toBeNull();
    s = reducer(s, { type: 'SELECT_TILE', idx: hit.tile });
    s = reducer(s, { type: 'SELECT_END', line: openEnds(s)[0].line, side: openEnds(s)[0].side });
    const end = s.sel.end;
    s = reducer(s, { type: 'DECLARE', bond: hit.t });
    expect(s.players[0].hand.length).toBe(4);
    expect(s.players[0].score).toBeGreaterThan(0);
  });
});