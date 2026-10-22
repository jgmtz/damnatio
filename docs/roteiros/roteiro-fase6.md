# Fase 6 — Prólogo, cruzamentos e gancho final (proposta)

**Status (2026-10-17):** aprovado e implementado, aguardando o teste do autor. Decisões do autor:
- o mito do prólogo é recitado por **um áugure do Colégio**;
- a cena do porto fica **como proposta** (confiar a brasa / esperar a Iante / levar de volta; dizer o nome);
- o túnel tem o **trecho jogável curto pelo Asterion** (farejando o homem sem som);
- no gancho final **varia só a figura** diante do altar (Lívia, se voltou ao Templo; senão, Cláudia).

**Diferenças em relação à proposta:**
- **No prólogo,** os três fios do tutorial são todos dourados (a tira pintada do fio não aceita cor). Os dois sólidos se chamam "uma vestal" e "o que vive embaixo", e o terceiro, sem nome, é o fio-fantasma. Há também "um fio solto" para cortar. O mini-jogo termina no primeiro gesto (atar, cortar ou deixar), e cada um ganha uma linha.
- **No túnel,** as opções "o menino está vivo" e "sinto muito" só aparecem depois da dádiva (`c_door2`).
- **No gancho,** o emaranhado é o `fate_event` `tangle` (a animação de emaranhar), e não o redesenho dos fios do mapa.

Pedidos de arte: `pedidos-de-arte/entregues/11-fase6.md`.
**Base:** GDD 7.3 (ordem), 7.4 (cruzamentos), 7.6 (encerramento), 7.7 (tempos), 3.2 (o segredo que a demo **não** revela), 5.7 (decisões com construção).
**Fora desta fase:** o som (GDD 9), que vem depois, com recomendações de trilha por parte do jogo.

## O que falta hoje
| Peça | Estado atual | Onde |
|---|---|---|
| Prólogo | não existe; o jogo começa direto na Lívia 1 | `chapter.json` → `order` |
| Lívia ↔ Théron | 5 falas no porto e o marcador `[Cruzamento ...: fase 6]` | `livia-04` `dp7` |
| Asterion ↔ Théron | 1 fala ("algo respira no escuro") e o marcador | `theron-04` `d_asterion2` |
| Gancho final | não existe; depois do T4 vem direto a tela "fim do capítulo" | — |

Lívia ↔ Asterion já está completo (L4 descida + A4 com a Lívia).

---

## 1. Prólogo — "O Fuso" (~4 min)

**Função (GDD 7.7):** fios, mundo e tutorial. Ensina, **antes** da Lívia, as três coisas que o jogador vai usar o capítulo todo:
1. que escolhas viram fios;
2. que os fios podem ser atados, cortados ou emaranhados;
3. que cada um dos três protagonistas tem um fio diferente.

Não revela Átropos nem a Guerra Esquecida (GDD 3.2).

**Três tempos:**
1. **O mito oficial (mundo).** Um vaso gira devagar, e cada face mostra uma pintura do império:
   - Aurélia;
   - a Chama de Vesta, que "mantém a ordem";
   - o monstro trancado no labirinto;
   - as Vestais.
   Uma voz recita a versão oficial, a mesma em que a Lívia acredita (GDD 7.3: aprendemos o mundo pelos olhos dela). O jogador **gira o vaso** (arrastar ou setas) para passar as faces.
2. **Os três fios (tutorial, mãos no controle).** O vaso para. Por trás da pintura aparecem três fios, cada um com a cor da cerâmica do dono:
   - **vermelho:** a Lívia;
   - **negro:** o Asterion;
   - **branco quase invisível:** o Théron.
   O jogador **ata** dois fios e **corta** um fio solto, no mini-jogo `threads` em modo guiado. Ao tentar segurar o fio branco, a mão passa através dele: ele já foi cortado. Sem explicação, só o estranhamento.
3. **A rachadura (gancho).** Um fio do império, o maior, treme. A chama pintada no vaso vacila por um instante. Corte para o título do capítulo, e a Lívia 1 começa.

**Decisão do jogador no prólogo:** nenhuma, de propósito. É o único trecho sem escolha, para ensinar sem cobrar.

**Arte nova:**
- três ou quatro faces do vaso do império (figuras vermelhas, uma por cena);
- o próprio vaso girando pode ser feito em código, com as faces coladas numa faixa.

---

## 2. Lívia ↔ Théron — "Fogo de templo" (dentro da L4, no lugar de `dp7`, ~4 min)

**Situação (já implementada):** a Lívia saiu escondida com a brasa prometida à Iante. A Iante não está lá. Há um homem encostado num pilar que os marinheiros não veem. Ela **vê**.

**O que esta cena precisa pagar:**
- **a promessa à Iante:** é a escolha da Lívia que hoje fica sem resposta (avaliação, parte 8);
- **o nome:** o Théron no livro de votos queimado (L4);
- **o aviso da Nerea:** já existe (`dp6b`/`dp6c`).

**Roteiro:**
1. **A conversa curta (já existe):** "Fogo de templo atrai gente que quer coisas" / "Quem é você?" / "Ninguém."
2. **A chama dele.** Perto dele, a chama do cálice se inclina, como diante do portal apagado.
   - **Janela de dádiva**, com `giftHint`: *"Por que ninguém olha para ele?"*
   - **Se ela ergue o cálice:** a chama mostra um fio cortado e mal atado na mão dele. Por um instante, a Lívia **lê o nome que ele não disse**, com as letras que escorriam da cera no livro de votos. `giftUses.livia +1`, o preço dela.
