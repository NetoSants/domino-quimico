import React from 'react';
import { SPECIES, CAT_LABEL, SCORES } from '../game/data.js';
import { speciesStyle } from './bits.jsx';

export default function RulesModal({ onClose }) {
  const rules = [
    {
      type: 'ionic',
      title: 'Iônica',
      who: 'Metal + não-metal · cátion + ânion',
      why: 'O metal doa elétrons ao não-metal (ou íons opostos se atraem). Havendo transferência de elétrons, é iônica.',
      pts: SCORES.ionic
    },
    {
      type: 'metallic',
      title: 'Metálica',
      who: 'Metal + metal',
      why: 'Elétrons livres formam uma nuvem delocalizada que "gruda" os átomos do metal.',
      pts: SCORES.metallic
    },
    {
      type: 'polar',
      title: 'Covalente polar',
      who: 'Não-metal + não-metal (diferentes)',
      why: 'Partilha de elétrons, mas o mais eletronegativo puxa mais — partilha desigual.',
      pts: SCORES.polar
    },
    {
      type: 'apolar',
      title: 'Covalente apolar',
      who: 'Não-metal + não-metal (iguais)',
      why: 'Átomos iguais partilham os elétrons exatamente igual.',
      pts: SCORES.apolar
    }
  ];

  const categories = Object.keys(SPECIES).map((sp) => SPECIES[sp].cat).filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="modal" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div className="modal-head">
          <h2>Como jogar</h2>
          <button className="btn btn-ghost sm" onClick={onClose}>✕</button>
        </div>

        <p className="modal-intro">
          Você liga espécies (átomos e íons) da sua mão às <b>pontas</b> da mesa e declara o tipo de ligação.
          Se acertar, pontua e pode continuar em <b>combo</b>. Se errar, o cartão explica o porquê.
        </p>

        <h3 className="sec">As 4 regras de ligação</h3>
        <div className="rule-grid">
          {rules.map((r) => (
            <div key={r.type} className={`rule-card bond-${r.type}`}>
              <div className="rule-title">{r.title} · {r.pts} pts</div>
              <div className="rule-who">{r.who}</div>
              <div className="rule-why">{r.why}</div>
            </div>
          ))}
        </div>

        <h3 className="sec">Espécies do jogo</h3>
        <div className="cat-row">
          {categories.map((c) => (
            <span key={c} className="cat-pill">{c}s</span>
          ))}
        </div>
        <div className="species-list">
          {Object.keys(SPECIES).map((sp) => {
            const st = speciesStyle(sp);
            return (
              <span key={sp} className="species-ref" style={{ background: st.bg, color: st.fg, borderColor: st.border }}>
                <b>{sp}</b>
                <em>{CAT_LABEL[SPECIES[sp].cat]}</em>
                {SPECIES[sp].EN !== undefined && <i>EN {SPECIES[sp].EN.toFixed(1)}</i>}
              </span>
            );
          })}
        </div>

        <h3 className="sec">Dica</h3>
        <p className="modal-intro">
          Compare as <b>eletronegatividades</b> (EN) marcadas nas peças: se o par é de não-metais diferentes,
          o de maior EN puxa os elétrons (polar). Dois não-metais iguais ou dois metais → sem "puxão" (apolar/metálica).
          Metal e não-metal → o metal perde, o não-metal ganha (iônica).
        </p>
      </div>
    </div>
  );
}