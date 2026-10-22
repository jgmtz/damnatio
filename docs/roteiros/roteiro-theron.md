# Roteiro — Théron, Capítulo 1 (fase 5)

**Status:** **aprovado e implementado** em 2026-10-10 (`content/chapters/ch01/theron-0*.json`), com arte provisória: silhuetas de fundo branco e vistas pendentes. Os pedidos de arte estão em `pedidos-de-arte/entregues/8-theron.md`. As decisões estão no fim do documento.

**Base:** GDD 4.3 (Théron), 4.4 (contraste), 5.5 (mortes), 7.2 (os 4 fragmentos), 7.4 (cruzamentos), 7.5 (Nerea), e o que a Lívia e o Asterion já deixaram para ele:
- **Lívia 3:** a peregrina **Iante** carrega a **chave de bronze de um santuário de Héstia** e espera no porto; a Lívia pode ter prometido levar uma brasa até ela.
- **Lívia 4:** o nome **Théron** no livro de votos queimado; a cera do Varrão não segura o nome; o Colégio passa a procurar "o homem que a chama mostrou" (`colegio_procura_theron`). No porto, a Lívia esbarra num **Desconhecido** (`crossover = livia-theron`, cena completa na fase 6).
- **Asterion 2:** a pedra cicatriza o último nome da lista de heróis.
- **Asterion 4:** o **portal das ondas** (do Théron) leva ao porto; um eco "um homem que não faz som" (fase 6). Se o Théron cortar o fio do chaveiro **Nísio**, o Portão já está aberto.

Alvo: 4 fragmentos de ~6–7 min, cada um com gancho, jogo e decisão.

**Tom (GDD 4.3):** cínico, charmoso, cansado.
- O Théron é o protagonista que **mais fala**, mas fala para enganar. O jogo dele é **diálogo, blefe e mãos rápidas**.
- **Voz interior sardônica:** comentários dele aparecem em itálico sobre a cena (como os pensamentos do Asterion, mas em tinta clara de fundo branco) e dizem o que ele realmente pensa enquanto fala outra coisa.
- **Meta:** nunca mais de ~1 min de texto sem input. Ele é rápido, e o jogo também.

> **Nomes novos (provisórios):**
> - **Nerea:** remendadeira de redes no porto (ver pergunta 1).
> - **Caio Licínio:** o patrício do contrato.
> - **Bíbulo:** o marinheiro que cai no golpe da feira.
>
> **Nísio** (o chaveiro, pai do Mirto) e **Iante** (a peregrina) já existem.

---

## A ideia que amarra tudo

O Théron foi **apagado**: o mundo não segura o nome dele (aprovado no roteiro do Asterion). Ele vive disso: **um homem que ninguém lembra é o golpista perfeito**. O preço da dádiva só piora o que já é a vida dele: quanto mais ele usa o Fio Cortado, menos gente se lembra dele **mesmo durante a conversa**.

**A Nerea é a exceção.** Ela olha para ele e diz o nome. Ninguém faz isso há séculos. Ele não sabe por quê, e o jogo também não conta no Capítulo 1.

**O contrato liga os três:** o patrício quer a **chave de Héstia da Iante** (a peregrina da Lívia), porque ela abre o velho santuário do porto, que dá no **túnel das ondas** até debaixo do Templo. Trair a Iante é trair a promessa que a Lívia talvez tenha feito. A entrega passa pelo túnel do Asterion.

---

## Mecânicas novas

| Mecânica | O que é | Onde |
|---|---|---|
| **Fio Cortado** (a dádiva, mini-jogo `threads`) | Em primeira pessoa, o Théron "vê" os fios de alguém: fios dourados saindo do peito da pessoa e indo para o que a prende (*"o filho"*, *"o dever"*, *"a dívida"*, *"o medo"*). Com o mouse ele pode **cortar** um fio (arrastar a lâmina através dele), **atar** dois fios (arrastar um até o outro) ou **afrouxar** um (segurar sobre ele). Cada fio, no conteúdo, tem o efeito de cada gesto. Usa a tira e os emblemas pintados que já existem (nó, tesoura, emaranhado). | Fragmentos 2 e 4, e como ação livre (F) em algumas falas |
| **Presença** (o preço) | Cada uso da dádiva tira presença (`giftUses.theron`). Ela é **visível**:<br>• a figura dele vai ficando transparente, como tinta de vaso funerário desbotando;<br>• o nome na caixa de diálogo esmaece;<br>• quem estava com ele **esquece no meio da frase** ("...e você é?").<br>Com a presença baixa, somem as opções que dependem de ser lembrado (cobrar uma dívida, "lembra de mim?"). É o equivalente das opções reconfortantes da Lívia e das gentis do Asterion. | Contador global; condições nas escolhas |
| **O jogo dos copos** (mini-jogo `shells`) | Golpe de feira em primeira pessoa: as mãos dele movem três copos sobre um barril, com a pedrinha embaixo de um, enquanto o marinheiro olha. O jogador embaralha com o mouse e **esconde a pedrinha na palma** nos instantes em que o marinheiro desvia o olho (os olhos dele aparecem num retrato no canto). Se for pego, o golpe vira confusão; se for bem, ganha a aposta. Sem "game over": o desempenho escolhe o resultado. | Fragmento 1 |
| **Blefe** (diálogo com leitura) | Nas conversas importantes, o retrato do outro mostra **sinais** (a mão no cinto, o olhar desviando). Escolher a fala certa depois de um sinal funciona melhor. Algumas escolhas têm tempo, como na Lívia. | Fragmentos 1, 3 e 4 |
| **Voz interior** | Comentários sardônicos dele sobre a cena (o nó `thought` que o Asterion já usa, com outro estilo de letra). | Todo o capítulo |

