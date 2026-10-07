import React from 'react';
import { MODES } from '../game/data.js';

export default function EndScreen({ s, onRestart, onSetup }) {
  const solo = s.mode === 'solo';
  const pct = s.stats.attempts ? Math.round((s.stats.correct / s.stats.attempts) * 100) : 0;
  const ranked = s.players.slice().sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.hand.length - b.hand.length;
  });
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="screen end">
      <div className="end-card">
        <div className="end-emoji">{solo ? '🎯' : '🏆'}</div>
        <h1>{s.finished || 'Fim de jogo!'}</h1>
        {solo ? (
          <p className="end-sub">
            Pontos: <b>{s.players[0].score}</b> · Acertos {s.stats.correct}/{s.stats.attempts} ({pct}%)
          </p>
        ) : (
          <p className="end-sub">{ranked[0].name + ' venceu a partida (' + MODES[s.mode]?.label + ')!'}</p>
        )}
        <div className="ranking">
          {ranked.map((p, i) => (
            <div key={i} className={`rank-row${i === 0 ? ' winner' : ''}`}>
              <span className="pos">{medals[i] || (i + 1) + 'º'}</span>
              <span className="name">{p.name} {p.isAI ? '(Robô)' : ''}</span>
              <span className="pts">{p.score} pts</span>
            </div>
          ))}
        </div>
        {!solo && <p className="end-note">Desempate: menos peças na mão.</p>}
        <div className="end-actions">
          <button className="btn btn-primary big" onClick={onRestart}>Jogar novamente</button>
          <button className="btn btn-ghost big" onClick={onSetup}>Menu</button>
        </div>
      </div>
    </div>
  );
}