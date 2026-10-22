> **Substituído pela pasta `pedidos-de-arte/`** (lista completa e atualizada de todas as artes). Este arquivo fica só como histórico.

# Artes para gerar — Capítulo 1 (Lívia)

> **Status em 08/10:** chegaram e estão no jogo:
> - o templo em peças (parede, coluna, portão, nicho, altar, lamparina);
> - o porto e as galerias;
> - Domícia, guarda e Lívia criança;
> - todos os close-ups e a ânfora;
> - o Asterion (7 poses + busto no escuro) e o Théron (8 poses + 4 retratos), já preparados para as fases 4 e 5.
>
> **Ainda faltam:**
> - os personagens **Cláudia** (e Vestais genéricas), **Iante**, **Pórcio Varrão** e o **áugure velho** do flashback (prompts em `docs/historico/prompts-elenco.md`);
> - os opcionais da seção 4: retratos extras, retrato da Domícia e capa do itch.io.

Lista do que ainda é provisório (desenhado em código ou SVG) e que, gerado no Gemini no estilo das poses da Lívia, vai deixar o jogo bem mais bonito. Em ordem de **impacto visual**.

**Regras gerais (valem para tudo):**
- Estilo: **pintura de vaso grego de figuras vermelhas** (terracota com traço preto fino e hachura de gravura sobre fundo preto), como a arte-base da Lívia. Anexe uma imagem aprovada da Lívia como **referência de estilo** e peça uma imagem **nova** (não uma edição), em **chat novo** para cada peça.
- **Objetos e personagens:** fundo preto liso, sem chão, sem moldura e com margem em volta. O `npm run art:clean` remove o fundo depois.
- **Cenários:** imagem inteira, sem pessoas, em **vista de frente** (elevação plana, sem perspectiva), porque os personagens andam de lado sobre uma linha de chão.
- Coloque os originais em `originais/` e me avise. Eu recorto, calibro e encaixo.

---

## 1. Cenários (maior impacto)

### 1.1 Templo da Chama — em peças (prioridade máxima)
O friso do templo tem 2 telas de largura. Imagens de IA muito largas e consistentes são difíceis, então o plano é **modular**: uma parede de fundo que se repete, mais os objetos colocados por código. Quando as imagens chegarem, eu adiciono ao motor o suporte a objetos de cenário posicionados por dados.

**a) Colunata de fundo (repetível)** — 16:9
```
Create a NEW illustration in the Greek red-figure vase painting style, matching the reference image's line work, hatching and terracotta-on-black palette. Use the reference ONLY for style.

SUBJECT: the inner wall of a Roman temple of Vesta seen strictly from the front, as a flat side-scrolling 2D game background: a row of four Doric columns at equal spacing, an architrave with triglyphs and a meander band at the top, a plain stone floor line at about 80% of the image height. Architecture drawn in fine terracotta lines with engraving-like hatching on a deep black background. The left and right edges should cut through the middle of the space between columns so the image can repeat side by side.

Flat frontal elevation, no perspective, no vanishing point. No people, no fire, no text, no watermark, no border. Wide 16:9.
```

**b) Objetos do templo** (um por chat, fundo preto, vista de frente):
- **Portão de bronze:** `a tall double bronze temple door with round studs and a carved frame, closed, seen from the front`
- **Nicho com ânfora:** `an arched wall niche holding a tall decorated amphora with black-figure bands`
- **Altar de Vesta:** `a round stone altar with a meander band, a shallow bronze fire bowl on top (empty, no fire), seen from the front` (o fogo é desenhado pelo código)
- **Lamparina de tripé:** `a bronze tripod oil lamp stand with a shallow bowl on top, no flame`

Modelo de prompt para os objetos:
```
Create a NEW illustration in the Greek red-figure vase painting style (terracotta drawing with fine black line work and engraving-like hatching), like the reference image. Use the reference ONLY for style.

OBJECT: [descrição acima]

Strict front view, flat, no perspective. Centered, generous empty margin. Plain solid black background, no floor line, no shadow, no border. No fire, no people, no text, no watermark.
```

