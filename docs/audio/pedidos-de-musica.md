# Pedidos de música e som — Damnatio: Todo Fio Tem um Preço

Documento para encomendar a trilha a um compositor. O jogo já toca tudo sozinho: basta salvar cada arquivo no lugar indicado (`assets/audio/...`). Enquanto um arquivo não existe, o jogo fica em silêncio naquele ponto, sem erro.

## 1. O jogo, para o compositor
- **O que é:** jogo narrativo de escolhas em 2D, para navegador, com três protagonistas que se cruzam numa Roma fictícia que absorveu a Grécia. A arte imita a pintura de vasos gregos.
- **Os protagonistas:**
  - **Lívia,** uma vestal que perde a fé;
  - **Asterion,** o "monstro" do labirinto, que é gentil e desconfiado;
  - **Théron,** um herói que o mundo esqueceu.
- **O preço:** toda escolha importante vira um fio que se ata, se corta ou se emaranha. Cada protagonista tem um dom, e cada uso do dom cobra um preço.
- **Clima:** Grécia antiga **imaginada**, íntima e pouco épica. Use poucos instrumentos, próximos e com a textura das mãos tocando. Deixe muito silêncio: é um jogo de ler e decidir.
- **Instrumentos:**
  - lira ou kithara (cordas dedilhadas);
  - aulos (sopro duplo e áspero; o duduk e o oboé rústico servem de referência);
  - tambor de mão (tympanon) e címbalos pequenos;
  - drones graves;
  - voz humana sem letra.
- **Modos:** dórico e frígio.
- **Referências de clima:** *Hades* (as partes calmas), *Journey* (economia), *Pentiment* (instrumentos de época próximos).
- **Evitar:** orquestra cheia, coro de batalha, sintetizador evidente e batida moderna.

## 2. A ideia central: camadas que reagem ao preço
Cada protagonista tem uma voz musical, e a música **muda conforme o preço do dom** do personagem que está sendo jogado. Para isso, cada faixa é entregue em **stems** (camadas separadas) que tocam juntas. O jogo sobe e desce cada camada sozinho, com fades.

| | Instrumento-base | O que muda |
|---|---|---|
| **Lívia** | lira + voz feminina sussurrada | **O selo:** `warm` (lira mais quente e cheia) entra quando ela guarda segredos pela fé; `cold` (notas frias e levemente desafinadas) entra quando a verdade a corrói |
| **Asterion** | drone grave, respiração, tambor lento | **A fera:** `beast1` (percussão) a partir de 1; `beast2` (mais percussão, mais rápida) a partir de 3; `roar` (rugido distorcido por baixo) a partir de 4 |
| **Théron** | aulos sozinho, frases curtas e secas | **A presença:** três versões da **mesma** melodia, e toca só uma de cada vez: `melody_full` (inteira), `melody_sparse` (faltam notas) e `melody_bare` (quase só silêncio). O som do esquecimento |

## 3. Regras técnicas (importantes)
1. **Entrega:** WAV, 48 kHz, 24 bits. Eu converto para OGG.
2. **Loops perfeitos:** cada arquivo de música é um loop. Sem silêncio no começo nem no fim, e a cauda do final se mistura ao começo, sem estalo na volta.
3. **Stems da mesma faixa:**
   - **mesma duração exata**, ao sample;
   - **mesmo andamento**;
   - **começam juntos**.
   O jogo inicia todos no mesmo instante e faz o loop de todos juntos.
4. **Cada stem soa bem sozinho e combinado.** O `base` precisa funcionar sozinho, porque é o que o jogador mais ouve.
5. **Duração do loop:** de 1:30 a 3:00. A tela de título e a música do prólogo podem ser mais curtas.
6. **Volume:** música em torno de −18 LUFS, efeitos em torno de −14 LUFS, pico em −1 dBTP. Todas as faixas no mesmo nível, para nenhuma "pular" na troca.
7. **Nomes:** exatamente os da tabela abaixo (pastas e arquivos em minúsculas).

## 4. Faixas

**Legenda dos stems:**
- **L** = `base`, `warm`, `cold` (Lívia);
- **A** = `base`, `beast1`, `beast2`, `roar` (Asterion);
- **T** = `base`, `melody_full`, `melody_sparse`, `melody_bare` (Théron);
- **1** = só `base`.

