# Proposta: fluidez do Théron e decisões com construção

**Status:** implementado em 2026-10-17 (seção 9), aguardando o teste do autor. O autor validou as opções A a E, manteve as mortes possíveis no Capítulo 1 e pediu que a dádiva sempre tenha um motivo.

---

## 1. As cenas do Théron

### 1.1 Corrigido durante a revisão
- **Retratos das vítimas e do Caio:** o busto inteiro (quadrado) saía da caixa de diálogo e cobria o nome de quem fala. Agora o retrato usa um recorte de cabeça e ombros, na proporção do retrato do Théron (`<id>.portrait`). O busto inteiro continua no canto do jogo dos copos.
- **T1, a Nerea deslizava sentada:** o nó `s_nerea` movia a Nerea, que está na pose de remendar, de x 3480 para 2960, e ela parava em cima da vítima, ainda em pé em 2900. Agora a vítima vai embora depois do golpe, a Nerea fica onde está e o Théron é quem caminha até ela.

### 1.2 Medidas
Falas são os nós de diálogo e de pensamento.

| Fragmento | Nós | Falas | Texto | Pontos de input | Maior trecho só de "avançar" |
|---|---|---|---|---|---|
| T1 Dia de Feira | 41 | 24 | 1.844 caracteres | 6 | 7 falas (depois dos copos até a Nerea) |
| T2 O Esquecimento | 29 | 20 | 1.955 | 4 | 4 falas (o preço depois dos fios) |
| T3 O Contrato | 25 | 18 | 1.599 | 4 | 4 falas, 490 caracteres (o monólogo do Caio) |
| T4 A Entrega | 79 | 51 | 5.022 | 7 | 4 falas, várias vezes seguidas |

O T4 tem quase 3 vezes o texto do T3 e empilha dez momentos em sequência:
1. o capanga do patrício;
2. a lembrança da Lívia;
3. o escriba;
4. a chave;
5. o túnel;
6. o Quinto;
7. os portais;
8. o Asterion;
9. a urna;
10. a Nerea.

### 1.3 Melhorias de fluidez sugeridas

| # | Onde | O problema | Sugestão |
|---|---|---|---|
| F1 | T1, abertura | O Théron grita "Cheguem mais perto!" para um mercado vazio, e 3 falas seguidas abrem o fragmento. | Pôr 2 ou 3 curiosos que se aproximam e vão embora, ou transformar o pregão numa escolha rápida (que história contar sobre o dente), com a reação da multidão. |
| F2 | T1, depois dos copos | 7 falas seguidas até a Nerea dizer "Théron." | Fazer da ida até a Nerea uma pequena exploração: o jogador anda pelo mercado, e ela fala o nome quando ele passa perto. O susto acontece no meio de uma ação, não numa fala. |
| F3 | T2, a dádiva | Usar os fios é uma opção de menu (`c02`). Na Lívia, a dádiva é uma ação livre (F) dentro das falas. | Oferecer os fios como ação livre (F) durante toda a negociação, e não como uma escolha à parte. É mais coerente com a Lívia, e o jogador decide quando usar. |
| F4 | T3, abertura | O Caio fala 3 vezes seguidas (490 caracteres) antes de qualquer resposta. | Intercalar com uma escolha de postura do Théron (provocar, calar, examinar a urna enquanto o Caio fala), ou deixar a exploração da sala correr enquanto ele fala. |
| F5 | T4 inteiro | É longo demais e tem muitas narrações de eco. | (a) O escriba e a lembrança da Lívia viram **imagem**, sem narração: o escriba aparece ao fundo com os guardas, e a sacerdotisa é uma figura pintada no cais. (b) O Quinto vira um blefe ou uma passagem furtiva, não 4 falas. (c) A volta ao mercado para a Nerea vira uma caminhada curta. Meta: perto de 3.000 caracteres. |
| F6 | T4, roubo da chave | Usa o jogo dos copos sem o barril, com copos desenhados em código, para tirar uma chave de um cinto. | Uma variação com a arte do cinto: a chave balança e é preciso pegá-la quando a Iante olha para o mar. É a mesma lógica dos copos (o olhar da vítima), com um pedido de arte. |
| F7 | T4, exploração do porto | O cinto da Iante pode ser examinado em x 1180, mas ela está em 1480: ele examina o cinto a 300 px de distância. | Pôr o objeto colado à personagem, ou examinar ao chegar perto dela. |
| F8 | Presença | A figura e o nome esmaecem aos poucos, mas o jogador não sente o momento em que perde presença. | Marcar cada perda com um "eco": por um instante, todas as figuras em cena olham para outro lado, e o nome dele pisca na caixa. É curto, sem texto. |

---

## 2. Por que as decisões parecem desconexas