---

## Fragmento 1 — Dia de Feira

**Lugar:** o porto, de dia, com feira.

1. **Gancho:** o Théron vende "um dente do Minotauro" (um dente de boi limado) para a multidão. Voz interior: *"Ninguém lembra de mim. Todo mundo lembra de um monstro."*
2. **Exploração na feira** (friso): três possíveis vítimas para examinar (E):
   - **Bíbulo, o marinheiro bêbado:** fácil e pobre;
   - **a esposa do mercador:** rica e desconfiada;
   - **um escriba do Colégio:** perigoso, mas é quem tem prata.

   Quem ele escolhe muda o mini-jogo e o risco.
3. **O jogo dos copos** com a vítima escolhida.
   - **Pego:** a guarda do porto se aproxima (`guarda_porto_atento`).
   - **Escriba do Colégio enganado:** ele volta no fragmento 4 (eco).
4. **A Nerea:** no meio da confusão, uma remendadeira de redes ergue os olhos da rede e diz: **"Théron."**
   - Voz interior: *"Ninguém diz esse nome. Ninguém pode."*
5. 🧵 **Decisão:**
   - **Falar com ela:** atado. Começa o laço `theron:nerea`.
   - **Fugir:** cortado. Ela fica com a rede e o nome na boca.
   - **Aplicar o golpe nela também** ("você me confundiu com outro, mas por uma moeda eu sou quem você quiser"): emaranhado. Ela ri; ele não esperava.

## Fragmento 2 — O Esquecimento

**Lugar:** a casa do chaveiro do labirinto, perto do Portão. É o **Nísio**, pai do Mirto.

1. **Gancho:** o Théron precisa de um caminho seguro pelas galerias velhas (ele ainda não sabe para quê; alguém pagou só "para saber o caminho"). O Nísio é o único que tem as chaves.
2. **Negociação** com blefe: o Nísio recusa, desconfia e fala do filho.
3. **Tutorial da dádiva:** o Théron vê os fios do Nísio:
   - **"o dever"** (o Portão);
   - **"o medo"** (do Colégio);
   - **"o filho"** (o Mirto).
4. 🧵 **Decisão pelo gesto:**
   - **Cortar "o dever":** o Nísio esquece de trancar o Portão esta noite (`nisio_fio_cortado`).
     - **Eco no Asterion 4:** o Portão já está aberto e o Nísio não sabe por quê.
     - É o eco do GDD 7.4.
   - **Afrouxar "o medo":** o Nísio fala demais e conta onde fica o santuário de Héstia do porto (pista para o fragmento 3).
   - **Não usar a dádiva:** convencer só com palavras é mais difícil, e se falhar ele sai sem nada.
5. **O preço, na hora:** se usou a dádiva, o Nísio para no meio da frase, olha para ele e pergunta "...quem deixou você entrar?". A figura do Théron perde cor. É a primeira vez que o jogador vê o preço.

## Fragmento 3 — O Contrato

**Lugar:** a casa de um patrício, à noite.

1. **Gancho:** o **Caio Licínio** pagou pelo "caminho" do fragmento 2. Agora quer o resto:
   - uma **urna lacrada** deve ser levada pelo túnel do porto até debaixo do Templo da Chama;
   - o túnel só se abre com a **chave de Héstia**, que está com uma peregrina de Corinto: a **Iante**.
   - "Ela não vai entregá-la. Você vai tirá-la dela."
