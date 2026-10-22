# 6. Ajustes novos (sessão de 09/10) que ainda NÃO estavam nos pedidos

Complementa `2-ajustes-das-imagens.md`. Tudo aqui foi decidido depois dele.
**Regra geral:** as imagens novas ainda estão sendo geradas no Gemini (limite diário). Deixe o código aceitar o arquivo novo e **cair no arquivo antigo se o novo não existir**, para o jogo continuar rodando enquanto isso.

## Status (assistente)
- **6.1 Unha:** o traçar aceita `nailArt` + `nailAnchor` (ponta da unha em fração da imagem) por cena, e cai na mão atual se a nova não existir. Os arquivos `asterion_dedo_unha.jpg` e `asterion_menino_dedo_unha.jpg` já estão no `art-clean.json` (o script os pula enquanto não existem). Quando chegarem, me passe as âncoras e eu ligo nas três cenas. **Hoje:** o menino usa `asterion_menino_Dedo.png` (a mão que você achou adulta), e o adulto usa `asterion_dedo`.
- **6.2 Osso:** a vista atual está no jogo (centro 50%/50%, sem fogo). Quando a corrigida chegar, é só rodar a limpeza de novo.
- **6.3 Vestais:** as duas que estão em `originais/` (`vestal_a_dormindo.png` sentada cochilando e `vestal_b_dormindo.png` deitada de costas) já estão no jogo, na fuga da Lívia 4. Se chegarem as versões `.jpg`, troco.
- **6.4 Emaranhado:** o jogo usa hoje a folha de 16 quadros (`fio_emaranhado_quadros.png`), a ~10 quadros/s, com o último quadro parado. `npm run art:fx` passa a usar `fio_emaranhado_12.jpg` (grade 4x3) ou o par `_a`/`_b` automaticamente, assim que existirem.
- **6.5 Tesoura:** 12 quadros (A1…B6) a ~10 quadros/s; o corte é o quadro 8: ali o fio muda para "cortado" e a tela dá um tranco. O quadro 12 fica parado. As versões `.jpg` substituem as `.png` automaticamente quando existirem.

---

## 6.1 Asterion escreve na pedra com a UNHA (as duas idades)

**Decisão:** no mini-jogo de traçar letras, o Asterion não "aponta" mais. Ele **risca a pedra com a ponta da unha**, com a **costas da mão** visível e o dedo indicador dobrado e inclinado para a frente, como quem arranha. Vale para o adulto e para o menino.

| Idade | Arquivo novo | Substitui / fallback |
|---|---|---|
| Adulto | `originais/asterion_dedo_unha.jpg` | `originais/primeira-pessoa/asterion/asterion_dedo.jpg` |
| Menino | `originais/asterion_menino_dedo_unha.jpg` | `originais/asterion_menino_dedo.jpg` (e o da leva 5.5) |

**Mão da criança:** a versão que o Gemini devolveu parecia adulta (antebraço longo, dedos finos). Já foi pedida nova: mão pequena, dedos curtos e gordinhos, sem pelo, sem algema. **Fundo precisa ser branco liso** (a versão que chegou veio terracota).

**No código:**
- O **cursor do traçado** passa a ser a **ponta da unha**, não a ponta do dedo. Preciso de uma âncora por imagem em % da largura/altura (`nailTip: {x, y}`). **Eu passo os valores quando as imagens chegarem**; deixe o campo configurável no nó (`fingerArt` / `nailAnchor`).
- A mão entra pela borda de baixo à direita, como antes. Remover o fundo branco como nas outras mãos (`art-clean.json`).
- O sulco da letra aparece **onde a unha toca**, e a mão acompanha o traçado (sem girar o pulso).
- Adulto: algema de ferro com elos partidos continua visível no punho. Menino: sem algema.

---

## 6.2 Vista 1.12 "O osso" (Asterion)

- Arquivo: `originais/vista_asterion_osso.jpg` (ainda sendo corrigido no Gemini: mão estava espalmada, corrente com um elo de cada lado).
- Âncora para o código: **osso no centro, x≈50% y≈50%** (vinheta + zoom lento).
- Nenhum efeito de fogo nessa vista.

---

## 6.3 Vestais dormindo: poses novas e diferentes entre si

A primeira geração da Vestal veio **idêntica à Cláudia dormindo** (mesmo rosto, mesma pose). Foi refeita com poses diferentes e **sem anexar `claudia_dormindo.jpg`**:

