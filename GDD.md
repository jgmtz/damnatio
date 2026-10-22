# GDD — Damnatio: Todo Fio Tem um Preço

> **[Decidido em 08/10]** Título: **Damnatio: Every Thread Has a Price** (inglês, idioma padrão) / **Damnatio: Todo Fio Tem um Preço** (português). O título anterior, *O Fio que Ninguém Corta*, era provisório.
>
> **[Decidido em 08/10] Idiomas:** o jogo abre em **inglês**, com todas as falas, textos e interações traduzidos; o **português** é escolhido nas Opções (ou no seletor de idioma da tela de título). Cada texto existe nos dois idiomas, e os testes acusam tradução faltando.

**Versão:** 0.4 — rascunho de concepção (inclui poses e retratos aprovados da Lívia e instruções para o assistente de programação)
**Gênero:** aventura narrativa de escolhas, com múltiplos protagonistas jogáveis
**Plataforma-alvo:** navegador (HTML/JavaScript), publicação no itch.io
**Status:** fases 0, 1 e 1b validadas pelo autor. Fase 2 (recorte vertical da Lívia, 4 fragmentos) implementada e, a pedido do autor, ampliada com interatividade antecipada da fase 3 (cenas em primeira pessoa, objetos, furtividade, tela dos fios). Aguardando validação.

> **Como ler este documento:** itens marcados como **[Decidido]** foram definidos pelo autor. Itens marcados como **[Proposta]** são sugestões ainda não validadas em jogo. A seção 12 lista as decisões em aberto.

---

## 1. Visão geral

Um jogo narrativo indie no estilo de *Detroit: Become Human* e *Life is Strange*, ambientado numa fantasia sombria que reinterpreta a mitologia greco-romana. O jogador alterna entre **três protagonistas** de personalidades e histórias opostas, e cada escolha, por menor que seja, altera relações, destinos de personagens e o rumo da história.

**Pitch:** *Em um império que reescreveu seus próprios mitos, uma sacerdotisa, um monstro e um herói esquecido carregam fragmentos do poder de uma deusa aprisionada, e cada escolha corta, ata ou emaranha os fios do destino.*

**Referências:** *Detroit: Become Human*, *Life is Strange*, *Hades* (estética de vaso), *Apotheon*, *Disco Elysium* (tom e cinza moral), *Darkest Dungeon* e *Limbo* (gravura e sombra). Estrutura de séries ao estilo dos livros de Rick Riordan (novos protagonistas a cada saga, misturando-se aos antigos).

## 2. Pilares de design **[Decidido]**

1. **Violência sugerida.** Horror e morte aparecem de forma implícita, como numa pintura de vaso: silhuetas, sombras, o corte de um fio. A crueza fica na implicação, não na imagem.
2. **Ninguém é puro.** Não existe "guerra do bem contra o mal". Cada personagem e facção tem propósitos, crenças e vontades defensáveis, e todos têm um lado sombrio.
3. **Sem medidor moral.** Nenhuma barra de "bom" e "mau" e nenhuma escolha sinalizada como certa. O Destino mede *para onde a história vai*, não se o jogador "acertou".
4. **Consequências com peso real.** Personagens importantes podem morrer por decisões do jogador, e uma morte nem sempre é uma escolha moralmente errada. Ela afeta a história e o desenvolvimento dos personagens.
5. **Justiça nas consequências.** Toda consequência grande deve ser antecipada por sinais (falas, objetos, fios) para que, ao olhar para trás, faça sentido. Evitar punições aleatórias.
6. **Contar vivendo, não só lendo.** A história não deve ser entregue apenas por texto. Flashbacks jogáveis, exploração e ação mostram causa e consequência na prática.
7. **Fluidez.** Nenhum trecho longo sem interação (meta: no máximo ~2 min seguidos de texto sem input).

## 3. Mundo e premissa

### 3.1 O Império de Aurélia **[Decidido]**
Uma Roma fictícia que absorveu a Grécia. Os panteões foram fundidos oficialmente (Héstia virou Vesta, por exemplo), mas nas **Províncias Helênicas** os cultos antigos sobrevivem "tolerados". A capital é **Aurélia**, sede do Templo da Chama. O **Labirinto** nasce em Creta, mas se estende por baixo de todo o império. O império é fictício para evitar amarras de precisão histórica.

### 3.2 A verdade oculta **[Decidido]** — *segredo da história; não revelar na demo*
Há séculos, numa guerra entre deuses e heróis (a **Guerra Esquecida**), os heróis descobriram que os fios dos próprios deuses podiam ser cortados. Para sobreviver, os deuses **prenderam Átropos**, a Moira da tesoura, no labirinto de Dédalo. Roma nasceu dessa vitória e **reescreveu os mitos**: os heróis foram apagados, Átropos foi esquecida e o labirinto virou "a prisão de um monstro". A chama de Vesta alimenta o selo, e as Vestais o mantêm sem saber para quê.

**Conflito central de longo prazo:** manter o selo (a ordem continua, apoiada numa mentira) ou libertar Átropos (o destino fica livre, mas os deuses e o império podem cair). Tema: *quem escreve a história* e *o que pagamos pelo poder*.

### 3.3 Consequência do selo **[Decidido]**
Com Átropos presa, nada corta os fios naturalmente, então **só os deuses decidem quem morre e quando**. Com o selo falhando, o mundo apodrece: gente que devia ter morrido continua andando, mortos não conseguem partir, fios se embaralham e fazem pessoas repetirem os mesmos dias e erros.

### 3.4 Como os deuses aparecem **[Decidido]**

| Forma | O que é | Frequência |
|---|---|---|
| **Arautos** | Mensageiros divinos que transmitem ordens e vigiam | Frequentes |
| **Avatares** | Mortais temporariamente tomados por um deus (oráculos, sacerdotes, imperadores em transe) | Pontos fortes de cada ato |
| **Deuses de verdade** | Presença plena, rara e custosa | Só em momentos-chave |

**[Proposta]** Visualmente, todo o jogo ocorre dentro de painéis de cerâmica, e os deuses de verdade **quebram a moldura do vaso** e invadem a tela.

### 3.5 Facções **[Decidido]**
1. **A Ordem da Chama:** as Vestais, que acreditam sinceramente no selo.
2. **O Colégio Augural:** a burocracia religiosa do império. Sabe parte da verdade e quer manter a ordem a qualquer custo (soltar Átropos cortaria milhões de fios de uma vez, então não é um vilão simples).
3. **Os Apagados:** heróis esquecidos e seus herdeiros, que querem libertar Átropos, nem todos por bons motivos.
4. **As Irmãs (Cloto e Láquesis):** as outras Moiras, de lados ambíguos. Uma quer a irmã de volta, a outra teme o que ela fará.

