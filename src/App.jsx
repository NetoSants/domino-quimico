import React, { useEffect, useReducer, useState } from 'react';
import { reducer, initialState } from './game/engine.js';
import { chooseAiMove } from './game/ai.js';
import SetupScreen from './components/SetupScreen.jsx';
import GameScreen from './components/GameScreen.jsx';
import EndScreen from './components/EndScreen.jsx';
import RulesModal from './components/RulesModal.jsx';

export default function App() {
  const [s, dispatch] = useReducer(reducer, undefined, initialState);
  const [showRules, setShowRules] = useState(false);

  // Turno da IA (dispara com leve atraso, depois que o estado se estabilizar).
  useEffect(() => {
    if (s.screen !== 'game' || s.finished) return;
    const pl = s.players[s.current];
    if (!pl || !pl.isAI) return;
    const t = setTimeout(() => {
      dispatch({ type: 'AI_MOVE', move: chooseAiMove(s) });
    }, 800 + Math.random() * 600);
    return () => clearTimeout(t);
  }, [s]);

  return (
    <div className="app">
      {s.screen === 'setup' && <SetupScreen onStart={(mode, names) => dispatch({ type: 'NEW', mode, names })} onRules={() => setShowRules(true)} />}
      {s.screen === 'game' && <GameScreen s={s} dispatch={dispatch} onRules={() => setShowRules(true)} />}
      {s.screen === 'end' && (
        <EndScreen
          s={s}
          onRestart={() => dispatch({ type: 'RESTART' })}
          onSetup={() => dispatch({ type: 'BACK_TO_SETUP' })}
        />
      )}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}