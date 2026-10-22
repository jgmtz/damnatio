# Roteiro — Asterion, Capítulo 1 (fase 4)

**Status:** **aprovado** pelo autor (as duas rodadas abaixo; mantém a Lívia presa pelo Colégio). **Os 4 fragmentos estão implementados** (`content/chapters/ch01/asterion-01..04.json`, textos em `content/strings/*/asterion01..04.json`), com arte provisória (lista em `docs/historico/prompts-asterion.md`). A ordem do capítulo intercala: L1 → A1 → L2 → A2 → L3 → A3 → L4 → A4. Também já estão no jogo: a regra de quem encontra quem na descida da Lívia, a câmara dos três portais e a cena da cera derretendo.

**Decisões do autor, 2ª rodada:**
7. **O apagamento do Théron:** aprovado ("o mundo não segura o nome dele"), inclusive a mudança na cena do livro da Lívia.
8. **Só um par se encontra no Capítulo 1;** os três se reúnem depois da demo.
   - O encontro da Lívia com o Asterion, no fim do capítulo dela, continua (para quem pegar esse caminho).
   - **Quando há encontro:** o Asterion está na escada se, no fragmento 3, **escolheu se abrigar perto do calor** e a **fera está baixa** (< 3).
   - **Quando não há:** a Lívia desce e só encontra a **câmara dos três portais**.
   - **Objetivo:** o jogador descobre, pelas escolhas, quem encontra quem.
9. **O capítulo do Asterion é sobre o pensamento dele,** que muda com o quanto ele usou a fera (mecânica "Duas vozes", abaixo).
10. **Os três portais** são um de cada protagonista.
11. **No capítulo do Asterion, a Lívia não decide nada:** ela já decidiu descer no capítulo dela. O fragmento final dele combina **as decisões que cada um tomou no próprio capítulo**. No Portão, o jogador age pelo gesto do Asterion, e a resposta da Lívia vem do que ela viveu.

**Decisões do autor:**
1. **Preço:** a fera trancando opções gentis e liberando opções brutas é o preço certo.
2. **O Portão leva a uma área mais profunda do labirinto.** O Asterion continua preso no Capítulo 1, e um **Capítulo 3 inteiro dentro do labirinto** fica como ideia para depois. Falta acertar o encaixe com o fim da Lívia (proposta na seção "O fim da Lívia e o fim do Asterion").
3. **O Mirto é filho do chaveiro Nísio.**
4. **O apagamento do Théron** precisa de algo mais criativo do que ler um nome num livro (proposta na seção "Como mostrar que o Théron foi apagado").
5. **As batidas sob o altar são do Asterion.**
6. **Ordem intercalada** (L1 → A1 → L2 → A2…) assim que os fragmentos dele estiverem prontos.
**Base:** GDD 3.3, 4.1, 5.2–5.5, 7.1–7.5. Alvo: 4 fragmentos de ~6–7 min, cada um com gancho, jogo e decisão.

**Tom (GDD 4.1):** o Asterion fala pouco e sente muito.
- **Pouco texto:** narração curta, em frases quebradas, e falas dele com poucas palavras.
- **Muita atmosfera:** o jogo dele é de **corpo e sentidos** (ouvir, farejar, esconder, segurar a fera), não de diálogo.
- **Meta:** nunca mais de ~1 min seguido de texto sem input, mais rígida que a da Lívia.

> **Nomes novos (todos provisórios):**
> - **Calias:** o velho escriba que o ensinou a ler, no flashback.
> - **Nísio:** o chaveiro do labirinto, pai do Mirto.
> - **Quinto:** o guarda novato.
> - **Os Caçadores do Colégio.**
>
> O **Mirto** já está no GDD.

---

## A ideia que amarra tudo

O Asterion vive nas galerias **logo abaixo do Templo da Chama**. Ele sente o calor do selo no chão. Quando a chama vacila, a pedra esfria e ele sente dor, como frio nos ossos.

**As batidas que a Lívia ouve sob o altar são dele.** Ele bate na pedra porque o calor está sumindo e ele não sabe por quê.

Isso liga os dois desde o primeiro fragmento sem revelar nada (GDD 3.2 continua secreto):
- **Marca:** o "olho fechado" que a Lívia viu no altar está gravado em todas as paredes onde ele aprendeu a ler.
- **Fenda:** a voz que a Lívia criança ouviu pela fenda era ele, cantarolando.

---

## Mecânicas novas (todas usam o motor atual + poucos acréscimos)

