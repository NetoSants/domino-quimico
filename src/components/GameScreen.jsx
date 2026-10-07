import React from 'react';
import { SCORES, TYPE_LABEL, BOND_TYPES, MODES } from '../game/data.js';
import { openEnds, fitOf, legalMovesExist, endSpecies, MAX_HAND } from '../game/engine.js';
import { SpeciesBadge, Tile, Junction, BondChip, Half } from './bits.jsx';

const LINE_NAMES = ['A', 'B'];
const WIN_KEEP = 5;

export default function GameScreen({ s, dispatch, onRules }) {
  const pl = s.players[s.current];
  const myTurn = !!pl && !pl.isAI;
  const ends = openEnds(s) || [];
  const selTile = s.sel.tile !== null && pl ? pl.hand[s.sel.tile] : null;

  // compatibilidade dos fins com a peça selecionada
  const fitByEnd = {};
  if (s.sel.tile !== null && selTile) {
    for (const e of ends) fitByEnd[e.line + ':' + e.side] = fitOf(selTile, e.sp);
  }

  const allowed = (line, side) => {
    if (s.playsThisTurn > 0 && s.comboTarget) return s.comboTarget.line === line && s.comboTarget.side === side;
    return true;
  };

  const pick = (line, side) => { dispatch({ type: 'SELECT_END', line, side }); };
  const onDropEnd = (line, side) => { dispatch({ type: 'DROP_ON_END', line, side, tile: dragRef.current }); };
  const compat = (line, side) => {
    const f = fitByEnd[line + ':' + side];
    return f !== undefined && f !== null && allowed(line, side);
  };

  return (
    <div className="screen game">
      <Topbar s={s} onRules={onRules} />

      <HintBar s={s} myTurn={myTurn} />

      {s.feedback && !s.feedback.hidden && <FeedbackCard fb={s.feedback} onClose={() => dispatch({ type: 'DISMISS_FEEDBACK' })} />}

      <div className="table-panel">
        <div className="table-head">
          <span>Mesa · {LINE_NAMES.length} linhas</span>
          {s.playsThisTurn > 0 && (
            <span className="combo-chip">🔥 Combo: ligue à última peça</span>
          )}
          {s.lastRoundPlayer !== null && <span className="lastround-chip">⏱ Última rodada!</span>}
        </div>
        {s.lines.map((line, l) => (
          <div className="line-row" key={l}>
            <span className="line-label">Linha {LINE_NAMES[l]}</span>
            <div className="table-line">
              <EndChip
                end={{ line: l, side: 'left', sp: line[0].halfL }}
                compat={compat(l, 'left')}
                allowed={allowed(l, 'left')}
                onPick={pick} onDropEnd={onDropEnd}
              />
              {renderLine(line)}
              <EndChip
                end={{ line: l, side: 'right', sp: line[line.length - 1].halfR }}
                compat={compat(l, 'right')}
                allowed={allowed(l, 'right')}
                onPick={pick} onDropEnd={onDropEnd}
              />
            </div>
          </div>
        ))}
      </div>

      <HandZone s={s} dispatch={dispatch} myTurn={myTurn} playable={handPlayable(s)} />

      <BondPanel s={s} selTile={selTile} ends={ends} dispatch={dispatch} myTurn={myTurn} />

      <ActionBar s={s} dispatch={dispatch} myTurn={myTurn} noMoves={!legalMovesExist(s)} selTile={selTile} />

      {s.log.length > 0 && <LogPanel log={s.log} />}
    </div>
  );
}

function renderLine(line) {
  const out = [];
  if (line.length > WIN_KEEP * 2) {
    pushWindow(out, line, 0, WIN_KEEP);
    out.push(<span key="gap" className="line-gap">⋯ {line.length - WIN_KEEP * 2}</span>);
    pushWindow(out, line, line.length - WIN_KEEP, line.length);
  } else {
    pushWindow(out, line, 0, line.length);
  }
  return out;

  function pushWindow(arr, ln, start, end) {
    for (let i = start; i < end; i++) {
      const t = ln[i];
      if (i > start) arr.push(<Junction key={'j' + i} left={ln[i - 1].halfR} right={t.halfL} />);
      arr.push(
        <div key={'t' + i} className="tile tiny">
          <Half sp={t.halfL} chargeOnly />
          <Half sp={t.halfR} chargeOnly />
        </div>
      );
    }
  }
}

function handPlayable(s) {
  const pl = s.players[s.current];
  const ends = openEnds(s);
  const map = {};
  for (let i = 0; i < (pl ? pl.hand.length : 0); i++) {
    map[i] = ends.some((e) => fitOf(pl.hand[i], e.sp) !== null);
  }
  return map;
}