3. **A brasa.** Ela tem que voltar antes da vigília seguinte, e a Iante não veio.
   🧵 **Decisão da Lívia (escolha com fio):**
   - **Confiar a brasa a ele** ("Entregue à Iante. Ela vem amanhã.") → `livia_brasa_com_theron`. Fio **atado**.
   - **Esperar a Iante até o limite** → ela volta tarde: `colegio_suspeita +1` e `colegio_alerta +1`. A Iante chega, recebe a brasa, e a promessa é cumprida pela própria Lívia. Fio **atado**, com custo.
   - **Levar a brasa de volta** → a promessa se quebra. Fio **cortado**.
   - **(Só se ergueu o cálice) Dizer o nome dele:** "Théron." Pode vir junto com qualquer das três opções acima, como uma fala antes da escolha.
4. **Fecho:** ele pega a brasa, ou não. Ela vai embora e, na esquina, já não lembra direito do rosto dele, só da chama inclinada. É o preço dele, visto por fora.

**Como volta no T4 (do lado dele):**
- **Com `livia_brasa_com_theron`:** o Théron tem a brasa no cinto. Diante da Iante, abre-se uma opção nova: entregar a brasa ("a sacerdotisa cumpriu"). O luto da Iante acalma (`iante_sem_luto`), e o pedido da chave muda de tom. A brasa é um item que vira fala, como pede a regra dos itens.
- **Se ela disse o nome dele:** o pensamento `t_livia` vira "Ela disse meu nome. Ninguém diz meu nome." Laço `+1`, porque ser lembrado o segura. A presença dele também volta um pouco.
- **Se ela esperou:** a Iante já tem a brasa, e a fala `d02_missed` vira gratidão.

---

## 3. Asterion ↔ Théron — "O homem que não faz som" (dentro do T4, no lugar de `d_asterion2`, ~4 min)

**Quando:** ninguém cruzou com a Lívia, e a entrega do Théron passa pelo túnel das ondas, até a câmara dos portais. É o caso `default` de `b_asterion`.

**Onde está o Asterion:** em todas as versões do A4, ele termina **atrás do Portão** do olho fechado. Os dois ficam um de cada lado do bronze.

**A simetria (o centro da cena):**
- o Asterion se guia **pelo som**, e o Théron **não faz som** (o mundo não segura nada dele);
- o Théron vê **fios**, e o fio do Asterion é grosso, e um deles parece com o dele: cortado e atado de novo (GDD 4.1: a maldição é efeito do selo);
- nenhum dos dois consegue saber do outro do jeito de costume.

**Roteiro (troca de ponto de vista dentro do T4):**
1. **Lado do Théron:** a respiração atrás do portal (a fala que já existe). Ele encosta a mão no bronze.
2. **Lado do Asterion** (escuro, curto, no estilo do A1): o modo `dark`.
   - Não há anel de som onde o Théron está, mas há **cheiro**: F fareja, e aparece um fio claro, de pessoa, que não faz barulho.
   - O pensamento depende da fera: o homem pergunta "...você é um fantasma?"; a fera diz "sem som. caçador."
3. **Lado do Théron, a decisão.** Ele sabe uma coisa que o Asterion não sabe: no T2, **foi ele quem cortou o fio do Nísio**, o chaveiro, e por isso o Portão abriu para o Mirto (`nisio_fio_cortado`).
   🧵 **Decisão do Théron:**
   - **Contar** ("Fui eu que abri o seu portão."): o Asterion bate uma vez no bronze. É o código das batidas da Lívia. Fio **atado**.
   - **Calar e seguir a entrega:** fio **cortado**. O Asterion só sente o cheiro indo embora.
   - **Olhar o fio do monstro** (a dádiva; Laço `−1` e presença): ele vê o fio do Mirto preso ao do Asterion, ou a ponta cortada, se o Mirto morreu. Sabe então o que dizer, e abre-se uma opção a mais: "O menino está vivo" ou "Sinto muito pelo menino".
   - **Sem `nisio_fio_cortado`:** a primeira opção não existe. Ele só tem a dádiva ou o silêncio.
4. **Fecho:** a urna pesa. Ele continua a entrega, e a cena segue para o `b_contract2` que já existe.

**Eco no futuro:** grava `asterion_conhece_theron` (`batida` ou `silencio`) para o Capítulo 2. Sem outro efeito no Capítulo 1, como pede a regra de ouro do GDD 7.1.

---

## 4. Gancho final — "A Chama Vacila" (~2 min, depois do T4, antes do "fim do capítulo")

**GDD 7.6:** fixo, igual para todos. A chama de Vesta oscila, e os fios se emaranham por um instante, sem mudar a trama.

**Roteiro:**
1. **O Templo à noite**, a chama do altar. Quem cuida dela é a Lívia, se voltou ao Templo; senão, a Cláudia. É o único detalhe que varia, e só de figura: a cena é a mesma.
2. **A chama vacila.** A cena sai do friso e mostra **todos os fios do capítulo** (os do mapa desta partida). Eles se emaranham por um instante, com a animação de emaranhar, e se soltam.
3. **A câmara dos três portais**, por um segundo, sem ninguém. No portal liso, uma rachadura fina. A chama se inclina para ela.
4. **Título:** "Capítulo 2". Depois, a tela "O que ficou" e o mapa dos fios, que já existem.

**Arte nova:** nenhuma obrigatória. O templo, os portais e os fios já existem. É opcional uma vista do portal liso com a rachadura.

---

## Tempo total estimado
Prólogo ~4 + porto ~4 + túnel ~4 + gancho ~2 = **~14 min** a mais. O capítulo fica perto de 1h30 a 1h45.