2. **Leitura:** o Théron tenta ver os fios do patrício e **não encontra nenhum**, ou encontra fios que sobem e somem no teto. Voz interior: *"Esse homem não está amarrado a nada. Ou está amarrado a algo grande demais."* É um sinal, sem explicação (ver pergunta 4).
3. **Blefe pelo preço**, com sinais no retrato dele.
4. 🧵 **Decisão:**
   - **Aceitar (trair a Iante):** cortado.
   - **Aceitar e planejar a traição ao patrício:** emaranhado.
   - **Recusar:** atado. O patrício sorri. No fragmento 4, outro homem vai atrás da Iante, e o Théron pode chegar antes dele ou não.

   **Se a Nerea foi vista com ele** (fragmento 1), o patrício menciona "a mulher das redes que lembra de você". É uma ameaça (`nerea_ameacada`).

## Fragmento 4 — A Entrega

**Lugar:** o porto, à noite, até o túnel das ondas.

1. **A chave:** a Iante espera no porto o filho melhorar, ou uma brasa de uma Vestal. O jeito de pegar a chave depende das escolhas:
   - **roubar com as mãos** (variação do jogo dos copos, agora com o cinto dela);
   - **pedir** (com a presença alta, ela lembra dele e confia);
   - **cortar o fio "o luto"** da Iante: ela esquece a dor e a chave junto. É a opção mais terrível, e cobra presença.
2. **Cruzamentos** (só um par no capítulo, regra já aprovada):
   - **Lívia ↔ Théron:** se a Lívia prometeu a brasa e foi ao porto (`crossover = livia-theron`), ela chega quando ele está com a Iante. É a cena completa da fase 6; aqui fica o marcador.
   - **Asterion ↔ Théron:** se a Lívia não veio e o Asterion está no fundo, a entrega pelo túnel das ondas passa perto dele. É o "homem que não faz som" (fase 6).
3. **O túnel das ondas** (exploração curta, escura, guiada pelo som do mar) até a câmara dos três portais.
   - **Se o Quinto sobreviveu** (Asterion 3), é ele quem guarda o túnel. Ele não se lembra do Théron, mesmo que já o tenha visto.
4. 🧵 **Decisão final:**
   - **Entregar a urna:** cortado. Ela fica no portal das ondas; ninguém sabe o que ela faz, e é o gancho do Capítulo 2.
   - **Quebrar a urna:** emaranhado. Dela sai só cinza e um cheiro de fio queimado.
   - **Devolver a chave à Iante:** atado. O patrício vai cobrar.
5. **A Nerea** (GDD 7.5):
   - **Se `nerea_ameacada` e o Colégio procura o Théron** (`colegio_procura_theron`, vindo da Lívia 4): o Théron volta ao porto e encontra a rede dela largada no cais. Ela foi levada, ou morreu (`kill: nerea`), conforme o que ele fez.
   - **Senão:** ela ainda está lá, remendando, e diz o nome dele de novo. Fecho do capítulo.

---

## Fios, flags e ecos

| Flag | Origem | Usada em |
|---|---|---|
| `theron_vitima` (`bibulo`, `mercadora`, `escriba`) | T1 | T4 (o escriba volta) |
| `theron:nerea` (relação) | T1 | T3, T4 |
| `nisio_fio_cortado` | T2 | **Asterion 4**: o Portão já aberto |
| `theron_sabe_santuario` | T2 | T3, T4 |
| `theron_contrato` (`aceitou`, `traicao`, `recusou`) | T3 | T4 |
| `nerea_ameacada` | T3 | T4 |
| `iante_chave` (`roubada`, `pedida`, `fio_cortado`) | T4 | Lívia ↔ Théron (fase 6) |
| `theron_entrega_tunel` | T4 | **Asterion 4**: o homem que não faz som |
| `giftUses.theron` (presença) | todo o capítulo | opções, figura, mapa |

**Ordem do capítulo:** L1 → A1 → **T1** → L2 → A2 → **T2** → L3 → A3 → **T3** → L4 → A4 → **T4** (GDD 7.3).

**Atenção à ordem:** o eco do Nísio (T2 → A4) funciona, porque o T2 vem antes do A4. O eco da Lívia 4 no T4 também. Já a cena do porto na Lívia 4 acontece **antes** do T4. Por isso, na fase 6, ela precisa ser escrita do lado da Lívia como o primeiro encontro, e o T4 mostra o mesmo momento pelo lado dele.

---

## Arte necessária (pedidos só depois da aprovação)

- **Já existe:** o Théron (8 poses e 4 retratos) e o porto à noite.
- **Cenários:** o porto de dia, com feira; a casa do Nísio; a sala do patrício; o túnel das ondas.
- **Personagens:**
  - **Nerea:** parada, remendando, assustada;
  - **Caio Licínio;**
  - **Bíbulo;**
  - a **Iante** e o **Nísio** no estilo do Théron (ver pergunta 3).