### 2.1 O que o conteúdo mostra
- **29 escolhas no capítulo, 12 delas marcadas com fio** (atar, cortar ou emaranhar). Quase todo fragmento termina numa escolha com fio que decide o desfecho sozinha.
- **59 marcas são gravadas e nunca lidas** (cerca de 50 sem contar as mortes). Exemplos:
  - `theron_vitima`, `nerea_conversou` e `nerea_golpe`;
  - `livia_tentou_confessar`, `livia_confessou` e `livia_prece_propria`;
  - `quinto_poupado`, `quinto_vivo` e `theron_protege_iante`;
  - as relações `livia:domicia`, `nerea:theron` e `iante:theron`;
  - as trilhas `fate: selo` e `fate: porta`, que somam em 14 e 10 lugares e não são lidas em nenhum.

  Ou seja, o jogo já registra a construção, mas não a usa. Só o nó final decide.
- **Consequências graves que dependem de um nó só:**

| Consequência | Hoje depende de | Construção antes |
|---|---|---|
| **Quinto morre** (A3) | Uma opção ("Atacar" ou "É fácil") e o mini-jogo de segurar a fera | Só a fera. A escolha aparece sem que o Quinto tenha sido construído antes |
| **Nerea morre ou é levada** (T4) | `nerea_ameacada` (automático no T3, se ele falou com ela no T1), `colegio_procura_theron` (L4) e a urna (T4) | Três peças, mas **o jogador não vê a ligação**: nenhuma cena avisa que a Nerea corre perigo, nem dá chance de protegê-la |
| **Mirto morre** (A4) | A escolha final e o caminho padrão de um ramo | Parcial (`quinto_ajudado`, `colegio_sabe_do_mirto`), mas o jogador não sabe que isso pesa |
| **Domícia é condenada** (L4) | `registro_revelado` + `colegio_suspeita` ≥ 2, ou a resposta no interrogatório | **Bom exemplo:** a suspeita se acumula desde a L1. Falta só mostrar isso ao jogador |
| **Iante sem luto ou sem esperança** (T4) | Um gesto no mini-jogo de fios | Nenhuma. É a primeira cena em que o Théron a conhece |

### 2.2 O que já funciona: a fera do Asterion
A fera é o modelo a seguir:
- **soma** de muitas escolhas pequenas (rosnar, bater na pedra, investir);
- **aparece** na tela (bordas vermelhas, o andar aos trancos, a voz da fera);
- **muda as opções** depois (as gentis se trancam), em vez de decidir um desfecho de uma vez.

Quando o Asterion fere alguém no A3, o jogador sente que **chegou lá**, e não que caiu numa armadilha de uma fala só.

---

## 3. Opções para dar construção às decisões

As opções podem ser combinadas. Todas usam o que o motor já tem: marcas, contadores, relações e condições `min`/`max`.

### Opção A: "Três passos" para toda consequência grave
Toda consequência que muda um personagem (morte, prisão, esquecimento) precisa de três momentos:
1. **Semente:** o personagem é apresentado, e o jogador cria um laço ou um conflito com ele.
2. **Aviso:** um sinal claro de que ele está em risco, com **uma chance de agir**.
3. **Consequência:** o desfecho lê o que o jogador fez nos dois passos anteriores, não só a última escolha.

**Exemplo, a Nerea:**
- **T1 (semente):** como hoje.
- **T2 (aviso):** a Nerea aparece no porto quando o Théron sai da casa do Nísio. Ela diz que "homens do Colégio perguntaram por um homem de túnica rasgada". O jogador pode mandá-la sumir por uns dias, ficar com ela ou ignorar.
- **T3:** o Caio só a ameaça se ela ainda está à vista.
- **T4 (consequência):** depende do aviso, da relação acumulada e da urna. Se ele a escondeu no T2, ela sobrevive mesmo com a ameaça. Se ignorou, a morte é possível.

**Exemplo, o Quinto:** apresentá-lo no A2 (um guarda jovem que hesita e deixa cair o pão para o Asterion), para que, no A3, atacá-lo pese.

- **A favor:** é a mudança mais natural e respeita o pilar "consequências anunciadas por sinais" (GDD 2).
- **Contra:** exige cenas novas, curtas, em fragmentos anteriores (mais texto e ajustes de roteiro).

### Opção B: contadores por protagonista (o modelo da fera para todos)
Cada protagonista ganha **um** contador visível que soma as pequenas escolhas. As decisões grandes passam a ser **condicionadas** por ele, como a fera tranca as opções gentis.

