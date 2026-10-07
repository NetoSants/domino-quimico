import React from 'react';
import { SPECIES, CAT_LABEL, ELEMENT_HUE, SCORES, TYPE_LABEL } from '../game/data.js';
import { substanceOf, bondOf } from '../game/rules.js';

// Estilos de uma espécie (tema claro): fundo pastel por elemento, texto escuro.
export function speciesStyle(sp) {
  const spec = SPECIES[sp];
  const h = ELEMENT_HUE[spec.element] || 0;
  return {
    bg: `hsl(${h} 72% 93%)`,
    fg: `hsl(${h} 55% 26%)`,
    border: `hsl(${h} 55% 62%)`
  };
}

export function BondChip({ type, children, className = '' }) {
  return (
    <span className={`bond-chip bond-${type} ${className}`}>{children || TYPE_LABEL[type]}</span>
  );
}

export function SpeciesBadge({ sp, small }) {
  const st = speciesStyle(sp);
  const cat = CAT_LABEL[SPECIES[sp].cat];
  return (
    <span className={`species ${small ? 'small' : ''}`} style={{ background: st.bg, color: st.fg, borderColor: st.border }} title={cat}>
      <span className="sym">{sp}</span>
      {!small && <span className="cat">{cat}</span>}
    </span>
  );
}

// Metade de uma peça (célula colorida com a espécie).
export function Half({ sp, connect, chargeOnly, showEN }) {
  const st = speciesStyle(sp);
  const spec = SPECIES[sp];
  return (
    <span className={`half${connect ? ' connect' : ''}`} style={{ background: st.bg, color: st.fg }}>
      <span className="sym">{sp}</span>
      {!chargeOnly && <span className="cat">{CAT_LABEL[spec.cat]}</span>}
      {showEN && spec.EN !== undefined && <span className="en">EN {spec.EN.toFixed(1)}</span>}
    </span>
  );
}

// Peça de dominó.
export function Tile({ tile, size = 'md', selected, playable, tradeSel, locked, connector, onClick, dragStart, draggable }) {
  const cls = [
    'tile',
    size,
    selected ? 'selected' : '',
    playable ? 'playable' : '',
    tradeSel ? 'trade-sel' : '',
    locked ? 'locked' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cls}
      onClick={onClick}
      draggable={draggable}
      onDragStart={dragStart}
      title={tile.join(' e ')}
    >
      <Half sp={tile[0]} connect={connector === 0} showEN />
      <Half sp={tile[1]} connect={connector === 1} showEN />
    </div>
  );
}

// Junção entre duas peças ligadas: substância + tipo colorido.
export function Junction({ left, right }) {
  const tp = bondOf(left, right);
  if (!tp) return null;
  return (
    <span className={`junction bond-${tp}`} title={TYPE_LABEL[tp] + ' · ' + SCORES[tp] + ' pts'}>
      <b>{substanceOf(left, right)}</b>
      <em>{TYPE_LABEL[tp]}</em>
    </span>
  );
}

export function Legend() {
  return (
    <div className="legend">
      {Object.keys(SCORES).map((t) => (
        <BondChip key={t} type={t} className="lg" />
      ))}
    </div>
  );
}