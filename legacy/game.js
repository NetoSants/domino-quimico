// ============================================================
//  DOMINÓ QUÍMICO — Lógica e interface
// ============================================================

(function () {
  'use strict';

  // ---------- Estado ----------
  var state = null;

  var MAX_HAND = 5;

  var WIN_KEEP = 5;
  var WIN_SHOW = 8;

  var dragIdx = null;
  var dragJustEnded = false;

  // ---------- Utilitários ----------
  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function defaultName(i) { return 'Jogador ' + (i + 1); }

  // ---------- Regras ----------
  function bondOfOrNull(a, b) { return bondOf(a, b); }

  function openEnds() {
    if (state.comboActive && state.comboTarget) {
      return [{
        line: state.comboTarget.line,
        side: state.comboTarget.side,
        sp: endSpecies(state.comboTarget.line, state.comboTarget.side)
      }];
    }
    var arr = [];
    for (var l = 0; l < state.lines.length; l++) {
      arr.push({ line: l, side: 'left', sp: state.lines[l][0].halfL });
      arr.push({ line: l, side: 'right', sp: state.lines[l][state.lines[l].length - 1].halfR });
    }
    return arr;
  }

  function endSpecies(lineIdx, side) {
    var line = state.lines[lineIdx];
    return side === 'left' ? line[0].halfL : line[line.length - 1].halfR;
  }

  function tileCanConnect(sp, tile) {
    return canBond(sp, tile[0]) || canBond(sp, tile[1]);
  }

  function legalMovesExist() {
    var hand = state.players[state.current].hand;
    var ends = openEnds();
    for (var i = 0; i < hand.length; i++) {
      for (var e = 0; e < ends.length; e++) {
        if (tileCanConnect(ends[e].sp, hand[i])) return true;
      }
    }
    return false;
  }

  // ---------- Preparação ----------
  function initGame(numPlayers, names) {
    state = {
      players: [],
      bag: shuffle(PIECES.slice()),
      lines: [[], []],
      discarded: [],
      current: 0,
      round: 1,
      roundPlays: 0,
      roundTrades: 0,
      zerosStreak: 0,
      playsThisTurn: 0,
      comboActive: false,
      comboTarget: null,
      lastRoundPlayer: null,
      selectedTile: null,
      flipped: false,
      selectedEnd: null,
      declared: null,
      trading: false,
      tradeSel: [],
      message: '',
      log: [],
      modal: null,
      endReason: ''
    };

    for (var i = 0; i < numPlayers; i++) {
      state.players.push({ name: names[i] || defaultName(i), hand: [], score: 0 });
    }

    // Distribui 5 peças para cada jogador
    for (var p = 0; p < numPlayers; p++) {
      for (var h = 0; h < MAX_HAND; h++) state.players[p].hand.push(state.bag.pop());
    }

    // Posição inicial: 2 peças quaisquer, uma abrindo cada linha paralela
    for (var ln = 0; ln < 2; ln++) {
      if (state.bag.length) {
        var t = state.bag.pop();
        var flip = Math.random() < 0.5;
        state.lines[ln] = [{ halfL: flip ? t[1] : t[0], halfR: flip ? t[0] : t[1] }];
      }
    }

    log('Partida iniciada! ' + numPlayers + ' jogadores.');
    log('Peças iniciais na mesa.');

    switchScreen('screen-game');
    startTurn();
    render();
  }

  // ---------- Fluxo de turno ----------
  function startTurn() {
    if (state.lastRoundPlayer !== null && state.lastRoundPlayer === state.current) {
      finishGame('A última rodada terminou!');
      return;
    }
    resetTurnState();
    state.message = '';
  }

  function resetTurnState() {
    state.playsThisTurn = 0;
    state.comboActive = false;
    state.comboTarget = null;
    state.selectedTile = null;
    state.flipped = false;
    state.selectedEnd = null;
    state.declared = null;
    state.trading = false;
    state.tradeSel = [];
  }

  function advanceTurn() {
    refill(state.current);

    if (state.discarded.length) {
      state.bag = state.bag.concat(state.discarded);
      state.discarded = [];
      log('Peças trocadas voltaram ao saco.');
    }

    checkLastRound(state.current);

    var wasLast = state.current === state.players.length - 1;
    var noPlaysThisRound = state.roundPlays === 0;

    state.current = (state.current + 1) % state.players.length;

    if (wasLast) {
      state.round++;
      // Salvaguarda anticongelamento: só termina quando ninguém joga por várias rodadas.
      // Trocas não salvam do término, mas dão tempo para o jogo destravar.
      if (noPlaysThisRound) {
        state.zerosStreak = (state.zerosStreak || 0) + 1;
      } else {
        state.zerosStreak = 0;
      }
      state.tradeOnlyStreak = (state.tradeOnlyStreak || 0) +
        (noPlaysThisRound && state.roundTrades > 0 ? 1 : 0);
      if (state.zerosStreak >= 3) {
        finishGame('Ninguém conseguiu jogar por 3 rodadas.');
        return;
      }
      if (state.tradeOnlyStreak >= 2) {
        finishGame('Pedras na mesa não permitem mais jogadas.');
        return;
      }
      state.roundPlays = 0;
      state.roundTrades = 0;
    }

    startTurn();
  }

  function endTurn() {
    log(state.players[state.current].name + ' encerrou a vez.');
    advanceTurn();
    render();
  }

  function refill(playerIdx) {
    var p = state.players[playerIdx];
    while (p.hand.length < MAX_HAND && state.bag.length) {
      p.hand.push(state.bag.pop());
    }
  }

  function checkLastRound(playerIdx) {
    var p = state.players[playerIdx];
    if (state.bag.length === 0 && p.hand.length < MAX_HAND && state.lastRoundPlayer === null) {
      state.lastRoundPlayer = playerIdx;
      log(p.name + ' não completou a mão: última rodada!');
    }
  }

  // ---------- Ações --------
  function playTile() {
    var tile = state.players[state.current].hand[state.selectedTile];
    var connect = state.flipped ? tile[1] : tile[0];
    var outer = state.flipped ? tile[0] : tile[1];
    var end = state.selectedEnd;

    var endSp = endSpecies(end.line, end.side);

    var real = bondOf(endSp, connect);
    if (!real) {
      failTurn('Jogada inválida: ' + endSp + ' não liga com ' + connect + '.');
      return;
    }
    if (state.declared !== real) {
      failTurn('Jogada inválida: tipo errado. O correto é ' + TYPE_LABEL[real] + '.');
      return;
    }

    // Coloca a peça na mesa (linha e lado escolhidos)
    if (end.side === 'left') {
      state.lines[end.line].unshift({ halfL: outer, halfR: connect });
    } else {
      state.lines[end.line].push({ halfL: connect, halfR: outer });
    }
    state.comboTarget = { line: end.line, side: end.side };

    var hand = state.players[state.current].hand;
    hand.splice(state.selectedTile, 1);

    var pts = SCORES[real];
    state.players[state.current].score += pts;
    state.playsThisTurn++;
    state.roundPlays++;
    state.comboActive = true;

    log(state.players[state.current].name + ' jogou ' + connect + '↔' + endSp +
      ' (' + TYPE_LABEL[real] + ') +' + pts + ' pts.');

    state.selectedTile = null;
    state.flipped = false;
    state.selectedEnd = null;
    state.declared = null;

    state.message = 'Jogada válida! +' + pts + ' pts (' + TYPE_LABEL[real] + '). ' +
      'Continue o combo ou encerre a vez.';

    render();
  }

  function failTurn(msg) {
    state.message = msg;
    log('ERRO: ' + msg, true);
    var name = state.players[state.current].name;
    if (state.playsThisTurn === 0) {
      log(name + ' errou na primeira jogada: peça devolvida à mão e turno encerrado.');
    } else {
      log(name + ' errou no combo: só a última peça retorna e o turno encerra.');
    }
    advanceTurn();
    render();
  }

  function confirmTrade() {
    var sel = state.tradeSel.slice();
    if (sel.length === 0) {
      state.message = 'Selecione pelo menos uma peça para trocar.';
      render();
      return;
    }
    var hand = state.players[state.current].hand;
    var removed = [];
    // Remove em ordem decrescente para não bagunçar os índices
    sel.sort(function (a, b) { return b - a; });
    for (var i = 0; i < sel.length; i++) removed.push(hand.splice(sel[i], 1)[0]);
    state.discarded = state.discarded.concat(removed);

    log(state.players[state.current].name + ' trocou ' + removed.length +
      ' peça(s): ' + removed.map(function (t) { return t.join('—'); }).join(', '));

    state.roundTrades++;

    advanceTurn();
    render();
  }

  // ---------- Fim de jogo ----------
  function finishGame(reason) {
    state.endReason = reason;
    resetTurnState();
    switchScreen('screen-end');
    renderRanking();
    render();
  }

  function renderRanking() {
    var ranked = state.players.slice().sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.hand.length - b.hand.length;
    });
    var medals = ['🥇', '🥈', '🥉'];
    var html = '';
    for (var i = 0; i < ranked.length; i++) {
      var p = ranked[i];
      html += '<div class="rank-row' + (i === 0 ? ' winner' : '') + '">' +
        '<span class="pos">' + (medals[i] || (i + 1) + 'º') + '</span>' +
        '<span class="name">' + esc(p.name) + '</span>' +
        '<span class="pts">' + p.score + ' pts</span>' +
        '<span style="margin-left:12px;color:#aeb8d8;font-size:0.85rem">' + p.hand.length + ' peças</span>' +
        '</div>';
    }
    $('ranking').innerHTML = html;
  }

  // ---------- Log ----------
  function log(msg, isErr) {
    state.log.unshift({ msg: msg, err: !!isErr });
    if (state.log.length > 40) state.log.length = 40;
  }

  // ---------- Navegação de telas ----------
  function switchScreen(id) {
    var scr = ['screen-setup', 'screen-game', 'screen-end'];
    for (var i = 0; i < scr.length; i++) $(scr[i]).classList.toggle('hidden', scr[i] !== id);
  }

  // ---------- Renderização ----------
  function render() {
    if (state.modal === 'consult') renderConsultModal();
    else $('consult-modal').classList.add('hidden');

    if (!state.players) { renderSetup(); return; }

    renderScorebar();
    renderTable();
    renderStatus();
    renderHand();
    renderBondPanel();
    renderLog();
  }

  function renderSetup() {
    // Estado vazio: apenas o setup de novo jogo é exibido (screen determinada por switchScreen)
  }

  function renderScorebar() {
    var html = '';
    for (var i = 0; i < state.players.length; i++) {
      var p = state.players[i];
      html += '<div class="score' + (i === state.current ? ' active' : '') + '">' +
        '<span class="sname">' + esc(p.name) + '</span>' +
        '<span class="spts">' + p.score + ' pts</span>' +
        '<span class="scount">' + p.hand.length + ' peças</span>' +
        '</div>';
    }
    $('scorebar').innerHTML = html;
  }

  function halfEl(sp, hilite, blend) {
    var bg = blend ? blend.bg : colorOf(sp);
    var fg = blend ? blend.fg : textColorOf(sp);
    return '<span class="half ' + (blend ? 'bonded ' : '') + chargeClass(sp) + (hilite ? ' hilite' : '') +
      '" style="background:' + bg + ';color:' + fg + '">' + esc(sp) + '</span>';
  }

  // Junção entre duas peças ligadas: símbolo da substância sobre a cor combinada.
  function bondJunction(a, b) {
    var blend = blendColor(a, b);
    var type = bondOf(a, b);
    var title = esc(TYPE_LABEL[type]) + ' (' + SCORES[type] + ' pts)';
    return '<div class="junction" style="background:' + blend.bg + ';color:' + blend.fg + '" title="' + title + '">' +
      esc(substanceOf(a, b)) + '</div>';
  }

  function renderTable() {
    var html = '';
    if (state.lines[0].length || state.lines[1].length) {
      var ends = openEnds();
      for (var l = 0; l < state.lines.length; l++) {
        html += '<div class="line-row">' +
          '<span class="line-label">Linha ' + (l + 1) + '</span>' +
          '<div class="table-line" data-line="' + l + '">' + renderLine(l, ends) + '</div>' +
          '</div>';
      }
    } else {
      html = '<div class="card" style="color:#9aa5c8">Aguardando peças iniciais...</div>';
    }
    $('table').innerHTML = html;

    bindEndChips();
  }

  function renderLine(lineIdx, ends) {
    var line = state.lines[lineIdx];
    var html = '';
    if (line.length > WIN_SHOW) {
      html += renderWindow(lineIdx, line, ends, 0, WIN_KEEP, true);
      var hidden = line.length - WIN_KEEP * 2;
      html += '<div class="line-gap" title="' + hidden + ' peças ocultas no meio da linha">⋯ ' + hidden + '</div>';
      html += renderWindow(lineIdx, line, ends, line.length - WIN_KEEP, line.length, true);
    } else {
      html += renderWindow(lineIdx, line, ends, 0, line.length, false);
    }
    return html;
  }

  function renderWindow(lineIdx, line, ends, start, endIdx, windowed) {
    var leftOn = false;
    var rightOn = false;
    for (var e = 0; e < ends.length; e++) {
      if (ends[e].line === lineIdx && ends[e].side === 'left') leftOn = true;
      if (ends[e].line === lineIdx && ends[e].side === 'right') rightOn = true;
    }

    var html = '';
    for (var i = start; i < endIdx; i++) {
      var t = line[i];
      var lBonded = i > start ? blendColor(line[i - 1].halfR, t.halfL) : null;
      var rBonded = i < endIdx - 1 ? blendColor(t.halfR, line[i + 1].halfL) : null;

      if (i === 0) {
        html += '<button class="end-chip ' + (leftOn ? 'on' : 'off') + '" id="end-' + lineIdx + '-left" ' +
          'data-line="' + lineIdx + '" data-end="left">' + esc(t.halfL) + ' +</button>';
      } else if (!windowed) {
        html += bondJunction(line[i - 1].halfR, t.halfL);
      }

      html += '<div class="domino tiny">' + halfEl(t.halfL, false, lBonded) + halfEl(t.halfR, false, rBonded) + '</div>';

      if (i === line.length - 1) {
        html += '<button class="end-chip ' + (rightOn ? 'on' : 'off') + '" id="end-' + lineIdx + '-right" ' +
          'data-line="' + lineIdx + '" data-end="right">+ ' + esc(t.halfR) + '</button>';
      }
    }
    return html;
  }

  function bindEndChips() {
    var sides = ['left', 'right'];
    for (var l = 0; l < state.lines.length; l++) {
      for (var s = 0; s < sides.length; s++) {
        var side = sides[s];
        (function (el, li, sd) {
          el.onclick = function () { onEndClick(li, sd); };
          el.ondragover = function (e) {
            if (state.trading) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            el.classList.add('over');
          };
          el.ondragleave = function () { el.classList.remove('over'); };
          el.ondrop = function (e) {
            e.preventDefault();
            el.classList.remove('over');
            onDropEnd(li, sd);
          };
        })($('end-' + l + '-' + side), l, side);
      }
    }
    $('table-area').ondragover = function (e) { e.preventDefault(); };
  }

  function onEndClick(line, side) {
    if (state.trading) return;
    if (state.selectedTile === null) {
      state.message = 'Selecione primeiro uma peça da sua mão (ou arraste-a até a ponta).';
      render();
      return;
    }
    // Durante combo, só a última extremidade conectada é permitida
    if (state.comboActive && state.comboTarget &&
      (state.comboTarget.line !== line || state.comboTarget.side !== side)) {
      state.message = 'No combo você deve ligar à última peça adicionada.';
      render();
      return;
    }
    state.selectedEnd = { line: line, side: side };
    state.declared = null;
    render();
  }

  function onDropEnd(line, side) {
    dragJustEnded = true;
    if (state.trading || dragIdx === null) return;
    if (state.comboActive && state.comboTarget &&
      (state.comboTarget.line !== line || state.comboTarget.side !== side)) {
      state.message = 'No combo você deve ligar à última peça adicionada.';
      render();
      return;
    }
    var tile = state.players[state.current].hand[dragIdx];
    var endSp = endSpecies(line, side);
    var flip = null;
    if (canBond(endSp, tile[0])) flip = false;
    else if (canBond(endSp, tile[1])) flip = true;
    if (flip === null) {
      state.message = 'Jogada inválida: ' + endSp + ' não liga com nenhuma metade dessa peça.';
      render();
      return;
    }
    state.selectedTile = dragIdx;
    state.flipped = flip;
    state.selectedEnd = { line: line, side: side };
    state.declared = null;
    state.message = 'Peça encaixada em ' + endSp + '. Declare o tipo de ligação e confirme.';
    render();
  }

  function renderStatus() {
    $('status-msg').textContent = state.message;
    $('bag-info').textContent = 'Saco: ' + state.bag.length + ' peças | Rodada ' + state.round +
      (state.lastRoundPlayer !== null ? ' | ÚLTIMA RODADA' : '');
  }

  function renderHand() {
    var me = state.players[state.current];
    var html = '';
    for (var i = 0; i < me.hand.length; i++) {
      var tile = me.hand[i];
      var cls = 'hand-tile domino';
      if (state.trading && state.tradeSel.indexOf(i) !== -1) cls += ' trade-sel';
      else if (state.selectedTile === i) cls += ' selected';

      var hL = state.selectedTile === i && !state.flipped ? ' hilite' : '';
      var hR = state.selectedTile === i && state.flipped ? ' hilite' : '';

      html += '<div class="' + cls + '" data-idx="' + i + '" title="' + esc(tile.join(' e ')) + '">' +
        '<span class="half ' + chargeClass(tile[0]) + hL + '" style="background:' + colorOf(tile[0]) + ';color:' + textColorOf(tile[0]) + '">' + esc(tile[0]) + '</span>' +
        '<span class="half ' + chargeClass(tile[1]) + hR + '" style="background:' + colorOf(tile[1]) + ';color:' + textColorOf(tile[1]) + '">' + esc(tile[1]) + '</span>' +
        '</div>';
    }
    $('hand').innerHTML = html;

    var tiles = $('hand').querySelectorAll('.hand-tile');
    for (var t = 0; t < tiles.length; t++) {
      tiles[t].draggable = !state.trading;
      tiles[t].ondragstart = (function (idx) {
        return function (e) {
          dragIdx = idx;
          dragJustEnded = true;
          if (e.dataTransfer) e.dataTransfer.setData('text/plain', String(idx));
        };
      })(parseInt(tiles[t].getAttribute('data-idx'), 10));
      tiles[t].ondragend = function () { dragIdx = null; };
      tiles[t].onclick = (function (idx) { return function () { onTileClick(idx); }; })(parseInt(tiles[t].getAttribute('data-idx'), 10));
    }

    renderActionbar();
  }

  function renderActionbar() {
    var html = '';

    if (!state.trading) {
      if (state.selectedTile !== null) {
        html += '<button id="btn-flip" class="btn ghost">Trocar lado</button>';
      }
      if (state.selectedTile !== null && state.selectedEnd !== null) {
        html += '<button id="btn-confirm" class="btn primary">Confirmar jogada</button>';
      }

      html += '<button id="btn-trade" class="btn ghost">Trocar peças</button>';

      if (state.playsThisTurn > 0) {
        html += '<button id="btn-end" class="btn primary">Encerrar vez</button>';
      } else if (!legalMovesExist()) {
        html += '<div class="nojob-hint">Sem jogadas possíveis: use a <b>troca</b> para comprar novas peças.</div>';
      }
    } else {
      html += '<span style="color:#4dd0e1;font-weight:600">Modo troca: clique nas peças para selecionar.</span>';
      html += '<button id="btn-trade-confirm" class="btn primary">Confirmar troca (' + state.tradeSel.length + ')</button>';
      html += '<button id="btn-trade-cancel" class="btn ghost">Cancelar</button>';
    }

    $('actionbar').innerHTML = html;

    bind('btn-flip', function () { state.flipped = !state.flipped; render(); });
    bind('btn-trade', function () {
      state.trading = true;
      state.selectedTile = null; state.selectedEnd = null; state.declared = null; state.flipped = false;
      state.message = 'Modo troca: selecione as peças que deseja descartar temporariamente.';
      render();
    });
    bind('btn-end', endTurn);
    bind('btn-trade-confirm', confirmTrade);
    bind('btn-trade-cancel', function () { state.trading = false; state.tradeSel = []; render(); });
    bind('btn-confirm', playTile);
  }

  function renderBondPanel() {
    var hasSel = state.selectedTile !== null && state.selectedEnd !== null;
    var html = '<div class="bond-title">Ligação a declarar</div>';

    var preview = 'Selecione uma peça e uma ponta da mesa.';
    if (hasSel) {
      var tile = state.players[state.current].hand[state.selectedTile];
      var connect = state.flipped ? tile[1] : tile[0];
      var endSp = endSpecies(state.selectedEnd.line, state.selectedEnd.side);
      preview = 'Ligação: ' + esc(endSp) + ' ↔ ' + esc(connect);
    }
    html += '<div id="preview">' + preview + '</div>';

    html += '<div id="bond-opts">';
    var types = ['ionic', 'polar', 'apolar', 'metallic'];
    for (var i = 0; i < types.length; i++) {
      var tp = types[i];
      html += '<button class="bond-btn ' + tp + (state.declared === tp ? ' active' : '') + '" data-type="' + tp + '"' +
        (hasSel ? '' : ' disabled') + '>' +
        TYPE_LABEL[tp] + ' (' + SCORES[tp] + ')</button>';
    }
    html += '</div>';

    $('bondpanel').innerHTML = html;

    var bondBtns = $('bondpanel').querySelectorAll('.bond-btn');
    for (var b = 0; b < bondBtns.length; b++) {
      bondBtns[b].onclick = (function (el) {
        return function () {
          if (state.declared === el.getAttribute('data-type')) state.declared = null;
          else state.declared = el.getAttribute('data-type');
          render();
        };
      })(bondBtns[b]);
    }
  }

  function bind(id, fn) {
    var el = $(id);
    if (el) el.onclick = fn;
  }

  function onTileClick(idx) {
    if (dragJustEnded) {
      dragJustEnded = false;
      return;
    }
    if (state.trading) {
      var pos = state.tradeSel.indexOf(idx);
      if (pos === -1) state.tradeSel.push(idx);
      else state.tradeSel.splice(pos, 1);
      render();
      return;
    }
    if (state.selectedTile === idx) {
      state.selectedTile = null; state.selectedEnd = null; state.declared = null; state.flipped = false;
    } else {
      state.selectedTile = idx;
      state.flipped = false;
      state.selectedEnd = null;
      state.declared = null;
    }
    render();
  }

  function renderLog() {
    var html = '';
    for (var i = 0; i < state.log.length; i++) {
      html += '<div class="log-line' + (state.log[i].err ? ' err' : '') + '">' + esc(state.log[i].msg) + '</div>';
    }
    $('log').innerHTML = html;
  }

  // ---------- Tabela de consulta ----------
  function renderConsultModal() {
    var html = '<table class="consult-table"><tr><th>Espécie</th><th>Pode ligar com (tipo / pontos)</th></tr>';
    for (var i = 0; i < SPECIES_ORDER.length; i++) {
      var sp = SPECIES_ORDER[i];
      var partners = COMBO_TABLE[sp].slice().sort();
      var chips = '';
      for (var j = 0; j < partners.length; j++) {
        var tp = bondOf(sp, partners[j]);
        if (!tp) continue;
        chips += '<span class="chip ' + tp + '" style="background:' + colorOf(partners[j]) + ';color:' + textColorOf(partners[j]) + ';border-left:5px solid ' + TYPE_COLOR[tp] + '">' +
          esc(partners[j]) + ' · ' + TYPE_LABEL[tp] + ' (' + SCORES[tp] + ')</span>';
      }
      html += '<tr><td class="group"><span class="chip" style="background:' + colorOf(sp) + ';color:' + textColorOf(sp) + '">' + esc(sp) + '</span></td>' +
        '<td>' + chips + '</td></tr>';
    }
    html += '</table>';
    $('consult-body').innerHTML = html;
  }

  // ---------- Setup ----------
  function renderSetupScreen() {
    var html = '';
    for (var p = 0; p < setupCount; p++) {
      html += '<input id="name-' + p + '" placeholder="' + defaultName(p) + '" maxlength="16" value="' + esc(defaultName(p)) + '">';
    }
    $('name-inputs').innerHTML = html;
    var btns = $('count-row').querySelectorAll('.count-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', parseInt(btns[i].getAttribute('data-count'), 10) === setupCount);
      btns[i].onclick = (function (el) {
        return function () {
          setupCount = parseInt(el.getAttribute('data-count'), 10);
          renderSetupScreen();
        };
      })(btns[i]);
    }
  }

  var setupCount = 2;

  // ---------- Inicialização ----------
  function boot() {
    state = { players: null };

    renderSetupScreen();

    $('btn-start').onclick = function () {
      var names = [];
      for (var i = 0; i < setupCount; i++) {
        var inp = $('name-' + i);
        names.push(inp ? inp.value.trim() || defaultName(i) : defaultName(i));
      }
      initGame(setupCount, names);
    };

    $('btn-consult').onclick = function () {
      state.modal = 'consult';
      renderConsultModal();
      $('consult-modal').classList.remove('hidden');
    };
    $('btn-close-consult').onclick = function () { state.modal = null; $('consult-modal').classList.add('hidden'); };

    $('btn-rules').onclick = function () { $('rules-modal').classList.remove('hidden'); };
    $('btn-close-rules').onclick = function () { $('rules-modal').classList.add('hidden'); };
    $('rules-modal').onclick = function (e) {
      if (e.target === $('rules-modal')) $('rules-modal').classList.add('hidden');
    };

    $('btn-restart').onclick = function () {
      state = { players: null, modal: null };
      $('consult-modal').classList.add('hidden');
      $('rules-modal').classList.add('hidden');
      switchScreen('screen-setup');
      renderSetupScreen();
    };

    // Fecha modal de consulta ao clicar fora
    $('consult-modal').onclick = function (e) {
      if (e.target === $('consult-modal')) { state.modal = null; $('consult-modal').classList.add('hidden'); }
    };
  }

  boot();
})();