| Protagonista | Contador | Soma com | Aparece como |
|---|---|---|---|
| Lívia | **Selo**: verdade × proteção. Já existe (`fate: selo`) e nunca é lido | dizer a verdade ao Colégio, confessar, mentir por Domícia | a chama mais azul (verdade) ou mais quente (proteção), e opções que se abrem ou se trancam |
| Asterion | **Fera**: já existe | como hoje | como hoje |
| Théron | **Presença**: já existe (dádiva) + **Laço**, novo | Laço: falar com a Nerea, poupar a Iante, proteger alguém, devolver o que roubou | Laço: os outros olham para ele e dizem o nome; com Laço alto, aparecem opções que só um homem lembrado tem |

Os desfechos graves passam a exigir **acúmulo**, e não uma fala. Exemplos:
- "Entregar a Iante" só fica pesado se o Laço estiver baixo.
- Com o Laço alto, o Théron **não consegue** cortar o luto dela: a opção fica trancada e aparece riscada, como as opções gentis do Asterion.

- **A favor:** usa o que já existe e dá ao jogador a sensação de "fui eu que construí isso".
- **Contra:** precisa de cuidado no equilíbrio, e um contador demais vira um "medidor moral" (o GDD 2 proíbe). Por isso, um só por protagonista, sem número na tela, só com sinais.

### Opção C: o mesmo dilema, em escalas crescentes
Cada protagonista enfrenta **o seu dilema central** 3 ou 4 vezes, do pequeno ao grande. A decisão final é a mesma pergunta, agora com tudo em jogo:
- **Lívia:** a verdade ou proteger quem ela ama. No L1, mentir sobre a chama por Domícia; no L2, a confissão da menina; no L3, contar as batidas ou guardar segredo; no L4, o interrogatório.
- **Asterion:** o homem ou a fera. Já é assim.
- **Théron:** usar as pessoas ou ser lembrado por elas. No T1, aplicar o golpe ou não; no T2, cortar o fio do Nísio ou convencer com palavras; no T3, aceitar o contrato; no T4, a Iante.

Na decisão final, um pensamento retoma as escolhas anteriores ("Da última vez, eu deixei a Nerea falar"), para o jogador ver o fio que ele mesmo puxou.

- **A favor:** dá unidade dramática; cada fragmento ensaia o final.
- **Contra:** exige reescrever as escolhas dos fragmentos 1 a 3 para que elas sejam o mesmo dilema.

### Opção D: consequências graduais, em vez de vida ou morte
Trocar os desfechos binários por uma escala. Por exemplo, para a Nerea:

| Pior | ← | → | Melhor |
|---|---|---|---|
| morre | é presa | foge da cidade e esquece o nome dele | fica, e lembra |

Cada passo negativo pede **mais um** erro acumulado. A morte só acontece quando tudo deu errado (ameaça + Colégio + urna entregue + ela não foi avisada). Também vale para o Quinto (ferido / morto) e o Mirto (perdido no labirinto / morto).

- **A favor:** as decisões continuam abalando, mas a morte vira raridade construída, e não sorte de um clique.
- **Contra:** mais desfechos para escrever (e mais artes de estado, como "ferido").

### Opção E: ecos que costuram os três protagonistas
Algumas marcas passam a ser **compartilhadas**. Por exemplo, `colegio_alerta` somaria:
- a Lívia contando ao Colégio;
- o Théron pego no mercado;
- o Asterion rachando a pedra.

Com o alerta alto, há mais guardas no A3, o Caio sabe mais no T3 e o Colégio procura a Nerea. Assim, uma morte no fim é produto **do capítulo inteiro**, e o jogador entende por quê no mapa dos fios.

- **A favor:** reforça a ideia central do jogo (todo fio tem um preço, e os fios se cruzam).
- **Contra:** fica mais difícil explicar a causa. Precisa de sinais claros, como uma linha no mapa dos fios que ligue as causas.

---

## 4. Recomendação

Combinar **A + B**, e usar a **D** só para as mortes:
1. **Contadores (B):**
   - ler o `selo` da Lívia, que já é gravado e nunca lido;
   - criar o **Laço** do Théron;
   - manter a fera.
   Todos aparecem só como sinais, sem número.
2. **Três passos (A)** para as quatro consequências mais graves: Nerea, Quinto, Mirto e Iante. Cada uma ganha uma cena de aviso, curta, num fragmento anterior, com uma chance de agir.
3. **Mortes graduais (D):** a morte só como o último degrau, quando o contador e o aviso apontam para o mesmo lado.
4. **Aproveitar as marcas que nunca são lidas:** muitas já guardam exatamente a construção que falta (`nerea_conversou`, `livia_tentou_confessar`, `quinto_poupado`, `theron_vitima`…). Elas viram falas diferentes e opções abertas ou trancadas, sem precisar de cenas novas.

