> **Substituído pela pasta `pedidos-de-arte/`** (lista completa e atualizada de todas as artes). Este arquivo fica só como histórico.

# Artes para gerar — Asterion, Capítulo 1

Arte dos 4 fragmentos do Asterion (`docs/roteiros/roteiro-asterion.md`). Tudo em **figuras negras**, o estilo dele, para o jogador sentir que mudou de protagonista.

## O que está provisório no jogo hoje (e qual arte substitui)

Os 4 fragmentos já estão jogáveis com arte provisória. Cada linha diz onde está o provisório e o que gerar para trocar. Quando a imagem chegar, eu recorto, calibro e troco o id no manifesto.

| No jogo agora | Onde aparece | Arte a gerar (seção abaixo) | Prioridade |
|---|---|---|---|
| **Mirto** = silhueta da Lívia criança (`placeholder.child`) | fragmentos 1 e 4 | Mirto: parado com a cesta (e com uma **lamparina acesa** na mão: o jogo desenha a chama), andando, assustado | **alta** |
| **Calias** = silhueta do áugure (`placeholder.augur`) | fragmento 2 (flashback) | Calias: parado; riscando a parede | **alta** |
| **Quinto** = arte do guarda do Templo (figuras vermelhas) | fragmentos 3 e 4 | Quinto: de pé com a tocha; sentado ferido | **alta** |
| **Guardas do flashback e Caçadores** = silhueta de guarda (`placeholder.guard`) | fragmentos 2 e 4 | Caçador do Colégio (com cão); serve também para os guardas do flashback | média |
| **Asterion jovem** = a arte do Asterion em escala menor | fragmento 2 | opcional: Asterion jovem, menor, **sem o chifre quebrado** (parado, investindo) | baixa |
| **Galerias** = o fundo `bg.galleries` (figuras vermelhas), escurecido | todos | câmara do Asterion; galeria repetível; arquivo do Calias | **alta** (câmara) |
| **Câmara dos três portais** = desenhada em código | descida da Lívia (sem o Asterion) e fragmento 4 | câmara dos três portais: **vista de frente** (fundo) e **em primeira pessoa** (do último degrau, para a descida) | **alta** |
| **Parede das letras** = pedra desenhada em código | mini-jogo de traçar (fragmento 2) | parede das letras (close-up) | média |
| **Mãos do Asterion** = desenhadas em código | mini-jogo de segurar a fera (fragmentos 3 e 4) | mãos do Asterion (close-up), opcional | baixa |

**Regras gerais:**
- **Referência de estilo:** anexe uma pose aprovada do Asterion (por exemplo `originais/personagens/asterion/asterion_parado.jpg`) como **referência de estilo** e peça uma imagem **nova**, não uma edição. Use um **chat novo** para cada peça.
- **Personagens:** figura inteira, de pé, de perfil ou três quartos, sobre **fundo terracota liso** (como o Asterion), sem chão, sem moldura e com margem em volta. O `npm run art:clean` remove o fundo (modo `"background": "auto"`).
- **Cenários:** imagem inteira, sem pessoas, em **vista de frente** (sem perspectiva), com a linha do chão a ~80% da altura, em 16:9.
- **Close-ups:** imagem inteira, sem pessoas.
- **Onde salvar:** coloque os originais em `originais/` e me avise.

**Modelo para personagens:**
```
Create a NEW illustration in the Greek BLACK-figure vase painting style, matching the reference image: solid black silhouette figures with fine incised lines revealing ochre details, on a plain flat terracotta background. Use the reference ONLY for style.

SUBJECT: [descrição]
POSE: [pose]

Full body, centered, generous empty margin. Plain flat terracotta background, no floor line, no border, no vase shape, no text, no watermark.
```

---

## 1. Personagens

