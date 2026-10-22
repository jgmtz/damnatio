# Perfil no itch.io: kit pronto

Tudo para montar o seu perfil no itch.io com a cara do jogo: figuras vermelhas em vaso, meandro grego e fundo de verniz negro. As imagens saem das artes do próprio jogo (as faces do vaso do prólogo e o painel de meandro da interface). Para gerar de novo: `node tools/itch-kit.mjs`.

**A conta você cria:** eu não posso criar contas nem digitar senhas por você. O resto está pronto para copiar e colar.

## Arquivos

| Arquivo | Onde usar | Tamanho |
|---|---|---|
| `perfil/avatar.png` | foto do perfil (o touro atrás das grades) | 512 x 512 |
| `perfil/banner.png` | imagem do topo da página (as quatro faces do vaso entre duas faixas de meandro) | 1920 x 512 |
| `perfil/fundo.png` | imagem de fundo, repetida (verniz negro com craquelado) | 720 x 240, emenda sem costura |
| `perfil/banner_perfil.png` | **banner em uso no perfil**: "JGMTZ", o fio atado e "Narrative games painted like Greek vases", com as vestais e o touro nas pontas | 1920 x 440 |
| `jogo/tema/banner.png` | banner da página do jogo (título sobre as faces do vaso) | 1920 x 488 |
| `jogo/tema/embed.jpg` | fundo atrás do "Run game" (os três portais) | 1920 x 1080 |

As imagens de `perfil/banner_perfil.png` e `jogo/tema/` são feitas por `node tools/itch-page.mjs`.

**Tema aplicado (perfil e página do jogo):** fundo `#0C0907`, texto `#F1E3CF`, links `#D9B45A`, fonte Cormorant Garamond (títulos da página do jogo em Cinzel). Na página do jogo, "Screenshots" precisa estar em **Sidebar**: em "Auto", o itch esconde as capturas de jogos HTML.

## Passo a passo
1. **Criar a conta:** em [itch.io/register](https://itch.io/register), marque que você quer publicar jogos (*"I'm interested in distributing content on itch.io"*).
2. **Foto e nome:** em **Settings → Profile**, envie o `avatar.png` e preencha o *Display name*.
3. **Tema da página:** abra a sua página (`seunome.itch.io`) e clique em **Edit theme** no topo.
   - **Header / banner:** `banner.png`.
   - **Background image:** `fundo.png`, com *repeat* ligado. Sem imagem, use a cor de fundo abaixo.
   - **Cores:** a tabela abaixo.
   - **Fontes:** *Cinzel* nos títulos, se estiver na lista; senão, *Cormorant Garamond* ou outra serifada clássica. No texto, *Cormorant Garamond* ou *EB Garamond*.
   - Salve.
4. **Descrição:** cole uma das biografias abaixo no campo de texto da página do perfil.

## Cores (as mesmas do jogo)

| Campo no itch | Cor | O que é |
|---|---|---|
| Background (BG) | `#0C0907` | verniz negro do vaso |
| Secondary background (BG2) | `#1A1410` | painel um tom acima |
| Text | `#F1E3CF` | creme do papel |
| Link | `#D9B45A` | ouro dos títulos |
| Button | `#C8743A` | terracota das figuras |
| Button text | `#0C0907` | negro |

## Biografia

**English** (o jogo abre em inglês, e a maior parte do público do itch fala inglês):
```
Narrative games painted like Greek vases.

I'm making Damnatio: Every Thread Has a Price, a story of choices in an imagined Rome that swallowed Greece. A vestal losing her faith, the "monster" of the labyrinth, and a hero the world forgot: three lives tangled in the Threads of Fate. Every choice ties, cuts or tangles a thread, and every gift has a price.
```

**Português:**
```
Jogos narrativos pintados como vasos gregos.

Estou fazendo Damnatio: Todo Fio Tem um Preço, uma história de escolhas numa Roma imaginada que engoliu a Grécia. Uma vestal perdendo a fé, o "monstro" do labirinto e um herói que o mundo esqueceu: três vidas presas nos Fios do Destino. Cada escolha ata, corta ou emaranha um fio, e cada dom cobra um preço.
```

## A página do jogo: o que já está pronto
- `jogo/capa.png`: a capa (1260 x 1000, o dobro dos 630 x 500 que o itch pede). Mostra o touro atrás das grades, o fio dourado com o nó e o título na fonte do jogo.
- `jogo/capturas/`: seis capturas do jogo (1456 x 819):
  1. título;
  2. vaso do prólogo;
  3. escolhas no templo;
  4. labirinto do Asterion;
  5. mercado do Théron;
  6. mapa dos fios.

  E mais seis (1262 x 711), tiradas depois:
  7. copos na feira (mini-jogo do Théron);
  8. os fios do porteiro (mini-jogo do Théron);
  9. a descida da Lívia, com o Asterion saindo do escuro;
  10. um fio do destino sendo atado no templo;
  11. o Asterion traçando o próprio nome na pedra;
  12. as duas vozes do Asterion, diante do guarda ferido.

  Envie na ordem que preferir: a primeira aparece em destaque.

## Depois: o resto da página do jogo
Quando formos publicar, eu monto o kit da página do jogo:
- capa de 630 x 500;
- capturas de tela;
- descrição nos dois idiomas;
- créditos das músicas;
- aviso "só computador";
- o zip do build.

A página do jogo usa o mesmo editor de tema, então estas cores e o fundo servem lá também.