**Ordem sugerida:**
1. Nerea e Théron (é o que está mais fresco e é o caso mais desconexo).
2. Quinto e Mirto.
3. Lívia e Domícia, que só precisam de sinais, porque a construção já existe.
4. As melhorias de fluidez F1 a F8, junto com cada fragmento mexido.

## 5. Perguntas para o autor
1. Quais opções você quer: A, B, C, D, E, ou a combinação recomendada?
2. Os contadores devem aparecer só por sinais (como a fera) ou ter algum indicador discreto na tela dos fios?
3. As mortes devem continuar possíveis no Capítulo 1? Ou o Capítulo 1 só ameaça, e as mortes ficam para quando a construção for mais longa?
4. Posso acrescentar cenas curtas de aviso em fragmentos já aprovados (ex.: a Nerea no fim do T2, o Quinto no A2)?
5. Das melhorias de fluidez F1 a F8, alguma você não quer?

---

## 6. Respostas do autor
1. **Usar todas as opções (A a E).** O jogo pode ficar maior, desde que seja o mais imersivo possível: **o jogador deve ter as mesmas dúvidas que o personagem** e pensar para decidir.
2. **As mortes continuam possíveis** no Capítulo 1.
3. As cenas de aviso estão explicadas na seção 8. Em aberto: as perguntas 2 e 5 da seção 5.

---

## 7. O que faz um jogo de escolhas prender o jogador

O tempo de tela conta, mas sozinho não basta: ele precisa ser tempo **fazendo coisas com** o personagem, não só lendo sobre ele. Estas são as táticas que os melhores jogos do gênero usam (*The Walking Dead*, *Detroit*, *The Witcher 3*, *Disco Elysium*, *Pentiment*, *Papers, Please*, *Oxenfree*, *Firewatch*), com o que cada uma pede ao nosso jogo.

### 7.1 O jogador sabe o mesmo que o personagem
- **A tática:** a dúvida só é real se o jogador não tem mais informação que o personagem. Em *Pentiment*, você precisa acusar alguém pelo assassinato e o jogo nunca diz quem foi. A dúvida dura até depois do fim.
- **Aqui:**
  - os avisos devem ser **ambíguos** ("perguntaram por um homem de túnica rasgada" pode ser nada);
  - o narrador nunca confirma o perigo;
  - o mapa dos fios só aparece **depois** do fragmento, como já é hoje.

### 7.2 Dilemas sem resposta certa
- **A tática:** as melhores escolhas opõem **dois valores bons**, e não o bem contra o mal. Na missão do Barão Sangrento (*Witcher 3*), toda opção salva alguém e condena outro. Quando uma opção é claramente "a má", o jogador não pensa: escolhe pela sua moral e não pela do personagem.
- **Aqui:** toda escolha com fio passa a ter **custo dos dois lados**. O Quinto já funciona assim: matá-lo protege o Mirto, ajudá-lo cria uma testemunha.
  - **Um teste para cada opção:** "alguém razoável escolheria isto?". Se a resposta for não, a opção está mal escrita.

### 7.3 Reconhecer na hora, pagar depois
- **A tática:** *The Walking Dead* avisava "Clementine vai lembrar disso". O que prende não é a consequência distante: é saber **na hora** que o mundo registrou, e depois **ver** o registro voltar.
- **Aqui:**
  - **Na hora:** um sinal sem texto (o fio treme, a pessoa desvia o olhar, a chama muda de cor). O nosso equivalente é o fio da tela, que hoje só aparece nas escolhas grandes. Ele pode aparecer, fraco, também nas pequenas que contam.
  - **Depois:** a fala ou a opção que volta ("Da última vez, você me deixou falar").

### 7.4 Escolhas pequenas que dizem quem o personagem é
- **A tática:** antes de pedir uma decisão grave, os jogos dão muitas escolhas **expressivas**, de tom e de postura, que não mudam a trama. Elas fazem o jogador **construir** o personagem, e na hora grave ele decide como "o seu" Théron decidiria.
- **Aqui:** é o motor da opção B. Provocar ou calar diante do Caio (F4), que história contar sobre o dente (F1): cada uma soma pouco no Laço, e o jogador sente que o resultado foi dele.

### 7.5 Fazer junto, não só conversar
- **A tática:** o vínculo nasce de **atividades compartilhadas**:
  - em *The Last of Us*, Ellie e Joel passam a pé por uma cidade;
  - em *Firewatch* e *Oxenfree*, a conversa acontece **enquanto você anda**, e você pode responder, interromper ou ficar quieto.

  O tempo de tela que funciona é esse.
- **Aqui:**
  - a Nerea **ajuda** o Théron em alguma coisa (costura a túnica rasgada, esconde a pedrinha dos copos);
  - o Mirto anda com o Asterion;
  - a Domícia ensina a Lívia a cuidar da chama.

  Falas durante a exploração (F2), e não paradas.