function Topbar({ s, onRules }) {
  const pct = s.stats.attempts ? Math.round((s.stats.correct / s.stats.attempts) * 100) : null;
  return (
    <div className="topbar">
      <div className="scorebar">
        {s.players.map((p, i) => (
          <div key={i} className={`score${i === s.current ? ' active' : ''}${p.isAI ? ' ai' : ''}`}>
            <span className="avatar">{p.isAI ? '🤖' : p.name.charAt(0).toUpperCase()}</span>
            <span className="sname">{p.name}</span>
            <span className="spts">{p.score} pts</span>
            <span className="scount">{p.hand.length}/{MAX_HAND} · {p.isAI ? 'IA' : 'pçs'}</span>
          </div>
        ))}
        {s.mode === 'solo' && pct !== null && (
          <div className="score stats">
            <span className="sname">Acertos</span>
            <span className="spts">{s.stats.correct}/{s.stats.attempts} ({pct}%)</span>
          </div>
        )}
      </div>
      <div className="top-actions">
        <span className="bag-info">Saco {s.bag.length} · Rodada {s.round}</span>
        <button className="btn btn-ghost sm" onClick={onRules}>Regras</button>
      </div>
    </div>
  );
}

function HintBar({ s, myTurn }) {
  let tip = '';
  if (!myTurn) tip = 'O adversário está jogando…';
  else if (s.trading) tip = null;
  else if (s.sel.tile === null) tip = 'Clique numa peça destacada em verde da sua mão.';
  else if (s.sel.end === null) tip = 'Agora clique numa ponta acesa da mesa.';
  else tip = 'Escolha o tipo de ligação e clique para confirmar.';
  return (
    <div className="hint-bar">
      <span>{s.message || 'Escolha uma peça para começar.'}</span>
      {tip && <em>{tip}</em>}
    </div>
  );
}

function FeedbackCard({ fb, onClose }) {
  const ok = fb.kind === 'ok';
  const incorrect = fb.declared && fb.actual && fb.declared !== fb.actual;
  const title = ok ? '✔ Ligação correta!' : (fb.invalid ? 'Isso não forma ligação' : 'Quase!');
  return (
    <div className={`feedback ${fb.kind}`}>
      <button className="feed-x" onClick={onClose} aria-label="fechar">✕</button>
      <div className="feed-head">{title}</div>
      <div className="feed-row">
        <SpeciesBadge sp={fb.a} small /> <span className="feed-arrow">↔</span> <SpeciesBadge sp={fb.b} small />
        {fb.actual && <BondChip type={fb.actual} className="pts-chip">{TYPE_LABEL[fb.actual]}</BondChip>}
        {fb.pts > 0 && <BondChip type={fb.actual} className="pts-chip">+{fb.pts} pts</BondChip>}
      </div>
      {fb.invalid && <p className="feed-reason">{fb.invalid}</p>}
      {incorrect && fb.reason && <p className="feed-reason">{fb.reason.text}</p>}
      {(fb.reason && fb.reason.delta !== null && fb.reason.delta !== undefined) && (
        <div className="feed-delta">Compare as EN: ΔEN = {fb.reason.delta}</div>
      )}
      {fb.substance && ok && <div className="feed-substance">Substância formada: <b>{fb.substance}</b></div>}
    </div>
  );
}

function EndChip({ end, compat, allowed, onPick, onDropEnd }) {
  return (
    <div
      className={`endchip${compat ? ' compat' : ''}${allowed ? '' : ' off'}`}
      onClick={() => (allowed ? onPick(end.line, end.side) : null)}
      onDragOver={(e) => { if (allowed) e.preventDefault(); }}
      onDrop={(e) => { if (allowed) { e.preventDefault(); onDropEnd(end.line, end.side); } }}
      title={'Ligar ' + end.sp}
    >
      <SpeciesBadge sp={end.sp} small />
      <span className="plus">{allowed ? '+' : '∅'}</span>
    </div>
  );
}

