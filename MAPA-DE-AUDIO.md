# Mapa de áudio e créditos: Damnatio

Músicas escolhidas pelo autor no OpenGameArt, já baixadas. Este arquivo diz **qual arquivo vai para qual faixa do jogo** e traz **os créditos de todos os autores**, que o autor quer mostrar no jogo mesmo quando a licença não exige.

Onde estão os arquivos: `originais/audio/` (nomes exatamente como baixados, listados abaixo).
Lista de faixas do jogo e prompts originais: `docs/prompts-musica-ia.md` e `docs/pedidos-de-musica.md`.

---

## 1. O que o assistente de programação deve fazer

1. **Mapear:** usar a coluna **"Decisão do autor"** da tabela 2 (se estiver vazia, usar a **sugestão**, marcando no relatório que foi sugestão).
2. **Converter para OGG** (os WAV são grandes) e gravar em `assets/audio/<faixa>.ogg`. Os arquivos continuam em `originais/audio/`, sem mudar.
3. **Loop:** achar o ponto de loop de cada faixa e emendar sem estalo. Se uma faixa tiver final marcado (a música "termina"), cortar antes do final ou avisar o autor.
4. **Volume:** normalizar para o mesmo nível entre as faixas. A música não pode cobrir diálogo nem os passos dos guardas (`night_temple`).
5. **`content/audio.json`:** registrar cada faixa só com a camada `base`. Faixas sem arquivo ficam em silêncio, como o jogo já faz.
6. **Créditos:** criar uma tela de **Créditos** (Opções e/ou tela de título) com o bloco da seção 3. As chaves de texto vão nos dois idiomas (`en` e `pt-BR`), como mandam as convenções do projeto. Rodar `npm test`.
7. **Relatório:** dizer ao autor quais faixas do jogo ficaram **sem música** e quais arquivos **não foram usados**.

---

## 2. Qual música é para qual faixa

As colunas **Sugestão** foram feitas a partir das tags e das descrições do OpenGameArt. **Ninguém ouviu as faixas com esse objetivo** (só o autor testou algumas). O autor corrige na coluna **Decisão do autor**.

### 2.1 Os arquivos

| # | Arquivo baixado | Título original | Autor | Impressão pela ficha |
|---|---|---|---|---|
| 1 | `mystic_journey.mp3` | Mystic Journey | Tausdei | Medieval, tags "lyre" e "harp" |
| 2 | `Harp.mp3` | Soft Mysterious Harp Loop | VWolfdog | Harpa suave, já é loop |
| 3 | `greek instruments.ogg` | Experimenting with Greek instrument samples | Spring Spring | Amostras gregas, estilo chiptune |
| 4 | `(2) walking_with_poseidon.mp3` | Walking with Poseidon | mvrasseli | Grego orquestral, com metais |
| 5 | `Iwan Gabovitch - Dark Ambience Loop.ogg` | Dark Ambience Loop | Iwan Gabovitch (qubodup) | Ambiente sombrio, loop |
| 6 | `cave themeb4.ogg` | Cave Theme | Brandon75689 | Caverna |
| 7 | `evil_temple.ogg` | Evil Temple Ambiance Loop | Brandon Morris | Ambiente de templo sombrio |
| 8 | `Find Nothing.mp3` | Soundscape - Find Nothing | Ellary | Paisagem sonora vazia |
| 9 | `Loop_The_Old_Tower_Inn.wav` | Medieval: The Old Tower Inn | RandomMind | Taverna |
| 10 | `Loop_The_Bards_Tale.wav` | Medieval: The Bard's Tale | RandomMind | Menestrel |
| 11 | `Loop_Minstrel_Dance.wav` | Medieval: Minstrel Dance | RandomMind | Dança animada |
| 12 | `Viktor Kraus - Secret Sanctum.mp3` | Secret Sanctum | Viktor Kraus | Santuário, tensão |

### 2.2 As faixas do jogo