| Mecânica | O que é | Onde |
|---|---|---|
| **Duas vozes** (o centro do capítulo) | O Asterion não tem caixa de narração: os **pensamentos** dele aparecem riscados sobre a cena, como as incisões do vaso, perto da cabeça dele. Há duas vozes na cabeça:<br>• **o homem** (o que o Calias ensinou): frases inteiras, letras douradas;<br>• **a fera:** palavras soltas, tortas, em vermelho-ferrugem.<br>A **fera** decide quem fala: de 0 a 1 só o homem; de 2 a 3 a fera interrompe ("...cheiro. medo. fácil."); a partir de 4 a fera fala por cima e o homem quase não se lê. Cada momento importante tem as duas versões do pensamento. As **escolhas** também mudam de voz: com a fera alta, as opções aparecem escritas por ela. | Todo o capítulo |
| **Escuro e som** | Galerias quase pretas. Sons aparecem como **anéis de tinta dourada** que se espalham das fontes (goteira, passos, sino, voz). O jogador anda guiado pelos anéis. Como ainda não há áudio, o som é visível. | Exploração (`stage.mode: "dark"`, fontes de som nos hotspots) |
| **Farejar (a dádiva, tecla F)** | Por alguns segundos, os **fios** aparecem no chão: dourados para os caminhos, vermelhos para o perigo e um fio de cada pessoa por perto. Revela saídas escondidas e onde alguém está. | Ação livre em explorações e algumas falas |
| **A fera (o preço)** | Cada farejada, cada susto e cada ato violento sobe a **fera** (`fera`, de 0 a 5). Ela fica visível: a tela pulsa nas bordas e a respiração dele aparece como vapor. Quanto maior a fera, **mais difícil o controle**: o andar dá trancos, os mini-jogos ficam mais nervosos e, acima de 3, opções gentis somem e aparecem opções brutas. É o equivalente das opções "reconfortantes" que a Lívia perde. | Contador global; condições nas escolhas |
| **Segurar a fera** | Mini-jogo novo (`restraint`) em primeira pessoa: as mãos enormes dele tremem, e o jogador mantém a respiração num ritmo (segurar e soltar) enquanto a raiva puxa. Não há derrota: segurar bem, mal ou perder o controle muda o resultado. | Fragmentos 3 e 4 |
| **Traçar as letras** | Mini-jogo novo (`trace`): passar o dedo pelas letras gregas riscadas na parede, seguindo o sulco. É assim que ele aprendeu a ler e é assim que "ouve" memórias. | Fragmento 2 (flashback) |
| **Esconder-se** | Furtividade invertida: ele é enorme, então não pode só andar devagar. Precisa entrar em **nichos** (hotspots de esconderijo) quando a tocha do guarda vira. | Fragmento 3 |

Tudo segue a regra do jogo: **nunca trava**, o desempenho só muda as consequências.

---

## Variáveis

| Variável | Tipo | Para que serve |
|---|---|---|
| `asterion:mirto`, `mirto:asterion` | relação | confiança mútua; decide se o Mirto o segue no fim |
| `fera` | flag numérica (0–5) | o preço da dádiva e do medo; tranca opções gentis, abre opções brutas |
| `giftUses.asterion` | contador | usos do Instinto do Labirinto (cada um soma +1 na `fera`) |
| `asterion_protegeu_livro` | flag | no flashback, ele escondeu o livro do Calias |
| `quinto_vivo`, `quinto_poupado`, `quinto_ajudado` | flags | o que ele fez com o guarda novato; eco no fragmento 4 |
| `asterion_abrigo` | flag (`calor` ou `fundo`) | onde ele se abrigou no fim do fragmento 3; junto com a `fera`, decide se a Lívia o encontra |
| `colegio_sabe_do_mirto` | flag | o Colégio descobriu que o Mirto conversa com o "monstro" |
| `mirto_morto` | morte | desfecho do Mirto (`kill: "mirto"`) |
| destino `porta` | número | **não é moral:** sobe quando o Asterion se abre ao mundo (confia, sai da sombra) e desce quando se fecha (esconde, ataca) |

**Ecos que ele recebe da Lívia** (os fragmentos dela vêm antes na ordem intercalada):
- `livia_ouviu_o_chao` / `flashback_seguiu_musica`: o que ele lembra da noite da Vestália.
- marca revelada no altar (`livia01` `m_mark`): no fragmento 1, a marca na parede dele **brilha** quando ele a toca.
- `colegio_suspeita`: quanto mais alta, mais cedo os Caçadores chegam no fragmento 4.

**Ecos que ele deixa:**
- **Para a Lívia:** as batidas ficam mais fortes ou mais fracas conforme a `fera`.
- **Para o Théron:** o Quinto, se sobreviver, é quem guarda as galerias na entrega do fragmento 4 do Théron.

