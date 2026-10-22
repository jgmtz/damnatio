# Revisão do Capítulo 1 (2026-10-22)

Revisão completa antes da publicação no itch.io: todas as cenas de fala, escolha e pensamento, nos dois idiomas, mais a leitura de todas as escolhas com o contexto da cena.

## Como foi feita
1. **Lógica do conteúdo** (script): flags marcadas e nunca lidas, flags lidas e nunca marcadas, textos sem uso, `{variáveis}` diferentes entre inglês e português, textos sem tradução.
2. **Varredura no navegador:** o jogo pula para cada uma das **576 cenas** (falas, escolhas e pensamentos), pelo caminho que leva até ela, e confere:
   - texto faltando;
   - fala ou opção cortada, ou fora da tela;
   - pensamento fora da tela;
   - quem fala ausente ou fora do quadro;
   - imagem quebrada;
   - erro no console.

   Rodou em inglês e em português.
3. **1500 partidas simuladas:** nenhum beco sem saída, e todos os nós são alcançáveis.
4. **Leitura das 42 escolhas (120 opções)**, cada uma com as falas que levam até ela.

## Erros corrigidos
| Onde | Problema | Correção |
|---|---|---|
| Lívia 3, fim (`d24a2`, `d_warm2`) | A Domícia falava sem estar em cena: ela tinha saído na cena anterior | Ela volta andando antes de falar (`s_dom_a`, `s_dom_w`) |
| Lívia 4, o Rito (`d02`, `d08`, `d09`) | O Varrão falava fora do quadro | Cena reorganizada: Varrão à esquerda, como testemunha; Cláudia e as Vestais do outro lado do altar. O eco "Cláudia vira as costas" agora só a vira |
| Lívia 4, fuga (`dcaught`) | "Volte para dentro" era dita pelo guarda mesmo com o guarda longe, fora da tela (quando quem acordava era uma Vestal) | Virou narração: "A voz de um guarda, do fundo do pátio: …" |
| Coda, portal rachado | A chama do altar flutuava no meio do portal | Chama removida da cena |
| Mapa dos fios | "Os fios de O Rito da Noite" | "Os fios: O Rito da Noite" (e "Threads: …" em inglês) |

## Melhorias feitas (decididas pelo assistente, a pedido do autor, seguindo as decisões anteriores)
O critério: toda escolha deixa marca e volta depois, e as consequências aparecem por sinais, sem medidor.

1. **Opções acima das cabeças.** Em toda escolha, se as opções cabem entre o topo da tela e a cabeça mais alta, elas sobem para lá, em tamanho um pouco menor; senão ficam onde estavam. O jogo mede de novo logo depois de mostrar (alguém pode estar chegando). Hoje isso vale para **18 das 42 escolhas**. As outras 24 não cabem no alto: o Asterion é alto demais, há opções longas ou com linha de motivo. Para elas, a alternativa seria uma coluna estreita ao lado, a decidir.
2. **Lívia 1, baixar ou erguer o cálice (`c05`):**
   - **baixar** é o gesto do rito bem feito e soma no cuidado do ritual (`ritual_cuidado`, que acende o altar na Lívia 4);
   - **erguer** mostra a chama se dobrando para quem chega: o Varrão viu do pórtico ("Vi do pórtico, quando a senhora a ergueu. Ela se dobrou para o chão."). Se a Lívia mentir para ele em seguida, ele percebe ("Curioso. Do pórtico, eu juraria ter visto o contrário.") e a suspeita do Colégio sobe.
3. **Lívia 2, "Que canção?" / "Eu não tenho medo" (`c01`):** a resposta da menina volta na Lívia adulta, no fim do fragmento:
   - "Às vezes, sozinha com a chama, ela ainda canta a canção daquela noite…";
   - ou "Ela ainda diz à chama que não tem medo. Algumas noites, quase acredita."
4. **Lívia 2, tentar confessar (`c03`):** o fio passou de **atar** para **emaranhar**. A confissão é cortada pela mentira da Domícia, e no mapa as duas opções já não parecem iguais.
5. **Resumo de fim de capítulo ("O que ficou")** ganhou três lembranças:
   - **Lívia diante do áugure:** "Fui eu." / o áugure humilhado / "o livro apontou Domícia". A resposta oficial agora marca `livia_acusou_domicia`.
   - **Os copos na feira:** quem o Théron enganou, ou que naquele dia ele não tirou nada de ninguém. Não aparece se ele foi pego.
   - **A Nerea:** se ele a enganou no primeiro encontro, ela "pagou uma moeda para ouvir uma mentira, e acha que valeu".
6. **Théron 4, pedir a chave (trancada):** a linha de motivo juntava duas causas. Virou "Ela não tem motivo para confiar em você.", que vale para as duas.
7. **Lívia 4, o cálice no Rito (`c03`):** o tempo foi de 4 para 6 segundos.
8. Removido o texto sem uso `asterion03.h.knock`.

## Conferido e mantido
- **Asterion 2, pegar o pão (`c02`):** aumentar `colegio_alerta` é proposital (`proposta-decisoes.md`: "o Colégio nota o pão sumido"), e a cena já diz isso: "Amanhã eles vão ver que o pão sumiu."

## Ganchos para o Capítulo 2 (marcados no Capítulo 1, ainda não lidos)
Ficam para o roteiro do Capítulo 2. Não são erros:
- **Asterion e Mirto:** `asterion_conhece_theron` (batida ou silêncio), `mirto_salvo`, `mirto_viu_a_fera`.
- **Quinto:** `quinto_vivo`, `quinto_poupado`, `quinto_viu`, `quinto_desviou`, `quinto_subornado`.
- **Lívia:**
  - `livia_viu_asterion`, `livia_voltou_ao_templo`, `livia_pega_saindo`, `livia_viu_fio_theron`;
  - `livia_promessa_quebrada`, `livia_abencoou`, `livia_contou_batidas`, `domicia_ouviu_promessa`;
  - `livia_segurou_o_fogo`, `livia_leu_registro`, `canto_quebrado`, `livia_perguntou_colegio`, `livia_deferiu_a_domicia`;
  - `brasas_salvas`, `flashback_seguiu_musica`.
- **Théron:**
  - `theron_urna`, `theron_entrega_tunel`, `theron_guardou_brasa`, `theron_protege_iante`, `theron_pagamento`, `theron_rota`;
  - `iante_luto_atado`, `escriba_no_porto`;
  - `nisio_sem_medo`, `nisio_pede_mirto`, `nisio_filho_dever`, `nerea_conversou`.
- **Outros:** `domicia_condenada`, `varrao_humilhado` (já usado no resumo), `ritual_noite`.