**Na demo** aparecem apenas a Ordem da Chama e o Colégio Augural. Os Apagados são rumor e as Irmãs são mistério.

## 4. Protagonistas **[Decidido]**

Cada protagonista usa um estilo de cerâmica diferente, uma linguagem de jogo diferente e uma dádiva com preço próprio.

### 4.1 Asterion, o Minotauro
- **Quem é:** o "monstro do labirinto", filho de uma maldição que não pediu (na verdade, um efeito colateral do selo). Aprisionado desde o nascimento, aprendeu a ler sozinho nas paredes. Inteligente e gentil por dentro, mas desconfiado, porque todos que o viram quiseram matá-lo.
- **Mentalidade:** instinto, lealdade e desconfiança. Fala pouco e sente muito.
- **Lado sombrio:** violento e vingativo quando tem medo.
- **Visual:** enorme, chifres quebrados, cicatrizes de correntes. Estilo **figuras negras** (silhuetas pesadas, incisões em dourado).
- **Dádiva:** **Instinto do Labirinto**. Ele "fareja" os fios como caminhos e perigos. **Preço:** cada uso desperta a fera, e a ação passa a exigir mais controle (o jogador luta contra o próprio personagem).
- **Foco de jogo:** ação e exploração sensorial, com pouquíssimo texto e muita atmosfera.
- **Secundário próximo:** **Mirto**, garoto que entrega comida no labirinto e é o único humano que não o trata como monstro.
- **O labirinto como estrutura viva:** não é uma masmorra isolada; suas passagens surgem sob templos, cidades e campos, o que mantém o Asterion conectado ao resto do mundo.

### 4.2 Lívia, a Vestal
- **Quem é:** sacerdotisa de Vesta, treinada desde criança para manter a chama sagrada. Disciplinada, devota, convencida de que servir aos deuses dá sentido ao mundo. Arco: **perda da fé**.
- **Mentalidade:** ordem, ritual e dever, que aos poucos viram dúvida e rebeldia.
- **Lado sombrio:** capaz de sacrificar inocentes pela chama.
- **Visual:** jovem, de branco e véu, com marcas de queimadura nas mãos. Estilo **figuras vermelhas** (traço fino e expressivo).
- **Dádiva:** **Chama da Verdade**. Revela o que está escondido (mentiras, selos, memórias em objetos). **Preço:** cada verdade queimada corrói a fé e a inocência dela, e o jogador perde opções "reconfortantes" nos diálogos.
- **Foco de jogo:** exploração, investigação e diálogo, com mini-jogo de ritmo e cuidado no ritual.
- **Secundária próxima:** **Domícia**, a Vestal Máxima que a criou e a quem Lívia deve tudo. Sabe mais do que diz.

### 4.3 Théron, o Herói Esquecido
- **Quem é:** veterano da guerra original, punido por desafiar os deuses: seu fio foi cortado e **ninguém o lembra**. Nenhum registro leva seu nome. Vive à margem como mercenário e golpista, cínico e charmoso.
- **Mentalidade:** pragmatismo, ironia e solidão. Não acredita em destino, e talvez por isso seja o único capaz de mexer nele.
- **Lado sombrio:** manipula e mente por conveniência.
- **Visual:** magro, armadura antiga remendada, olhar cansado, venda no olho. Estilo **fundo branco** (vasos funerários), traço fantasmagórico e quase sem cor.
- **Dádiva:** **Fio Cortado**. Permite atar, soltar ou cortar fios de outras pessoas e mudar o rumo delas. **Preço:** quanto mais usa, mais as pessoas esquecem que ele esteve ali, e ele perde aliados e confiança.
- **Foco de jogo:** diálogo, persuasão, blefe e investigação.
- **Secundária próxima:** **Nerea** *(nome provisório)*, a única pessoa que ainda se lembra dele, sem que ele saiba por quê. Mistério ligado à premissa.

### 4.4 Contraste

| | Asterion | Lívia | Théron |
|---|---|---|---|
| Natureza | Criatura | Mortal devota | Mortal apagado |
| Mentalidade | Instinto | Fé → dúvida | Cinismo |
| Cerâmica | Figuras negras | Figuras vermelhas | Fundo branco |
| Foco de jogo | Ação | Exploração e ritual | Diálogo e blefe |
| Preço da dádiva | Perde o controle | Perde a fé | Perde a presença |

**Origem das dádivas — segredo:** as três são fragmentos do poder de Átropos que vazam pelo selo. É por isso que cobram um preço.

## 5. Sistemas de jogo

### 5.1 Estrutura em fragmentos **[Decidido]**
Cada capítulo é dividido em fragmentos curtos centrados em um protagonista. Ao terminar um, a história passa para outro, e as ações de um afetam as cenas dos demais.

### 5.2 Tipos de gameplay dentro dos fragmentos **[Decidido]**
- **Exploração:** cenas 2D em friso lateral (ver seção 8.4), com objetos e pistas para interagir.
- **Diálogo:** escolhas, algumas com tempo limitado.
- **Ação:** sequências curtas sob pressão (timing, reflexo, sequência de comandos). Combate complexo é evitado de propósito.
- **Flashback jogável:** cena jogada, não lida, que mostra quem o personagem é (ver seção 7).

**[Proposta]** Oferecer opção de reduzir ou desligar a pressão de tempo (acessibilidade).

**[Decidido pelo autor na fase 2]** O jogo não pode parecer só storytelling. Cada fragmento tem momentos de **mãos no controle** além da caminhada:
- **Cenas na visão da Lívia (primeira pessoa):** verter o óleo, revelar com a Chama da Verdade, pegar as brasas, cantar no ritmo da chama, descer no escuro até o Asterion.
- **Objetos para examinar no friso**, com pistas que destravam falas.
- **Furtividade leve** na fuga noturna.
- **A dádiva como ação livre** (tecla F) em certas conversas.

Os mini-jogos **nunca travam o jogo**: o desempenho só muda as consequências. A opção de acessibilidade (sem pressão de tempo) também vale para eles. Detalhes em `docs/design/proposta-interatividade.md`.