**Fios marcados** 🧵: um por fragmento, como na Lívia.

---

## Fragmento 1 — O Ouvido do Labirinto (~7 min)

**Gancho:** escuro total. Uma batida. Outra. O jogador descobre que **é ele** quem bate na pedra: a pedra do teto, que sempre foi morna, está esfriando.

1. **Despertar (exploração às escuras, ~2 min).** A tela é preta e só os anéis de som existem: goteira à esquerda, o sopro de uma corrente de ar à direita.
   - **Tutorial embutido:** andar em direção aos anéis.
   - **Objetos para examinar** (pelo tato, com descrição curta):
     - a parede com letras riscadas ("ΜΙΝΩ", e o olho fechado);
     - um osso velho de boi ("não é dele; é de comida, de muito tempo");
     - a corrente partida presa na parede ("foi dele").
2. **A primeira farejada** (guiada, sem custo nesta vez). Um cheiro novo: pão, suor de menino. Os fios aparecem: um fio fino e quente vem das escadas de cima. É o **Mirto**.
3. **Mirto chega com a cesta.** Ele não tem medo, ou finge muito bem. Fala sem parar (é a "voz" do fragmento, para o Asterion poder falar pouco). Ele conta que lá em cima a chama do Templo "fez uma coisa estranha", que as Vestais estão nervosas e que o pai dele, Nísio, o chaveiro, mandou não demorar.
   *Escolha (gesto, sem palavras):* **aceitar o pão da mão dele** (`asterion:mirto +1`), **esperar que ele deixe no chão** ou **rosnar para ele ir embora** (`fera +1`, `mirto:asterion −1`).
4. **A pedra esfria de novo.** O Asterion urra de dor, um frio que ele sente nos chifres. O Mirto se assusta.
   - **Eco:** se a Lívia levou a Cláudia a sério no L1, o Mirto conta que "uma Vestal disse que ouviu batidas" e pergunta se foi ele.
5. 🧵 **Decisão:** o Mirto pergunta: "Você bate na pedra? Por quê?"
   - **Mostrar a ele a marca na parede** e deixá-lo tocar (fio atado): `asterion:mirto +1`, `mirto:asterion +1`, `porta +1`. O Mirto copia o símbolo num caco de cerâmica para "perguntar às Vestais".
   - **Mentir com o silêncio,** virando as costas (fio emaranhado): nada muda por fora, mas o Mirto vai embora intrigado. `porta −1`.
   - **Bater na pedra de novo, com força, até rachar** (fio cortado): `fera +1`. Lá em cima, isso é a batida mais forte que a Lívia ouve no L3. `porta −1`.
6. **Fecho:** sozinho, ele encosta a testa na pedra fria. Uma linha: "Morna. Sempre foi morna."

**Sinais plantados:** o calor do selo, o Nísio chaveiro, o caco com o símbolo (que pode chegar ao Colégio).

---

## Fragmento 2 — O Escriba *(flashback jogável, ~6 min)*

**Tratamento visual:** o mesmo da memória da Lívia (sépia desbotada), mas em figuras negras. O Asterion é jovem, menor e sem o chifre quebrado.

**Gancho:** ele toca as letras da parede (mini-jogo **traçar**) e a pedra "fala": a memória vem pelos dedos.

1. **Traçar a primeira palavra.** Seguir o sulco de **Α-Σ-Τ-Ε-Ρ** com o dedo (mouse ou setas). Ao completar, a memória abre.
   - **O que muda:** a precisão define quanto da memória volta (o que ele "ouve" do Calias); não há derrota.
2. **Calias,** um escriba velho e meio cego, condenado a copiar registros no labirinto (o Colégio usa as galerias como arquivo). Ele não tem medo do menino-touro: "Monstro? Você? Você tem medo de rato."
   - O Calias ensina as letras **riscando a parede**, porque não tem papiro para desperdiçar.
   - **Jogo:** traçar duas letras a mais, cada vez mais rápido; ele comenta.
   - **O nome que a pedra não guarda** (o apagamento do Théron; ver a seção própria). O Calias mostra uma parede antiga, com a lista dos heróis de "uma guerra que ninguém conta", e pede ao menino que trace o último nome.
     - **O sulco se fecha atrás do dedo:** as letras somem enquanto o jogador as traça, a pedra volta lisa e só sobra a forma de um nome que não está mais lá.
     - O Calias, baixinho: "Esse a pedra não quer guardar. Já risquei cem vezes. Amanhã está liso de novo."
     - **Nada é explicado,** nem o nome aparece: o jogador só sente que alguém foi tirado do mundo. A ligação com o Théron é percebida depois, pelo eco com a Lívia.
