# Proposta — mais jogo, menos leitura (Capítulo 1, Lívia)

> **Status:** aprovada pelo autor por inteiro (as 4 cenas e os extras A a G, sem "game over") e **implementada**. Onde cada coisa entrou:
> - **Verter o óleo:** Vigília (`m_pour`) e Rito (`m_oil`, mais difícil).
> - **Revelar com a chama:**
>   - marca no altar (`m_mark`, guiada);
>   - Domícia (`g01`, tecla F);
>   - Iante (`g03`, tecla F: chave e óbolo);
>   - Varrão (`g04`, tecla F: amuleto);
>   - livro de votos (`m_book`: nome do Théron e registro raspado; demorar demais aumenta a suspeita do Colégio).
> - **Descer no escuro:** galerias (`m_descent`).
> - **Pegar as brasas:** flashback (`m_embers`).
> - **Canto por ritmo:** Rito (`m_chant`).
> - **Objetos no friso:** todos os fragmentos.
> - **Fuga furtiva:** Rito, rumo ao porto (`est`; o lado do poço só existe com a dica da Cláudia).
> - **Tela dos fios:** Tab ou menu.
> - **Pavio:** escolhas com tempo.
> - **Ecos:** a Cláudia perto ou de costas, a chama do altar mais forte ou mais fraca, a Domícia mais perto.

**Pedido do autor:** o jogo está parecendo só storytelling. Ele quer mais interação sem perder a história: cenas na visão da Lívia (primeira pessoa) em que o jogador **faz** a ação em vez de escolher num menu, por exemplo verter o óleo, aproximar a chama do livro, ver as marcas na pedra e descer as escadas até o Asterion.

**Princípio:** cada fragmento passa a ter **pelo menos um momento de mãos no controle** além da caminhada. O texto continua, mas em blocos curtos entre ações. Os resultados das ações viram consequências (flags), sem "game over" e sem medidor moral.

---

## Parte 1 — As cenas pedidas (visão da Lívia)

Todas usam um novo nó **`minigame`** (já previsto no GDD 10.4). A cena ocupa a tela inteira, desenhada em código (canvas), no estilo vaso. Controles: **mouse ou WASD/setas**. Ao terminar, o resultado escolhe o próximo nó e aplica efeitos.

### 1. Verter o óleo *(Vigília e Rito da Noite)*
- **Vista:** close lateral do cálice com a chama e da ânfora de óleo acima.
- **Controle:** inclinar a ânfora (mouse para cima/baixo, W/S ou ↑/↓). Quanto mais inclinada, mais grosso o fio de óleo.
- **Objetivo:** manter a chama "calma" por ~8 s. Pouco óleo e ela se encolhe; óleo demais e ela engasga e explode. O próprio tamanho da chama é o indicador, sem barra na tela.
- **Resultado:** cuidadoso, irregular ou desastrado → muda a chama e as falas seguintes (`ritual_cuidado`). No Rito da Noite o fluxo é mais instável, porque a chama já está vacilando.

### 2. Revelar com a Chama da Verdade *(marca no altar, Iante, livro de votos)*
- **Vista:** a superfície em primeira pessoa (pedra, manto, página queimada), quase no escuro.
- **Controle:** mover o cálice (mouse ou WASD). A chama ilumina um círculo; segurar a luz sobre um ponto escondido por ~1 s faz a marca **acender em ouro**.
- **O preço na tela:** enquanto a dádiva está ativa, rachaduras finas avançam pelas bordas da tela (a fé corroendo). Soltar a chama (clique direito ou Espaço) encerra a cena antes.
- **O que o jogador encontra decide o que acontece.** No livro há duas revelações:
  - o **nome do Théron** → o Colégio passa a procurá-lo;
  - a **letra raspada sobre a menina** → pesa na condenação da Domícia.

  O jogador pode achar uma, as duas ou nenhuma. O Varrão está olhando: quanto mais tempo a chama fica no livro, mais ele suspeita.