### 7.6 A escolha feita com as mãos
- **A tática:** em *Papers, Please*, o carimbo é a escolha; em *Detroit*, apertar o gatilho é um gesto. Quando a decisão é um **ato**, ela pesa mais que um clique numa lista.
- **Aqui:** já é o forte do jogo: cortar o fio arrastando, segurar a fera, erguer o cálice (F). Ampliar:
  - **F3:** os fios do Théron viram ação livre;
  - **não fazer nada** também conta como escolha (deixar o tempo correr, soltar o mouse).

### 7.7 Tempo de decidir, na medida
- **A tática:** o cronômetro tira o jogador do cálculo e o põe no instinto, mas cansa se aparecer sempre. *The Walking Dead* usa o tempo nas cenas de pânico; nas decisões morais grandes, deixa pensar.
- **Aqui:** cronômetro só quando **o personagem** também não tem tempo (o Caio esperando a resposta, os cães descendo). Nas escolhas finais, sem cronômetro, mas com uma **pausa de peso**: a câmera fecha, o som cai, o fio aparece antes das opções.

### 7.8 A dúvida dentro da cabeça
- **A tática:** em *Disco Elysium*, as habilidades do personagem discutem entre si e dão conselhos ruins. O jogador ouve **as duas vozes** e decide qual seguir.
- **Aqui:**
  - as "Duas vozes" do Asterion já fazem isso;
  - estender, com moderação, à Lívia (a voz da Domícia e a voz do Colégio) e ao Théron (o golpista e o herói esquecido);
  - **regra:** as duas vozes têm razão.

### 7.9 Consequência que se vê, não que se lê
- **A tática:** nos jogos de escolha, o mais forte é a **ausência**. Uma cadeira vazia, um nome que ninguém diz, uma banca fechada no mercado.
- **Aqui:**
  - se a Nerea morreu, a banca de remendos fica vazia no próximo mercado;
  - se o Quinto morreu, a tocha dele não sobe a escada;
  - **sem narração explicando.**

### 7.10 Ritmo: tensão e respiro
- **A tática:** depois de uma decisão grave, uma cena **quieta**, curta, sem escolha, em que o jogador digere o que fez. Duas decisões graves seguidas se anulam.
- **Aqui:**
  - nunca duas escolhas com fio seguidas;
  - depois de cada uma, 10 a 20 segundos de caminhada ou de imagem (o Théron sozinho no cais);
  - o T4, que hoje empilha dez momentos, ganha esses respiros quando for enxugado (F5).

### 7.11 Não punir a curiosidade
- **A tática:** o jogador que examina tudo e conversa com todos deve ganhar **informação**, não castigo. Isso ensina a prestar atenção, e prestar atenção é imersão.
- **Aqui:** examinar objetos destrava opções (já é assim). Os avisos podem ter **pistas extras** para quem examina (a tabuleta do Quinto com o caco do Mirto).

---

## 8. As cenas de aviso, explicadas

### 8.1 O que é
É o **segundo passo** dos "três passos" (opção A): uma cena **curta** (30 a 90 segundos de jogo), num fragmento **anterior** ao da consequência, que faz três coisas:
1. **Mostra o perigo dentro do mundo**, por um personagem ou um objeto, nunca pelo narrador.
2. **Dá uma chance de agir**: uma escolha, uma ação ou um objeto para examinar.
3. **Fica gravada**, e a consequência lê o que o jogador fez.

Ela não é um fragmento novo. É um trecho dentro de um fragmento que já existe, no lugar de algumas falas ou junto de uma exploração.

### 8.2 Regras
- **Ambígua:** o aviso pode ser nada. O jogador não tem certeza, e por isso pensa (7.1).
- **Agir tem custo:** se proteger alguém fosse de graça, todo mundo protegeria. Esconder a Nerea faz ela perder a banca e brigar com ele; avisar o Mirto faz ele desconfiar do pai.
- **Ignorar é válido:** não fazer nada é uma escolha, e às vezes a certa.
- **Sem cronômetro, sem fio na tela:** o aviso não pode parecer "a decisão importante", senão vira armadilha anunciada. O peso aparece só depois, no mapa.
- **Uma por consequência grave:** quatro ou cinco no capítulo, não mais.

### 8.3 Como ficaria, caso a caso

