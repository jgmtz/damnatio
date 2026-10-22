> **Substituído pela pasta `pedidos-de-arte/`** (lista completa e atualizada de todas as artes). Este arquivo fica só como histórico.

# Prompts de arte — elenco do Capítulo 1 (Lívia)

Seguem o modelo do Apêndice A do GDD. Hoje esses personagens aparecem como **silhuetas provisórias em SVG** (`assets/art/characters/placeholders/`). Para trocar por arte, gere a imagem, coloque o original em `originais/`, adicione a linha em `tools/art-clean.json`, rode `npm run art:clean` e aponte o id no `assets/art/manifest.json` (ex.: `placeholder.vestal.elder` → o PNG novo). Depois ajuste `ground`, `headPx` e `cup` no JSON do personagem ("headPx é a calibração" da escala).

**Dica:** use a arte-base da Lívia como referência **só de estilo** (traço, hachura, paleta), não de rosto. Gere cada personagem em chat novo.

## Modelo base (corpo inteiro)

```
Create a NEW illustration in the Greek red-figure vase painting style on a plain solid black background: terracotta figures with fine black line work and engraving-like hatching, like the reference image. Use the reference image ONLY for the drawing style, not for the face, body or clothes.

CHARACTER: [descrição]

POSE: [pose]

Strict side profile facing right. Full body visible, centered, generous empty margin around the figure. Eye drawn in authentic red-figure style: same terracotta color as the skin, thin black almond outline and solid black iris, no white of the eye. No ground line, no floor, no border, no golden threads, no fire, no text, no watermark.
```

## Personagens

**Domícia — Vestal Máxima** (prioridade 1)
- CHARACTER: `a dignified Roman Vestal high priestess in her fifties, tall and straight-backed, strong aquiline nose, deep lines around the mouth, long veil (suffibulum) falling to the knees over a long pleated stola, a woven headband like Lívia's, old faint scars on the palms of both hands.`
- POSE: `standing still, hands folded in front of her waist, chin slightly lowered, calm and severe gaze.`

**Iante — a Peregrina** (prioridade 2)
- CHARACTER: `a weary Greek woman from Corinth in her mid-thirties, travel-worn hooded cloak over a simple chiton, ragged hem, hair tied low, tired eyes, a small bronze key hanging on a cord at her neck, half hidden under the cloak.`
- POSE: `standing, both hands clasped against her chest, leaning slightly forward as if asking for something.`

**Pórcio Varrão — áugure do Colégio** (prioridade 3)
- CHARACTER: `a Roman augur in his forties, short dark hair, clean-shaven, sharp observant face, toga praetexta with a broad dark border draped over the left shoulder, holding a lituus (a short staff curled like a spiral at the top), a wax tablet hanging at his belt.`
- POSE: `standing, holding the lituus upright in front of him with the right hand, head slightly tilted as if studying something.`

**Cláudia — noviça** (prioridade 4)
- CHARACTER: `a Vestal novice of about sixteen, round young face, short veil falling only to the shoulders, simple long stola without ornaments, nervous expression.`
- POSE: `standing, hands clasped tightly in front of her, shoulders slightly raised.`

**Lívia aos sete anos — flashback** (prioridade 5)
- CHARACTER: `a seven-year-old girl, the same face as the reference image but as a child (use the reference for the face only in this case), hair tied in a knot at the back, no veil, short tunic too big for her.`
- POSE: `standing small and straight, looking up, hands hidden behind her back.`

## Retratos (se quiser retrato no diálogo para o elenco)

Use o modelo de retrato do Apêndice A, trocando a referência pela pose aprovada do personagem. Os retratos são opcionais: sem eles, o diálogo mostra só o nome.
