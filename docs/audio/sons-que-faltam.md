# Sons e músicas que faltam

Lista para buscar o que falta na trilha. O jogo já toca cada arquivo assim que ele chegar; até lá, aquele momento fica em silêncio.

## Como entregar
1. **Onde salvar:**
   - **efeitos** em `originais/audio/sfx/`;
   - **músicas** em `originais/audio/`.
   Com qualquer nome e formato (MP3, OGG, WAV); eu converto, corto e igualo o volume.
2. **Créditos:** para cada arquivo, anote no `MAPA-DE-AUDIO.md` o título, o autor, a licença e o link. Os créditos aparecem no jogo.
3. **Licença:**
   - **Prefira CC0** (não exige crédito, mas creditamos mesmo assim).
   - **CC-BY** também serve, só que exige crédito.
   - **Evite CC-BY-NC** ("não comercial"), se um dia o jogo for pago ou aceitar doações.
4. **Onde procurar:**
   - **[Freesound.org](https://freesound.org)** para efeitos. Na busca, use o filtro **License → Creative Commons 0**; a conta grátis é necessária para baixar.
   - **[OpenGameArt.org](https://opengameart.org)** para músicas e efeitos.
   - **[Pixabay Sound Effects](https://pixabay.com/sound-effects/)**: licença própria, liberada para uso comercial.

## 1. Efeitos sonoros (11)

Curtos: de 0,5 a 3 s, sem silêncio antes do som. Se o som achado for mais longo, tudo bem: eu corto.

| Arquivo | Quando toca | O que procurar | Termos de busca (em inglês) |
|---|---|---|---|
| `thread_tie` | um fio do destino se ata (escolha importante) | corda esticando e um nó firme se fechando | `rope tighten`, `rope knot`, `rope creak` |
| `thread_cut` | um fio se corta | estalo seco de corda partindo, pontas caindo | `rope snap`, `string snap`, `cord break` |
| `thread_tangle` | um fio se emaranha | fios raspando e enrolando, sem resolução | `rope rustle`, `yarn`, `fabric rub`, `thread rub` |
| `echo_tie` | "o mundo registrou" algo bom | dedilhado curto de lira ou harpa, subindo | `harp gliss up`, `lyre pluck`, `harp short` |
| `echo_fray` | "o mundo registrou" algo ruim | dedilhado curto, descendo, abafado | `harp gliss down`, `muted pluck`, `detuned harp` |
| `echo_alert` | o Colégio ficou mais atento | um címbalo pequeno e seco | `finger cymbal`, `small cymbal`, `tingsha` |
| `theron_fade` | o Théron esmaece | um sopro abafado, alguém saindo da sala | `soft whoosh`, `breath whoosh`, `air swell fade` |
| `flame_waver` | a chama vacila | lufada de fogo que se dobra e volta | `fire whoosh`, `torch whoosh`, `flame gust` |
| `bronze_knock` | o Asterion bate no portão de bronze | batida grave em metal enorme, com ressonância | `metal door knock`, `bronze gong hit`, `heavy metal impact` |
| `knock_gate` | Lívia 3, batida no portão do Templo | mão batendo em madeira pesada, três vezes | `knock wooden door`, `heavy door knock` |
| `knocking_below` | Lívia 3 e 4, batidas sob o chão | batidas abafadas vindas de baixo da pedra | `muffled knock`, `knocking underground`, `distant thud` |

**Dica:** para `echo_tie` e `echo_fray`, um mesmo som de harpa pode servir aos dois. Eu inverto ou abafo um deles.

## 2. Músicas que faltam (3)

| Faixa | Onde toca | O que precisa | Busca no OpenGameArt | Se for gerar com IA |
|---|---|---|---|---|
| `port_night` | o porto à noite, onde a Lívia e o Théron se encontram (L4 e T4) | calma, noturna, com saudade; de preferência lira ou harpa e um sopro (flauta, oboé) que não se acertam. **Loop.** | `night harbor`, `calm night flute`, `melancholic harp loop` | prompt `port_night` em `docs/audio/prompts-musica-ia.md` |
| `iante` | a Iante no porto (L4): o filho dela pôde partir | **voz feminina sem letra**, um lamento curto que termina em alívio. Também serve um solo de instrumento (duduk, flauta, violino) | `female vocal lament`, `sad vocal`, `lament`, `requiem` | prompt `iante` |
| `coda` | o fim do capítulo, o gancho final | solene, que se desfaz em silêncio; **não precisa ser loop** (de 1:30 a 2:30, com final) | `ending theme`, `sad ending`, `epilogue`, `dark finale` | prompt `coda` |

**Opção sem buscar nada:** a `coda` pode reaproveitar *Walking with Poseidon* (o hino do prólogo), em versão lenta e se apagando, o que fecha o capítulo com o mesmo hino do começo. Diga se quiser, e eu faço a edição.

## 3. Depois que chegar
Me avise. Eu:
- converto, corto e igualo o volume;
- ligo cada arquivo no `content/audio.json`;
- ponho o crédito na tela de Créditos.