### 5.3 Os Fios do Destino **[Decidido]**
*(Implementado:*
- *fios animados nas escolhas marcadas e nas consequências;*
- *a **tela dos fios** (Tab), que mostra **só o caminho que o jogador seguiu**, sem as alternativas;*
- *o **mapa dos fios** ao fim de **cada fragmento** (decidido em 08/10), um fluxograma no estilo de Detroit desenhado com o próprio fio (um **cordão trançado**, não uma linha):*
  - *a história corre **na horizontal**, da esquerda para a direita; o mapa abre inteiro na tela e funciona como um mapa (arrastar, zoom com a roda, duplo clique ou botões);*
  - *o fio dourado da partida atual se desenha ao abrir a tela;*
  - *os caminhos de outras partidas aparecem apagados, e os nunca percorridos aparecem tracejados e com "?";*
  - *as escolhas marcadas levam o símbolo do seu fio no mapa: ∞ (atado), corte ou emaranhado; consequências como a condenação aparecem sobre o fio;*
  - *os caminhos descobertos **se acumulam entre partidas**, com a porcentagem descoberta;*
  - *viram nós as escolhas, os resultados dos mini-jogos, as saídas das explorações e o momento da dádiva (ergueu o cálice / deixou passar);*
  - *no fim do capítulo, dá para rever o mapa de cada fragmento.)*

 Mecânica de assinatura. Escolhas importantes aparecem como **fios de tinta** que se atam, se cortam ou se emaranham na tela, e o jogador vê o que está construindo ou destruindo. **A morte de um personagem é mostrada como o corte do seu fio.** Ao fim de cada capítulo, um **mapa dos fios** mostra o que aconteceu e o que *poderia* ter acontecido, sem rótulo de certo ou errado (inspirado no fluxograma de *Detroit*).

### 5.4 Sistema de consequências em três camadas **[Decidido]**
1. **Curto prazo:** flags que alteram as cenas seguintes (um NPC ajudou ou traiu, uma porta ficou aberta ou trancada).
2. **Relações:** laços entre os protagonistas e com secundários. Uma escolha de um pode prejudicar, salvar ou matar o círculo de outro.
3. **Destino:** variável de longo prazo que acumula as decisões e indica para qual desfecho a história caminha. **Não mede moralidade.**

### 5.5 Regras de morte **[Decidido]**
- **Na demo (Capítulo 1):** somente personagens secundários morrem, inclusive os mais próximos dos protagonistas.
- **Ao longo da série:** personagens importantes podem morrer por decisões do jogador, e a história continua sem eles.
- Se todos os protagonistas de uma temporada morrerem, isso é **um final**, não "game over".

### 5.6 Cruzamentos entre protagonistas **[Decidido]**
Três níveis: (1) o **evento comum** da premissa; (2) **ecos indiretos**, em que uma ação de um muda a cena do outro; (3) **encontros diretos**, poucos e bem escritos (por volta de 3 a 5 pontos por capítulo na versão completa). Evitar ramificações cruzadas em excesso, por escopo.

### 5.7 Construção das decisões **[Decidido; implementado em 2026-10-17, aguardando o teste do autor]**
O autor validou as opções A a E de `docs/design/proposta-decisoes.md`. Mortes de secundários continuam possíveis no Capítulo 1. O que foi feito, fragmento por fragmento, está na seção 9 daquele documento.
- **Nenhuma consequência grave nasce de uma fala só.** Toda consequência grave tem três passos: semente, aviso (com chance de agir) e consequência.
- **Um contador por protagonista, só com sinais:** a fera do Asterion, o selo da Lívia e o Laço do Théron.
- **Desfechos graduais:** a morte é o último degrau.
- **Ecos compartilhados entre os protagonistas.**
- **Meta de imersão:** o jogador tem as mesmas dúvidas que o personagem. O jogo pode crescer para isso. As táticas estão em `docs/design/proposta-decisoes.md`, seção 7.
- **Avaliação (2026-10-17):** `docs/design/avaliacao-escolhas.md` avalia o capítulo por uma régua de 12 critérios: nota 63/100, contra 69–83 das referências. Já aplicado:
  - os 14 erros encontrados jogando;
  - custo para o caminho gentil do Théron;
  - as causas da prisão da Nerea lidas em cena;
  - o resumo "O que ficou" no fim do capítulo.
- **Dádiva com motivo** (pedido do autor): erguer o cálice, ou olhar os fios, nunca é curiosidade. A cena planta uma dúvida, o botão diz o que a dádiva responderia, e o que ela revela abre uma opção na decisão seguinte.

## 6. Estrutura em temporadas **[Decidido]**

- **Temporada 1:** os três protagonistas e a premissa deste documento.
- **Temporadas seguintes:** novos protagonistas com ponto de vista próprio, que se misturam aos antigos (ao estilo de Rick Riordan) e herdam o mundo moldurado pelas escolhas do jogador.
- **Requisitos técnicos decorrentes:** conteúdo orientado a dados, estado de mundo persistente e save exportável/importável entre temporadas (ver seção 10).
- **Pergunta futura:** se protagonistas puderem morrer na T1 completa, como a T2 trata a ausência ou o legado deles?

## 7. Capítulo 1 — "A Chama Vacila" *(demo)*

### 7.1 Objetivos
- **Duração alvo:** 1h a 1h30.
- **Função:** **apresentação**. O jogador deve se apegar a cada protagonista e querer jogar o Capítulo 2.
- **Regra de ouro:** **nenhum evento que altere a trama global.** As consequências são pessoais e persistentes: relações, vida e morte de secundários, uso e preço das dádivas, qual par de protagonistas se cruzou.
- **Fluidez:** cada fragmento tem três tempos (gancho, gameplay, decisão), alternando tipos de jogo.

### 7.2 Fragmentos **[Proposta]** — 4 por protagonista (12 no total, ~6 a 7 min cada)