| Arquivo | Pose |
|---|---|
| `originais/vestal_a_dormindo.jpg` | sentada no chão, joelhos recolhidos, cabeça caída sobre o peito, mãos no colo, de lado olhando para a esquerda |
| `originais/vestal_b_dormindo.jpg` | deitada de costas, uma mão sobre o peito, a outra caída ao lado, véu espalhado ao redor da cabeça |

- A imagem que veio igual à Cláudia **pode ser usada para a Cláudia**, se a atual não estiver aprovada. Guardar como `originais/claudia_dormindo_alt.jpg` (não usar nas Vestais).
- Fundo preto, sem linha de chão. O código das "vigias adormecidas" (fragmento 4 da Lívia) deve apontar para os dois arquivos novos; se não existirem, manter as Vestais de pé.
- As Vestais devem parecer **mais velhas** que a Lívia e a Cláudia (quarenta e poucos anos).

---

## 6.4 Fio emaranhado: animação de 12 quadros

- Arquivo: `originais/fio_emaranhado_12.jpg` (grade 4x3, 12 células iguais, leitura da esquerda para a direita, de cima para baixo). **Substitui** `fio_emaranhado_quadros.jpg` (a de 6 quadros, 5.8.2).
- Fundo preto liso; o fio entra pela esquerda e sai pela direita **no mesmo ponto** em todos os quadros.
- Sequência: quadro 1 reto → emaranha aos poucos → quadro 12 é o **emaranhado denso final** (idêntico ao `fio_emaranhado` atual).
- **Reprodução:** 10 a 12 quadros por segundo (cerca de 1 s no total). **O último quadro fica parado** como a pintura final do emaranhado.
- Fallback: se o gerado vier com grade errada, o Gemini manda duas folhas de 6; nesse caso os arquivos serão `fio_emaranhado_a.jpg` (quadros 1-6) e `fio_emaranhado_b.jpg` (7-12) e você toca em ordem.

---

## 6.5 Tesoura cortando o fio: animação de 12 quadros

**Decisão de estilo:** a tesoura é **a de metal rebitada** (lâminas em forma de folha de oliveira, cabos com meandro, argola na ponta) que veio na primeira tentativa. Esse estilo foi **escolhido** e é o definitivo. Foi pedida a mesma tesoura, pequena e **sempre inteira dentro da célula**.

**Arquivos (duas folhas de 6, grade 3x2 cada):**
- `originais/fio_tesoura_a.jpg` → quadros 1 a 6
- `originais/fio_tesoura_b.jpg` → quadros 7 a 12

Ordem de leitura em cada folha: esquerda para a direita, de cima para baixo. A sequência completa é A1…A6, B1…B6.

| Quadro | O que acontece |
|---|---|
| 1 | tesoura aberta pairando no alto, fio inteiro |
| 2-3 | tesoura desce, aberta |
| 4 | lâminas abertas dos dois lados do fio |
| 5-6 | lâminas fechando, fio apertado |
| 7 | quase fechada, fibras se abrindo |
| **8** | **tesoura fechada, o fio é cortado** (pontas desfiadas) |
| 9-10 | tesoura sobe, as duas pontas se afastam e caem |
| 11 | tesoura no alto, pontas penduradas |
| 12 | tesoura no alto (mesma posição do quadro 1), duas pontas separadas com vão no meio |

**Regras para o código:**
- O **momento do corte é o quadro 8** (B2). Efeitos de som, tremor de tela e a troca de estado do nó ("fio cortado") disparam aí.
- Fio horizontal a **65% da altura da célula**; tesoura ocupa no máximo 55% da largura; mesma escala em todos os quadros. Se algum quadro vier com a tesoura cortada pela borda, é erro da geração (nunca recortar a tesoura no código).
- Toque a 8 a 10 quadros por segundo. Ao terminar, o quadro 12 **permanece** como fio cortado.
- Se as folhas ainda não existirem, manter o corte em código de hoje.

---

## Resumo de arquivos novos esperados em `originais/`
`asterion_dedo_unha.jpg`, `asterion_menino_dedo_unha.jpg`, `vista_asterion_osso.jpg`, `vestal_a_dormindo.jpg`, `vestal_b_dormindo.jpg`, `claudia_dormindo_alt.jpg` (opcional), `fio_emaranhado_12.jpg` (ou `_a`/`_b`), `fio_tesoura_a.jpg`, `fio_tesoura_b.jpg`.

**Âncoras pendentes (eu passo quando as imagens chegarem):** ponta da unha do adulto e do menino; centro exato do osso depois da correção.