3. **A noite da Vestália** (eco da Lívia, L2):
   - **Se a menina foi atrás da voz:** o Asterion lembra que cantarolava e que **uma orelha pequena encostou do outro lado da fenda**. Depois o calor sumiu de repente, ele teve medo e parou de cantar.
   - **Se ela foi atrás da música:** ele lembra de cantar para ninguém e do calor sumindo mesmo assim.
   - Nos dois casos: "Naquela noite a pedra ficou fria pela primeira vez."
4. **Os guardas vêm buscar o livro do Calias:** um códice que ele escrevia em segredo, copiando o que o Colégio mandava raspar dos registros (gente comum: dívidas perdoadas, condenações desfeitas, nascimentos "inconvenientes"). É a prova de que o Colégio reescreve a história, sem tocar na Guerra Esquecida. O velho empurra o livro para as mãos do menino e diz "Esconda", mas os guardas já ouviram.
   🧵 *Decisão:*
   - **Proteger o livro:** fugir para o escuro com ele (fio atado) → `asterion_protegeu_livro`, `porta −1`. Os guardas levam o Calias. É sugerido: o fio dele se corta fora de quadro.
   - **Obedecer aos guardas:** entregar o livro (fio cortado). O Calias é poupado "por ter colaborado", mas nunca mais fala com ele. `porta +1`.
   - **Investir contra os guardas** (fio emaranhado, só aparece se ele **não** completou bem os traçados, porque o medo venceu): `fera +1`. O Calias é levado e o livro se perde.
5. **Volta ao presente:** a mão dele está parada sobre as letras.
   - **Se protegeu o livro:** ele ainda o tem, escondido num nicho. É uma ponte para o Capítulo 2 sobre o Colégio reescrever a história (não sobre o Théron).
   - **Se obedeceu:** só restam as letras na parede.

**Por que o flashback importa:** mostra que ele não nasceu com medo dos homens, mas aprendeu, e que sabe ler (o que ninguém lá em cima imagina).

---

## Fragmento 3 — A Ronda (~7 min)

**Gancho:** uma tocha. Um guarda novato, Quinto, entra nas galerias sozinho, por aposta dos colegas ("traz um pelo do monstro").

1. **Esconder-se (furtividade, ~2 min).** A tocha varre a galeria. O Asterion precisa ir de nicho em nicho, **ficar imóvel** quando a luz passa e chegar ao nicho onde guarda as coisas dele (o livro, se o protegeu, e o caco do Mirto).
   - Ser visto não acaba o jogo: o Quinto grita e foge, e isso vira a pior versão do fim do fragmento (`colegio_sabe_do_mirto` mais provável).
   - **Farejar ajuda:** mostra o fio vermelho do medo do Quinto e o caminho dos nichos, mas cada uso soma `fera +1`.
2. **O Quinto se perde** no labirinto e cai num poço raso. Torce o tornozelo, a tocha vai se apagando. Ele chora e reza. O Asterion pode observá-lo de perto.
   - **O que ele carrega** (examinável): a tabuleta da aposta, com o nome dos colegas, e **um caco de cerâmica com o olho fechado**, o do Mirto. O Colégio já está perguntando sobre aquele símbolo.
3. 🧵 **Decisão:**
   - **Ajudar:** guiá-lo para fora sem ser visto (fio atado). Bater na parede para fazer sons que ele segue, numa exploração em que o jogador conduz o Quinto até a saída. → `quinto_ajudado`, `porta +1`. Ele sai vivo e nunca conta o que aconteceu, mas sabe.
   - **Deixar onde está** (fio emaranhado): o Quinto encontra o caminho sozinho ao amanhecer, ferido. → `quinto_vivo`, e ele conta tudo, inclusive o caco. → `colegio_sabe_do_mirto`.
   - **Atacar** (fio cortado). Abre o mini-jogo **segurar a fera**:
     - se ele **segura** o golpe: o Quinto foge apavorado, o guarda vê o monstro e o Colégio sabe → `quinto_poupado`, `colegio_sabe_do_mirto`;
     - se **perde o controle:** a violência é sugerida, uma sombra na parede e o fio do Quinto se corta → `kill: "quinto"`, `fera +2`. O caco some com ele, e o Colégio não sabe do Mirto, por enquanto.
   - **Bloqueio por preço:** com `fera ≥ 3`, a opção "ajudar" aparece **bloqueada**, e no lugar surge "Ele tem cheiro de medo. É fácil." Esse é o preço da dádiva tornado visível.
