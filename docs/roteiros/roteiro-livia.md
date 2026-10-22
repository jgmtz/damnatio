# Roteiro — Lívia, Capítulo 1 (fase 2)

**Status:** aprovado pelo autor (inclusive a condenação da Domícia, a Iante sacerdotisa de Héstia e o nome do Théron no livro de votos) e **implementado** em `content/chapters/ch01/livia-01..04.json`, com textos em `content/strings/pt-BR/livia01..04.json`. Os desvios em relação a este roteiro estão listados no fim.
**Base:** GDD 4.2, 5.3–5.5, 7.1–7.5. Alvo: 4 fragmentos de ~6–7 min (~25–28 min no total), cada um com gancho, jogo e decisão, e no máximo ~2 min de texto sem input.

> **Nomes novos (todos provisórios):** **Cláudia** (noviça, amiga da Lívia), **Áugure Pórcio Varrão** (representante do Colégio Augural), **Iante** (a Peregrina) e **Díon** (filho dela). Os nomes definitivos estão em aberto no GDD 12.6.

---

## Variáveis (o que as escolhas guardam)

| Variável | Tipo | Para que serve |
|---|---|---|
| `livia:domicia`, `domicia:livia` | relação | confiança mútua; muda falas da Domícia e o desfecho dela |
| `livia:claudia` | relação | a noviça como aliada ou não; quem avisa a Lívia no fragmento 4 |
| `livia:varrao` | relação | como o Colégio vê a Lívia |
| `colegio_suspeita` | flag numérica (0–3) | o quanto o Colégio desconfia do Templo; pesa na condenação da Domícia |
| `livia_ouviu_o_chao` | flag | ela já ouviu o som sob o Templo (flashback ou fragmento 3); habilita o cruzamento com o Asterion |
| `livia_prometeu_peregrina` | flag | ela prometeu levar a brasa ao porto; habilita o cruzamento com o Théron |
| `livia_tentou_confessar` | flag | no flashback, tentou assumir a culpa |
| `colegio_procura_theron` | flag | eco para o Théron: o Colégio passa a procurar o nome (põe a Nerea em risco) |
| `domicia_condenada` | morte/destino | desfecho da Domícia no capítulo |
| `giftUses.livia` | contador | usos da Chama da Verdade; **a partir do 1º uso, opções "reconfortantes" somem** |
| destino `selo` | número | **não é moral:** sobe quando a Lívia sustenta a versão oficial e a ordem, desce quando ela questiona |

**Fios marcados** (atar, cortar, emaranhar) só nas decisões grandes: uma por fragmento, indicada abaixo com 🧵.

---

## Fragmento 1 — A Vigília (~7 min)

**Gancho:** antes do amanhecer, Cláudia jura que a chama "se curvou para o chão" durante a noite e que ouviu batidas sob o altar.

1. **Átrio, alvorada.** Cláudia corre até a Lívia. *Escolha:* acalmá-la com a doutrina ("A chama não se curva."), levá-la a sério ("Mostre-me onde.") ou repreendê-la ("Rumores ofendem Vesta."). Muda `livia:claudia`.
2. **Exploração:** atravessar o templo até o nicho, onde a Domícia espera. Outras Vestais aparecem como silhuetas no caminho.
3. **Domícia.** Primeira cena com ela: calor, autoridade, e uma frase que ela não termina. Ela avisa que um áugure do Colégio vem hoje "em visita de rotina" e repara nas cicatrizes das mãos da Lívia (gancho para o flashback). *Escolha:* perguntar por que o áugure vem (ela desconversa; primeiro sinal de que sabe mais) ou não perguntar.
4. **O ritual da chama** *(substituto do mini-jogo: 3 escolhas com tempo: o óleo, as palavras, o gesto).* A chama do cálice reage a cada passo. No fim, por um instante, a chama se inclina para o chão e revela uma **marca de selo antiga na pedra do altar**, que a Lívia nunca tinha visto. É a primeira manifestação involuntária da dádiva, sem explicação.
5. **O áugure Varrão chega** e pergunta, olhando para a chama: "Ela vacilou esta noite?" 🧵 *Decisão:*
   - **Contar a verdade** (fio cortado): o Colégio anota. `colegio_suspeita +1`, `livia:varrao +1`, `selo −1`.
   - **Mentir para proteger o Templo** (fio atado): `domicia:livia +1`, `selo +1`. A Domícia vê a mentira e não diz nada.
   - **Devolver a pergunta à Domícia** (fio emaranhado): a Domícia responde por ela, e o áugure repara. `colegio_suspeita +1`, `livia:domicia +1`.
6. **Fecho:** a sós, a Domícia diz: "Há coisas que a chama mostra e que a boca não deve repetir." Fim.

**Sinais plantados:** batidas sob o altar (Asterion), marca de selo (premissa), o Colégio de olho no Templo (destino da Domícia).

