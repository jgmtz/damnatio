# 2. Ajustes nas imagens já geradas (para o assistente de programação)

> **Status (assistente, 09/10):**
> - **Feito:**
>   - **Fios:**
>     - emblemas escalados pela espessura do próprio fio, que passa a bater com a da tira: nó 28 px, tesoura 17 px, emaranhado 21 px, fuso 12 px, pontas 47 px, tira 57 px;
>     - cor dos emblemas puxada para o amarelo-palha da tira;
>     - tira sem os pontinhos soltos e repetida espelhada, sem emenda;
>     - halo aditivo pulsante, partículas de aura com sprites das centelhas e onda de luz com velocidade ajustável por cena;
>     - reações: forte ao atar, falhando e com fiapos soltos ao cortar, agitado no emaranhado.
>   - **Mapa:** fundo com o centro escurecido.
>   - **Altar do canto:** a chama nasce na bacia (terço de cima).
>   - **Parede das letras:** laterais escurecidas.
>   - **Labirinto:**
>     - galeria, câmara e arquivo repetidos com cópias espelhadas;
>     - luz suave atrás do portal do meio e um brilho fraco no portal liso.
>   - **Vistas:**
>     - chama na lamparina torta (50%, 20%) e na inclinada (50%, 14%, tombada para o chão);
>     - portão escurecido, preservando a mão, com a luz no vão;
>     - olho da parede com brilho dourado pulsante (50%, 36%);
>     - punho com a tocha distante (96%, 50%) acima da vinheta e poeira caindo das juntas (40%, 45%), já pronto para quando a imagem chegar.
>   - **Mãos e figuras:** a limpeza já preserva o contorno ocre (as mãos do Asterion) e o contorno preto interno (os braços da Lívia).
> - **Não feito, e por quê:**
>   - **Upscayl na tira:** não precisou. O arquivo tem 1376 px de largura, e o fio mede 57 px de espessura (não 34), o que basta para o tamanho usado no jogo.
>   - **Cálice:** o "pequeno de três pezinhos" era o meu desenho provisório em código, não o cálice da Lívia. Na arte dela, o cálice tem haste, pé, duas alças e a faixa em zigue-zague, igual ao do Gemini, então mantive o `calice` do Gemini. Recortar da pose também não serviria, porque a mão dela cobre o cálice.
>   - **Opcionais:** roseta, rotação de 3 a 4° na lamparina torta, faixa preta na inclinada, apagar raízes repetidas.
> - **Aguardando imagem:** corrente (nova versão), tabuinha da aposta, caco e punho (ver `PENDENTES-GEMINI.md` e `1-vistas-em-primeira-pessoa.md`).

Este arquivo reúne tudo o que deve ser feito **em código ou na limpeza** das imagens que já chegaram em `originais/`. Nenhum item aqui exige gerar de novo no Gemini. Coordenadas são em % da largura (x) e da altura (y) da imagem.

## 0. Regras que valem para tudo
- **Fogo, brilho e luz são sempre em código,** por cima da arte. A arte não traz chama.
- **Flashback** (menina) aparece em sépia desbotada; a arte é normal.
- **Vistas em primeira pessoa:** a imagem aproxima devagar (zoom lento) e a **borda escurece** (vinheta). Os objetos principais ficam no centro.
- No `art:clean`, use **limite de preto baixo** para não comer linhas finas (fibras do fio, hachuras, contorno ocre).

---

## 1. Fios sagrados (`1-fios-sagrados.md`)

### Igualar espessura e cor
- `fio_sagrado_tira` é a **referência de espessura e de cor** (versão mais grossa e fibrosa).
- Escale o fio de `fio_no_atado`, `fio_corte`, `fio_emaranhado`, `fio_fuso` e `fio_pontas_rompidas` para a **mesma espessura** da tira (o fio do fuso é o mais fino; a tira, a mais grossa).
- Aplique uma **correção de cor leve**: a tira é amarelo-palha, as outras são ouro-alaranjado.

### A tira
- A tira é fina (~34 px de altura na versão original). **Passe pelo Upscayl** antes de usar em tamanho grande.
- **Emenda:** as pontas esquerda e direita não casam. Resolva com **crossfade** nas pontas ou **espelhando cópias alternadas**.
- Apague do recorte os **pontinhos dourados soltos** acima do fio (viram partículas à parte).
- Limpe o **ruído do fundo preto** (canto superior direito) com limite de preto, sem comer as bordas do fio.

### Efeitos em código por cima da tira
- **Halo dourado** suave atrás do fio (mistura aditiva), pulsando devagar.
- **Partículas de aura:** pequenas centelhas nascem em pontos aleatórios do fio, derivam poucos pixels e somem. Use `fio_centelhas` como sprites.
- **Onda de luz** correndo ao longo do fio, com velocidade que muda conforme a cena.
- **Reações:** mais intenso ao atar; falhando, com fiapos soltos, ao cortar; agitado no emaranhado.
- Tudo deve **seguir o caminho do fio em qualquer curva**.

### Outras peças
- **Tesoura (`fio_corte`)**: aceita como está. Ela é de uso comum, não de Moira; refazer com tesoura grega em U é opcional e fica para depois.
- **Centelhas (`fio_centelhas`)**: saíram só 6, pouco variadas, e uma parece pepita. Funciona. Regerar com 8 formatos é opcional.
- **Fundo do mapa (`mapa_fundo`)**: tem manchas claras de reflexo (alto à direita). **Escureça o centro com uma máscara** para elas não competirem com os fios.
- **Roseta (`fio_roseta`)**: opcional, aparece de vez em quando ao longo do fio como selo.

---