| Faixa do jogo | Onde toca | Clima | Sugestão | Decisão do autor |
|---|---|---|---|---|
| `title` | Tela de título, Templo à noite | Lira triste, noite | 1 `mystic_journey` | |
| `prologue` | O vaso do império | Solene, oficial, um pouco falso | 4 `walking_with_poseidon` | |
| `temple_dawn` | Lívia, manhã (L1) | Lira clara e calma, devota | 2 `Harp` | |
| `temple_day` | Lívia, ritual de dia (L2) | Lira com pulso suave | 1 `mystic_journey` | |
| `temple_dusk` | Lívia, entardecer (L3) | Lento, cansado, duvidoso | 2 `Harp` | |
| `flashback` | Lembrança de criança (L2) | Caixinha de música, desbotado | 2 `Harp` | |
| `night_temple` | Fuga pelo Templo (L4) | Furtivo, deixa os passos dos guardas aparecerem | 12 `Secret Sanctum` | |
| `night_rite` | Rito da Noite (L4) | Tenso, hipnótico, ameaçador | 7 `evil_temple` | |
| `galleries` | Descida sob o Templo, túnel do Théron | Caverna fria, sem ritmo | 6 `cave themeb4` | |
| `labyrinth` | Asterion (A1 a A4) | Quase sem música, pesado | 5 `Dark Ambience Loop` | |
| `bronze` | Asterion atrás do portão de bronze (T4) | Quase silêncio, vazio | 8 `Find Nothing` | |
| `port_day` | Théron no mercado (T1, T2) | Alegre, malandro | 11 `Minstrel Dance` | |
| `keeper_house` | Casa do chaveiro (T2) | Íntima, desconfortável | 9 `Old Tower Inn` | |
| `villa_night` | Vila do patrício (T3) | Rica e fria | 10 `Bard's Tale` | |
| `port_night` | Porto à noite, Lívia e Théron | Duas melodias que não se encaixam | **sem arquivo** | |
| `iante` | Iante no porto (L4) | Lamento com voz, que se resolve | **sem arquivo** | |
| `coda` | Gancho final (não é loop) | Hino que se desfaz em silêncio | **sem arquivo** | |

Arquivo ainda sem uso: **3 `greek instruments.ogg`** (amostras, não é uma música). Pode servir como inspiração ou ser descartado.

**Observações do autor sobre cada arquivo** (escreva aqui o que ouviu, por exemplo "serve", "alegre demais", "final marcado"):

- 1 mystic_journey:
- 2 Harp:
- 3 greek instruments:
- 4 walking_with_poseidon:
- 5 Dark Ambience Loop:
- 6 cave theme:
- 7 evil_temple:
- 8 Find Nothing:
- 9 Old Tower Inn:
- 10 Bard's Tale:
- 11 Minstrel Dance:
- 12 Secret Sanctum:

---

## 3. Créditos (todos os autores)

O autor faz questão de creditar **todos**, inclusive os que liberaram como CC0 ou domínio livre, em agradecimento por terem disponibilizado as músicas. Todas foram obtidas em **OpenGameArt.org**.

### 3.1 Tabela completa