---

## Fragmento 2 — O Dia da Chama *(flashback jogável, ~6 min)*

**Tratamento visual:** filtro de flashback (tons de papiro e tinta invertida). A Lívia criança e a Domícia jovem aparecem como silhuetas.

**Gancho:** "Doze invernos antes." Primeira vigília da Lívia, aos sete anos. A Domícia: "A chama não pode ficar sozinha nem pelo tempo de um suspiro."

1. **Vigília da menina.** Diálogo curto e terno com a Domícia, que vai dormir no pórtico.
2. **Exploração com duas saídas** *(o jogador escolhe andando)*. Ela vai deixar o posto, e isso é fixo: só muda o motivo.
   - **À esquerda,** a música da festa da Vestália, do lado de fora → flag `flashback_seguiu_musica`.
   - **À direita,** uma voz que cantarola por uma fenda no chão → `livia_ouviu_o_chao` (sinal do Asterion).
3. **A chama se apaga por um instante.** Silêncio total; "todas as sombras do templo se inclinaram para o mesmo lado". A menina volta correndo e **reacende as brasas com as mãos nuas**: é a origem das cicatrizes, um evento fixo. É o tutorial de consequência: o fio dela treme na tela.
4. **Manhã. Um áugure pergunta quem deixou a chama sozinha.** A Domícia responde: "Fui eu." Ele avisa: **"Uma Vestal Máxima com duas faltas não é perdoada. Mentir ao Colégio é a segunda."** Esse é o sinal que torna justo o que pode acontecer no fragmento 4. 🧵 *Escolha da menina* (fio atado nos dois casos, de jeitos diferentes):
   - **Ficar em silêncio,** como o olhar da Domícia pede.
   - **Começar a confessar.** A Domícia corta: "A menina delira de febre." → `livia_tentou_confessar`.
   Nos dois casos a Domícia leva a culpa (fixo), e a punição dela é sugerida: "Domícia não usou as mãos por um mês."
5. **Volta ao presente:** a Lívia olha as cicatrizes. `livia:domicia +1`, ou +2 se tentou confessar.

---

## Fragmento 3 — A Peregrina (~7 min)

**Gancho:** uma mulher das Províncias Helênicas bate no portão do Templo ao entardecer.

1. **Exploração curta** até o portão, onde a Lívia está de guarda.
2. **Iante** conta que o filho, Díon, teve febre por nove dias. "O curandeiro disse que ele morreria no terceiro. Ele não morre. Anda à noite e repete as mesmas palavras." É um sinal do selo falhando (GDD 3.3), mas ninguém explica. Ela pede uma **brasa da chama de Vesta**, que nunca pode sair do Templo, "para que ele possa ir".
3. **Chama da Verdade, primeiro uso deliberado (opcional).** A Lívia pode erguer o cálice diante da Iante (pose `flame`). A chama revela que ela não mente sobre o filho, mas esconde algo: é sacerdotisa de um culto antigo de Héstia, "tolerado". `giftUses +1`, e a Lívia sente a fé rachar. *Se não usar,* ela só tem a palavra da mulher.
4. **A Domícia aparece no pórtico:** "O Templo não empresta Vesta." Ela é dura, mas há tristeza nos olhos.
5. 🧵 *Decisão:*
   - **Recusar, como manda a lei** (fio cortado): a Iante vai embora. `selo +1`.
   - **Prometer levar uma brasa ao porto depois do Rito** (fio atado): `livia_prometeu_peregrina`, `selo −1`. A Domícia, se ouviu, pode suspeitar (conforme `domicia:livia`).
   - **Oferecer uma bênção no lugar da brasa** (palavras de consolo): **trancada se a Lívia já usou a dádiva**, por ser opção "reconfortante". É o preço visível da dádiva, mostrado como opção bloqueada.
6. **Fecho, ao anoitecer:** as batidas sob o altar voltam, mais fortes. Se a Lívia levou a Cláudia a sério no fragmento 1, a Cláudia está com ela. *Escolha pequena:* contar à Domícia ou guardar segredo. → `livia_ouviu_o_chao`.

---

## Fragmento 4 — O Rito da Noite (~7 min)

**Gancho:** o grande rito noturno, com todas as Vestais e o áugure Varrão presente "como testemunha do Colégio".

1. **O rito** *(substituto do mini-jogo: 3 ou 4 escolhas com tempo, mais exigentes que as do fragmento 1).* No meio, **a chama vacila de verdade** diante de todos; a chama do cálice da Lívia cresce sozinha.
2. **O registro queimado.** O Varrão trouxe o antigo livro de votos do Templo, meio queimado, para "verificar os registros da Vestal Máxima". A chama passa por cima da página. *Escolha:* **usar a dádiva para ler a parte queimada** (`giftUses +1`) ou desviar o cálice.
   - Ao usar, ela revela duas coisas:
     - **Um nome que ninguém reconhece,** entre os juramentos de séculos atrás: **Théron**. O Varrão anota: "Quem é Théron?" → `colegio_procura_theron` (eco para a Nerea, GDD 7.4).
     - **O registro original da falta de doze anos atrás,** com a letra da Domícia raspada e o nome de uma menina por baixo.
