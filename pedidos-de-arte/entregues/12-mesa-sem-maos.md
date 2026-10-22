# 12. Tampo do barril sem as mãos (jogo dos copos) — ENTREGUE

Chegou e está no jogo (2026-10-18): `fp.theron.table` aponta para `firstperson/theron/theron_mesa_sem_maos.jpg`, e a mão que se move voltou.

**Por quê:** no jogo dos copos (Théron 1), a mão do Théron agora se move até o copo enquanto o jogador segura. A pintura da mesa já tem as duas mãos dele, então ficavam três. Até a imagem nova chegar, o jogo esconde a mão que se move (`"tableHands": true` nos três copos do T1) e mostra só o anel.

| Arquivo em `originais/` | Id no jogo | Onde entra |
|---|---|---|
| `theron_mesa_sem_maos.jpg` | `fp.theron.table` | fundo do jogo dos copos (T1) |

## Como gerar
Aqui vale **editar** a imagem, e não pedir uma nova: o enquadramento precisa ser idêntico, porque os copos são colocados por cima nas posições da pintura.

1. Anexe `assets/art/firstperson/theron/theron_mesa.jpg` (o tampo já sem os copos).
2. Prompt:

```
Edit this image. Remove both hands and both sleeves completely. Where they were, continue the barrel exactly as it is around them: the wooden planks of the top with their grain, the rim of the barrel and its metal hoop, and the cream paper background at the bottom corners. Keep everything else identical: same framing, same size, same line style and colors. Do not add anything.
```

3. Se sobrar algum resto de dedo ou manga, peça: `Remove the remaining fingers/sleeve, keep everything else identical.`

Quando salvar, me avise: eu troco a imagem e devolvo a mão que se move.