- **Altar (fragmento 1):** curto e involuntário. A chama "puxa" sozinha para a marca e o jogador só acompanha. É o tutorial da mecânica.

### 3. Descer no escuro *(galerias, fragmento 4)*
- **Vista:** primeira pessoa na escada estreita; só o círculo de luz do cálice.
- **Controle:** W/↑ desce degrau a degrau, S/↓ recua. A chama treme mais a cada degrau. Paredes riscadas aparecem na luz, com letras antigas.
- **O encontro:** no fim do corredor, **dois olhos** refletem a chama no escuro. Ali o jogador decide **com ações**, não por menu:
  - erguer o cálice: mostra mais (chifres quebrados, correntes) e marca o cruzamento com o Asterion;
  - ficar imóvel: ele chega mais perto;
  - recuar: ele some.

### 4. Pegar as brasas *(flashback, fragmento 2)* — sugestão minha, no mesmo espírito
- **Vista:** as mãos da menina sobre o altar apagado.
- **Controle:** clicar (ou Espaço) nas brasas que ainda brilham, juntando-as no centro. A tela branqueia aos poucos de dor.
- **Resultado:** sempre reacende, porque é um evento fixo. *(Mudado em 08/10, a pedido do autor: **sem tempo** por padrão. A menina precisa juntar **todas** as brasas no centro para a chama renascer, e há um contador. Por isso a variação "salvou parte / poucas" e a fala correspondente da Domícia saíram. O modo com tempo continua disponível com `timed: true`.)*

---

## Parte 2 — Outras ideias para parecer mais jogo

| # | Ideia | Onde entra | Esforço |
|---|---|---|---|
| A | **Objetos para examinar no friso** (E ou clique): lamparinas, a ânfora, o portão, tabuinhas. Pistas opcionais que **destravam falas** (ex.: achar a tabuinha de oração da Cláudia abre uma opção nova com ela). | Todos os fragmentos | médio |
| B | **Dádiva como ação livre:** em certas conversas, a tecla F ergue o cálice a qualquer momento, sem ser opção de menu. O personagem reage, e o preço (fé) é cobrado. | Iante, Varrão, Domícia | médio |
| C | **Fuga noturna furtiva:** sair do Templo à noite andando no friso sem ser vista. As Vestais dormem; o guarda do Colégio tem um cone de visão; andar devagar perto deles. Ser pega não é derrota: muda o que acontece. | Rito da Noite, rumo ao porto | médio |
| D | **Canto do rito por ritmo:** apertar no compasso do pulsar da chama (o mini-jogo de ritmo previsto no GDD 7.2). | Rito da Noite | médio |
| E | **Tempo diegético:** nas escolhas com tempo, a barra vira o pavio queimando ou o fio desfiando. | Global | baixo |
| F | **Tela dos fios (Tab):** ver a qualquer momento os fios atados e cortados até agora. O mapa dos fios do GDD 5.3, em versão leve, para as consequências aparecerem durante o jogo. | Global | médio |
| G | **Ecos visíveis no cenário:** o mundo muda pelo que você fez (o lugar vazio da Domícia, a Cláudia evitando a Lívia, a chama do altar mais fraca). | Global | baixo |

---

## Notas técnicas
- **Nó `minigame`:** `{ "type": "minigame", "game": "pour" | "reveal" | "descent" | "embers", "params": { ... }, "outcomes": [{ "id", "effects", "next" }] }`. Cada jogo vive em `src/systems/minigames/`, com lógica de pontuação testável separada do desenho.
- **Acessibilidade (GDD 5.2):** a opção "escolhas com tempo limite" passa a valer também para os mini-jogos (sem pressa, ou pular com resultado médio).
- **Arte:** tudo desenhado em código no estilo vaso (provisório). Depois posso escrever prompts para close-ups (página do livro, pedra do altar, escada) no modelo do Apêndice A.