| Consequência | Onde entra o aviso | O que o jogador vê | O que pode fazer | O que muda depois |
|---|---|---|---|---|
| **Nerea** (morta, presa, fugida ou salva, no T4) | **T2**, saindo da casa do Nísio | A Nerea no porto, costurando. Ela comenta, de passagem, que "dois homens de branco perguntaram por um sujeito de túnica rasgada". | Mandá-la sair da cidade por uns dias (ela perde a feira e fica magoada: Laço −1) · pedir que ela minta por ele (Laço +1, mas ela fica exposta) · rir e mudar de assunto | O T3 (o Caio só a ameaça se ela estiver à vista) e o degrau final no T4 |
| **Quinto** (morto, ferido ou testemunha, no A3) | **A2** | Um guarda jovem, ao fundo, que deixa cair um pedaço de pão perto da grade e olha para o escuro antes de ir. | Pegar o pão ou deixar · farejar (fera +1): o cheiro dele é medo, não ódio | No A3, o Asterion o **reconhece**: uma opção a mais ("é o do pão") e uma voz do homem mais forte |
| **Mirto** (no A4) | **T2** (eco do Théron) e **A3** | No T2, o Nísio fala do filho que "vive descendo com cestas". No A3, a tabuleta do Quinto tem o caco do Mirto. | No T2: perguntar pelo menino ou não (o Théron pode avisar o Nísio) · no A3: pegar o caco antes que o Quinto o leve | `colegio_sabe_do_mirto` passa a depender do caco e do aviso, e não de um ramo padrão |
| **Iante** (luto ou esperança, no T4) | **T2**, no porto, depois da casa do Nísio (hoje o Théron só a conhece no T4) | Uma peregrina de Corinto pede ajuda para pagar o remédio do filho doente. Uma chave de bronze pende do cinto dela. | Dar a ela a moeda do Nísio (Laço +1) · aplicar o golpe dos copos nela (moeda a mais, Laço −1) · passar reto | No T4, ela **o reconhece** (ou não): "pedir a chave" se abre mesmo com pouca presença, e cortar o luto de quem ele ajudou, ou enganou, pesa de outro jeito |
| **Domícia** (no L4) | Já existe: a suspeita (`colegio_suspeita`) se acumula desde a L1 | Falta só o sinal: um sacerdote que passa a observar a Lívia no L2 e no L3, cada vez mais perto | Nada novo; as escolhas que já existem passam a ser vistas | O jogador percebe a suspeita subir antes do interrogatório |

### 8.4 Quanto acrescentaria (estimativa antes da implementação)
São cerca de 5 trechos curtos, de 3 a 6 falas cada, mais uma escolha ou um objeto. Parte deles **substitui** falas que já existem (o eco narrado do escriba, a lembrança da Lívia no cais), então o texto total cresce pouco. As artes novas seriam poucas: a Nerea, a Iante e o Quinto já têm arte; talvez um fundo de sacerdote ao longe para a Lívia.

---

## 9. O que foi implementado (2026-10-17)

Lista para conferir jogando, na ordem do capítulo. Para pular direto a um ponto, use o depurador (F2).

### 9.1 Para o jogo inteiro
- **"O mundo registrou" (7.3):** quando uma escolha **sem fio** muda uma relação ou um contador, um fio atravessa o alto da tela por um instante, sem texto:
  - **dourado:** um laço cresceu;
  - **avermelhado, se desfazendo:** um laço se gastou;
  - **cinza:** o Colégio ouviu alguma coisa.
- **Pausa de peso (7.7):** antes das escolhas com fio, e sem cronômetro, as bordas da cena escurecem e as opções aparecem depois de um segundo.
- **Segunda voz (7.8):** alguns pensamentos da Lívia e do Théron ganham uma resposta em outra cor, um instante depois. Para a Lívia, é a voz de Domícia; para o Théron, a do herói que ele foi.
- **Alerta do Colégio (opção E):** um contador único (`colegio_alerta`) que soma ações dos três protagonistas.
  - **Sobe quando:**
    - a Lívia conta a verdade ao áugure (L1);
    - o Théron é pego nos copos (T1);
    - o Asterion racha a pedra (A1);
    - o Asterion pega o pão do guarda (A2);
    - o Théron avisa o Nísio (T2);
    - o Quinto vê o Asterion ou conta o que viu (A3);
    - a Lívia demora no livro, é pega saindo ou humilha o áugure (L4).
  - **Pesa:**
    - no Caio (T3), que comenta o nervosismo do Colégio;
    - nos cães da A4, que chegam mais cedo;
    - no destino do Mirto;
    - no perigo da Nerea;
    - nos homens do Colégio no cais (T2 e T4).

### 9.2 Lívia
- **A dádiva sempre tem um motivo:** o botão do cálice diz o que ele responderia.
  - Por exemplo: "F — erguer o cálice: o que Domícia teme no Colégio?".
  - O validador exige isso em toda janela.