| | **Lívia** | **Asterion** | **Théron** |
|---|---|---|---|
| **1. Apresentação** | *A Vigília:* um dia no Templo, com o ritual da chama como mini-jogo de ritmo e cuidado. Conhecemos Domícia e as outras Vestais. | *O Ouvido do Labirinto:* exploração às cegas guiada pelo som. Primeiro contato com Mirto. | *Dia de Feira:* um golpe leve no porto, com lábia e blefe. Nerea o reconhece. |
| **2. Flashback / Preço** | *O Dia da Chama* **(flashback jogável):** Lívia criança deixa o posto, a chama falha por um instante e Domícia assume a culpa. Tutorial de consequência. | *O Escriba* **(flashback):** ele "ouve" memórias nas paredes e revive o velho que o ensinou a ler. Escolha: proteger o livro ou obedecer. | *O Esquecimento* (sem flashback): usa o Fio Cortado numa negociação e vê o contratante esquecê-lo ali, na hora. Mostra o preço. |
| **3. Conflito pessoal** | *A Peregrina:* uma mulher pede ajuda ao Templo e testa dever contra compaixão. | *A Ronda:* um guarda novato entra no labirinto. O jogador esconde, ajuda ou ataca. | *O Contrato:* um patrício oferece um trabalho que exige trair alguém. |
| **4. Desfecho e cruzamento** | *O Rito da Noite:* o ritual maior. Conforme as escolhas, ela cruza com Théron ou Asterion. | *O Portão:* a decisão final sobre Mirto, e talvez o encontro com Lívia ou Théron. | *A Entrega:* cumpre o contrato ou trai, e esbarra em Lívia ou Asterion. |

Os flashbacks devem ser **pessoais** (mostram quem o personagem é) e **não** podem revelar a Guerra Esquecida ou Átropos.

**Fragmentos do Asterion: roteiro aprovado em parte** em `docs/roteiros/roteiro-asterion.md`. Decisões do autor: a "fera" tranca opções gentis (o preço); o Portão leva a uma área mais funda do labirinto (ideia de um Capítulo 3 dentro do labirinto); o Mirto é filho do chaveiro Nísio; as batidas sob o altar são do Asterion; ordem intercalada assim que ele estiver pronto. Apagamento do Théron aprovado: "o mundo não segura o nome dele" (a cera derrete na tabuinha do Varrão, a pedra cicatriza no flashback do Asterion). Quem encontra quem: a Lívia só encontra o Asterion se ele se abrigou perto do calor e a fera está baixa; senão ela encontra a câmara dos três portais (um de cada protagonista). Também aprovados: o fragmento final do Asterion com a Lívia (inclusive a Lívia presa pelo Colégio) e a mecânica "Duas vozes". Os 4 fragmentos do Asterion estão implementados (com arte provisória), e o capítulo intercala Lívia e Asterion. Prompts de arte em `docs/historico/prompts-asterion.md`.

**Fragmentos da Lívia: roteiro aprovado e implementado** em `docs/roteiros/roteiro-livia.md`. Decisões do autor: a Domícia pode ser condenada (e morrer) no fragmento 4; a Peregrina, Iante, é sacerdotisa de Héstia; o nome do Théron aparece no livro de votos queimado do Templo. Secundários novos, com nomes provisórios: **Cláudia** (noviça), **Pórcio Varrão** (áugure do Colégio), **Iante** (a Peregrina) e **Díon** (filho dela).

**Fragmentos do Théron: roteiro aprovado e implementado** em `docs/roteiros/roteiro-theron.md` (com arte provisória; pedidos em `pedidos-de-arte/entregues/8-theron.md`). Os títulos são *Dia de Feira*, *O Esquecimento*, *O Contrato* e *A Entrega*. O capítulo agora intercala os três protagonistas (7.3).
- **Decisões do autor:**
  - a **Nerea** é remendadeira de redes;
  - a traição do contrato mira a **Iante** e a chave de Héstia;
  - os secundários das cenas dele são redesenhados em fundo branco;
  - o patrício **Caio Licínio** não tem fios próprios (sinal divino, sem explicação);
  - os mini-jogos **Fio Cortado** (`threads`) e **copos** (`shells`) foram aprovados;
  - a Nerea pode morrer no T4.
- **Preço:** a presença do Théron (figura e nome esmaecendo) e opções que exigem ser lembrado.
- **Secundários novos:** Nerea, Caio Licínio, Bíbulo, a mulher do mercador e o escriba do Colégio.

### 7.3 Ordem de jogo (intercalada, como em *Detroit*)
Prólogo → Lívia 1 → Asterion 1 → Théron 1 → Lívia 2 → Asterion 2 → Théron 2 → Lívia 3 → Asterion 3 → Théron 3 → Lívia 4 → Asterion 4 → Théron 4 → gancho final → mapa dos fios.

**[Implementado em 2026-10-17]** O prólogo (*O Fuso*: o vaso do império e os três fios) e o gancho final (*A Chama Vacila*) são fragmentos de interlúdio (`interlude: true`): sem mapa dos fios depois deles. Roteiro e decisões em `docs/roteiros/roteiro-fase6.md`.

A primeira rodada serve para conhecer os três antes de aprofundar qualquer um. **Lívia abre o jogo [Decidido]**: ela acredita na versão oficial, então o jogador aprende o mundo pelos olhos dela.

### 7.4 Cruzamentos **[Decidido; os três pares implementados em 2026-10-17]**
Lívia ↔ Théron (*Fogo de templo*, no fim da L4) e Asterion ↔ Théron (*O homem que não faz som*, no T4) foram escritos e aprovados em `docs/roteiros/roteiro-fase6.md`. Lívia ↔ Asterion já existia (descida da L4 + A4).

- **Nunca os três juntos** no Capítulo 1. Apenas **dois** se encontram, conforme as escolhas dos fragmentos 3 e 4. O terceiro só vê ecos. Isso dá motivo para o Capítulo 2 reuni-los.
- **Pares possíveis:** Lívia ↔ Théron (ela sai do Templo para ajudar a peregrina e esbarra nele no porto); Lívia ↔ Asterion (ela segue um ruído sob o Templo e desce às galerias); Asterion ↔ Théron (a entrega passa pelas galerias, e o Asterion o ouve).
- **Ecos indiretos (exemplos):** o Théron corta o fio do chaveiro e o portão do labirinto fica aberto para o Mirto; a Chama da Verdade revela o nome do Théron num registro queimado e o Colégio passa a procurá-lo, colocando Nerea em risco.

### 7.5 Secundários e destinos
- **Mirto** pode morrer na fuga se o Asterion se esconder ou perder o controle. Se sobrevive, é a prova de que o Asterion pode confiar em alguém.
- **Domícia** pode ser condenada pelo Colégio. Se sobrevive, guarda um segredo que revela depois.
- **Nerea** pode morrer se o Colégio a alcançar. Se sobrevive, é a chave para descobrir por que ainda lembra do Théron.
- Nenhuma morte é "castigo". Cada uma reflete uma troca real: proteger uma pessoa pode custar outra.