4. **Fecho:** o silêncio volta. Se o Quinto está vivo, a última imagem é a tocha dele subindo a escada, lá longe.
5. **Onde se abrigar esta noite** (decisão pequena, andando: duas saídas da galeria). É ela que decide, sem o jogador saber ainda, se a Lívia vai encontrá-lo.
   - **Subir, para perto do calor** da pedra sob o Templo. O pensamento: o homem diz "lá em cima é quente; lembra a voz da fenda", a fera diz "fogo. homens. não." → `asterion_abrigo = calor`.
   - **Descer, para o fundo,** longe dos homens → `asterion_abrigo = fundo`.

**Troca, não castigo:** matar o Quinto protege o Mirto agora e custa caro depois; ajudá-lo é o mais "gentil", mas o Quinto vira uma testemunha.

---

## Fragmento 4 — O Portão (~7 min) — versão sem a Lívia

*(Com a Lívia, o fragmento segue a seção "A4 com a Lívia", mais abaixo.)*

**Gancho:** o Mirto desce correndo, sem cesta. "O Colégio vai descer. Agora, esta noite. Com cães. Por sua causa. Por minha causa." (É a noite do Rito da Lívia; ver "Quem encontra quem".)
- **Por que o Colégio vem:** conforme o fragmento 3, por causa do caco ou do relato do Quinto. Se nada vazou, vem porque a chama vacilou no Rito da Lívia e o Colégio acha que "o monstro está envenenando o fogo".
- **Quando:** com `colegio_suspeita ≥ 2`, os Caçadores já estão nas escadas.

1. **O plano do Mirto.** Ele roubou a chave do pai: a do **Portão de bronze**, que separa as galerias de Aurélia do **labirinto fundo**, onde o Colégio não vai. "Lá embaixo eles nunca vão te achar."
   - O Portão não leva à superfície: o Asterion **não sai do labirinto** no Capítulo 1 (regra de ouro, GDD 7.1). Ele só vai mais fundo.
2. **A corrida até o Portão (ação, ~2 min):** exploração com os cães e as tochas dos Caçadores ao fundo.
   - O Asterion carrega o Mirto quando ele não aguenta mais; o andar fica mais lento, e a `fera` sobe com o barulho dos cães.
   - **Farejar mostra o caminho mais curto,** a um custo.
   - **Eco do Théron:** se ele cortou o fio do Nísio no fragmento 3 dele, o Portão **já está aberto** e o Nísio não lembra por quê, então a chave nem é necessária. *(O nome da flag sai no roteiro do Théron.)*
3. **No Portão:** a chave emperra (ou o portão aberto range alto demais). Os Caçadores estão perto.
   - **Eco do fragmento 3:** se o Quinto foi ajudado, é ele quem vem na frente. Ele vê o Mirto, hesita e **aponta para o lado errado**. Ganha-se tempo, e uma opção a mais destrava.
4. 🧵 **Decisão final** (fio cortado, atado ou emaranhado conforme o resultado):
   - **Levar o Mirto para o fundo:** os dois passam, o Portão fecha. O Mirto vive, mas deixa o pai e a vida lá em cima: "Ele vai achar que eu morri." → `mirto_seguiu`, `porta +1`.
     - **Precisa de confiança:** só se `mirto:asterion ≥ 1`; senão o Mirto tem medo e não vai.
   - **Mandar o Mirto de volta pela escada e fechar o Portão sozinho:** o Mirto corre para casa.
     - **Ele vive** se `quinto_ajudado` (o Quinto o deixa passar) ou se `colegio_sabe_do_mirto` é falso.
     - **Senão,** os Caçadores o alcançam na escada. A violência é sugerida: um grito interrompido e o fio dele se corta → `mirto_morto`.
     - **Os sinais** dessa troca estão nos fragmentos 1 e 3: o caco, o relato do Quinto.
   - **Ficar e enfrentar os Caçadores** para dar tempo ao Mirto. Abre o mini-jogo **segurar a fera**, na versão mais forte:
     - **segurando:** ele só assusta, os cães recuam, o Mirto foge, e o Asterion passa pelo Portão ferido → `fera +1`;
     - **perdendo o controle:** a fera vence. Sombras na parede, o fio de um Caçador se corta, e o Mirto **vê**. Ele vive, mas foge do Asterion → `mirto:asterion −2`, `fera +2`, `porta −2`.
     - Com `fera ≥ 4`, esta é a **única** opção disponível: o preço cobrado por inteiro.
5. **Fecho:** ele do lado de dentro do Portão, a mão no bronze. Do outro lado, longe, uma batida: a pedra que esfria. Os ecos da Lívia e do Théron estão em "A4 sem a Lívia".

---

## Quem encontra quem (a noite do Rito)