- **L1:**
  - **O preço explicado:** antes da janela, um pensamento planta a dúvida ("Visita de rotina. Ela não acredita nisso") e a voz de Domícia avisa o preço: cada olhar com a chama tira uma prece.
  - **O que o cálice abre:** se ele mostrou o medo de Domícia, aparece a opção **"Sua mão está tremendo. Do que você tem medo?"**. Domícia conta a falta antiga no livro de votos, e a Lívia chega ao áugure sabendo o que está em jogo.
- **L2 (fim, no presente):** se o Colégio já suspeita, o áugure aparece ao longe olhando para Domícia, com uma linha de narração.
- **L3:**
  - **O áugure no Templo:** com suspeita 1, ele está ao longe e pode ser examinado. Com suspeita 2 ou mais, está perto do altar e anota "Máxima".
  - **A dúvida da Iante:** uma narração mostra que a mão dela volta sempre à bainha do manto.
  - **O que o cálice abre:** se ele revelou a chave de Héstia, aparece a opção **"Ela é sacerdotisa de Héstia, Domícia. A chama também é dela."**. Domícia cede ("Eu não ouvi nada"), o que protege a promessa à Iante mas custa um pouco da relação com Domícia.
  - **Antes da escolha:** um pensamento de duas vozes ("A lei diz não. A mãe diz por favor").
  - **Contar ou guardar as batidas agora mexe no selo.**
- **L4:**
  - **A dúvida:** uma narração mostra a mão do áugure escondida na toga.
  - **Antes da pergunta final:** um pensamento recorda o que a Lívia fez aos sete anos (tentou confessar ou ficou em silêncio), com a voz de Domícia.
  - **O selo tranca opções:**
    - com o selo em 3 ou mais (muitos segredos), "Fui eu." fica trancada;
    - com o selo em −3 ou menos (muita verdade), culpar a Vestal Máxima fica trancado.
  - **O que o cálice abre:** se ele mostrou o amuleto, aparece **"O senhor aperta um amuleto contra esta chama, áugure. Pergunte a ela, não a mim."** (fio emaranhado).
    - O áugure recua, e Domícia só é condenada se a suspeita estiver muito alta.
    - Em troca, o Colégio fica em alerta.
  - **Ler o nome do Théron no livro aumenta o perigo da Nerea.**
- **O selo na chama:** nos fragmentos da Lívia, a chama do cálice fica mais azulada e clara quando ela escolhe a verdade, e mais vermelha quando guarda segredos. O efeito começa em ±2 e fica forte em ±3.

### 9.3 Asterion
- **A2, o aviso do Quinto:** depois do flashback, um guarda jovem deixa cair pão pela grade e vai embora. É uma escolha sem fio:
  - **pegar o pão:** ele vai reconhecê-lo depois, mas o Colégio nota o pão sumido;
  - **farejar:** fera +1, e ele descobre que o guarda tem medo dos outros guardas, não dele;
  - **deixar:** "pão que cai do alto é isca".
- **A3:**
  - **O reconhecimento:** se pegou ou farejou o pão, um pensamento reconhece o Quinto ("É o do pão").
  - **Ajudar fica mais fácil:** a opção vale com fera até 3, em vez de 2.
  - **O caco do Mirto:** pegá-lo do chão custa fera +1, mas impede que o Colégio descubra o Mirto pelo caco.
  - **Atacar ganhou um motivo:** "antes que ele suba e conte o que viu".
  - **A morte do Quinto é o último degrau:** se o Asterion perde o controle mas reconhece o Quinto, o golpe para no meio. O Quinto foge ferido e vivo; só morre se o Asterion nunca o conheceu.
- **A4:**
  - **Antes da escolha final:** um pensamento recorda o Mirto (o pão, o olho na parede, ou o rosnado), com a fera dizendo "cães. perto. escolhe.".
  - **O destino do Mirto, em degraus:** salvo; salvo pelo pai, se o Théron avisou o Nísio no T2; levado vivo pelo Colégio, se o alerta está baixo; morto, só com tudo contra ele.
  - **Os cães na escada chegam mais cedo com o alerta alto.**

### 9.4 Théron
- **Laço (o novo contador):** sobe quando ele se liga a alguém e desce quando ele se afasta.
  - **Sinal:** o fio no alto da tela.
  - **Presença:** o Laço segura a presença dele, e a figura e o nome esmaecem menos.
  - **Com Laço 2 ou mais:** abre a última chance da Nerea no T4.
  - **Com Laço 3 ou mais:** a mão dele não consegue cortar o luto nem a esperança da Iante.