### 7.6 Encerramento
Gancho **fixo, igual para todos**: a chama de Vesta oscila e os fios se emaranham por um instante, sem alterar a trama, e abre o Capítulo 2. Em seguida, o **mapa dos fios** mostra as decisões do jogador e as que ele não tomou. O estado pessoal de cada protagonista é salvo e levado adiante.

### 7.7 Tempo estimado

| Parte | Tempo |
|---|---|
| Prólogo (fios, mundo, tutorial) | ~4 min |
| 12 fragmentos × ~6,5 min | ~78 min |
| Gancho final + mapa dos fios | ~6 min |
| **Total** | **~1h30** |

O tempo real vai variar entre jogadores e só playtests de verdade confirmarão a estimativa.

## 8. Direção de arte

### 8.1 Estilo **[Decidido]**
Mistura de **cerâmica grega** (composição e paleta de vaso) com **gravura/tinta** (texturas ásperas, sombras fortes, alto contraste).

### 8.2 Regras visuais **[Proposta]**
- **Paleta base:** terracota, preto e dourado. Cada protagonista tem uma variação (figuras negras, figuras vermelhas, fundo branco).
- **Moldura de vaso:** as cenas são "painéis" de cerâmica. Deuses de verdade quebram a moldura.
- **Fios:** linhas de tinta animadas, com tensão e emaranhamento visíveis. A morte é um corte de fio.
- **Violência:** sempre sugerida (silhueta, sombra, corte do fio).
- **Olhos [Decidido]:** na cor da pele, com contorno fino em amêndoa e íris preta, **sem o branco do olho** (esclera), como na pintura de vaso de figuras vermelhas. A emoção vem de olhar mais aberto, sobrancelha e boca. Exceção possível: o Théron, cujo estilo de fundo branco terá regras próprias, a definir.
- **Flashbacks:** tratamento visual próprio para o jogador perceber a mudança. *(Implementado em 08/10: lembrança desbotada, em sépia com névoa e bordas escurecidas. A inversão de tinta, usada com as silhuetas provisórias, deixava a arte final verde-oliva.)*
- **Silhuetas primeiro:** priorizar leitura em silhueta e composição, viáveis para um desenvolvedor solo.
- **[Implementado, acabamento visual]** Luz em código: penumbra com poças de luz em volta das lamparinas e dos cálices, poeira na luz, colunas em primeiro plano com paralaxe, sombras sob os personagens, transição de cena com fio dourado e tela de título sobre o templo à noite. Tipografia: Cinzel (inscrições) e Cormorant Garamond (texto). A lista de artes a gerar está em `docs/historico/prompts-arte.md`.

### 8.3 Produção de assets **[Proposta adotada por padrão]**
- **Personagens e cenários:** imagens raster (PNG/WebP) geradas pelo autor em ferramenta de IA de imagem, com prompts em inglês no estilo figuras vermelhas. **Arte-base da Lívia aprovada:** perfil, terracota sobre preto, hachura de gravura, marcas de queimadura nas mãos e tigela dourada.
- **Recortes:** cada personagem é separado em partes (cabeça, tronco, braços, saia, véu, pernas) com fundo transparente, feito em editor gratuito (Krita, GIMP, Photopea).
- **Animação por código:** o motor monta as partes em camadas e as anima por rotação e posição em torno de pivôs (parado, caminhada, alcançar, examinar). Poses que o recorte não alcança (ajoelhar, cair, golpear) são imagens extras geradas com a arte-base como referência.
- **Efeitos em código, não na imagem:** os fios do destino, as chamas e a hachura de tinta, para reagirem às escolhas do jogador.
- **Resolução:** a figura deve ter cerca de 800 a 1000 px de altura para telas 1080p; usar um upscaler gratuito se necessário.
- **Arte desacoplada do código:** referenciada por id, para poder ser trocada por um artista ou por outros assets depois.
- **Licença e transparência:** conferir os termos de uso comercial da ferramenta escolhida e preencher a declaração de uso de IA generativa na página do itch.io, conforme as regras vigentes.

### 8.4 Modelo de exploração e comportamento dos personagens **[Proposta adotada por padrão]**
**[Decidido pelo autor]** Personagens menores em relação à arquitetura (a Lívia em pé tem cerca de 3/4 da altura de uma coluna), com o chão do friso mais alto e a caixa de diálogo sobre a faixa do piso.

**Friso lateral:** o personagem anda para a esquerda e a direita por cenários que lembram o friso pintado ao redor de um vaso. Combina com a arte em perfil estrito e dispensa múltiplas direções de movimento. Diálogos e momentos de ação usam telas dedicadas (retratos e poses-chave).

| Atividade | O que o personagem faz | Arte necessária |
|---|---|---|
| Explorar | Anda, para, examina, estende a mão | Parado, caminhada (recortes), examinar, alcançar |
| Dialogar | Fala em primeiro plano | Retrato com 4 a 5 expressões |
| Agir sob pressão | Desvia, resiste, golpeia (varia por personagem) | 3 a 4 poses-chave congeladas com efeito de tinta |
| Usar a dádiva | Lívia acende a chama, Asterion fareja, Théron corta o fio | 1 pose e efeito em código |
| Sofrer consequência | Hesita, cai, perde alguém | 1 a 2 poses e o corte do fio em código |

Estimativa: cerca de 15 imagens ou conjuntos por protagonista. Começar só com a Lívia.

### 8.5 Estado da arte da Lívia **[Decidido]**

Imagens geradas pelo autor no Gemini (plano grátis) a partir da arte-base aprovada. Pasta sugerida: `assets/art/characters/livia/poses/`. Os nomes abaixo são sugeridos; ajustar aos arquivos reais.

**Poses de corpo inteiro**

| Pose | Arquivo sugerido | Status | Uso |
|---|---|---|---|
| Caminhada (passada) | `livia_base_caminhada.png` | Aprovada | Quadro-chave de caminhada e base de recorte |
| Parada | `livia_base_parada.png` | Aprovada | Pose de repouso, base de recorte (remover a linha de chão) |
| Ajoelhada / oferenda | `livia_pose_oferenda.png` | Aprovada | Ritual da chama (cálice na altura do joelho) |
| Chama da Verdade | `livia_pose_chama.png` | Aprovada | Uso da dádiva. Corrigir o olho com esclera branca e deixar área transparente no topo para a chama em código |
| Assustada | `livia_pose_assustada.png` | Aprovada (primeira versão, cálice junto ao corpo) | Susto e tensão. Corrigir o olho e a sombra entre nariz e boca. O recuo é feito por código, deslizando a Lívia para trás |
| Proteger a chama | `livia_pose_proteger.png` | Opcional | |
| Abalo grande | `livia_pose_abalo.png` | Reserva | |
| Examinar, alcançar | — | Sem imagem própria | Feitas no recorte (inclinar o tronco, girar o braço da frente) |

