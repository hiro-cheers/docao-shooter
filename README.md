<div align="center">

# 🐷🔫 Docão Shooter

### Tiroteio na Fazendinha Cheers

**FPS no navegador em que todo mundo é o Docão, o porquinho mascote da Cheers.**
Quem morre vira bacon 🥓 e o bacon cura quem pisar nele.

[![Jogar agora](https://img.shields.io/badge/%F0%9F%90%B7_Jogar_agora-docao.mvalentim.dev-ff4d4d?style=for-the-badge)](https://docao.mvalentim.dev)
[![Release](https://img.shields.io/github/v/release/valentimm/docao-shooter?style=for-the-badge&label=vers%C3%A3o&color=ffb36b)](https://github.com/valentimm/docao-shooter/releases/latest)

[![Three.js](https://img.shields.io/badge/Three.js-r169-000000?logo=threedotjs&logoColor=white)](https://threejs.org)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers_%2B_Durable_Objects-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![Vercel](https://img.shields.io/badge/site_na-Vercel-000000?logo=vercel&logoColor=white)](https://docao.mvalentim.dev)
[![Playwright](https://img.shields.io/badge/testes-Playwright-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev)

<img src="screenshots/03-tiroteio.png" alt="Tiroteio na Arena da Fazendinha" width="860">

</div>

Tudo foi feito do zero: os modelos são procedurais em Three.js, os sons são sintetizados com WebAudio e não há código, arte, nome ou áudio de terceiros. Abra o link, escolha a skin e comece a pururucar. Não precisa instalar nem criar conta.

---

## 📚 Sumário

- [🎮 Como jogar](#-como-jogar)
- [⌨️ Controles](#️-controles)
- [🏆 Modos de jogo](#-modos-de-jogo)
- [🗺️ Mapas](#️-mapas)
- [🔫 Armas](#-armas)
- [💣 Granadas](#-granadas)
- [🔥 Killstreaks e camuflagens](#-killstreaks-e-camuflagens)
- [❤️ Mecânicas](#️-mecânicas)
- [🎭 Skins](#-skins)
- [📸 Galeria](#-galeria)
- [💻 Rodando localmente](#-rodando-localmente)
- [🧪 Testes](#-testes)
- [🗂️ Estrutura do projeto](#️-estrutura-do-projeto)
- [⚙️ Por dentro do online](#️-por-dentro-do-online)
- [🤝 Como contribuir](#-como-contribuir)
- [⚠️ Limitações conhecidas](#️-limitações-conhecidas)
- [🙌 Créditos](#-créditos)

---

## 🎮 Como jogar

1. Abra **https://docao.mvalentim.dev**.
2. Escreva **seu nome** (até 16 caracteres) e escolha a **skin** do Docão.
3. Monte o loadout: **uma arma de cada categoria** (primária, secundária e corpo a corpo). Se for de Sabre de Luz, escolha a cor dele também.
4. Escolha o **mapa** (ou **Aleatório**, que sorteia um mapa a cada partida) e o **modo**.
5. Clique em **JOGAR OFFLINE** ou em **JOGAR ONLINE**.

O nome, a skin, as armas, o mapa, o modo e a sensibilidade ficam salvos no navegador.

### 🤖 Offline (contra bots)

- De **4 a 6 bots**, cada um com nome de comida: Farofa, Pipoca, Trufa, Bolota, Torresmo, Paçoca, Linguiça, Quindim, Coxinha e Pururuca.
- Os bots ganham uma primária aleatória, escolhem a arma pela distância, pegam vida e Copo Bomba, arremessam granadas e sobem e descem andares pelas rampas.
- No menu também dá pra escolher o **Tempo** da partida e a **Sensibilidade** do mouse (normal e mirando).

### 🌐 Online (com a galera)

- **Criar sala:** escolha mapa, modo (Mata-mata, Dominação ou Treino), **máximo de jogadores (2 a 10)**, se quer **completar com bots** e o **tempo** (Padrão, 3, 5, 7, 10, 15 ou 20 min). Sai um **código de 4 letras**.
- **Entrar na sala:** digite o código ou abra o link de convite `https://docao.mvalentim.dev/?sala=ABCD`, que já cai direto no lobby.
- **Convite:** no lobby e na pausa tem Copiar link, Copiar código, WhatsApp, Telegram, Slack e Compartilhar.
- **Anfitrião (★):** troca mapa, máximo, bots, modo, tempo e **chat (liga/desliga)**, e clica em **INICIAR PARTIDA**. No fim, ele escolhe **JOGAR DE NOVO** ou **PRÓXIMO MAPA ▸**.
- **Nomes repetidos:** o servidor ajusta sozinho, então o segundo "Matheus" vira "Matheus (2)".
- **Caiu a conexão?** O jogo reconecta sozinho e você volta com o mesmo jogador e o mesmo placar.

---

## ⌨️ Controles

| Tecla | O que faz |
|---|---|
| **W A S D** (ou setas) | andar |
| **Mouse** | mirar |
| **Espaço** | pular |
| **Shift** (segurar, esquerdo ou direito) | agachar: câmera e corpo abaixam, anda mais devagar; só levanta quando há espaço |
| **Clique esquerdo** | atirar · golpe da faca · corte do sabre · segurar = puxar a corda do arco |
| **Botão direito** | mirar com zoom (luneta nas snipers) · **com a faca na mão: estocada** |
| **R** | recarregar |
| **1** / **2** / **3** | primária / secundária / corpo a corpo |
| **Rodinha do mouse** | gira entre as três armas |
| **V** | troca rápida: faca ↔ última arma |
| **Q** (segurar e soltar) | carrega e arremessa o **Copo Bomba** |
| **4** | granada de **fumaça** (só offline) |
| **5** | granada de **atordoamento** (só offline) |
| **F** | usa o **killstreak** pronto (o mais antigo primeiro) |
| **Tab** (segurar) | placar |
| **Esc** ou **P** | pausa |

**Na tela de morte**

| Tecla | O que faz |
|---|---|
| **1 – 9** (ou clique no cartão) | escolhe a primária do próximo renascimento: 1 Fuzil Pururuca · 2 Mini Uzi · 3 P90 · 4 Calibre 12 · 5 Sniper Torresmo · 6 Canhão do Barril · 7 Carabina da Granja · 8 Bazuca · 9 Escopeta Semi |
| **Espaço** / **Enter** ou botão **RENASCER** | volta pro jogo (liberado depois de 5 s) |

**Online: chat e voz**

| Tecla | O que faz |
|---|---|
| **T** | abre o chat para **todos** |
| **Y** / **U** | abre o chat do **time** (na Dominação) |
| **Enter** | abre o chat (com o Docão vivo) |
| **Esc** | fecha o chat |
| **J** | troca a voz: Mudo → Todos → Time |
| **K** (segurar) | fala no microfone (push-to-talk) |

**Modos especiais**

| Modo | Tecla | O que faz |
|---|---|---|
| Treino | **B** | próxima primária, na hora e com pente cheio |
| Treino | **N** | próxima secundária |
| Treino | **M** | alterna faca ↔ sabre |
| Exploração | **,** e **.** (ou **[** e **]**) | primária anterior / próxima |

---

## 🏆 Modos de jogo

### ⚔️ Mata-mata (offline e online)
Todos contra todos. Vence quem fizer **20 abates** primeiro ou quem estiver liderando quando o tempo acabar (**5 min** no padrão).

### 🚩 Dominação (offline e online)
Time **Vermelho × Azul**. Uma **zona de captura** (anel com coluna de luz, raio 4 m) aparece num ponto aleatório do mapa.

- **Tempo de captura:** `26 − n` segundos, onde *n* é o número de jogadores do time dentro da zona (1 → 25 s, 2 → 24 s … 10 → 16 s).
- **Contestada** (os dois times dentro): o progresso congela.
- **Time adversário sozinho:** primeiro neutraliza o progresso do outro, depois começa o dele.
- **Zona vazia:** o progresso cai 0,1 por segundo até zerar.
- Cada captura vale **1 ponto** e a zona reaparece longe da anterior. **Primeiro a 5 vence**, e o tempo padrão é **7 min**.
- Placar individual: abates + 2 × zonas capturadas.
- **Sem fogo amigo**, mas a sua própria explosão ainda te machuca.
- **Escolha de time:** Vermelho, Azul ou Automático. A troca é recusada se deixar um time com 2 humanos a mais que o outro.

### 🧭 Exploração (só offline)
O mapa vazio, só pra você. Sem bots e sem relógio, com munição infinita e renascimento em 1 s. Use **,** **.** **[** **]** pra trocar a primária. É ideal pra conhecer os mapas.

### 🎯 Treino · Estande do Docão (offline e online)
Um estande de tiro no estilo The Range, que abre sempre no mapa **Estande do Docão**.

- Os alvos **não atacam**, levam dano normal e **voltam em 2 s**.
- Números de dano sobem em cima do alvo (amarelo = cabeça).
- **B / N / M** trocam a arma na hora, a reserva de munição é infinita e o Copo Bomba volta sozinho. Não tem limite de tempo.
- Online, os jogadores se dão dano normalmente, então dá pra fazer X1 com a galera.

---

## 🗺️ Mapas

São **9 mapas** de partida, mais o Estande do Docão, que só abre no modo Treino. Todos têm prédios com interior, vários andares ligados por rampas, telhados onde dá pra subir e pelo menos uma linha longa pra Sniper. A geometria, os nomes e a arte são originais. Quando o mapa cita um jogo, foi só a inspiração de layout.

| Mapa | Como é |
|---|---|
| 🏡 **Arena da Fazendinha** | Três corredores, com bases de dois andares e terraço, celeiro com jirau no meio, galinheiro-túnel ao norte e caixa d'água ao sul. |
| 🐖 **Duas Pocilgas** | Estilo Dust2: túneis cobertos até o B, meio com portas e linha de Sniper, catwalk alto pro A, longo com portões e casas de dois andares. |
| 🏭 **Celeiro Industrial** | Estilo Rust/Office: galpão com vão central, mezanino e escritórios, ponte até a torre de contêineres, telhado com casas de máquina e guarita. |
| 🏪 **Mercadão** | Estilo Mirage: palácio com sacada sobre a rampa do A, apartamentos de dois andares até o B, conector, mercearia e a sala da janela olhando o meio. |
| 🛢️ **Torres Gêmeas do Barril** | O mapa comprido de Sniper: torres de três andares, ruínas com trincheira, planaltos com ponte e casamata com telhado. |
| 🏘️ **Vizinhança Cheers** | Estilo Nuketown: duas casas de dois andares frente a frente, garagens com telhado, sacadas, quintais e o ônibus no meio da rua. |
| 🍻 **Bar Cheers Noturno** | Estilo Office: salão com balcão e palco, VIP com sacada no andar de cima, terraço, banheiros, escritório, sinuca e corredores compridos. |
| 🥛 **HOTMILK** | O campus inteiro: Bloco 01 ao norte, Bloco 02 ao sul, estacionamento com catraca atrás, praça entre os blocos e portão na frente. |
| 🔩 **Pátio Ferrugem** | Pátio pequeno no estilo do Rust. A torre do meio é a mais alta, com rampa do chão até o topo. |
| 🎯 **Estande do Docão** *(Treino)* | Raias de 10, 20, 30 e 50 m, alvos andando, área de explosivos e arco, cercadinho da faca e do sabre e arena X1. |

No fim da partida, **PRÓXIMO MAPA ▸** segue a ordem da lista.

---

## 🔫 Armas

Você leva **uma primária + uma secundária + uma arma corpo a corpo**, escolhidas por categoria no menu. Todo Docão tem **100 de vida**. Os valores abaixo são os mesmos no cliente e no servidor (`shared/rules.js`).

> **Como ler:** *Dano* é por tiro (por bago nas escopetas) e *Cabeça* é o multiplicador do tiro na cabeça ("direto no focinho!"). *Cadência* é o tempo entre tiros e *Queda* mostra até onde o dano é cheio, até onde cai e o mínimo que sobra.

### 🔥 Rajada (primária)

| Arma | Pente / reserva | Dano | Cabeça | Cadência | Recarga | Alcance | Queda | Zoom |
|---|---|---|---|---|---|---|---|---|
| **Fuzil Pururuca** (automático) | 30 / 120 | 20 | ×2 | 0,1 s | 1,6 s | 140 m | — | 40° |
| **Mini Uzi do Leitão** (automática) | 25 / 100 | 11 | ×1,6 | 0,055 s | 1,35 s | 70 m | 8 → 28 m, até 35% | 55° |
| **P90 da Granja** (automática) | 50 / 150 | 14 | ×1,5 | 0,07 s | 1,7 s | 110 m | 16 → 48 m, até 45% | 48° |

### 💥 Escopeta (primária)

| Arma | Pente / reserva | Dano | Cabeça | Cadência | Recarga | Alcance | Queda | Zoom |
|---|---|---|---|---|---|---|---|---|
| **Escopeta Chiqueiro · Calibre 12** (pump) | 8 / 32 | 8 bagos × 18 | ×1,5 | 0,8 s | 0,25 s + 0,45 s por cartucho (atirar interrompe) | 45 m | 7 → 30 m, até 30% | 55° |
| **Escopeta Semi do Leitão** | 8 / 32 | 8 bagos × 13 | ×1,5 | 0,36 s | 1,4 s | 40 m | 6 → 22 m, até 25% | 58° |

### 🎯 Precisão (primária, com luneta)

| Arma | Pente / reserva | Dano | Cabeça | Cadência (ferrolho) | Recarga | Alcance | Luneta |
|---|---|---|---|---|---|---|---|
| **Sniper Torresmo** | 5 / 20 | 100 (1 tiro no corpo mata) | ×1,5 | 1,15 s | 2,3 s | 220 m | 13° |
| **Canhão do Barril** | 3 / 6 | 180 (mata em qualquer lugar) | ×1 | 1,85 s | 3,1 s | 260 m | 8° |
| **Carabina da Granja** | 10 / 40 | 55 (2 no corpo, 1 na cabeça) | ×2,2 | 0,58 s | 1,9 s | 180 m | 24° |

- Com a **luneta aberta e parado** (menos de 1,5 m/s), o tiro vai exatamente no centro. Andando ou no ar ele espalha um pouco, e sem luneta espalha mais. A Torresmo é a que mais espalha sem luneta.
- Cada uma tem a sua luneta, e o ferrolho fecha a luneta depois de cada tiro.

### 🚀 Explosivo (primária)

| Arma | Pente / reserva | Dano | Cadência | Recarga | Zoom |
|---|---|---|---|---|---|
| **Bazuca do Chiqueiro** | 1 / 4 | até 120 em área (raio 5 m), 40% em você mesmo | 0,6 s | 2,5 s | 55° |

O foguete voa a 24 m/s e explode ao bater em parede, chão ou Docão (acerto direto dá o dano máximo). Atire no chão embaixo de você pra dar um **rocket jump**. A caixa de munição dá só **+1 foguete**.

### 🔪 Corpo a corpo

| Arma | Golpe | Detalhes |
|---|---|---|
| **Faca de churrasqueiro** | clique: **40** de dano, 1,6 m, a cada 0,42 s · botão direito: estocada de **75**, 1,8 m, a cada 1 s | **pelas costas mata na hora**, e com ela na mão você corre **15% mais rápido** |
| **Sabre de Luz** | **100** de dano por corte, 2,5 m, a cada 0,48 s | um corte na frente mata · você anda **30% mais devagar** · 6 cores: vermelho, azul, verde, roxo, amarelo e branco |

Quem é esfaqueado vê o carimbo **MOGGADO!**, e no feed aparece "X moggou Y [Faca]".

### 🔧 Secundária

| Arma | Pente / reserva | Dano | Cabeça | Cadência | Recarga | Alcance | Queda | Zoom |
|---|---|---|---|---|---|---|---|---|
| **Pistolinha Leitão** (semi) | 12 / 60 | 25 | ×2 | 0,16 s | 1,1 s | 110 m | — | 50° |
| **Furadeira de Prego** | 16 / 64 | 18 | ×1,4 | 0,11 s | 1,25 s | 40 m | 6 → 22 m, até 25% | 58° |
| **Besta do Leitão** | 1 / 10 | 38 | ×1,35 | 0,45 s | 1,35 s (arma a corda) | 80 m | 12 → 40 m, até 45% | 58° |
| **Arco da Granja** | 1 / 16 | 26 × força da corda | ×1,4 | 0,35 s | 0,85 s | 65 m | 10 → 36 m, até 40% | 62° |

No **arco**, segure o clique pra puxar a corda: em 0,7 s ela chega no talo, e a força vai de 0,35× (soltando na hora) até 1,3× (no talo). A besta e o arco são fracos de propósito, então um tiro no corpo não mata.

---

## 💣 Granadas

| Granada | Tecla | Quantidade | Estoura em | Raio | Efeito |
|---|---|---|---|---|---|
| 🥤 **Copo Bomba** | **Q** (segura e solta) | nasce com 1, máx. 3 | 2,5 s | 6 m | até **130** de dano em área, 40% em você mesmo, com empurrão |
| 🌫️ **Fumaça** | **4** | 1 por vida | 1,15 s | 5,6 m | nuvem que tampa a visão por **12 s** |
| ⚡ **Atordoamento** | **5** | 1 por vida | 1,0 s | 7,2 m | por **3,4 s**, quem estiver no raio (até você) fica lento (35% da velocidade), com a tela ofuscada, e não atira |

- O **Copo Bomba** é um copo de festa vermelho com o logo "C!" que explode em confete, espuma e cerveja. A barra de força enche em 1,2 s, um arco tracejado mostra a trajetória e o copo quica nas paredes.
- Os copos que flutuam no mapa dão +1 e reaparecem depois de 20 s.
- A fumaça e o atordoamento **só funcionam offline** e não causam dano.

---

## 🔥 Killstreaks e camuflagens

Abates seguidos sem morrer enchem a barra da direita. Quando um prêmio fica pronto aparece **"F · nome do prêmio"**, e é só apertar **F** pra usar. Com mais de um guardado, o F usa o mais antigo.

| Abates | Prêmio | O que faz |
|---|---|---|
| **3** | 👁️ **Olho da granja** | minimapa que mostra os inimigos por **10 s** |
| **5** | 🚀 **Míssil da granja** | abre o laptop e você **pilota um míssil em primeira pessoa**, que sai do alto do céu e vai pra onde o mouse aponta: até **460** de dano num raio de **26 m** (40% em você) |
| **7** | 🚁 **Gavião da granja** | helicóptero que fica até **30 s** atirando nos inimigos (16 de dano por tiro). Ele tem 280 de vida e dá pra derrubar |
| **10** | ☢️ **Fim da chapa** *(secreto)* | puxa o rádio, roda uma contagem de **5 s** e **todo mundo morre, menos você** (e o seu time na Dominação). Morrer depois de puxar o rádio não cancela |

- Depois do 10º abate a sequência recomeça.
- Os abates do Gavião e da nuke não contam pra sequência. Cada abate do Gavião vale 25 pontos.
- **Online** quem manda é o servidor: ele conta a sequência, confere o prêmio e aplica o dano do míssil, do Gavião e do Fim da chapa, e todo mundo vê o efeito. Os outros jogadores podem derrubar o Gavião.
- **Pontos:** +10 por acerto, +100 por abate e +150 por abate na cabeça.

### 🎨 Camuflagens (valem pra partida)

Abates com a **mesma arma** na mesma partida mudam a cor dela. Tudo zera na partida seguinte.

| Abates com a arma | Camuflagem |
|---|---|
| **5** | 🟫 Camuflagem de chiqueiro |
| **10** | 🥓 Camuflagem de bacon |
| **15** | 🏆 Dourada |

---

## ❤️ Mecânicas

- **Morte = BACON 🥓:** o Docão dá um "pop", some numa nuvem de fumaça e vira uma tira de bacon que quica chiando no chão. A câmera da morte fica olhando pra quem te matou.
- **Bacon que cura:** qualquer Docão vivo que pisar no bacon (menos o próprio morto) ganha **+10 de vida**, até 100. O bacon fica no chão por uns 3,45 s.
- **Regeneração:** se você levou dano de **outro** Docão e ficou **5 s** sem apanhar, a vida volta a **+10 por segundo** até 100, com a barra brilhando em verde. Se o último dano foi seu (bazuca no pé, o seu Copo Bomba, o seu míssil), não regenera.
- **Pickups:** o pickup de vida dá **+50**, a caixa de munição enche a reserva e o copo dá +1 Copo Bomba.
- **Renascimento:** depois de **5 s** o botão vira **RENASCER**, e você volta clicando nele ou apertando Espaço/Enter. Ao nascer, você fica **2 s protegido**.
- **Kill feed** no canto de baixo à esquerda, com frases de porco: *pururucou*, *fritou*, *transformou em torresmo*, *mandou pra chapa*, *defumou*, *fez virar bacon*, *serviu no café da manhã*, *botou no espeto*, *temperou com chumbo*… O tiro na cabeça aparece como **"direto no focinho!"**, e quem morre leva o carimbo **PURURUCADO!**.
- **Placar ao vivo** no canto de cima à esquerda, e o placar completo fica no **Tab**.

---

## 🎭 Skins

São **17 skins**. A identidade do Docão (corpo de porquinho, focinho, orelhas, bochechas, olhos) não muda de propósito, só a roupa.

| | | | |
|---|---|---|---|
| Clássico | Clube Cheers | Rei do Pop | Rapper da Hora |
| Bruxinho | Mestre do Kung Fu | Cabeludo | Pescador |
| Choquinho | Boné da Firma | Fantasminha | Esqueletão |
| Cavaleiro Galáctico | Nômade do Deserto | Boi Caprichoso | Docão Felipe |
| Docão Matheus | | | |

As fantasias são só *inspiradas*. O Docão Felipe e o Docão Matheus são homenagens do time, feitas a pedido. Os bots usam skins aleatórias.

<details>
<summary>🖼️ Ver as skins (imagem com as 14 primeiras)</summary>

<img src="screenshots/skins-grid.png" alt="Grade de skins" width="900">

</details>

<details>
<summary>🧵 Como adicionar uma skin</summary>

Abra `skins.js` e acrescente um objeto no array `SKINS`:

```js
{
  id: 'milan',                       // único, vai pro localStorage
  name: 'Rubro-Negro',               // nome no menu
  shirt: {
    color: '#c8102e',                // cor base da camiseta
    trim: '#111111',                 // gola + punhos
    pattern: { type: 'stripes', colors: ['#c8102e', '#111111'], count: 12 }, // ou 'hoops' (horizontal) ou null
    logo: { text: 'C!', color: '#f5e6d0', outline: null, sub: 'cheers' },    // text 'C!' = logo Cheers; outro texto = letra/número
  },
  pants: '#111111',                  // shorts
  body: { tone: '#ee9c22' },         // opcional; travado na faixa amarelo-laranja
  parts: [                           // opcional; peças do catálogo PARTS
    { type: 'cap', color: '#7DF9FF', brim: '#12233a', logo: true },
    { type: 'glasses', color: '#2a1408' },
  ],
},
```

Campos extras da camiseta: `sleeves: 'short' | 'long' | 'puffy'`, `sleeveColor`, `logo.size / logo.x / logo.y` e
`details: [{ type: 'military' | 'frogs' | 'clouds' | 'tie' | 'zipper' | 'backStripes' | 'bones' | 'tunicWrap' | 'stillsuit', ... }]`.
Outros campos opcionais: `face: { paint: 'skull' }`, `eyes: { iris: '#hex' }` e `float: true` (flutua e deixa rastro).

Peças 3D disponíveis (`parts`):
- **chapéus:** `cap`, `fedora`, `bucketHat`, `roundCap`, `hood`
- **cabelo:** `longHair` (com `headband` opcional)
- **rosto:** `glasses`, `sunglasses`
- **mãos e pés:** `glove` (`hand: 'right' | 'left' | 'both'`), `shoes`, `socks`
- **corpo:** `epaulettes`, `puffer`, `chain`, `robe`, `scarf`, `wand`, `mandarinCollar`, `vest`, `fish`, `boltTail`, `bandana`, `headphones`
- **fantasias:** `ghostSheet`, `boneLimbs`, `sash`, `laserSword`, `armWraps`, `hoodDown`, `noseTube`, `desertScarf`

Pra criar um tipo novo de peça, crie uma função em `PARTS` no `costumes.js`. Ela recebe `(opções, rig)` e devolve um `THREE.Object3D` (use `userData.anchor = 'head'` pra prender na cabeça). Pra conferir a skin isolada, abra `render.html?skin=<id>&rot=0.6&frame=face`.

</details>

---

## 📸 Galeria

| | |
|---|---|
| <img src="screenshots/18-mapa-mercadao-visao-geral.png" alt="Mercadão visto de cima"><br>**Mercadão** visto de cima | <img src="screenshots/17-online-zona-contestada.png" alt="Zona contestada na Dominação"><br>**Dominação** online: zona contestada |
| <img src="screenshots/12-sniper-scope.png" alt="Luneta da Sniper Torresmo"><br>Luneta da **Sniper Torresmo** | <img src="screenshots/20-faca-primeira-pessoa.png" alt="Faca de churrasqueiro"><br>**Faca de churrasqueiro** na cara do Farofa |
| <img src="screenshots/19-bacon-4-fritando.png" alt="Bacon fritando no chão"><br>Morreu, virou **bacon** 🥓 | <img src="screenshots/15-online-lobby.png" alt="Lobby online"><br>**Lobby** da sala online |

<sub>Algumas capturas são de versões anteriores, então o menu e o HUD de hoje podem estar um pouco diferentes.</sub>

---

## 💻 Rodando localmente

O jogo é um site estático com módulos ES, e o Three.js já vem em `vendor/`. Só precisa ser servido por HTTP:

```bash
git clone https://github.com/valentimm/docao-shooter.git
cd docao-shooter
python3 -m http.server 8124
# abra http://localhost:8124
```

### Servidor online local

O servidor é um Cloudflare Worker com Durable Objects, que fica em `server/`:

```bash
cd server
npm install
npx wrangler dev --port 8787
```

Depois abra o jogo apontando pro servidor local, inclusive em duas abas pra testar o multiplayer:

```
http://localhost:8124/?server=ws://127.0.0.1:8787
```

Parâmetros de URL úteis:
- `?server=` troca o servidor (o padrão está em `config.js`)
- `?sala=ABCD` entra direto no lobby
- `?hz=10` muda a taxa de envio pro servidor (padrão 20/s)

### Deploy

- **Site:** a Vercel publica a `main` sozinha. O `.vercelignore` deixa `server/` e os testes de fora.
- **Servidor:** `cd server && npx wrangler deploy`. Para só gerar o bundle, use `npx wrangler deploy --dry-run --outdir dist`. Se mudar a URL do Worker, ajuste `SERVER_URL` em `config.js`. Publique o Worker **antes** do site quando o protocolo mudar.

---

## 🧪 Testes

Os testes de navegador usam **Playwright** em modo headless, e vários deles salvam capturas em `screenshots/`. Instale as dependências na raiz com `npm install` e suba o servidor estático. A maioria espera o jogo em `http://localhost:8124/`. `test.mjs`, `test-maps.mjs` e `test-streaks.mjs` usam a porta 8123 (o `test-streaks` aceita `SITE=`).

| Sem navegador | Offline (navegador) | Online (precisa do `wrangler dev`) |
|---|---|---|
| `test-shared.mjs`: regras compartilhadas | `test.mjs`: fluxo geral | `test-online.mjs` |
| `test-crouch.mjs`: postura, colisão, hitboxes e histórico online | `test-crouch-browser.mjs`: Shift, câmera e animação | |
| `test-map-audit.mjs`: auditoria dos mapas + partida simulada | `test-maps.mjs`: mapas, escadas e telhados | `test-online-dom.mjs` |
| `test-social.mjs`: protocolo do chat e da voz | `test-dom.mjs`: Dominação | `test-online-idle.mjs` |
| `test-chat-voice.mjs`: chat e voz numa sala falsa | `test-streaks.mjs`: granadas e killstreaks | `test-online-names.mjs` |
| `tools/stuck-repro.mjs`: ninguém fica preso na parede | `test-treino.mjs`, `test-faca.mjs`, `test-bacon.mjs` | `test-online-nextmap.mjs` |
| | `test-mira.mjs`, `test-reload.mjs`, `test-respawn.mjs` | `test-faca-online.mjs`, `test-treino-online.mjs` |
| | `test-nextmap.mjs`, `test-skin-start.mjs` | `test-prod.mjs`, `test-prod-dom.mjs` |
| | | `tools/test-killstreak-online.mjs`: míssil, Gavião e nuke online |

Exemplo do online:

```bash
cd server && npx wrangler dev --port 8787 --var ALLOW_TEST:1   # ALLOW_TEST só pros testes automáticos
node test-online.mjs http://localhost:8124/ ws://127.0.0.1:8787
```

---

## 🗂️ Estrutura do projeto

```
docao-shooter/
├── index.html · style.css     # menu, HUD, lobby, pausa e placar
├── main.js                    # o jogo: física, armas, bots, áudio, fluxo e online
├── maps.js                    # os mapas (só dados) + PLAY_MAPS
├── world.js · world-offsets.js  # monta o mundo e as miniaturas dos mapas
├── nav.js                     # grafo de navegação + A* dos bots
├── docao.js · costumes.js     # modelo 3D do Docão e peças de fantasia
├── skins.js                   # registro das skins (só dados)
├── killstreak-ui.js · uav.js  # barra de prêmios e minimapa
├── tactical-nades.js          # fumaça e atordoamento
├── weapon-camo.js · weapon-thumbs.js   # camuflagens e miniaturas das armas
├── sniper-view.js · bow-view.js · saber-view.js · fp-gear.js  # modelos em 1ª pessoa
├── bacon.js · feedback.js     # bacon da morte, medalhas e pontos
├── chat.js · voice.js · net.js · config.js   # chat, voz (WebRTC), rede e URL do servidor
├── shared/                    # regras usadas pelo cliente e pelo servidor
│   ├── rules.js               # armas, Copo Bomba, física, tempos, bots
│   ├── combat.js · melee.js   # explosões, dispersão da sniper, faca
│   ├── domination.js · training.js   # Dominação e Treino
│   └── physics.js · names.js  # colisão e nomes
├── server/                    # Cloudflare Worker + Durable Object "Room"
│   └── src/index.js · src/game.js
├── tools/                     # planta dos mapas, screenshots, auditorias
├── vendor/                    # Three.js r169 + BufferGeometryUtils
├── test*.mjs                  # testes (Playwright e Node)
└── PATCH_NOTES.md             # histórico de versões
```

---

## ⚙️ Por dentro do online

<details>
<summary>Arquitetura do servidor e do cliente</summary>

- **Servidor:** fica em `server/`. É um Cloudflare Worker com um **Durable Object `Room`** (SQLite, plano grátis) por código de sala.
  - `POST /api/rooms` cria a sala e `GET /api/rooms/ABCD` consulta.
  - `GET /ws/ABCD?name=&skin=&primary=&token=` abre o WebSocket e `GET /health` responde a checagem.
  - Usa a WebSocket Hibernation API, então no lobby o objeto hiberna sem custo, e o `ping`/`pong` é resposta automática.
  - Sala vazia é apagada depois de 2 min.
- **Autoritativo:** `server/src/game.js` não tem DOM nem Three.js e decide acertos, dano, abates, placar, renascimento, pickups, Copo Bomba, foguetes, faca, bacon, regeneração e o fim da partida. Usa os mesmos `maps.js`, `nav.js` e `shared/` do cliente.
- **Cliente:** `net.js` e a seção Online do `main.js`. O seu Docão anda localmente, sem atraso, e manda posição, mira, arma e eventos ~20 vezes por segundo. Os outros aparecem com **interpolação de 100 ms**.
- **Tiro:** é hitscan no servidor com compensação de lag (o servidor volta no tempo até o instante que você via na tela).
- **Anti-cheat básico:** o servidor confere velocidade máxima, posição dentro do mapa e fora das paredes, cadência por arma, munição, pente e recarga, e se o tiro sai perto do olho.
- **Bots online:** rodam no servidor com a mesma IA dos bots offline. Ocupam as vagas livres e saem quando alguém entra.
- **Reconexão:** o token fica na `sessionStorage` e a vaga fica guardada por 30 s.
- **Voz:** o áudio vai de navegador a navegador (WebRTC). O servidor só apresenta os jogadores.
- **Custo:** cada mensagem recebida por WebSocket conta 1/20 de requisição no plano grátis (100 mil por dia). Se precisar economizar, use `?hz=10`.

</details>

<details>
<summary>Como criar um mapa novo</summary>

- `maps.js` é só dados. Cada mapa tem `id`, `name`, `desc`, `size`, `palette`, `boxes`, `props`, `spawns`, `pickups` e `waypoints`.
- Helpers: `B()` (caixa), `R()` (rampa), `wallX`/`wallZ` com `door()`/`win()`, `mirrorZ`/`rot180` e `building(...)`, que monta um prédio com andares, portas, janelas, lajes, rampas e telhado.
- Dica: comece a rampa a pelo menos 1 m da parede, senão não dá pra subir.
- Depois rode:
  - `node test-map-audit.mjs [ids]`
  - `node tools/stuck-repro.mjs [ids]` (tem que dar 0 / 0 / 0)
  - `node test-maps.mjs`
- Pra gerar fotos, use `node tools/screenshots-mapas.mjs`, e pra ver a planta, `python3 tools/planta.py`.

</details>

---

## 🤝 Como contribuir

1. Faça um **fork** (ou crie uma branch, se você for colaborador) a partir da `main`.
2. Rode o jogo localmente e os testes da área que você mexeu.
3. Abra um **Pull Request para a `main`**. A `main` é protegida e precisa de **1 aprovação** pra entrar.
4. Escreva o que mudou em **[`PATCH_NOTES.md`](PATCH_NOTES.md)**, num item da próxima versão, em linguagem de jogador. Use esse arquivo, **não** o `PATCHNOTES.md`.
5. Se mexeu no protocolo online, avise no PR, porque o Worker precisa ir pro ar antes do site.

Ideias, bugs e sugestões de mapa ou skin são bem-vindos nas issues. 🐷

---

## ⚠️ Limitações conhecidas

- A **fumaça** e o **atordoamento** só funcionam offline.
- Online o **Olho da granja** (minimapa) é calculado no seu próprio jogo. O míssil, o Gavião e o Fim da chapa são decididos pelo servidor.
- A colisão é feita de caixas alinhadas, por isso os andares são ligados por rampas (não há escada de mão) e barris e silos colidem como quadrados.
- Os bots não fazem rocket jump nem pulam entre telhados.

---

## 🙌 Créditos

- **Matheus Valentim** ([@valentimm](https://github.com/valentimm)): criador do jogo e da maior parte do código, dos mapas e das skins
- **João** ([@rramosjoao](https://github.com/rramosjoao)): mira, snipers, granadas táticas, killstreaks, Arsenal do Chiqueiro, Gavião, míssil pilotado e camuflagens
- **Janor** ([@Janor-Neto-Cheers](https://github.com/Janor-Neto-Cheers)): chat, voz e convite da sala
- **Paulo** ([@paulo-cheers](https://github.com/paulo-cheers)): campus HOTMILK e modo Exploração

O Docão é o mascote da **Cheers** 🧡

📜 **[Patch notes](PATCH_NOTES.md)** · 🏷️ **[Releases](https://github.com/valentimm/docao-shooter/releases)** · 🎮 **[Jogar agora](https://docao.mvalentim.dev)**

<div align="center"><sub>Feito com muito torresmo e zero ovos. Oink! 🐽</sub></div>