3. 🧵 **Decisão final** (fio cortado). O Varrão pergunta à Lívia, diante de todas: "Quem deixou a chama sozinha, doze invernos atrás?"
   - **Confessar: "Fui eu."** É verdade, mas prova que a Domícia mentiu ao Colégio, a segunda falta. → `domicia_condenada`.
   - **Repetir a versão oficial** (a Domícia). A Domícia fica a salvo, *a menos que* `colegio_suspeita ≥ 2` e o registro tenha sido revelado: nesse caso o Varrão não acredita e leva a Domícia mesmo assim.
   - **Calar-se.** A Domícia responde por ela, e o resultado segue a mesma regra do item anterior.
   - **Se a Domícia é condenada:** ela é levada pelo Colégio. A cena é sugerida (o fio dela se tensiona e é cortado fora de quadro), e o castigo não é mostrado. **É uma troca, não um castigo:** a verdade tem um preço (GDD 7.5).
   - **Se ela sobrevive:** ela guarda um segredo e o diz pela metade ("Um dia vou te contar o que a chama queimou.").
4. **Cruzamento** *(substituto até a fase 6):*
   - Se `livia_prometeu_peregrina`: ela sai escondida com uma brasa até o porto e esbarra em "um homem que ninguém parece ver". → `crossover = livia-theron`.
   - Senão, se `livia_ouviu_o_chao`: ela segue as batidas e desce pelas galerias sob o altar, até ouvir uma respiração enorme no escuro. → `crossover = livia-asterion`.
   - Senão: ela fica no Templo; só sente os ecos.
   - Em todos os casos o fragmento termina num **gancho provisório**, e o encontro em si é escrito na fase 6.

---

## Notas de implementação (fase 2)

- **Silhuetas em SVG** para Domícia (adulta e jovem), Cláudia, Lívia criança, áugure (toga e bastão curvo), Iante e Vestais genéricas. Entram no manifesto de arte por id, trocáveis depois.
- **Flashback:** um campo novo `mode: "flashback"` no nó `stage`, que aplica um filtro visual ao palco. O nó `flashback` próprio fica para a fase 3, se ainda fizer sentido.
- **Ritual:** sequência de escolhas com tempo, e a chama do cálice reage a cada passo (`flame`). Errar o ritmo não é "falhar": só muda pequenos detalhes (comentário da Domícia, anotação do áugure).
- **Exploração com duas saídas** (flashback) já funciona com o motor atual.
- O rascunho de teste atual (`livia-01.json`) será substituído.

## O que mudou na implementação (em relação ao roteiro acima)

- **Fragmento 1:** "Estaremos prontas" sobe `domicia:livia` (a Domícia gosta da obediência). O gesto do ritual tem duas versões: baixar o cálice ou erguê-lo (pose `flame`). As duas mostram a marca no altar.
- **Fragmento 2:** o apagar da chama aparece como fio **emaranhado** (`fate_event`). Depois do apagão, há uma segunda caminhada curta ("Corra até o altar"). Pegar as brasas é uma escolha única com tempo: a única opção é agir.
- **Fragmento 3:** a pergunta "Ir para onde?" pode ser feita uma vez e volta para a mesma escolha. Na promessa, a Domícia **finge não ouvir** se `domicia:livia ≥ 1`; senão, chama a Lívia para dentro e a confiança cai. As batidas no fim **sempre** marcam `livia_ouviu_o_chao`.
- **Fragmento 4:**
  - "Segurar o cálice e esperar" no rito soma `colegio_suspeita +1`. É o que torna possível a condenação sem confissão: revelar o registro + suspeita ≥ 2.
  - Na condenação há uma escolha a mais: **rezar por ela** (bloqueada se a dádiva já foi usada, mostrando o preço) ou só olhar.
  - A morte da Domícia é registrada como `kill` (fio cortado) depois que ela sai de cena.
  - Se `livia:claudia ≥ 1`, a Cláudia dá uma dica de fuga.
  - Antes de descer às galerias há a escolha **descer** ou **voltar para a cama**; voltar leva ao desfecho "fica no Templo".
  - O porto e as galerias são cenas curtas sobre fundo preto, terminando num marcador `[Cruzamento ...: fase 6]`. No porto, o Théron aparece como **"Desconhecido"**.
- **Distribuição dos desfechos** (400 partidas aleatórias no teste): Domícia condenada em ~42%; cruzamento com Théron ~37%, Asterion ~30%, nenhum ~33%.