O fragmento 4 da Lívia e o do Asterion acontecem **na mesma noite**, nessa ordem (L4 → A4). A chama vacila no Rito, diante do Colégio. O Colégio culpa "o que vive sob o Templo" e manda os Caçadores descerem **naquela mesma noite**: é o gancho do A4.

**Só um par se encontra no Capítulo 1.** Os três se reúnem depois da demo. O par sai das escolhas dos três, tomadas cada uma no próprio capítulo:

```
L4: a Lívia desce às galerias?        (precisa: ouviu o chão + escolheu descer)
 ├─ não ── prometeu a brasa à Iante? ── sim ─> Lívia ↔ Théron (porto)
 │                                   └─ não ─> nenhum par com a Lívia
 └─ sim ── o Asterion está na escada?  (A3: abrigo = calor  E  fera < 3)
            ├─ sim ─> Lívia ↔ Asterion
            │         L4: os olhos no escuro (a descida que já existe)
            │         A4: versão "com a Lívia" (abaixo)
            └─ não ─> L4: ela chega à CÂMARA DOS TRÊS PORTAIS, sozinha
                      A4: versão "sem a Lívia"; pode haver Asterion ↔ Théron
                          (se a entrega do Théron passar pelo portal das ondas)
```

- **Com fera alta (≥ 3),** mesmo abrigado perto do calor, ele sente o fogo dela descendo e foge. O jogador do Asterion vê isso no A4, num pensamento da fera: "fogo. desceu. fugi."
- O jogador entende o porquê **só olhando para trás:** as escolhas do Asterion no A3 decidiram o que a Lívia encontrou no L4. É o tipo de causa e efeito que o mapa dos fios mostra.

### A câmara dos três portais (fim da descida da Lívia, quando ele não está)

A escada termina numa câmara redonda com **três portais**, um de cada protagonista:

| Portal | Símbolo | Para onde vai | No Capítulo 1 |
|---|---|---|---|
| **Do Asterion** | o **olho fechado** do altar | o labirinto fundo (o Portão do A4) | trancado; do outro lado, uma respiração enorme |
| **Do Théron** | **ondas** | um túnel até o porto (a rota da entrega do Théron) | entreaberto; cheiro de sal |
| **O apagado** | **nenhum**: pedra lisa, como o nome que a pedra não guarda | ninguém sabe | fechado; a chama do cálice **se inclina para ele** e não para mais |

- **Na descida da Lívia sem o Asterion,** o mini-jogo muda: no fundo não há olhos.
  - A câmara aparece aos poucos, e a chama revela os três símbolos.
  - **A última imagem** é o portal liso, para onde a chama se inclina.
  - **Gancho para depois da demo:** os três se reúnem e o terceiro portal se abre.
- **Na versão com o Asterion,** a câmara existe do mesmo jeito: é por ela que os dois chegam ao Portão no A4.

### A4 com a Lívia (`crossover = livia-asterion`)

O fragmento continua sendo do Asterion, e a **Lívia não decide nada** dentro dele: ela já decidiu descer no capítulo dela. O que ela faz vem do que ela viveu no próprio capítulo (as decisões e o estado dela), e o jogador age pelo Asterion.

1. **O encontro, do lado dele** (fase 6: a mesma cena da escada, agora pelos olhos dele).
   - **Os pensamentos reagem ao que ela fez na descida:**
     - **se ela ergueu o cálice:** o homem diz "luz. não queima.";
     - **se ficou imóvel:** "ela também tem medo";
     - **se recuou:** a fera diz "foge. todos fogem."
   - **A fera muda conforme isso:** −1 se ela ergueu o cálice, +1 se recuou.
2. **O Mirto chega correndo:** os Caçadores estão descendo, seguindo o rastro de fogo da Lívia. Os três vão até a câmara dos portais.
   - **Se a Domícia foi condenada no Rito,** a Lívia sabe que o Colégio vai procurá-la também. A fala dela vem dessa decisão do capítulo dela.
3. **O Portão do olho fechado:** a chave do Mirto gira, mas o bronze não cede. A chama da Lívia **revela a fechadura escondida**. Ela faz isso por conta própria, porque é o que a dádiva dela faz (`giftUses.livia +1`, o preço dela).
   - **Se ela nunca usou a dádiva no capítulo dela,** a chama é fraca e demora. Os Caçadores chegam mais perto, e o Asterion precisa **segurar a fera** enquanto espera.