| Pasta (`assets/audio/music/...`) | Stems | Onde toca | O que pedir |
|---|---|---|---|
| `title/` | 1 | tela de título | Lira e voz, calmo e um pouco triste: o Templo à noite. Pode ser uma versão nua do tema da Lívia. |
| `prologue/` | 1 | o vaso do império | **Hino cívico, solene e um pouco falso:** lira e coro masculino grave em uníssono, a versão oficial da história. O jogo corta o hino quando a chama vacila. |
| `temple_dawn/` | L | Lívia 1, manhã | **O tema da Lívia**, lira sozinha e luminosa. A mesma melodia volta nas três faixas do Templo. |
| `temple_day/` | L | Lívia 2, o ritual | O tema, com o tambor suave do ritual. |
| `temple_dusk/` | L | Lívia 3, entardecer | O tema mais lento, com a voz. |
| `flashback/` | L | Lívia 2, a lembrança de criança | O tema numa caixinha: lira aguda, lenta, com eco e desbotada. |
| `night_rite/` | L | Lívia 4, o Rito da Noite | **A faixa mais tensa da Lívia:** tambores do ritual num pulso constante e o coro das Vestais. |
| `night_temple/` | L | Lívia 4, a fuga | **Furtividade:** drone e batidas abafadas. Não pode atrapalhar a escuta dos passos dos guardas. |
| `galleries/` | L | a descida sob o Templo; o túnel do Théron | Drone com água pingando e a lira muito distante, quase sumindo. |
| `iante/` | 1 | Lívia 4, a Iante no porto | **Só voz feminina,** um lamento curto que se resolve: o filho dela pôde partir. |
| `labyrinth/` | A | Asterion 1–4 | **Quase sem música:** drone grave, respiração, pedra. O `base` tem de ser muito discreto, porque os sons do mundo importam mais. |
| `bronze/` | A | Théron 4, o Asterion atrás do portão de bronze | Como o `labyrinth`, ainda mais vazio, com um metal grave ressoando de leve. |
| `port_day/` | T | Théron 1 e 2, o mercado | **A única faixa alegre:** aulos e tambor de feira, dançante e malandro. É o Théron golpista. |
| `keeper_house/` | T | Théron 2, a casa do chaveiro | Aulos baixo e um único pulso, íntimo e desconfortável. |
| `villa_night/` | T | Théron 3, a vila do patrício | **Rica e fria:** cordas "caras" sem calor, música de banquete. |
| `port_night/` | `base`, `lyre`, `aulos_full`, `aulos_sparse` | Lívia 4 e Théron 4, o porto à noite | **O encontro:** a lira da Lívia (`lyre`) e o aulos do Théron (cheio ou com notas faltando) **na mesma faixa**, tocando sem se acertar. |
| `coda/` | 1 | o gancho final do capítulo | **Começa com o hino do prólogo,** igual. No meio, os três temas (lira, drone, aulos) tocam juntos, fora de compasso, até se desfazer. Fecha com silêncio e uma nota grave. Esta faixa **não** precisa ser loop: pode ter começo e fim (2:00 a 2:30). |

## 5. Efeitos sonoros (`assets/audio/sfx/`)

| Arquivo | Quando | O que pedir |
|---|---|---|
| `thread_tie.ogg` | um fio se ata | corda esticando, e um nó firme |
| `thread_cut.ogg` | um fio se corta | estalo seco de corda, com as pontas caindo |
| `thread_tangle.ogg` | um fio se emaranha | fios raspando, enrolando, sem resolução |
| `echo_tie.ogg` | "o mundo registrou" (algo bom) | um dedilhado curto de lira, subindo |
| `echo_fray.ogg` | "o mundo registrou" (algo ruim) | um dedilhado curto, descendo e meio abafado |
| `echo_alert.ogg` | o Colégio ficou mais atento | um címbalo pequeno, seco |
| `theron_fade.ogg` | o Théron esmaece | um sopro abafado, como alguém saindo da sala (o jogo também abafa a música) |
| `flame_waver.ogg` | a chama vacila | uma lufada de fogo que se dobra e volta |
| `bronze_knock.ogg` | o Asterion bate no portão | uma batida grave em bronze, enorme, com ressonância |
| `knock_gate.ogg` | Lívia 3, batida no portão do Templo | batida de mão em madeira pesada |
| `knocking_below.ogg` | Lívia 3 e 4, batidas sob o chão | batidas abafadas vindas de baixo da pedra |

Efeitos de 0,5 a 3 segundos, sem silêncio antes do som.

## 6. Ordem sugerida de entrega
Para ouvir as camadas funcionando cedo:
1. **Primeiro pacote:** `temple_dawn` (L), `labyrinth` (A), `port_day` (T) e os três sons de fio. Com eles, dá para testar a ideia das camadas com cada protagonista.
2. **Segundo pacote:** `title`, `prologue`, `night_rite`, `port_night` e `coda`.
3. **Resto:** as demais faixas e efeitos.

**Total:** 17 faixas (49 stems) e 11 efeitos.