function HandZone({ s, dispatch, myTurn, playable }) {
  const pl = s.players[s.current];
  const hand = pl ? pl.hand : [];
  const connectorIdx = s.sel.end !== null && s.sel.tile !== null ? (s.sel.flipped ? 1 : 0) : null;

  return (
    <div className="hand-panel">
      <div className="hand-head">
        <span>{pl ? pl.name + ' — mão' : ''}</span>
        {pl && pl.isAI && <span className="thinking">pensando…</span>}
      </div>
      <div className="hand">
        {hand.map((t, i) => (
          <Tile
            key={i}
            tile={t}
            selected={s.sel.tile === i && !s.trading}
            playable={myTurn && !s.trading && s.sel.tile === i ? false : myTurn && playable[i] && !s.trading}
            tradeSel={s.trading && s.tradeSel.includes(i)}
            locked={!myTurn || s.trading}
            connector={s.sel.tile === i ? connectorIdx : null}
            draggable={myTurn && !s.trading}
            onClick={() => { if (myTurn) dispatch({ type: 'SELECT_TILE', idx: i }); }}
            dragStart={(e) => { if (myTurn) { dragRef.current = i; if (e.dataTransfer) e.dataTransfer.setData('text/plain', String(i)); } }}
          />
        ))}
        {hand.length === 0 && <div className="empty-hand">Mão vazia.</div>}
      </div>
    </div>
  );
}

// Índice da peça sendo arrastada (compartilhado para o alvo de drop).
const dragRef = { current: null };

function BondPanel({ s, selTile, ends, dispatch, myTurn }) {
  const ready = s.sel.tile !== null && s.sel.end !== null && selTile;
  const endSp = s.sel.end ? endSpecies(s.lines, s.sel.end.line, s.sel.end.side) : null;
  const connect = ready ? selTile[s.sel.flipped ? 1 : 0] : null;

  return (
    <div className="bond-panel">
      <div className="bond-title">Ligação a declarar</div>
      {ready && connect ? (
        <>
          <div className="preview">
            <SpeciesBadge sp={endSp} small /> ↔ <SpeciesBadge sp={connect} small />
          </div>
          <div className="bond-opts">
            {BOND_TYPES.map((t) => (
              <button key={t} className={`bond-btn bond-${t}${s.sel.declared === t ? ' active' : ''}`} onClick={() => dispatch({ type: 'DECLARE', bond: t })}>
                {TYPE_LABEL[t]} <em>· {SCORES[t]} pts</em>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="bond-idle">
          <p>Selecione uma peça <b>e</b> uma ponta para ativar.</p>
          <div className="legend-4">
            {BOND_TYPES.map((t) => <BondChip key={t} type={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function LogPanel({ log }) {
  return (
    <div className="log-panel">
      <h3>Últimas jogadas</h3>
      <div className="log-lines">
        {log.slice(0, 8).map((entry, i) => (
          <span key={i} className={`log-line${entry.err ? ' err' : ''}`}>{entry.msg}</span>
        ))}
      </div>
    </div>
  );
}

function ActionBar({ s, dispatch, myTurn, noMoves, selTile }) {
  const modeLabel = MODES[s.mode]?.label;

  if (s.trading) {
    return (
      <div className="actionbar">
        <span className="trade-hint">Modo troca: toque nas peças a descartar.</span>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'TRADE' })}>Confirmar troca ({s.tradeSel.length})</button>
        <button className="btn btn-ghost" onClick={() => dispatch({ type: 'CANCEL_TRADE' })}>Cancelar</button>
      </div>
    );
  }

  if (!myTurn) {
    return (
      <div className="actionbar">
        <span className="thinking-big">🤖 Robô está jogando…</span>
      </div>
    );
  }

  // permite virar quando as duas metades encaixam
  const canFlip = selTile && s.sel.end !== null &&
    fitOf(selTile, endSpecies(s.lines, s.sel.end.line, s.sel.end.side)) === 'both';

  return (
    <div className="actionbar">
      {canFlip && <button className="btn btn-ghost" onClick={() => dispatch({ type: 'FLIP' })}>Trocar lado</button>}
      {s.mode === 'solo' ? (
        <>
          <button className="btn btn-ghost" onClick={() => dispatch({ type: 'TRY_TRADE' })}>Trocar peças</button>
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'END_TURN' })} disabled={s.playsThisTurn === 0 && s.sel.tile !== null}>Recompor mão</button>
          <button className="btn btn-danger ghost-danger" onClick={() => dispatch({ type: 'FINISH_SOLO' })}>Encerrar treino</button>
        </>
      ) : (
        <>
          <button className="btn btn-ghost" onClick={() => dispatch({ type: 'TRY_TRADE' })}>Trocar peças</button>
          {s.playsThisTurn > 0 && <button className="btn btn-primary" onClick={() => dispatch({ type: 'END_TURN' })}>Encerrar vez</button>}
          {noMoves && s.playsThisTurn === 0 && (
            <span className="nojob">{modeLabel} · sem jogadas possíveis — use a troca ou encerre a vez.</span>
          )}
        </>
      )}
    </div>
  );
}