4. 🧵 **Decisão final, do Asterion** (o gesto é do jogador):
   - **Estender a mão para ela** ("vem"), ou
   - **Fechar o Portão entre os dois** ("volta").
   - **A resposta dela vem do capítulo dela:**

     | O que a Lívia viveu | Se ele estende a mão | Se ele fecha o Portão |
     |---|---|---|
     | a Domícia foi **condenada** (não há mais Templo para ela) | ela **desce com ele** | ela fica do lado de fora, sozinha, diante dos Caçadores: volta presa, e o Capítulo 2 começa com ela nas mãos do Colégio |
     | a Domícia está **a salvo** e ela **ergueu o cálice** para ele | ela hesita e **desce com ele** ("um dia eu volto") | ela **volta ao Templo** e mente aos Caçadores para protegê-lo |
     | a Domícia está **a salvo** e ela **não ergueu o cálice** | ela **volta ao Templo**: alguém precisa manter a chama | ela **volta ao Templo** |

   - **O Mirto vem junto na decisão:**
     - **Se a Lívia volta ao Templo,** leva o Mirto com ela. Ninguém toca no protegido de uma Vestal, e o Mirto se salva.
     - **Se a Lívia desce,** o Mirto segue o que já estava no roteiro: desce junto se confia no Asterion (`mirto:asterion ≥ 1`); senão corre sozinho para cima e corre o risco do A4 sem a Lívia.
   - **Com a fera alta (≥ 4),** a opção "estender a mão" aparece **bloqueada**, e no lugar surge a da fera: "Fechar. Sozinho. Sempre sozinho." É o preço dele.
5. **Fecho:** o Portão se fecha.
   - **Se ela desceu:** os dois, a chama do cálice e o escuro do labirinto fundo. É a ponte para o Capítulo 3 dentro do labirinto.
   - **Se não desceu:** ele do lado de dentro, a mão no bronze, ouvindo os passos dela subirem.

**Fios marcados:** a decisão final é um fio **atado** se ela desce com ele, **cortado** se o Portão se fecha entre os dois, e **emaranhado** se ela fica do lado de fora, presa.

### A4 sem a Lívia

É a versão já escrita na seção "Fragmento 4 — O Portão" (Mirto, Caçadores, a decisão sobre o Mirto). Muda só o lugar: o Portão é o portal do **olho fechado** na câmara dos três portais.
- **Eco da Lívia, se ela desceu mas ele não estava:** o Asterion sente, do fundo, o cheiro de fogo de templo na câmara. A fera diz "fogo. desceu. fugi."; o homem diz "...quem era?".
- **Eco do Théron:** se a entrega dele passa pelo portal das ondas, o Asterion ouve "um homem que não faz som" → `[Cruzamento Asterion ↔ Théron: fase 6]`.

**Capítulo 3 dentro do labirinto:** fica registrado como ideia para o planejamento da temporada. O Portão fechado no Capítulo 1 é a porta de entrada dele.

---

## Como mostrar que o Théron foi apagado

**Proposta:** em vez de "ler o nome num registro", uma regra que o jogador **vê acontecer**: **o mundo não consegue segurar o nome dele.** Tinta escorre, pedra cicatriza, som não ecoa, gente esquece no meio da frase. Só quem carrega um fragmento da dádiva (Lívia, Asterion) guarda o que viu, e mesmo assim sem entender.

Cada protagonista sente isso do seu jeito:

| Onde | Como aparece | Situação |
|---|---|---|
| **Asterion, fragmento 2** | **A pedra cicatriza:** o jogador traça o último nome da lista de heróis, e o sulco se fecha atrás do dedo. Nenhuma letra fica. | proposta neste roteiro |
| **Lívia, fragmento 4** | **A tinta foge.** A Chama da Verdade acende o nome no livro queimado, como hoje. Depois muda: o Varrão copia o nome na tabuinha de cera, **a cera derrete e as letras escorrem enquanto ele escreve**, e ele fica olhando a tabuinha lisa: "Que nome... o que eu ia escrever?" Todos viram, ninguém guarda; só a Lívia lembra. O Colégio continua procurando (`colegio_procura_theron`), mas não um nome: procura "o homem que a chama mostrou e que a cera não segurou", o que ainda põe a Nerea em risco. | **muda uma cena já implementada:** precisa da sua aprovação |
| **Asterion e Théron se cruzam** | **O homem não faz som:** na exploração guiada por som, os passos do Théron **não criam anéis**, e a farejada não mostra fio nenhum. "Um homem que não deixa som nem cheiro." | fase 6 |
| **Mapa dos fios** | O fio do Théron é desenhado **puído e desbotado**, e nos mapas dos outros as escolhas que o envolvem aparecem como "um homem", nunca pelo nome. | fase 5/6 |
| **Théron, os fragmentos dele** | O preço da dádiva: o contratante esquece que ele estava ali, no meio da conversa (já no GDD). | roteiro do Théron |

