# 🐷 Docão Shooter — Patch Notes

Jogue em **https://docao.mvalentim.dev**

---

## Próxima versão

- Menu com nova logo, lettering cartoon, moldura irregular de madeira, campos padronizados e carimbo suíno. A chama do título tem animação discreta.
- Jogar e Juntar a Porcada ficam lado a lado, com menor destaque visual para a ação online.
- Docão fica sobre uma caixa de armas 3D, com madeira quente, ferragens e inscrição pintada. Trocar Visual é uma mala de figurinos apoiada na quina.
- O Arsenal abre a tampa e leva a câmera ao interior da caixa, onde as armas aparecem em bandejas de madeira.
- A mala abre pela lateral e revela um provador com forro verde e prévia 3D do figurino selecionado.
- Chão e paisagem têm profundidade e paralaxe durante as transições. Fechar ou Esc faz o caminho inverso; a preferência por movimento reduzido pula a viagem.
- Layout adaptado para telas estreitas, navegação por teclado e foco restaurado ao sair dos menus.

---

## Resumo de 21 e 22/10/2026
Tudo o que entrou no jogo nesses dois dias (detalhes em cada versão abaixo):
- **v1.2 · Mapas v2:** os 7 mapas refeitos com casas, andares, escadas e telhados
- **v1.3 · Bacon & Nomes:** morte vira bacon e cada jogador escolhe o nome
- **v1.4 · Pururucado:** kill feed com frases de porco
- **v1.4.1 · Mira, snipers e prêmios** ([@rramosjoao](https://github.com/rramosjoao), PRs #1 e #2): mira no botão direito, três snipers, abates seguidos, fumaça, atordoamento e prêmios de 3, 5 e 7
- **v1.5 · Churrasco Moggado:** faca de churrasqueiro e animações de recarga
- **v1.5.1 a v1.5.7:** botão RENASCER, 3 skins novas, salas com até 10 jogadores, tempo da partida configurável, captura da Dominação mais lenta, Docão não fica mais preso na parede, piso e mira sem piscar
- **v1.6 · Bacon Restaurador:** bacon cura 10 de vida
- **v1.6.1 · Respiro:** vida regenera fora de combate
- **v1.7 · Arsenal do Chiqueiro** ([@rramosjoao](https://github.com/rramosjoao), PR #3): armas novas por categoria, helicóptero Gavião, nuke secreto e mapa Pátio Ferrugem
- **v1.8 · Míssil Pilotado:** chat e voz, campus HOTMILK, modo Exploração, modo Treino no Estande do Docão, killstreaks no F, míssil pilotado e camuflagens
- **v1.8.1 · Streak de verdade:** online o míssil, o Gavião e o Fim da chapa matam de verdade, com o servidor no controle
- **v1.8.2 · Chat no canto** ([@Janor-Neto-Cheers](https://github.com/Janor-Neto-Cheers), PR #7): chat sempre visível no alto e T para falar com todos
- **v1.8.3 · Comanda da Fazendinha** ([@hiro-cheers](https://github.com/hiro-cheers), PR #8): menu inicial novo com cenário de fazendinha ao entardecer
- **v1.8.4 · Agachadinha** ([@felipe-cheers](https://github.com/felipe-cheers), PR #9): Shift agacha com hitbox sincronizada no online, mira só no botão direito e um pulo por toque no Espaço

---

## v1.8.4 — Agachadinha 🐖 (22/10/2026)
Feito pelo **[@felipe-cheers](https://github.com/felipe-cheers)** (PR #9).
- Segure **Shift** (esquerdo ou direito) para agachar, com animação e câmera mais baixa. O Docão anda mais devagar e só levanta se houver espaço acima da cabeça.
- A mira com zoom agora fica só no **botão direito** do mouse (o Shift virou o agachar).
- A hitbox acompanha a transição ao agachar e levantar, inclusive nos tiros, golpes de faca e explosões. A postura também é sincronizada no multiplayer, e o servidor confere a troca.
- Corrigido o pulo que se repetia ao pular, agachar e soltar o agachar no ar. Cada pressão em Espaço agora dispara apenas um pulo.

## v1.8.3 — Comanda da Fazendinha 🌅 (22/10/2026)
Feito pelo **[@hiro-cheers](https://github.com/hiro-cheers)** (PR #8).
- Os campos da comanda agora usam etiquetas impressas, papel claro e setas pintadas. Os ajustes de mira ganharam marcadores de tampinha e valores visíveis.
- A fazendinha do menu agora tem cenário próprio ao entardecer, luz quente no Docão e um palco de madeira. A comanda ganhou acabamento de papel, carimbo suíno, opções lado a lado e placas com ferragens.
- O menu virou a comanda da fazendinha: papel de açougue, placas de madeira e o botão Jogar. Arsenal e visual são acessados pelas placas junto do Docão; ajustes e áudio ficam no canto superior direito.
- O Docão fica de frente na vitrine. Os botões de jogar continuam à mão, mesmo ao escolher armas ou skins, e o menu se adapta a telas menores.

## v1.8.2 — Chat no canto 💬 (22/10/2026)
Feito pelo **[@Janor-Neto-Cheers](https://github.com/Janor-Neto-Cheers)** (PR #7).
- O histórico do chat fica aberto durante a partida, no canto superior direito, e desce sozinho quando chega mensagem nova
- **T** abre o chat para todos; **Y** ou **U** abre só para o time na Dominação. O Tab volta a ser só o placar
- Os botões de voz saíram de cima do feed de abates e foram para o lado do chat

## v1.8.1 — Streak de verdade 💥 (22/10/2026)

- Online, o míssil pilotado, o Gavião e o Fim da chapa agora matam de verdade. Antes eles apareciam só na tela de quem usou
- Quem decide é o servidor: ele conta a sua sequência, confere se você ganhou o prêmio e se o míssil chegou onde dava pra chegar, e só então aplica o dano
- Todo mundo vê a explosão do míssil, o Gavião voando e atirando e a contagem e o clarão do Fim da chapa
- Os outros jogadores (e os bots) podem atirar no Gavião e derrubá-lo
- O kill feed mostra o nome do prêmio: [Míssil da granja], [Gavião da granja] e [Fim da chapa]
- Igual ao offline: abates do Gavião valem 25 pontos e não contam pra sequência, o Fim da chapa também não conta, e morrer depois de puxar o rádio não cancela

---

## v1.8 — Míssil Pilotado 🚀 (22/10/2026)
Versão de muita gente: valeu, Janor, Paulo e João! 🐷

**Chat, voz e convite** (PR #4, [@Janor-Neto-Cheers](https://github.com/Janor-Neto-Cheers))
- Chat escrito no lobby, na partida e no fim do jogo: Y fala com todos, U só com o time, e Tab troca o canal com a caixa aberta
- Voz: J troca entre Mudo, Todos e Time; segure K para falar
- Convite da sala no lobby e na pausa: copiar link ou código, WhatsApp, Telegram, Slack e compartilhar

**Campus HOTMILK e modo Exploração** (PR #5, [@paulo-cheers](https://github.com/paulo-cheers))
- Mapa HOTMILK com o Bloco 01 e o Bloco 02 (prédios de três andares com corredor, escada e vão entre eles)
- O mapa HOTMILK virou o campus inteiro: Bloco 01, Bloco 02, estacionamento com catraca, praça e portões
- Modo Exploração (offline): mapa sem bots pra andar e testar armas

**Treino · Estande do Docão**
- Novo modo com mapa próprio: alvos que não atacam e voltam em 2 s, números de dano na tela, distâncias de 10 a 50 m, alvos em movimento, área de explosivos, faca/sabre e arena X1
- B/N/M trocam a arma na hora, munição infinita e sem tempo. Funciona offline e online

**Killstreaks no F e camuflagens** (PR #6, [@rramosjoao](https://github.com/rramosjoao))
- O killstreak não dispara sozinho: quando fica pronto, aperte F. Com mais de um guardado, o F usa o mais antigo
- O de 5 abre um laptop e você pilota um míssil em primeira pessoa: sai bem alto, o mouse aponta e a explosão é bem maior
- No menu, cada arma mostra uma miniatura
- Camuflagem por partida: 5 abates com a mesma arma dão a de chiqueiro, 10 a de bacon e 15 deixa dourada. Zera na partida nova

---

## v1.7 — Arsenal do Chiqueiro 🏹🚁 (21/10/2026)
Leva enorme feita pelo **[@rramosjoao](https://github.com/rramosjoao)** (PR #3). Valeu, João! 🐷

**Armas**
- A lista de armas ficou separada por categoria: Rajada, Escopeta, Precisão, Explosivo, Faca e Secundária
- Mini Uzi do Leitão: rajada bem rápida, curta, forte de perto
- P90 da Granja: compacta, carregador grande, rajada mais estável
- Furadeira de Prego: secundária. Um prego por clique
- Escopeta Semi do Leitão: atira mais rápido e é mais fraca. A Calibre 12 (pump) ficou mais forte
- Sniper Torresmo sem luneta espalha mais. Com a luneta e parado, continua no centro
- Sabre de Luz na categoria Faca. As duas mãos seguram o cabo e acompanham o corte. Com ele na mão, você anda 30% mais devagar
- Besta do Leitão e Arco da Granja, as duas na categoria Secundária. Não matam de um tiro no corpo. A besta arma a corda na recarga. No arco, segura o clique para puxar a corda: quanto mais tempo, mais forte a flecha
- A Bazuca do Chiqueiro ficou maior e com cara de RPG: tubo longo, traseira larga, empunhadura e a ogiva na boca

**Killstreaks**
- O killstreak de 5 solta os mísseis do céu, e eles batem mais forte
- O killstreak de 7 agora é o helicóptero Gavião da granja (no máximo 30 segundos, dá para derrubar)
- Cada abate do helicóptero Gavião da granja vale 25 pontos. Não enche a barra de killstreak
- O nuke saiu da barra e virou um streak secreto de 10 abates. Se você morrer depois de puxar o rádio, a contagem não cancela
- A fumaça ficou mais fechada no meio

**Mapa e tela**
- Mapa Pátio Ferrugem, menor, no estilo do Rust: a torre do meio é a mais alta, com rampa do chão até o topo
- A lista de abates (killfeed) foi para o canto esquerdo de baixo, acima da vida e da linha de Abates, sem cobrir o resto
- Quando você morre, a câmera fica parada olhando para quem te matou

## v1.6.1 — Respiro 💚 (21/10/2026)
- **Vida regenera fora de combate:** levou dano de outro Docão e ficou **5 segundos** sem apanhar? A vida volta sozinha, **+10 por segundo**, até 100. Levou dano de novo, os 5 segundos recomeçam.
- **Mas só se o dano não foi seu:** se o último dano veio de você mesmo (foguete da bazuca no pé, seu próprio Copo Bomba, seu míssil), não regenera, e isso cancela a regeneração que ia começar. Quer a vida de volta? Fica longe da própria explosão.
- Enquanto regenera, a barra de vida brilha verdinho com um "+" pulsando.
- Vale pros bots também. No online quem decide é o servidor.

## v1.6 — Bacon Restaurador 🥓❤️ (21/10/2026)
O bacon agora serve pra alguma coisa: **quem pisar no bacon de um Docão morto ganha +10 de vida!**
- Vale pra qualquer um que estiver vivo: inimigo, aliado ou quem fez a vítima virar bacon. Só o próprio morto não come o bacon dele.
- Comeu: aparece **"+10 de vida (bacon!)"**, toca um "nhac nhac" e o bacon some numa nuvenzinha rosada. A vida não passa de 100. Se você já está com 100, o bacon fica no chão pra outro.
- Dá pra pegar enquanto o bacon estiver no chão (uns 3 segundos). Se ninguém pegar, ele some como antes. Agora ele cai pertinho de onde o Docão morreu.
- Os bots também comem: pegam quando passam por cima e, com pouca vida, vão atrás de um bacon que esteja perto.
- No online quem decide é o servidor, então todo mundo vê o mesmo bacon sumir.

## v1.5.7 (21/10/2026)
- **Piso e telhado não piscam mais:** onde duas superfícies ficavam exatamente no mesmo plano (laje em cima da parede, faixa no piso, asfalto, meio-fio…) a imagem ficava trocando de cor quando você mexia a câmera. Agora cada uma fica no seu lugar. A colisão continua igualzinha.
- **Bacon não afunda mais no chão:** quando um Docão morre, a tira de bacon fica deitada por cima do piso (no chão ou num telhado), sem afundar nem no fim da animação.
- **RENASCER já trava o mouse:** clicar em RENASCER (ou apertar Espaço/Enter) já volta a mirar na hora. O aviso "Clique pra voltar a mirar" só aparece se o navegador não deixar, e some assim que o mouse trava.
- **A mira do centro da tela não pisca mais.**
- Bots não ficam mais parados no meio da rampa achando que já chegaram no telhado.

## v1.5.6 (21/10/2026)
- **Correção: Docão preso na parede** em todos os mapas. Quem saía da borda de um telhado, caixa ou rampa caía "dentro" da lateral dela, e quem subia escada/rampa debaixo de viga ou verga de porta enfiava a cabeça nela. Daí nenhuma direção funcionava.
  - O chão agora usa a mesma largura do corpo, então você para na borda em vez de afundar na parede.
  - Degrau e rampa só sobem se a cabeça couber.
  - Se por algum motivo o Docão ficar dentro de alguma coisa, ele é empurrado pra fora na hora (sem atravessar parede).
  - Empurrões fortes (explosão) não atravessam mais parede fina.
- O jogo e o servidor usam exatamente a mesma física agora, então no online o servidor não te "puxa de volta" quando você encosta no teto ou numa parede.

## v1.5.5 (21/10/2026)
- **Captura bem mais demorada na Dominação:** sozinho na zona agora leva **25 s**, e cada aliado a mais tira 1 s: 2 → 24 s, 3 → 23 s… até **16 s com 10**. Neutralizar o progresso do outro time vai na mesma velocidade.
- Zona vazia continua perdendo 10% por segundo (zera em até 10 s).

## v1.5.4 (21/10/2026)
- **Tempo da partida configurável:** ao criar a sala (e no lobby, só o anfitrião) tem o campo **Tempo**: Padrão, 3, 5, 7, 10, 15 ou 20 min. "Padrão" continua 5 min no Mata-mata e 7 min na Dominação. Quem não é anfitrião vê o tempo escolhido no lobby. Mudou no meio da partida? Vale a partir da próxima. O menu offline também ganhou o campo **Tempo**.
- **Captura mais demorada na Dominação:** sozinho na zona leva **15 s** (antes 8 s); com 2 do time, 7,5 s; com 3 ou mais, 5 s.

## v1.5.3 (21/10/2026)
- **Salas online com até 10 jogadores:** ao criar a sala ou no lobby, o máximo agora vai até **10** (com bots completando, se quiser). Dois bots novos, **Coxinha** e **Pururuca**, e o placar do canto mostra até 10 linhas.

## v1.5.2 — Skins novas (21/10/2026)
Agora são **17 skins**. Chegaram três novas no fim da lista:
- **Boi Caprichoso:** chifrinhos brancos, túnica azul com estrela branca no peito, franja nos ombros e saiote de fitas azuis e brancas.
- **Docão Felipe:** cabelo bagunçado, óculos pretos grossos, camisa grafite com listras verde-água, short preto e tênis preto de sola branca.
- **Docão Matheus:** topete curto, bigodinho e barba rala, olhos verdes, moletom preto de capuz, crachá vermelho da Cheers com o "C!", calça preta e tênis branco.
- No online as skins novas aparecem certinho pra todo mundo (servidor atualizado junto).

## v1.5.1 (21/10/2026)
- **Renascimento agora leva 5 s e tem botão:** depois de morrer o botão mostra a contagem ("Renascer em 4.2s") e, liberado, você volta clicando em **RENASCER** (ou Espaço/Enter). Dá tempo de escolher a arma com calma.
- Bots continuam renascendo sozinhos; no online vale o mesmo (o servidor só te traz de volta quando você clica).

## v1.5 — "Churrasco Moggado" (21/10/2026)
- **Faca de churrasqueiro:** nova arma no **slot 3** (tecla 3, rodinha ou **V** pra troca rápida; no cartão da tela de morte o atalho é **V**).
  - **Clique esquerdo:** golpe (segurando, repete).
  - **Botão direito:** estocada, só com a faca na mão. Nas armas de fogo o botão direito continua sendo a mira.
  - **Pelas costas mata na hora.**
  - Kill feed novo: **"X moggou Y [Faca]"**, tela de morte com **MOGGADO!** e "Você foi moggado por [nome]".
- **Animações de recarga** em todas as armas: pente caindo, cartuchos entrando, ferrolho das snipers, bazuca no ombro (também em 3ª pessoa).
- Correção: as armas voltam a dar dano depois de **Próximo mapa** e **Jogar de novo** no online.
- Correção: a skin do Docão volta a aparecer no menu logo no começo.
- Correção: na **Vizinhança Cheers** a câmera do menu ficava dentro do ônibus e a skin não aparecia; agora ela procura um ângulo livre em qualquer mapa. A barra de prêmios por abate não aparece mais por cima do Docão no menu.
- **Tela de morte compacta**, ancorada embaixo: todas as armas cabem mesmo em telas menores.

## v1.4.1 — Mira, snipers e prêmios 🎯 (21/10/2026)
Feito pelo **[@rramosjoao](https://github.com/rramosjoao)** (PRs #1 e #2).
- O botão direito mira em todas as armas. Na sniper abre a luneta, e no ferrolho a mão do Docão puxa o ferrolho
- Três snipers: Torresmo (meio), Canhão do Barril (pesada, pouca bala) e Carabina da Granja (leve e rápida), cada uma com a sua luneta. O menu ganhou o slider Mirando
- Acerto mostra o X, os pontos (+10, +100, +150) e medalhas. Abates seguidos: Dupla na chapa, Trio frito, Ultra na brasa, Fantástico e Incrível
- Granada de fumaça (tecla 4) e de atordoamento (tecla 5)
- Prêmios por abates sem morrer: no 3 um minimapa que gira com você, no 5 um tablet para marcar 3 mísseis, no 7 o rádio que derruba todo mundo

## v1.4 — "Pururucado" (21/10/2026)
- **Kill feed novo:** "carimbou" virou **"pururucou"**, com frases engraçadas sorteadas a cada abate:
  *fritou, transformou em torresmo, mandou pra chapa, defumou, fez virar bacon, serviu no café da manhã, botou no espeto, temperou com chumbo…*
- Tela de morte agora mostra **PURURUCADO!** e "Você foi pururucado por [nome]".
- Suicídio: "se pururucou", "virou bacon sozinho", "se jogou na frigideira", "fritou no próprio óleo".
- Tiro na cabeça: **"direto no focinho!"**

## v1.3 — Bacon & Nomes (21/10/2026)
- **Animação de morte:** o Docão estoura e vira **bacon** fritando no chão (com fumaça, brilho de gordura e chiado).
- Câmera de morte em 3ª pessoa mostrando o seu bacon antes de escolher as armas.
- **Nome do jogador:** campo no menu, na janela online e no lobby (botão "Trocar"). Fica salvo e aparece na plaquinha, no placar, no kill feed e na tela final. Nomes repetidos viram "Nome (2)".

## v1.2 — Mapas v2 (21/10/2026)
Os 7 mapas foram refeitos com construções de verdade: casas com interior, escadas, andares, telhados, becos, cobertura e corredores longos pra AWP. Bots sobem e descem andares.
- **Duas Pocilgas** (estilo Dust2): túneis do B, portas do meio, catwalk, longo do A, casas de 2 andares.
- **Mercadão** (estilo Mirage): palácio com sacada, apartamentos, conector, sala da janela, mercearia.
- **Vizinhança Cheers** (estilo Nuketown): duas casas de 2 andares com varanda, telhado da garagem, quintais, ônibus.
- **Celeiro Industrial** (estilo Rust/Office): galpão com mezanino, escritórios, ponte, contêineres, guarita, silos.
- **Bar Cheers Noturno** (estilo Office): ala de 2 andares, VIP com sacada, terraço, banheiros, sinuca, palco do DJ.
- **Arena da Fazendinha** (3 corredores): bases de 2 andares com terraço, celeiro com jirau, túnel do galinheiro.
- **Torres Gêmeas do Barril** (mapa de sniper): torres de 3 níveis, ruínas, trincheira, ponte e casamata.
- Correção: quem entra no meio da partida sempre escolhe o time antes de nascer.

## v1.1 — Dominação (20/10/2026)
- **Novo modo Dominação:** dois times (Vermelho × Azul). Zonas aparecem em pontos aleatórios; quanto mais gente do time dentro, mais rápido captura (até 3×). Zona disputada pausa. Primeiro time a **5 zonas** vence.
- Seta na borda da tela com a **distância em metros** até a zona.
- **Placar sempre visível** no canto superior esquerdo.
- **Escolha de time** (Vermelho / Azul / Automático) antes da partida e ao entrar no meio.
- **Tela de morte clicável:** escolha as armas com o mouse (teclas continuam funcionando).
- **Explosões melhores:** bazuca e granada medem a distância até o corpo (não o centro) e pegam quem está meio escondido; foguete direto sempre acerta.
- **AWP mais precisa:** dispersão zero com luneta parado, tiro sai exatamente do centro da mira.

## v1.0 — Multiplayer online (20/10/2026)
- **Jogar online com amigos** (grátis, servidor na Cloudflare): crie uma sala e mande o link `docao.mvalentim.dev/?sala=ABCD`.
- Até 8 jogadores, bots completam a sala, o dono escolhe mapa e quantidade.
- Servidor decide tiros, dano, granadas, foguetes, placar e respawn (com anti-cheat básico e compensação de lag).
- Reconexão automática mantendo o placar.

## v0.x — Lançamento
- FPS do Docão inspirado no Shell Shockers, contra bots.
- 14 skins: Clássico, Clube Cheers, Rei do Pop, Rapper da Hora, Bruxinho, Mestre do Kung Fu, Cabeludo, Pescador, Choquinho, Boné da Firma, Fantasminha, Esqueletão, Cavaleiro Galáctico e Nômade do Deserto.
- Armas: fuzil, AWP, 12, bazooka e pistola (1 primária + 1 secundária).
- **Granada Red Cup** com o logo Cheers: até 3 cargas, segure Q pra dosar a força.
- Zoom no Shift.