- **Perder presença (F8):** cada uso dos fios faz todos em cena olharem para o outro lado por um instante, e o nome dele pisca.
- **T1:**
  - **Abertura (F1):** dois curiosos se aproximam. Ele escolhe que história contar sobre o dente (o herói, a verdade, o herói sem nome), e eles reagem e vão embora.
  - **Não aplicar o golpe:** nova opção "Ninguém. Hoje não.".
  - **A ida até a Nerea (F2):** virou caminhada. Ele atravessa a feira, e ela diz "Théron." quando ele passa perto. A narração anterior saiu.
  - **Ser pego aumenta o alerta.**
- **T2:**
  - **Os fios como ação livre (F3):** são a tecla F durante toda a negociação com o Nísio, e não mais uma escolha à parte. Antes, um pensamento lembra o preço.
  - **Aviso ao Nísio:** se ele viu o pão do menino, pode dizer "Mantenha ele em casa". Isso salva o Mirto no A4, se der errado, mas o Nísio desconfia e o Colégio fica em alerta.
  - **O porto (cena nova):** ele atravessa o porto. Se o alerta está alto, um escriba do Colégio pergunta pelas bancas, e dá para examiná-lo.
  - **A Iante (aviso):** pede ajuda para o remédio do filho. Ele pode dar a prata (Laço +1), enganá-la com os copos (Laço −1) ou seguir em frente.
  - **A Nerea (aviso):** conta que dois homens de branco perguntaram por ele. Um pensamento de duas vozes ("Pode ser nada" / "Pode ser tudo"). Ele pode:
    - mandá-la sumir: ela foge, fica magoada, e o Laço cai;
    - pedir que ela minta: ela fica, um pouco protegida, e o Laço sobe;
    - rir: o perigo dela cresce.
- **T3:**
  - **Postura diante do Caio (F4):** provocar, calar ou olhar a urna, cada uma com uma resposta.
  - **O alerta:** com o alerta alto, o Caio comenta o nervosismo do Colégio.
  - **O motivo dos fios:** o botão diz "a quem o patrício está preso?". Se viu os fios dele, aparece **"Os seus fios sobem para o teto. Quem segura a ponta?"**, e isso volta no T4.
  - **A Nerea escondida:** o Caio não a ameaça, só diz que ela sumiu.
  - **Antes do contrato:** um pensamento de duas vozes. Se ele conheceu a Iante no T2, a segunda voz diz: "Iante... Isto não é só mais uma."
- **T4:**
  - **Mais curto (F5):** o escriba virou figura no fim do cais com um pensamento, e a lembrança da Lívia virou só pensamento.
  - **O cinto (F7):** fica perto da Iante.
  - **A Iante lembra dele:** se ele ajudou, ela agradece ("O Díon dormiu sem febre a última noite"), e pedir a chave fica possível mesmo com pouca presença. Se ele a enganou, ela reconhece "as mãos dos copos": pedir fica trancado e roubar fica mais difícil.
  - **Os fios da Iante:** são a tecla F na conversa (com motivo no botão).
  - **Roubo da chave (F6):** um mini-jogo novo, o cinto. Ele desfaz uma volta do nó cada vez que ela olha para o mar. A arte do cinto ainda é desenhada em código (pedido em `pedidos-de-arte/entregues/9-decisoes.md`).
  - **O Quinto no túnel:** se está vivo, é uma passagem furtiva. Passar sem ser visto dispensa a conversa; ser visto leva ao blefe.
  - **Antes da urna:** um pensamento recorda o que ele sabe (ou os fios do Caio subindo ao teto), com a segunda voz.
  - **Quebrar ou devolver a urna:** se o Caio ameaçou a Nerea, isso aumenta o perigo dela (a vingança dele).
  - **O destino da Nerea, em degraus:**
    - **o perigo soma:** o riso no T2, a ameaça no T3, o nome lido pela Lívia, o alerta alto e a vingança do Caio;
    - **o perigo diminui:** se ela mentiu por ele;
    - **escondida:** fugiu. A banca está vazia, e um menino entrega um nó de rede.
  - **No mercado:** ele caminha até ela.
    - **Perigo 0:** ela está bem.
    - **Perigo 1:** "os homens de branco voltaram hoje".
    - **Perigo 2 ou mais:** os homens do Colégio chegam, e vem a última chance: **gritar o próprio nome** (precisa de Laço 2 ou mais) ou ficar na sombra. Depois disso:
      - **perigo 2 ou 3:** ela é levada viva;
      - **perigo 4 ou mais:** ela morre.

### 9.5 Testes e números
- Desfechos em 1500 partidas aleatórias: a Nerea morre em cerca de 4%, e o Quinto e o Mirto ainda menos.
- O teste de partidas passou de 400 para 1500 (os desfechos raros pedem várias decisões alinhadas).
- O teste do depurador tenta 2500 sementes.
- Todos os 43 testes e o build passam.