---

## Regras de morte e troca (GDD 5.5 e 7.5)

- **Podem morrer:** o **Mirto** (fragmento 4), o **Quinto** (fragmento 3) e um Caçador (fragmento 4, sugerido); o Calias é levado (fora de quadro, no flashback). Todos são secundários.
- **Nenhuma morte é castigo,** e cada uma é anunciada antes:
  - o caco e o Quinto são os sinais do destino do Mirto;
  - a opção bruta que aparece com a `fera` é o sinal da perda de controle.
- **O Asterion não morre nem sai do labirinto** no Capítulo 1.

---

## Arte necessária (figuras negras, como a dele)

- **Personagens:**
  - **Mirto** (menino de ~11 anos, cesta), com pose parada e passada;
  - **Calias** (velho escriba, meio cego, estilete na mão);
  - **Quinto** (guarda jovem com tocha, sentado ferido);
  - **Caçador do Colégio** (com cão, silhueta);
  - **Nísio** (só citado, opcional).
- **Cenários:** galerias escuras (já há uma versão, que pode ser reaproveitada escurecida); a **câmara do Asterion** (palha, correntes partidas, nichos); o **Portão de bronze** do labirinto fundo; a cela do Calias no arquivo (flashback).
- **Close-ups (primeira pessoa):** parede com letras riscadas (para traçar); as mãos do Asterion (segurar a fera), ou desenhadas em código como os braços da Lívia.

Os prompts saem num `docs/historico/prompts-asterion.md` depois da aprovação.

---

## Falta decidir

1. **Aprovar a 2ª rodada:**
   - quem encontra quem (o diagrama);
   - a câmara dos três portais;
   - o A4 com a Lívia (a tabela da resposta dela);
   - as Duas vozes.
2. **A Lívia presa pelo Colégio** (se ele fecha o Portão e a Domícia foi condenada) é um gancho forte, mas pesado. Mantém, ou nesse caso ela também volta ao Templo?
---

## O que mudou na implementação (em relação ao roteiro acima)

- **Fragmento 1:**
  - O gesto do pão é uma escolha com três opções (pegar, esperar, rosnar).
  - A farejada guiada não tem custo.
  - O eco do olho fechado brilhando usa a flag `livia_viu_marca`, do ritual da Lívia.
- **Fragmento 2:**
  - Os traçados são três:
    1. o nome dele (ΑΣΤΕΡ), no presente, que abre a memória;
    2. ΜΙΝΩ, com o Calias;
    3. o nome que a pedra não guarda (ΘΗΡΩΝ, que some enquanto é traçado). Ninguém diz o nome em voz alta.
  - Traçar bem ΜΙΝΩ marca `asterion_traco_firme`, e isso esconde a opção "investir contra os guardas".
  - O corte do fio do Calias aparece como `fate_event` (fora de quadro).
- **Fragmento 3:**
  - A furtividade usa **nichos**: parado dentro de um, ele se encolhe e a tocha não o vê.
  - Ser visto marca `quinto_viu` e sobe a fera.
  - "Deixar onde está" só entrega o Mirto ao Colégio se o Mirto copiou o símbolo; sem o caco no chão, o Quinto não tem o que contar.
  - Com fera ≥ 3, "ajudar" aparece trancada, e "atacar" vira a opção da fera.
  - O abrigo da noite é uma caminhada com duas saídas.
- **Fragmento 4:**
  - A versão com a Lívia começa no instante do encontro e reage ao que ela fez na escada (erguer, ficar, recuar).
  - A chama dela abre a fechadura na hora se ela já usou a dádiva; senão demora, e o Asterion precisa segurar a fera enquanto espera.
  - Na versão sem a Lívia, "levar o Mirto" exige confiança (`mirto:asterion ≥ 1`), e com fera ≥ 4 só resta enfrentar os Caçadores.
- **Descida da Lívia (L4):**
  - Sem o Asterion na escada, o mini-jogo termina na **câmara dos três portais** (desenhada em código até a arte chegar), e o fragmento fecha com a pergunta dela ao portal liso.
  - O marcador "[fase 6]" do encontro virou uma frase de gancho ("os cães do Colégio começam a latir"), retomada no A4.
- **Ainda fica para a fase 6:** o encontro Asterion ↔ Théron (precisa da flag da entrega do Théron).
- **Distribuição dos desfechos** (400 partidas aleatórias): Lívia ↔ Asterion ~22%, Lívia ↔ Théron ~35%, nenhum par ~43%. O Mirto morre em ~9% das partidas; o Quinto em ~12%.