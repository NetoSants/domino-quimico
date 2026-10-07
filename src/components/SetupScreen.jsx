import React, { useState } from 'react';
import { MODES, SCORES, TYPE_LABEL } from '../game/data.js';
import { BondChip } from './bits.jsx';

export default function SetupScreen({ onStart, onRules }) {
  const [mode, setMode] = useState('solo');
  const [count, setCount] = useState(2);
  const [name1, setName1] = useState('');
  const [names, setNames] = useState({ 2: ['', ''], 3: ['', '', ''], 4: ['', '', '', ''] });

  const start = () => {
    const list = mode === 'solo' ? [name1.trim() || 'Você'] : mode === 'ai' ? [name1.trim() || 'Você'] : names[count].map((n, i) => n.trim() || 'Jogador ' + (i + 1));
    onStart(mode, list);
  };

  return (
    <div className="screen setup">
      <header className="hero">
        <div className="hero-mark">🧪</div>
        <h1>Dominó Químico</h1>
        <p className="subtitle">Ligue as espécies na mesa e <b>deduza o tipo de ligação</b> para pontuar.</p>
        <div className="hero-legend">
          <BondChip type="ionic">Metal + não-metal → Iônica</BondChip>
          <BondChip type="polar">Não-metais diferentes → Polar</BondChip>
          <BondChip type="apolar">Não-metais iguais → Apolar</BondChip>
          <BondChip type="metallic">Metais → Metálica</BondChip>
        </div>
      </header>

      <div className="mode-grid">
        {Object.keys(MODES).map((k) => (
          <button key={k} className={`mode-card${mode === k ? ' active' : ''}`} onClick={() => setMode(k)}>
            <span className="mode-icon">{MODES[k].icon}</span>
            <span className="mode-title">{MODES[k].label}</span>
            <span className="mode-desc">{MODES[k].desc}</span>
          </button>
        ))}
      </div>

      <div className="card players-card">
        {mode === 'match' && (
          <>
            <label className="lbl">Número de jogadores</label>
            <div className="count-row">
              {[2, 3, 4].map((n) => (
                <button key={n} className={`count-btn${count === n ? ' active' : ''}`} onClick={() => setCount(n)}>{n}</button>
              ))}
            </div>
            <label className="lbl">Nomes</label>
            <div className="names">
              {names[count].map((v, i) => (
                <input key={i} value={v} onChange={(e) => setNames({ ...names, [count]: names[count].map((x, j) => (j === i ? e.target.value : x)) })} placeholder={'Jogador ' + (i + 1)} maxLength={16} />
              ))}
            </div>
          </>
        )}
        {(mode === 'solo' || mode === 'ai') && (
          <>
            <label className="lbl">{mode === 'ai' ? 'Seu nome' : 'Seu nome (opcional)'}</label>
            <div className="names">
              <input value={name1} onChange={(e) => setName1(e.target.value)} placeholder="Você" maxLength={16} />
            </div>
            {mode === 'ai' && <p className="hint">Você enfrenta o <b>Robô</b> — que só faz jogadas válidas.</p>}
            {mode === 'solo' && <p className="hint">Sem penalidade: errou, o cartão explica e você tenta de novo.</p>}
          </>
        )}
      </div>

      <div className="actions">
        <button className="btn btn-primary big" onClick={start}>Começar</button>
        <button className="btn btn-ghost big" onClick={onRules}>Como jogar</button>
      </div>
    </div>
  );
}