**Retratos de diálogo** (busto em perfil, proporção 4:5, base cortada em curva como medalhão; rosto de referência: o retrato sereno)

| Expressão | Arquivo sugerido | Status |
|---|---|---|
| Serena | `livia_retrato_serena.png` | Aprovado |
| Determinada | `livia_retrato_determinada.png` | Aprovado (apagar a sombra entre nariz e boca) |
| Preocupada / dúvida | `livia_retrato_preocupada.png` | Aprovado |
| Tristeza | `livia_retrato_tristeza.png` | Extra pendente |
| Indignação | `livia_retrato_indignacao.png` | Extra pendente |

**Limpeza obrigatória em todas as imagens:** remover a linha de chão, corrigir a esclera branca dos olhos, apagar sombras que leem como bigode, guardar o original sem mexer em `originais/` e exportar em PNG com fundo transparente nas peças recortadas.

**Objeto-assinatura:** o cálice dourado de três pés com faixa em zigue-zague (não é mais uma tigela simples). Deve aparecer igual em todas as poses. A chama nasce em código sobre o cálice.

**Recorte simplificado:** como o vestido é longo e cobre as pernas, o boneco usa poucas peças: cabeça, véu, tronco com saia (peça única), braço da frente com o cálice, braço de trás e os dois pés com sandália. Movimentos previstos: respiração e leve balanço do tronco, véu balançando, aceno de cabeça, braços girando em torno de 10 graus e pés alternando. A caminhada usa a imagem da passada e a pose parada como quadros-chave, com balanço e transição feitos por código. Em giros maiores de braço aparece um vazio no tronco, então limitar o ângulo ou redesenhar a região.

**Normalização de escala:** as poses têm escalas diferentes no quadro (a ajoelhada é bem maior que a parada). Cada pose deve guardar em arquivo de dados o ponto de apoio (onde o corpo toca o chão) e a altura da cabeça, para o personagem não variar de tamanho entre poses.

**Limpeza das imagens:** remover a linha de chão quando existir, converter para PNG/WebP com fundo transparente e não usar JPEG como arquivo final.

**Arte integrada em 08/10 (originais em `originais/`):**
- **Templo montado por peças:** parede de tijolos que se repete (escurecida para as figuras se destacarem), colunas dóricas, portão de bronze, nicho com ânfora, lamparinas de tripé (com chama em código) e altar de Vesta. A posição de cada peça está em `content/backgrounds/temple.json`.
- **Fundos:** porto à noite (cruzamento com o Théron) e galerias sob o templo (cruzamento com o Asterion).
- **Personagens:** Domícia, guarda do Colégio e Lívia criança substituem as silhuetas. **Ainda provisórios:** Cláudia, Vestais, Iante, Varrão e o áugure velho.
- **Théron** (estilo fundo branco): 8 poses (parado, andando, encostado, espreitar, esquecimento, fio cortado, persuasão, sacar espada) e 4 retratos (sério, sardônico, cansado, abalado). No Capítulo 1 ele aparece como o "Desconhecido" encostado no pilar do porto.
- **Asterion** (estilo figuras negras): 7 poses (parado, andando, esconder, escutar/farejar, estender a mão, fera, investida) e o busto "no escuro", que aparece no encontro da escada.
- **Cenas em primeira pessoa:** pedra do altar, livro de votos, manto, escada, braseiro (as brasas jogáveis ficam sobre as brasas pintadas) e a ânfora do óleo.

**Arte do Théron integrada em 15/10** (`pedidos-de-arte/entregues/8-theron.md`, 16 de 34 imagens):
- **Personagens:** Nerea (parada, remendando, assustada), Bíbulo, a mulher do mercador e o escriba, com busto para o jogo dos copos.
- **Cenários:** mercado do porto, casa do Nísio, vila do patrício e túnel das ondas. O mercado, a casa e o túnel repetem espelhados.
- **Primeira pessoa:** a mão aberta e a mão com a lâmina (mini-jogo dos fios), e o tampo do barril. O pipeline tira os copos pintados do tampo (`patches`) e recorta um deles como peça móvel (`saturated`).
- **Mais tarde, no mesmo dia:**
  - Nísio (parado e assustado), Caio Licínio (corpo e busto), Iante e Quinto em fundo branco;
  - 10 das 11 vistas em primeira pessoa;
  - os bustos do Caio e das vítimas também servem de retrato no diálogo.
- Com a vista do escriba, a arte do Théron está completa.

**Artes das decisões com construção integradas em 17/10** (`pedidos-de-arte/entregues/9-decisoes.md`): o cinto da Iante (mini-jogo do roubo da chave, no T4) e a vista do áugure observando o Templo (L3).

**Estado no projeto (sessão 1):**
- Originais intocados em `originais/`, com a extensão do formato real (alguns ainda são JPEG): `livia_base_parada`, `livia_base_caminhada`, `livia_pose_oferenda`, `livia_pose_chama`, `livia_pose_assustada`, `livia_retrato_serena`, `livia_retrato_determinada` e `livia_retrato_preocupada`.
- `npm run art:clean` (`tools/clean-art.ts`, lista em `tools/art-clean.json`) remove o fundo preto preservando contornos e hachuras e grava PNG transparente em `assets/art/characters/livia/poses/` e `.../portraits/`. Limitação: os vãos estreitos entre os pés do cálice continuam pretos. A esclera branca e a sombra de bigode **não** são corrigidas pelo script; isso continua a cargo do autor.
- Ids no jogo: poses `idle`, `walk`, `offering`, `flame`, `scared`; expressões `serene`, `determined`, `worried`. O retrato aparece em medalhão à esquerda da caixa de diálogo, escolhido pelo campo `expression` da fala.

**Protótipo da fase 1b (decisões do autor: animar a pose inteira, caminhada controlada pelo jogador, cenário provisório em código, fios só em escolhas marcadas):**
- Sem recortes por enquanto: a pose inteira respira (escala vertical sutil) e a caminhada alterna a passada e a pose parada, com balanço vertical. Parâmetros no campo `animation` do personagem. O boneco em peças entra quando o autor cortar as artes.
- Cada pose guarda também o ponto `cup` (centro da borda do cálice, medido pelos pixels dourados), onde nasce a chama desenhada em código.
- Cenário provisório: friso do Templo da Chama em SVG (`assets/art/backgrounds/temple_placeholder.svg`, 3840 px de largura), com colunas, nicho com ânfora, lamparinas e o altar de Vesta.
- Fios do Destino: ao tomar uma escolha marcada, um fio dourado cruza a tela e é atado (laço em oito), cortado (lâmina e duas metades que caem) ou emaranhado (nós no meio).