| Título | Autor | Licença | Link |
|---|---|---|---|
| Mystic Journey | Tausdei | CC-BY 3.0 | https://opengameart.org/content/mystic-journey |
| Soft Mysterious Harp Loop | VWolfdog | CC-BY 3.0 | https://opengameart.org/content/soft-mysterious-harp-loop |
| Experimenting with Greek instrument samples | Spring Spring | CC0 | https://opengameart.org/content/experimenting-with-greek-instrument-samples |
| Walking with Poseidon | mvrasseli | CC-BY 3.0 | https://opengameart.org/content/walking-with-poseidon |
| Dark Ambience Loop | Iwan Gabovitch (qubodup) | CC-BY 3.0 | https://opengameart.org/content/dark-ambience-loop |
| Cave Theme | Brandon75689 | OGA-BY 3.0 ou CC0 | https://opengameart.org/content/cave-theme |
| Evil Temple Ambiance Loop | Brandon Morris | OGA-BY 3.0 ou CC0 | https://opengameart.org/content/evil-temple-ambiance-loop |
| Soundscape - Find Nothing | Ellary | CC-BY 4.0 | https://opengameart.org/content/soundscape-find-nothing |
| Medieval: The Old Tower Inn | RandomMind | CC0 | https://opengameart.org/content/medieval-the-old-tower-inn |
| Medieval: The Bard's Tale | RandomMind | CC0 | https://opengameart.org/content/medieval-the-bards-tale |
| Medieval: Minstrel Dance | RandomMind | CC0 | https://opengameart.org/content/medieval-minstrel-dance |
| Secret Sanctum | Viktor Kraus | CC-BY 3.0 | https://opengameart.org/content/secret-sanctum |
| Underwater Theme (`port_night`) | Cleyton Kauffman | CC0 | https://opengameart.org/content/underwater-theme |
| Breves dies hominis (`iante`) | Magdalen Kadel | CC0 | https://opengameart.org/content/breves-dies-hominis |
| Epilogue (`coda`) | tcarisland | CC-BY 4.0 | https://opengameart.org/content/epilogue |

Licenças: CC-BY 3.0 https://creativecommons.org/licenses/by/3.0/ · CC-BY 4.0 https://creativecommons.org/licenses/by/4.0/ · CC0 https://creativecommons.org/publicdomain/zero/1.0/ · OGA-BY 3.0 https://opengameart.org/content/oga-by-30-faq

**Exigência de um autor:** a página de *Dark Ambience Loop* pede que a tela de créditos traga exatamente: `"Dark Ambience Loop by Iwan Gabovitch qubodup.net"` (ou o link do perfil: `http://opengameart.org/users/qubodup`). Usar essa frase no jogo.

### 3.2 Bloco para a tela de Créditos do jogo

Mostrar **só as músicas que de fato entraram no jogo** (apagar da lista as que o autor não usou). Texto em inglês (jogo abre em inglês) e em português. Título da seção: "Music" / "Música".

```
Music: found on OpenGameArt.org. Thank you to every artist who shares their work.

"Mystic Journey" by Tausdei (CC-BY 3.0)
"Soft Mysterious Harp Loop" by VWolfdog (CC-BY 3.0)
"Walking with Poseidon" by mvrasseli (CC-BY 3.0)
"Dark Ambience Loop" by Iwan Gabovitch qubodup.net (CC-BY 3.0)
"Cave Theme" by Brandon75689 (OGA-BY 3.0 / CC0)
"Evil Temple Ambiance Loop" by Brandon Morris (OGA-BY 3.0 / CC0)
"Soundscape - Find Nothing" by Ellary (CC-BY 4.0)
"Medieval: The Old Tower Inn" by RandomMind (CC0)
"Medieval: The Bard's Tale" by RandomMind (CC0)
"Medieval: Minstrel Dance" by RandomMind (CC0)
"Secret Sanctum" by Viktor Kraus (CC-BY 3.0)
"Experimenting with Greek instrument samples" by Spring Spring (CC0)
```

```
Música: encontrada no OpenGameArt.org. Obrigado a cada artista que compartilha o seu trabalho.

(mesma lista acima; só o texto de introdução muda)
```

### 3.3 Para a página do jogo no itch.io

Colocar também na descrição do jogo, na seção "Credits": o mesmo bloco, com os links da tabela 3.1.

---

## 4. Pendências

- O autor ouve as 12 faixas e preenche a coluna **Decisão do autor** e as observações.
- Faltam **`port_night`**, **`iante`** e **`coda`** (precisam de lira com aulos desencontrados, voz sem letra e um hino que se desfaz). Possível solução: outro pacote do OpenGameArt ou gerar com IA.
- **Efeitos sonoros** (`thread_tie`, `thread_cut`, `thread_tangle`, `echo_*`, `theron_fade`, `flame_waver`, `bronze_knock`, `knock_gate`, `knocking_below`): ainda não buscados. Fonte sugerida: Freesound.org e OpenGameArt (Sound Effect), com a mesma regra de licença e crédito.
