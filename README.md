# Dominó Químico

Jogo educativo de **dominó sobre ligações químicas** criado para apresentação na faculdade.

A ideia original é de **Lipi333** ([repositório original](https://github.com/Lipi333/domino-quimico)) — um protótipo em JavaScript puro. Esta versão é uma **repaginada completa** feita a partir dessa ideia: reescrita em **React + Vite**, com regras de ligação que podem ser **deduzidas** (em vez de decoradas), **3 modos de jogo**, e um **feedback pedagógico** que explica cada erro.

> Versão publicada em: https://NetoSants.github.io/domino-quimico/

---

## Índice

- [Como funciona o jogo](#como-funciona-o-jogo)
- [As 4 regras de ligação (deriváveis)](#as-4-regras-de-ligacao-derivaveis)
- [Eletronegatividade: a pista para deduzir](#eletronegatividade-a-pista-para-deduzir)
- [Modos de jogo](#modos-de-jogo)
- [Pontuação](#pontuacao)
- [Fim da partida](#fim-da-partida)
- [O que foi melhorado em relação ao original](#o-que-foi-melhorado-em-relacao-ao-original)
- [Tecnologias e arquitetura](#tecnologias-e-arquitetura)
- [Como rodar localmente](#como-rodar-localmente)
- [Como publicar (GitHub Pages)](#como-publicar-github-pages)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Testes](#testes)
- [Créditos](#creditos)

---

## Como funciona o jogo

Cada **peça de dominó** tem **duas espécies** — um átomo (metais como Na, não-metais como Cl) ou um íon (cátions como Na⁺, ânions como Cl⁻).

O jogo funciona como um dominó comum:

1. **Dê uma olhada nas pontas da mesa** — cada linha termina numa espécie.
2. **Escolha uma peça destacada em verde** na sua mão (peças que encaixam em alguma ponta).
3. **Clique numa ponta acesa** da mesa onde a peça encaixa.
4. **Declare o tipo de ligação** entre a espécie da ponta e a espécie da peça que a encosta nela (iônica, metálica, covalente polar ou apolar).
5. **Acertou**: a peça entra na mesa, você pontua e pode continuar jogando em **combo** (a próxima peça deve ser ligada à que você acabou de colocar).
6. **Errou**: o cartão de feedback explica **o porquê** (com a eletronegatividade envolvida e a substância que seria formada).

A jogada pode ser feita **clicando** (peça → ponta → tipo de ligação) ou por **arrastar e soltar** a peça numa ponta. Quando só uma metade da peça encaixa, ela é **virada automaticamente**; quando as duas encaixam, você usa o botão "Trocar lado".

### Por que dá para deduzir

As peças mostram, nos átomos neutros, a **eletronegatividade (EN)** de Pauling. Não-metais eletronegativos "puxam" elétrons, metais eletropositivos "doam". Comparar as EN dos extremos não é decorar — é **aplicar química**.

---

## As 4 regras de ligação (deriváveis)

A validade e o tipo de ligação saem de **4 regras simples**, calculados pelo código em tempo real — não existem tabelas de combinações decoradas:

| Espécie A            | Espécie B                 | Tipo de ligação          |
| -------------------- | ------------------------- | ------------------------ |
| metal                | não-metal                 | **Iônica**               |
| cátion               | ânion                     | **Iônica**               |
| metal                | metal                     | **Metálica**             |
| não-metal            | não-metal (espécies iguais) | **Covalente apolar**   |
| não-metal            | não-metal (espécies diferentes) | **Covalente polar** |
| demais pares         | —                         | não ligam (repulsão)     |

**Por que funciona (o raciocínio por trás):**

- **Metal + não-metal → iônica**: o metal doa elétrons (eletropositivo) e o não-metal os recebe (eletronegativo). Há **transferência de elétrons**.
- **Cátion + ânion → iônica**: cargas opostas se atraem por força eletrostática.
- **Metal + metal → metálica**: elétrons livres formam uma nuvem delocalizada compartilhada pelos átomos.
- **Não-metais iguais → apolar**: átomos iguais partilham os elétrons de forma exatamente igual.
- **Não-metais diferentes → polar**: o mais eletronegativo puxa mais o par de elétrons — partilha desigual.
- **Não ligam**: dois cátions (ou dois ânions) se repelem; combinações sem "quem doa e quem recebe" não formam ligação nesse modelo.

Como cada par válido tem **exatamente um** tipo, a declaração nunca é ambígua — o jogador raciocina, e o jogo confirma.

---

## Eletronegatividade: a pista para deduzir

Eletronegatividade de Pauling usada no jogo (exibida nas peças):

| Espécie | EN  | Espécie | EN  |
| ------- | --- | ------- | --- |
| K       | 0.8 | H       | 2.2 |
| Na      | 0.9 | I       | 2.5 |
| Li      | 1.0 | Br      | 2.8 |
|         |     | Cl      | 3.0 |
|         |     | F       | 4.0 |

Nos **cátions e ânions** (Li⁺, Na⁺, K⁺, F⁻, Cl⁻, Br⁻, I⁻) a EN não se aplica — a pista aí é a **carga do íon**.

---

## Modos de jogo

| Modo                  | Jogadores          | Erro de declaração                       | Observações                                  |
| --------------------- | ------------------ | ---------------------------------------- | -------------------------------------------- |
| 🎯 **Treino livre**   | 1                  | Sem penalidade — o jogo explica e você tenta de novo | Estatística de acertos ao vivo; sem cronômetro, ideal para aprender |
| 🤖 **Solo vs Robô**   | 1 humano + 1 IA    | Encerra o seu turno                      | O Robô sempre declara a ligação correta      |
| 🏆 **Partida**        | 2 a 4 (hot-seat)   | Encerra o seu turno                      | Mesmo aparelho, jogadores alternam turnos    |

> Em **Treino livre**, ao perder uma jogada você pode trocar peças **sem punição** e repor a mão. Nos modos competitivos, cada erro encerra o turno — a peça volta para a sua mão.

---

## Pontuação

| Ligação           | Pontos |
| ----------------- | ------ |
| Covalente apolar  | 10     |
| Metálica          | 6      |
| Iônica            | 5      |
| Covalente polar   | 5      |

Ligações apolares valem mais por serem mais fáceis de reconhecer (espécies iguais).

---

## Fim da partida

- O jogador que **esvaziar a mão** vence imediatamente.
- Quando o **saco acaba**, entra a **última rodada**: a partir daí todos jogam uma vez com a mão que têm.
- Se **ninguém conseguir jogar** por 3 rodadas seguidas, ou se todos só trocarem peças por 2 rodadas, a partida termina (pontuação decide).

---

## O que foi melhorado em relação ao original

O protótipo original — single-page em JavaScript puro — já tinha a mecânica base do dominó (peças, mesa, declaração e troca). Esta versão mantém a essência e a reforça para **ensinar química de verdade**:

1. **Regras deriváveis no lugar da tabela decorada.** O original validava cada par por uma `COMBO_TABLE` (lista exaustiva de combinações). Agora a validade e o tipo saem de **4 regras de química** calculadas no código — restaure a lógica que o jogador deve deduzir.

2. **Eletronegatividade visível nas peças.** Antes, decidir a ligação era tentativa e erro; agora cada átomo mostra sua EN, incentivando comparar e deduzir.

3. **Cartão pedagógico a cada jogada.** Acertou ou errou, o jogo mostra: o porquê da ligação, a **ΔEN (diferença de eletronegatividade)** e a **substância formada** (ex.: NaCl, F₂, HBr).

4. **Explicação dos porquês quando NÃO liga.** Pares que não formam ligação recebem justificativa química (ex.: "Dois cátions têm carga positiva igual — eles se repelem").

5. **Três modos de jogo.** Só existia a partida. Foram adicionados **Treino livre** (sem punição + estatísticas de acertos) e **Solo vs Robô** (adversário controlado por IA).

6. **IA simples e honesta.** O Robô escolhe o encaixe de maior pontuação e sempre declara corretamente, servindo de modelo.

7. **Fluxo de jogada bem mais enxuto.** Antes era "peça → ponta → declara → **confirma**". Agora o tipo de ligação **executa na hora** — 3 cliques e ponto final. O flip da peça é automático quando só uma metade encaixa.

8. **Combo com alvo único.** Durante a sequência de jogadas, apenas a última peça colocada é destacada como destino — menos confusão.

9. **Mesa "colapsável".** Linhas longas mostram as bordas e resumem o meio ("⋯ N" peças) em vez de esticar a tela.

10. **Interação por clique ou arrastar-e-soltar** (drag & drop).

11. **Visual renovado.** Tema claro, tipografia Nunito, botões táteis, cores por tipo de ligação, pontas com pulso quando compatíveis, peças jogáveis destacadas em verde.

12. **Arquitetura e qualidade de código.** Reescrita em React 19 + Vite, com o estado do jogo num **reducer puro e testável** (Vitest). Fácil de apresentar na faculdade e de evoluir (novas espécies, novos modos, *leaderboard* etc.).

---

## Tecnologias e arquitetura

| Camada      | Tecnologia                                  |
| ----------- | ------------------------------------------- |
| Interface   | React 19 (JSX, sem TypeScript)              |
| Build       | Vite 8                                      |
| Estado      | Reducer puro (`useReducer`) — todo o jogo é uma função `state → action → state` |
| Regras      | Módulo `rules.js` — matriz derivável + explicações pedagógicas |
| Testes      | Vitest (14 testes: regras, motor e renderização das telas) |
| Estilo      | CSS puro com variáveis de tema (`global.css`) |

### Por que isso importa numa apresentação

- O motor do jogo (`src/game/`) é **independente da interface**: dá para testar e até rodar no terminal.
- As regras químicas ficam isoladas num módulo (facilita explicar o "algoritmo da química").
- Trocar visual ou adicionar modo novo não mexe na lógica do jogo.

---

## Como rodar localmente

Pré-requisito: **Node.js 20+** e **npm**.

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em desenvolvimento (http://localhost:5173)
npm run dev

# 3. Testes
npm test

# 4. Build de produção (gera a pasta dist/)
npm run build

# 5. Pré-visualizar o build de produção
npm run preview
```

---

## Como publicar (GitHub Pages)

O projeto já está configurado com `base: '/domino-quimico/'` no `vite.config.js` (o site é servido em `https://<usuário>.github.io/domino-quimico/`).

Passo a passo:

```bash
# 1. Compila o site em dist/
npm run build

# 2. Cria/publica a branch gh-pages com o conteúdo de dist/ na raiz
git checkout --orphan gh-pages
git add -A
git commit -m "Publicar site"
git push -u origin gh-pages
git checkout main   # volta para a branch de desenvolvimento
```

3. No GitHub: **Settings → Pages → Build and deployment** → `Deploy from a branch` → branch `gh-pages`, pasta `/ (root)` → Save.
4. Acesse `https://<usuário>.github.io/domino-quimico/`.

> Dica: dá para automatizar tudo com um **GitHub Actions** que roda `npm run build` e sobe a `gh-pages` a cada push na `main`.

---

## Estrutura do projeto

```
├── index.html                 # entry do Vite (monta o React, fonte Nunito)
├── vite.config.js             # plugin React + base do GitHub Pages
├── package.json               # scripts: dev, build, preview, test
├── src/
│   ├── main.jsx               # ponto de entrada do React
│   ├── App.jsx                # telas (setup → jogo → fim) + turno da IA
│   ├── game/                  # ← o "motor", independente da interface
│   │   ├── data.js            #   espécies, eletronegatividades, peças, pontuação, modos
│   │   ├── rules.js           #   as 4 regras deriváveis + explicações pedagógicas
│   │   ├── engine.js          #   reducer puro do jogo (todas as ações)
│   │   ├── ai.js              #   escolha de jogada do Robô
│   │   ├── engine.test.js     #   testes do motor
│   │   └── smoke.test.jsx     #   testes de renderização das telas
│   ├── components/
│   │   ├── SetupScreen.jsx    #   escolha de modo e jogadores
│   │   ├── GameScreen.jsx     #   mesa, mão, painel de ligação, feedback
│   │   ├── EndScreen.jsx      #   resultado e ranking
│   │   ├── RulesModal.jsx     #   modal "Como jogar"
│   │   └── bits.jsx           #   peças, células de espécie, junções, chips
│   └── styles/
│       └── global.css         # tema claro, botões táteis, cores por ligação
└── legacy/                    # código ORIGINAL preservado (JS puro) — referência
```

---

## Testes

```bash
npm test
```

São 14 testes cobrindo:

- A **matriz derivável**: metal + não-metal → iônica, cátion + ânion → iônica, metal + metal → metálica, não-metais → covalente (igual/diferente), e **repulsão** para pares inválidos.
- Que **todo par válido tem exatamente um tipo** de ligação (sem ambiguidade).
- O **motor**: criação de partida, cálculo de encaixe/orientação da peça (`fitOf`), jogada correta pontuando e passando o turno.
- **Renderização** das telas de configuração, jogo, fim e modal de regras.

---

## Créditos

- **Ideia e protótipo original**: **Lipi333** — feito para apresentação na faculdade ([repositório original](https://github.com/Lipi333/domino-quimico), código preservado na pasta `legacy/`).
- **Repaginada**: **Neto Santos** (fork `NetoSants/domino-quimico`) — reconstrução em React/Vite, regras deriváveis, modos e feedback pedagógico, com base na ideia original.