## 9. Áudio
**[Decidido em 2026-10-18; sistema implementado, trilha encomendada pelo autor a um compositor]**
- **Direção:** Grécia antiga imaginada e íntima, com lira, aulos, tambor de mão, drones e voz sem letra, em modos dórico e frígio, e muito silêncio.
- **Camadas que reagem ao preço do dom** (aprovado pelo autor):
  - o selo da Lívia esquenta ou esfria a lira;
  - a fera do Asterion soma percussão e, no alto, um rugido;
  - a melodia do Théron perde notas conforme ele esmaece.
- **Pedido completo ao compositor:** `docs/audio/pedidos-de-musica.md` (17 faixas em stems e 11 efeitos).

## 10. Guia técnico inicial **[Proposta]**

### 10.1 Stack
HTML/JavaScript no navegador, com bundler (por exemplo Vite) para gerar o build final. Cenas em DOM/SVG ou canvas, a decidir na fase de protótipo. Personagens em camadas (recortes) animados por transformações definidas em dados.

**[Decidido na sessão 1]** TypeScript (strict) + Vite + Vitest, Node 24. Identificadores e comentários do código em inglês. Palco lógico de 1920x1080 escalado com letterbox. UI e personagens em DOM; **chama e fios num `<canvas>` sobre os personagens** (decidido na fase 1b), com um único laço de animação que também move a câmera do friso. Pastas extras em relação à 10.3: `originais/` (artes-fonte) e `tools/` (scripts de pipeline). Detalhes nas notas de desenvolvimento.

### 10.2 Princípios
- **Orientado a dados:** personagens, capítulos e fragmentos em arquivos JSON/Markdown. Nenhuma história escrita direto no código. Adicionar um personagem ou capítulo novo deve significar adicionar arquivos.
- **Textos em arquivos de strings** desde o início (preparado para mais de um idioma).
- **Estado de mundo centralizado e serializável** (flags, relações, Destino, mortes, dádivas usadas, par que se cruzou).
- **Lógica de consequências testável**, separada da interface.
- **Versão de schema no save**, para migrar saves entre temporadas.
- **Normalização de poses:** ponto de apoio e altura da cabeça por pose, em dados (ver seção 8.5).

### 10.3 Estrutura de pastas sugerida
```
/
├── GDD.md
├── (notas de desenvolvimento) # convenções do projeto
├── src/
│   ├── engine/            # estado, save, executor de cenas, input, áudio
│   ├── systems/           # fios do destino, diálogo, exploração, ação, mini-jogos
│   ├── ui/
│   └── main.js
├── content/
│   ├── characters/
│   ├── chapters/ch01/     # livia-01.json, asterion-01.json, ...
│   └── strings/           # pt-BR.json, ...
├── assets/
│   ├── art/               # imagens (PNG/WebP) e recortes, referenciados por id
│   └── audio/
├── docs/
└── dist/                  # build para itch.io
```

### 10.4 Formato de cena **[Proposta]**
Cada fragmento é uma sequência de nós, por exemplo:
```json
{
  "id": "livia-01-vigilia-03",
  "type": "choice",
  "text": "strings.livia01.vigilia03",
  "choices": [
    {
      "text": "strings.livia01.vigilia03.a",
      "conditions": [],
      "effects": [{ "flag": "livia_guardou_segredo", "value": true }],
      "next": "livia-01-vigilia-04"
    }
  ]
}
```
Tipos de nó previstos: `dialogue`, `choice`, `exploration`, `action`, `minigame`, `flashback`, `crossover`, `fate_event`.

**Implementado na fase 1:** `stage` (fundo e personagens em cena), `dialogue` (com `pose` e `expression` de quem fala), `choice` (com condições, opções bloqueadas visíveis e tempo limite com escolha padrão), `branch` (salto condicional) e `end`. **Na fase 1b:** `exploration` (friso em que o jogador anda até uma saída; objetos interativos ficam para a fase 3), o campo `thread` (`tie`, `cut`, `tangle`) nas escolhas importantes e o campo `flame` (intensidade da chama sobre o cálice). **Na fase 2:** `fate_event` (fio mostrado como consequência, por exemplo uma morte), `stage.update` (mudanças parciais de cena), `stage.mode: "flashback"` (no lugar de um nó `flashback` próprio), contadores em flags (`{flag, add}` e `{flag, min, max}`) e textos divididos por fragmento em `content/strings/<idioma>/`. **Na ampliação da fase 2:** `minigame` (`pour`, `reveal`, `descent`, `embers`, `rhythm`), objetos (`hotspots`) e vigias (`watchers`) na exploração, `gift` em falas e escolhas (dádiva pela tecla F), condições em `stage.update` (ecos visíveis) e `stage.mode: "night"`. As chaves de texto não usam o prefixo `strings.` (ex.: `livia01.c01.cover`). O schema completo está em `src/engine/types.ts`.

### 10.5 Save e exportação
- Salvar no navegador (`localStorage`) e permitir **exportar/importar** o save (por exemplo código em base64), para levar as escolhas de uma temporada à seguinte.
- O mapa dos fios lê o histórico de decisões salvo.

### 10.6 Build e publicação (itch.io)
- Gerar uma pasta final com `index.html` **na raiz**, compactada em `.zip`, com caminhos relativos.
- No itch.io, criar o projeto do tipo HTML e marcar a opção de jogar no navegador. Conferir os limites de tamanho e de arquivos na documentação atual.
- Estratégia: lançar a demo gratuita, coletar feedback e considerar game jams de narrativa para visibilidade.

## 11. Roadmap sugerido

| Fase | Entrega |
|---|---|
| **0. Setup** | Repositório, estrutura, notas de desenvolvimento, build para `dist/` |
| **1. Motor mínimo** | Estado, save, executor de cenas, diálogo e escolhas, UI básica |
| **1b. Protótipo da Lívia** | Arte-base, recortes, caminhada no friso, chama e fios em código |
| **2. Recorte vertical da Lívia** | 4 fragmentos jogáveis (~25 min) com arte provisória, validando motor, ritmo e escrita |
| **3. Sistemas de ação e exploração** | Mini-jogos, exploração, QTE, Fios do Destino visíveis |
| **4. Asterion** | 4 fragmentos |
| **5. Théron** | 4 fragmentos |
| **6. Cruzamentos e mapa dos fios** | Ecos indiretos, encontros em pares, gancho final |
| **7. Polimento e playtest** | Ajuste de ritmo e tempo real, acessibilidade, áudio |
| **8. Publicação** | Build, página no itch.io, demo pública |

