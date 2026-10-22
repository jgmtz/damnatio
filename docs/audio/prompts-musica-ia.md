# Prompts de música e som para IA

Versão do `docs/audio/pedidos-de-musica.md` para gerar a trilha com IA, para testar. Os prompts estão em **inglês**, porque as ferramentas entendem melhor.

## Como usar

1. **Só a camada `base` de cada faixa.**
   - A IA gera uma música inteira, não camadas sincronizadas. Camadas geradas à parte não acertariam o compasso umas com as outras.
   - O jogo funciona só com o `base`: as camadas reativas (selo, fera, presença) ficam para depois.
2. **Instrumental ligado,** exceto nas faixas marcadas com 🎤.
   - 🎤 = a faixa tem voz sem letra. Desligue o modo Instrumental e escreva na letra só vocalises: `[wordless humming] mmm... aah... ooh...`.
3. **Sem nome de artista nem de jogo no prompt.** As ferramentas recusam.
4. **Campo de "evitar".** Onde a ferramenta tiver "exclude" ou "negative prompt", cole:
   `orchestra, epic, battle choir, synthesizer, electronic, modern drums, drum kit, bass guitar, pop vocals, lyrics`
5. **Gere 2 ou 3 versões** de cada faixa e escolha a melhor.
6. **Salve em `originais/audio/<nome>.mp3`** (ex.: `originais/audio/temple_dawn.mp3`). Eu faço o loop, ajusto o volume e ponho no lugar.

## Faixas

### Primeiro pacote (uma por protagonista)

**`temple_dawn`**: o tema da Lívia, de manhã (L1). Cerca de 2 min.
```
Solo ancient Greek lyre, bright and gentle morning theme, a simple memorable melody, Dorian mode, plucked gut strings with audible finger texture, soft stone room reverb, peaceful and devout, sparse with space between phrases, 72 BPM, intimate acoustic, seamless loop
```

**`labyrinth`**: o Asterion (A1–A4). Quase sem música. Cerca de 2 min.
```
Dark minimal ambience, very low droning tone, slow heavy breathing texture, faint resonance of stone walls, almost no melody, a distant slow hand drum every few bars, underground labyrinth, quiet and unsettling but not horror, 50 BPM, very sparse, seamless loop
```

**`port_day`**: o Théron golpista no mercado (T1, T2). A única faixa alegre. Cerca de 2 min.
```
Lively ancient Greek street market tune, aulos double reed pipe with a rough nasal tone like a duduk or rustic oboe, playful cheeky melody, hand drum dance rhythm, small tambourine, street-smart and mischievous, Dorian mode, 110 BPM, acoustic, seamless loop
```

### Segundo pacote

**`title`** 🎤: tela de título, o Templo à noite. Cerca de 1 min 30.
```
Slow melancholic ancient Greek lyre solo with soft wordless female humming, night in a temple, faint crackle of a sacred fire, Dorian mode, intimate and sad, 60 BPM, sparse, seamless loop
```

**`prologue`** 🎤: o vaso do império. É a versão oficial da história, solene e um pouco falsa. Cerca de 1 min 30.
```
Solemn ancient Roman civic hymn, low male voices chanting in unison without words, plucked kithara, slow processional frame drum, Dorian mode, grand but hollow, official and slightly false propaganda, 70 BPM, no orchestra
```

**`night_rite`** 🎤: o Rito da Noite (L4). A faixa mais tensa da Lívia. Cerca de 2 min.
```
Tense ancient night ritual, steady pulsing frame drums, low female choir chanting wordless, droning double reed underneath, Phrygian mode, hypnotic and ominous, 90 BPM, acoustic, seamless loop
```

**`port_night`**: o porto à noite, onde a Lívia e o Théron se encontram. Cerca de 2 min.
```
Night harbor, gentle waves, an ancient lyre and a double reed aulos playing two melodies that never quite fit together, slightly out of sync, longing and hesitant, Dorian mode, 70 BPM, sparse, intimate, seamless loop
```