| Quem | Descrição (SUBJECT) | Poses (uma por chat) | Prioridade |
|---|---|---|---|
| **Mirto** | `a thin Greek boy about eleven years old, short curly hair, simple short tunic, barefoot, carrying a round wicker basket with bread, a small clay oil lamp in his other hand (unlit)` | parado segurando a cesta e a lamparina; andando (passada); assustado (recuando, braços para cima); estendendo a mão com um pão | alta |
| **Asterion jovem** (flashback, opcional) | `the same Minotaur as the reference but much younger and smaller, a teenager, both horns intact, thinner, no chain scars yet` | parado; investindo | baixa |
| **Calias** (flashback) | `an old Greek scribe, thin and bent, long beard, half-blind with clouded eyes, a worn himation, holding a bronze stylus` | parado; riscando letras numa parede com o estilete (de perfil, braço erguido) | alta |
| **Quinto** | `a young Roman temple guard, barely a man, crested helmet too big for him, short tunic, leather cuirass, holding a burning torch` | de pé com a tocha erguida; sentado no chão segurando o tornozelo, tocha caída ao lado | alta |
| **Caçador do Colégio** | `a Roman hunter of the Augural College, hooded cloak, short spear, a large hunting dog on a leash beside him` | andando com o cão à frente; parado, cão farejando o chão | média |
| **Nísio** (opcional) | `a middle-aged Roman gatekeeper, heavy ring of bronze keys at the belt, tired face` | parado | baixa |

---

## 2. Cenários (16:9, vista de frente)

**Modelo:**
```
Create a NEW illustration in the Greek BLACK-figure vase painting style, matching the reference image's line work and palette (black shapes with fine incised ochre lines on terracotta). Use the reference ONLY for style.

SUBJECT: [descrição]

Flat frontal elevation for a side-scrolling 2D game background, no perspective. Floor line at about 80% of the image height. No people, no animals, no text, no watermark, no border. Wide 16:9.
```

| Cenário | SUBJECT | Notas |
|---|---|---|
| **Câmara do Asterion** | `the lair of a huge creature inside a stone labyrinth: rough stone walls covered with scratched ancient Greek letters and a repeated symbol of a closed eye (a circle crossed by a line), a bed of old straw, broken iron chains hanging from a ring in the wall, small niches carved in the wall, water dripping from a crack in the ceiling` | **prioridade máxima:** fragmentos 1 e 3 |
| **Galeria do labirinto (repetível)** | `a long corridor of an ancient stone labyrinth, heavy blocks, low arched ceiling, roots through the cracks, a few scratched letters on the walls. The left and right edges must match so the image can repeat side by side` | corridas e furtividade |
| **O Portão** | `a massive double bronze gate set in the rock at the end of a labyrinth corridor, carved with a large closed eye (a circle crossed by a horizontal line), heavy lock, darkness beyond the bars` | fragmento 4 |
| **Câmara dos três portais** | `a round underground chamber at the foot of a stone staircase, three tall stone portals side by side: the left one carved with a large closed eye (a circle crossed by a horizontal line) and closed by bronze bars, the middle one carved with stylized waves and slightly open, the right one perfectly smooth and blank with no carving at all, sealed` | fim da descida da Lívia **e** Portão do fragmento 4. Pode ser gerada também em **primeira pessoa** (vista do último degrau) para o mini-jogo da descida; nesse caso, peça a versão com perspectiva. |
| **Arquivo do Calias** (flashback) | `an underground archive in a labyrinth: shelves cut into the rock holding scrolls and wax tablets, a small writing desk with an oil lamp, a wall covered with letters scratched for teaching, one wall with an old list of names, the last line worn smooth` | fragmento 2 |

**Sem fogo pintado em nenhum:** a luz, as tochas e as chamas são desenhadas em código.

---

## 3. Close-ups (primeira pessoa)

| Cena | O que gerar | Notas |
|---|---|---|
| **Parede das letras** (traçar) | `a rough stone wall seen straight on, filling the whole image, with large ancient Greek letters deeply scratched into it by hand, uneven grooves` | as letras que o jogador traça são desenhadas em código por cima; a imagem é só a textura |
| **Mãos do Asterion** (segurar a fera) | `two enormous black-figure hands seen in first person, fingers half-clenched, old chain scars around the wrists, on a plain terracotta background` | opcional: o código pode desenhar as mãos, como faz com os braços da Lívia |

---

## Ordem sugerida

1. Mirto (parado e andando) e a câmara do Asterion: com isso o fragmento 1 fica jogável com arte final.
2. Calias e o arquivo (fragmento 2).
3. Quinto e a galeria repetível (fragmento 3).
4. Caçador e o Portão (fragmento 4).
5. Os opcionais por último.

Enquanto as imagens não chegam, eu uso **silhuetas provisórias**, como fiz no começo com a Lívia.