## 2. Primeira pessoa: peças avulsas (`2-primeira-pessoa.md`)

### Mãos e braços da Lívia (2.1, 2.2) e da menina (2.3)
- Fundo **preto**: remova com limite baixo para não perder o contorno preto interno.
- O **ponto de apoio** é a borda de baixo (cotovelo cortado). Na menina (2.3), o braço sai da borda **de cima**.
- A cicatriz da Lívia está desenhada em hachura. Na menina **não há cicatrizes**: elas aparecem em código quando ela pega as brasas.

### Mãos do Asterion (2.6, 2.7, 2.8)
- São **pretas puras com contorno ocre fino**, sobre terracota. Ao remover o fundo, **preserve a borda ocre**, senão a mão fica serrilhada.
- Ponto de apoio: borda de baixo. No **dedo (2.6)**, é a borda **direita de baixo**.
- Todas têm a **algema de ferro com elos quebrados** no pulso. Isso substitui o "cicatrizes de corrente" do pedido original.
- O espelhamento para a mão esquerda é feito em código.

### Altar do canto (2.5)
- A bacia está **vazia**, no terço de cima. A chama é em código.
- Fica espaço livre em cima da bacia para a chama.

### Parede das letras (2.9)
- O centro é um **bloco liso grande**: as letras grandes, os sulcos e o traço dourado entram ali, em código.
- Os blocos laterais são pretos com letras gregas já escritas. **Escureça ou desfoque** se brigarem com as letras do jogo.

### Cálice (2.4) — decisão em aberto
- As duas versões do Gemini não bateram com o cálice da Lívia (um cálice com haste e pé, em vez do pequeno de três pezinhos).
- **Plano recomendado:** recorte o cálice direto da pose `livia_base_ajoelhada` (ou da parada), passe pelo Upscayl e use como peça avulsa. Se ficar borrado, avise, e geramos de novo no Gemini a partir dessa pose.

---

## 3. Mirto (`3-asterion-personagens.md`)
Aprovados: `mirto_parado`, `mirto_andando`, `mirto_assustado`.
- As três têm o **mesmo torso e o mesmo braço da lamparina**. Reaproveite o corpo e troque só pernas e braços quando precisar de outras poses.
- No "parado", as pernas já estão meio abertas (quase uma passada curta). Serve.
- No "assustado", as pernas são as da caminhada. O braço erguido já comunica o susto.
- Os rabiscos na lamparina imitam letras e ficam minúsculos. Ignore.
- A chama da lamparina é em código.

---

## 4. Cenários do labirinto (`4-asterion-cenarios.md`)

### Câmara do Asterion (`labirinto_camara`)
- Paredes **terracota** com linhas pretas; linha do chão a ~85%; a faixa preta de baixo é o piso.
- Os **nichos em arco** são esconderijos: o interior é **preto liso**.

### Galeria (`labirinto_galeria`)
- Linha do chão a ~85%.
- Para repetir lado a lado, **espelhe as cópias alternadas** (os arcos do teto da esquerda e da direita não casam).
- As **raízes** são o ponto mais único da imagem e repetem. Apague uma delas em cópias alternadas, se incomodar.

### Portais, de frente (`portais_frente`)
- Linha do chão a ~85%. Da esquerda para a direita: portal do olho com grade, portal das ondas entreaberto, portal liso selado.
- Cada portal é uma **zona de interação** separada; o do meio é o que fica aberto.
- O interior do arco do meio é preto e engole a silhueta do Asterion: ponha um **fundo mais claro** atrás dele quando o personagem atravessar.
- Opcional: brilho sutil no portal liso quando o jogador se aproxima.

---

## 5. Vistas em primeira pessoa dos objetos (`1-vistas-em-primeira-pessoa.md`)

Âncoras para os efeitos em código, nas imagens já aprovadas:

| Imagem | Ponto | O que fazer |
|---|---|---|
| `vista_livia_lamparina_torta` | chama em **x ≈ 50%, y ≈ 20%** (centro da elipse da bacia) | A bacia fica vazia por baixo. Opcional: gire a imagem 3 a 4° para exagerar a lamparina torta. |
| `vista_livia_lamparina_inclinada` | chama em **x ≈ 50%, y ≈ 14%** | A chama fica **inclinada para o chão**. Opcional: acrescente uma faixa preta em cima para centralizar a bacia. As faixas terracota do chão leem como luz; escureça um pouco se quiser. |
| `vista_livia_portao` | vão entre as folhas em **x ≈ 50%** | A luz da manhã entra ali. **Escureça a porta ~25 a 30%**, preservando a mão e a manga, porque a mão e a porta têm quase a mesma cor. |
| `vista_asterion_parede` | olho em **x ≈ 50%, y ≈ 36%** | Brilho **pulsante dourado**, passando um pouco da borda do círculo (a linha do símbolo é fina). Só quando a Lívia viu a marca no altar. |
| `vista_asterion_punho` | tocha distante em **x ≈ 96%, y ≈ 50%**; impacto nas juntas dos dedos em **x ≈ 40%, y ≈ 45%** | O brilho da tocha deve ser desenhado **por cima** da vinheta (ela está perto da borda). A poeira cai das juntas logo abaixo do punho. |
| `vista_asterion_corrente` | **aguardando nova versão** | Não use a atual (tem duas correntes). Depois da nova: elo aberto em x ≈ 50%, y ≈ 75%. |

Observações:
- As letras de algumas imagens misturam letras latinas (Y, R, K). Ficam minúsculas; ignore.
- No `vista_livia_lamparina_inclinada`, os pés da lamparina são de **grifo**, iguais aos da lamparina avulsa.