**`coda`** 🎤: o gancho final. Não é loop: tem começo e fim. De 2 min a 2 min 30.
```
Through-composed piece, not a loop. Begins as a solemn civic hymn with low male unison voices and kithara, then a lyre, a deep drone and a double reed aulos enter all at once, each playing its own theme out of time with the others, the music slowly unravels and falls apart into silence, ends with a single low note, ancient Greek, acoustic
```

### Resto

**`temple_day`**: o ritual de dia (L2). O tema da Lívia com tambor suave.
```
Ancient Greek lyre melody, gentle and devout, over a soft ritual frame drum with a steady calm pulse, small finger cymbals, Dorian mode, sacred daytime temple, 80 BPM, acoustic, sparse, seamless loop
```

**`temple_dusk`** 🎤: entardecer (L3). O tema mais lento, com voz.
```
Slow ancient Greek lyre melody with a soft wordless female voice, dusk in a temple, warm but tired and doubtful, Dorian mode, 60 BPM, lots of space and silence, intimate, seamless loop
```

**`flashback`**: a lembrança de criança (L2). O tema numa caixinha de música.
```
High delicate lyre like a music box, slow childhood memory, faded and echoing, distant reverb, slightly worn lo-fi texture, nostalgic and fragile, 55 BPM, seamless loop
```

**`night_temple`**: a fuga pelo Templo (L4). Furtividade; não pode cobrir os passos dos guardas.
```
Quiet stealth ambience, low drone, soft muffled hand drum hits, very sparse, tense held breath, Phrygian mode, leaves room for footsteps, 70 BPM, minimal, seamless loop
```

**`galleries`**: a descida sob o Templo e o túnel do Théron.
```
Underground cave ambience, deep drone, water dripping in stone galleries, very distant faint lyre notes fading away, cold and mysterious, minimal, no rhythm, seamless loop
```

**`iante`** 🎤: a Iante no porto (L4). Lamento curto que se resolve.
```
Solo female voice lament, wordless, ancient Mediterranean, mournful at first, slowly resolving into gentle relief and peace, only a very soft low drone underneath, intimate, 60 BPM
```

**`bronze`**: o Asterion atrás do portão de bronze (T4). Mais vazio que o labirinto.
```
Near-silent dark ambience, very deep drone, a low metallic bronze resonance humming faintly, vast empty chamber, a presence waiting behind a door, minimal, very quiet, seamless loop
```

**`keeper_house`**: a casa do chaveiro (T2). Íntima e desconfortável.
```
Low double reed aulos playing quietly, a single repeating low pulse, intimate and uncomfortable, suspicious, small dim room, sparse, 65 BPM, acoustic, seamless loop
```

**`villa_night`**: a vila do patrício (T3). Rica e fria.
```
Elegant banquet music in a rich Roman villa at night, refined plucked harp and kithara, polished and expensive but without warmth, aloof and cold, 85 BPM, acoustic, seamless loop
```

## Efeitos sonoros

Use um gerador de efeitos (ElevenLabs Sound Effects) com duração de 1 a 3 s. Salve em `originais/audio/sfx/<nome>.mp3`.

| Arquivo | Prompt |
|---|---|
| `thread_tie` | `A taut rope stretching, then a firm knot pulled tight, close-up, dry, no music` |
| `thread_cut` | `A single taut cord snapping with a sharp dry crack, the loose ends falling softly` |
| `thread_tangle` | `Threads rubbing and twisting into a tangle, scratchy fibers, unresolved, close-up` |
| `echo_tie` | `A short rising pluck on an ancient lyre, three notes, gentle and bright` |
| `echo_fray` | `A short descending pluck on an ancient lyre, muted and slightly dull` |
| `echo_alert` | `A single small dry finger cymbal hit, short, slightly ominous` |
| `theron_fade` | `A muffled breath of air, like someone quietly leaving a room, soft whoosh fading away` |
| `flame_waver` | `A gust over an oil lamp flame, the fire bends with a soft whoosh and comes back` |
| `bronze_knock` | `One huge deep knock on a massive bronze door, long metallic resonance` |
| `knock_gate` | `A hand knocking three times on a heavy wooden temple gate, solid and muffled` |
| `knocking_below` | `Muffled knocking coming from beneath a stone floor, distant and dull` |