### 1.2 Porto à noite (cena Lívia ↔ Théron) — 16:9
```
...SUBJECT: a Roman harbor at night seen from the front as a flat side-scrolling background: stone quay, wooden mooring posts, the silhouettes of moored ships and their masts against a dark sky, a few hanging lanterns (unlit, the light is added later), a stone pillar on the right where a man could lean. Stone floor line at about 80% of the height. Terracotta lines on black. No people, no fire, no text. Wide 16:9.
```

### 1.3 Galerias sob o Templo (cena Lívia ↔ Asterion) — 16:9
```
...SUBJECT: an underground stone corridor of the labyrinth seen from the front as a flat background: rough-cut walls scratched with ancient Greek letters, a low arched ceiling, roots coming through cracks, darkness at the far end. Terracotta lines on black, heavy hatching in the shadows. No people, no fire, no text. Wide 16:9.
```

---

## 2. Personagens (substituem as silhuetas)
Os prompts estão em **`docs/historico/prompts-elenco.md`**: Domícia, Iante, Varrão, Cláudia e Lívia aos 7 anos. Falta um:
- **Guarda do Colégio:** `a Roman temple guard, crested bronze helmet, short tunic under a leather cuirass, a dark cloak, holding a tall spear upright` (pose: `standing guard, spear held upright in the right hand, looking ahead`).

Para cada personagem basta a pose **parada**; se quiser que andem melhor, gere também uma **passada** (como a da Lívia).

---

## 3. Cenas em primeira pessoa (close-ups)
Hoje são desenhadas em código. O que o código anima (chama, marcas que acendem, braços, olhos) continua em código; a imagem entra como **fundo** da cena. Por isso, peça **sem** as marcas e textos escondidos.

| Cena | O que gerar | Notas |
|---|---|---|
| Marca no altar | `the top of an old stone altar seen from directly above, worn blocks, cracks, soot` | **sem** o símbolo do olho |
| Livro de votos | `an open ancient book of vows seen from above, papyrus pages with faded lines of script, the lower pages burned and blackened at the edges` | **sem** nomes legíveis |
| Mantos (Iante, Domícia, Varrão) | `a close-up of draped woolen cloth folds filling the whole image` | um só serve para os três |
| Óleo | `a terracotta oil amphora lying on its side, mouth pointing right, two handles, black-figure bands` | objeto isolado, fundo preto |
| Brasas (flashback) | `a wide stone fire bowl full of grey ash seen from above, a few dying embers` | |
| Escada do labirinto | `a narrow stone staircase descending into darkness, seen in first person from the top step` | é a única com perspectiva |
| **Asterion no escuro** | ver abaixo | estilo **figuras negras** (GDD 4.1) |

**Asterion** (o mais importante desta lista):
```
Create a NEW illustration in the Greek BLACK-figure vase painting style: a black silhouette with fine incised lines revealing gold-ochre details, on a dark background.

SUBJECT: the head and shoulders of an enormous Minotaur emerging from darkness, seen from the front: broad bull head, one horn broken off halfway, old chain scars around the thick neck, eyes catching a faint golden light. He looks wary and sad, not monstrous. Only the upper part is lit, the rest fades into black.

Centered, plain black background, no border, no text, no watermark.
```

---

## 4. Opcionais (polimento final)
- **Braços da Lívia em primeira pessoa:** antebraços com as cicatrizes segurando o cálice. É difícil manter a consistência na IA; o desenho em código já funciona bem.
- **Retratos que faltam (GDD 8.5):** tristeza e indignação da Lívia, e um retrato da Domícia (modelo de retrato no Apêndice A do GDD).
- **Capa para o itch.io** (630×500): a Lívia ajoelhada no altar com a chama, título em cima, no estilo do jogo.