- **Primeira pessoa (mãos do Théron, fundo branco):**
  - mãos sobre os copos;
  - mão com a lâmina para cortar fios;
  - mão aberta "vendo" os fios;
  - os fios saindo de uma pessoa (pode ser o retrato com fios desenhados por cima, em código, com a tira pintada).
- **Cenas em primeira pessoa:** o barril com três copos e o cinto da Iante.

---

## Decisões (o autor aprovou o roteiro com "pode implementar"; nas perguntas abertas valeram as propostas)

1. A Nerea é **remendadeira de redes** no porto.
2. O alvo da traição é a **Iante** e a chave de Héstia.
3. Os secundários das cenas do Théron são **redesenhados em fundo branco**, com ids próprios: `iante_wg` e `quinto_wg`.
4. O patrício **não tem fios próprios**: só fios finos que sobem e somem no teto (`rising` no mini-jogo). É um sinal, sem explicação.
5. Os mini-jogos `threads` (Fio Cortado) e `shells` (copos) foram aprovados.
6. A Nerea **pode morrer no T4**, se `nerea_ameacada` e `colegio_procura_theron` (da Lívia 4) e ele não entregou a urna. Se ele entregou, ela é levada (`nerea_levada`).

## Como ficou na implementação (diferenças em relação à proposta)

- **T1:** cada vítima tem o próprio jogo dos copos, com a atenção crescendo de uma para outra (`watchful` 0,35, 0,55 e 0,75). O escriba enganado (`escriba_enganado`) reaparece no cais no T4.
- **T2:**
  - A negociação é uma escolha com tempo (14 s).
  - As pistas da casa (examinar o pão e a carta) destravam as falas "o filho" e "a carta".
  - O mini-jogo tem três fios (dever, medo, filho), e o filho pode ser **atado** ao dever.
  - Cortar o medo revela o santuário (`theron_sabe_santuario`).
- **T3:**
  - A leitura do patrício é uma ação livre (F) numa fala (`gift`).
  - Antes da decisão há um blefe com tempo (15 s). A fala "Diga o meu nome" só aparece com a presença alta (`giftUses.theron` ≤ 1).
- **T4:**
  - **A chave:** pode ser roubada (jogo dos copos com a Iante, 2 rodadas), pedida (presença alta, `giftUses.theron` ≤ 2) ou tirada pela dádiva (três fios: luto, chave, esperança; dá para atar a esperança ao luto).
  - **Se ele recusou o contrato:** o capanga do patrício chega à Iante, e o Théron decide se chega antes.
  - **Cruzamentos:** com `livia-theron`, há uma lembrança da sacerdotisa no cais. Se a Lívia não encontrou ninguém, a câmara dos portais deixa o marcador **Asterion ↔ Théron** (`crossover = asterion-theron`, `theron_entrega_tunel`).
  - **O Quinto**, se vivo, guarda o túnel e não lembra dele.
- **Presença (o preço):** a figura do Théron e o nome dele na caixa de diálogo esmaecem conforme `giftUses.theron` (mínimo de 35%). A voz interior usa a classe `voice-theron`, em tinta clara.

## Perguntas que foram feitas ao autor

1. **Quem é a Nerea?** Proposta: remendadeira de redes no porto. Ela vive de **atar fios**, o que conversa com a dádiva dele sem explicar nada. Prefere outra ocupação ou outra ligação?
2. **O alvo da traição no contrato:** a **Iante** (amarra o Théron à história da Lívia e ao cruzamento no porto) ou a **Nerea** (mais pessoal, mas solta das outras histórias)?
3. **Estilo dos secundários nas cenas do Théron:**
   - **(a)** como na Lívia e no Asterion, cada protagonista vê o mundo no seu estilo: Iante, Nísio etc. **redesenhados em fundo branco** (mais arte);
   - **(b)** reaproveitar a Iante e o Nísio no estilo original (menos arte, mas mistura estilos na mesma cena).
4. **O patrício "sem fios":** ele é um sinal de que há algo divino por trás (um avatar, GDD 3.4), sem revelar nada. Está bom para o Capítulo 1, ou é demais (GDD 7.1: nada que altere a trama global)?
5. **A dádiva como mini-jogo de fios** (cortar, atar e afrouxar com o mouse) e **o jogo dos copos** com o olhar do marinheiro: aprova as duas mecânicas?
6. **A Nerea pode morrer no T4** (GDD 7.5), se ela foi ameaçada e o Colégio procura o Théron por causa da Lívia. Mantém essa regra?