**Plano B de escopo:** se o tempo apertar, cortar o fragmento 3 de cada protagonista leva a demo para cerca de 1h.

## 12. Riscos e decisões em aberto

**Riscos**
1. **Escopo:** 12 fragmentos é muito conteúdo para um desenvolvedor solo. Validar tudo com a Lívia primeiro.
2. **Arte:** manter o mesmo personagem consistente entre muitas imagens geradas por IA é o maior desafio. Por isso o plano usa recortes de uma arte-base única e poucas poses extras.
3. **Tempo real de jogo:** a estimativa de 1h30 precisa de playtest.
4. **Consequências injustas:** evitar mortes ou desfechos sem foreshadowing.
5. **Complexidade da premissa:** na demo, mostrar só a primeira camada (Ordem da Chama e Colégio Augural).

**Decisões em aberto**
1. Título definitivo do jogo.
2. Idioma(s) de lançamento (PT-BR, EN ou ambos).
3. Se protagonistas podem morrer na T1 completa e como a T2 trata isso.
4. Ferramenta de geração de imagem definitiva e seus termos de licença (a arte será gerada por IA e recortada pelo autor; um artista pode substituir depois). Atualmente em uso: Gemini, plano grátis.
5. Áudio e trilha.
6. Nomes definitivos de Mirto, Domícia e Nerea (e dos provisórios da fase 2: Cláudia, Pórcio Varrão, Iante, Díon).
7. Quais deuses específicos aparecem como arautos, avatares e deuses de verdade.
8. Papel e natureza das Irmãs (Cloto e Láquesis).
9. Como termina a Temporada 1 completa (fora da demo).

## 13. Instruções para a primeira sessão do assistente de programação

**Contexto:** o autor sabe programar e quer entender as decisões de arquitetura em explicações breves. O projeto fica apenas em pastas locais por enquanto, sem repositório remoto.

1. **Ler este GDD inteiro** antes de qualquer ação.
2. **Fazer perguntas de esclarecimento antes de implementar** (o autor prefere isso a refazer o trabalho). Perguntas sugeridas para a abertura: JavaScript ou TypeScript; idioma de identificadores e comentários no código; versão de Node instalada; resolução-alvo da tela (sugestão: 1920x1080 com escala responsiva).
3. **Criar as notas de desenvolvimento** com as convenções do projeto: stack, estrutura de pastas, regras de conteúdo orientado a dados, textos em arquivos de strings, estado serializável, arte referenciada por id e a regra de atualizar o GDD quando uma decisão mudar.
4. **Executar as fases 0 e 1 do roadmap (seção 11):** setup do projeto com build para `dist/`, estrutura de pastas, estado do mundo, save com exportar e importar, executor de cenas em JSON, diálogo e escolhas, interface básica. Usar as poses da Lívia (seção 8.5) como arte provisória.
5. **Não iniciar** sistemas de ação, mini-jogos ou arte final antes de o fragmento Lívia 1 estar jogável de ponta a ponta.
6. **Entregas pequenas e verificáveis:** ao fim de cada fase, rodar o jogo, descrever como testar e esperar a validação do autor.
7. **Git apenas local** (`git init`), sem configurar remote.

## Apêndice A — Prompts de arte (referência)

**Modelo para novas poses** (anexar a imagem aprovada como referência, em chat novo, e pedir uma imagem nova, não uma edição):

```
Create a NEW illustration. Use the reference image only for the character's face, veil, clothing, burn scars, golden three-legged cup with a zigzag decorative band, and the Greek red-figure vase painting style on black background. Do not copy the reference's pose.

POSE: [descrição da pose]

Strict side profile facing right. Full body visible, centered, generous empty margin around the figure. Plain solid black background with no ground line, no floor, no border. No golden threads, no fire, no text, no watermark.
```

**Linhas de POSE:**
- Chama da Verdade: `standing, both arms raised holding the cup above her head, chin lifted, intense determined gaze upward, dress and veil flowing slightly upward.`
- Recuar com medo: `stepping backward away from something ahead, free hand pressed to her chest, the cup clutched against her side, eyes wide with fear.`
- Proteger a chama: `body curled slightly forward, free arm shielding the cup from wind, veil and dress blown backward, eyes wide with worry.`
- Abalo grande: `kneeling on both knees, head lowered, hands open and resting on her lap, the cup fallen beside her, shoulders slumped in grief.`

**Aprendizados:** pedir pose parada em modo de edição não funciona, porque o modelo se prende à referência. Funciona pedir uma imagem nova, descrever literalmente onde ficam os pés e usar uma referência que ele conhece (estátua grega arcaica). Gerar cada pose em chat novo evita que o modelo se prenda às tentativas anteriores.

**Modelo para retratos de diálogo** (usar o retrato sereno como referência, em chat novo para cada expressão):

```
Create a NEW illustration. Use the reference image for the character's exact face, hairband, hair, veil, clothing and the Greek red-figure vase painting style on black background. Keep the same face and the same drawing style, and change ONLY the facial expression.

Bust portrait (head and shoulders only) of Lívia in strict side profile facing right. EXPRESSION: [descrição]

Eye drawn in authentic red-figure style: the eye is left the same terracotta color as the skin, outlined only with a thin black almond shape and a solid black iris, no white of the eye. Clean upper lip, no shadow, no mustache, no line between nose and mouth except the thin lip line.

Same framing as the reference, centered, generous empty margin around the figure. Plain solid black background, no border. No cup, no golden threads, no fire, no text, no watermark.
```

**Expressões extras:** tristeza: `head slightly bowed, eyes lowered, inner brows tilted upward, lips trembling, grief held back.` Indignação: `eyes narrowed, brows lowered, nostrils slightly flared, lips tight, controlled anger.`

**Aprendizados adicionais:** usar o retrato como referência de rosto mantém a personagem consistente entre expressões. Pedir "no mustache" ajuda a evitar a sombra entre nariz e boca. Quando o Gemini repete a pose da referência, não vale insistir: aceitar a melhor versão e resolver o movimento por código.
