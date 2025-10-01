// Acessando os elementos HTML
const alavanca = document.getElementById("alavanca");
const resultado = document.getElementById("resultado");
const saldoEl = document.getElementById("saldo");
const apostaEl = document.getElementById("aposta");
const celulas = document.querySelectorAll(".grid-cell");
const musicaFundo = document.getElementById("musica-fundo");
const premioAtualEl = document.getElementById("premio-atual");

// Elementos de controle de áudio e pagamentos
const btnAudio = document.getElementById("btn-audio");
const somVitoria = document.getElementById("som-vitoria");
const btnPagamentos = document.getElementById("btn-pagamentos");

// Elementos de fogos de artifício
const fireworksLeft = document.getElementById("fireworks-left");
const fireworksRight = document.getElementById("fireworks-right");

// Elementos de Turbo
const btnTurbo = document.getElementById("btn-turbo");
const rodadasTurboEl = document.getElementById("rodadas-turbo");

// Modal de Seleção
const selectionModal = document.getElementById("selection-modal");
const modalTitle = document.getElementById("modal-title");
const modalGrid = document.getElementById("modal-grid");
const modalCloseBtn = document.getElementById("modal-close-btn");
const apostaSelector = document.getElementById("aposta-selector");
const rodadasTurboSelector = document.getElementById("rodadas-turbo-selector");

// Modal de Pagamentos
const modalPagamentos = document.getElementById("modal-pagamentos");
const pagamentosGrid = document.getElementById("pagamentos-grid");
const pagamentosModalCloseBtn = document.getElementById(
  "pagamentos-modal-close-btn"
);

// Histórico de Ganhos
const historicoLista = document.getElementById("historico-lista");

// Símbolos do jogo. '🧙' é o Wildcard
const simbolos = [
  "⚔️",
  "⚔️",
  "⚔️",
  "⚔️",
  "⚔️",
  "⚔️",
  "⚔️",
  "🛡️",
  "🛡️",
  "🛡️",
  "🛡️",
  "🛡️",
  "🛡️",
  "🪙",
  "🪙",
  "🪙",
  "🪙",
  "🪙",
  "👑",
  "👑",
  "👑",
  "🐉",
  "🐉",
  "🧙",
  "🩳",
  "🩳",
  "🦦",
];

// Tabela de prêmios por símbolo
const tabelaDePremios = {
  "🐉": 25,
  "👑": 15,
  "🪙": 10,
  "🛡️": 5,
  "⚔️": 5,
  "🦦": 30,
  "🩳": 12,
  "🧙": 25,
};

// Variáveis de estado
let saldo = 100;
let premioTotalRodada = 0;
let isPlaying = false;
let sequenceCount = 0;
let musicaTocando = false;
let modoTurbo = false;
let rodadasRestantes = 0;
let isMuted = false;
let historicoResultados = [];
let currentSelectionType = null;

// Valores para cada tipo de seleção
const apostaValues = [
  10, 20, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 2500,
];
const turboValues = [1, 5, 10, 25, 50, 100];

// --- FUNÇÕES UTILITÁRIAS ---

function formatarValor(valor) {
  if (valor >= 1000000) {
    return (valor / 1000000).toString().replace(/\.0$/, "") + "M";
  }
  if (valor >= 1000) {
    return (valor / 1000).toString().replace(/\.0$/, "") + "k";
  }
  return valor;
}

// --- FUNÇÕES DE CONTROLE DE ÁUDIO ---

function aplicarVolume() {
  musicaFundo.volume = isMuted ? 0 : 0.5;
  somVitoria.volume = isMuted ? 0 : 1.0;
  btnAudio.textContent = isMuted ? "🔇" : "🔊";
}

function toggleMusica() {
  if (!musicaTocando) {
    musicaFundo
      .play()
      .catch((e) => console.log("Reprodução de áudio bloqueada: ", e));
    musicaTocando = true;
  }
}

function toggleMute() {
  isMuted = !isMuted;
  aplicarVolume();
}

// --- FUNÇÕES DE INTERFACE (UI) ---

function atualizarSaldo(valor) {
  saldo += valor;
  saldoEl.textContent = saldo;
  saldoEl.classList.remove("deduct", "gain");
  if (valor < 0) saldoEl.classList.add("deduct");
  else if (valor > 0) saldoEl.classList.add("gain");
  setTimeout(() => saldoEl.classList.remove("deduct", "gain"), 500);
}

function brilharCelulasVencedoras(indicesVencedores) {
  indicesVencedores.forEach((index) => celulas[index].classList.add("winner"));
  setTimeout(
    () =>
      indicesVencedores.forEach((index) =>
        celulas[index].classList.remove("winner")
      ),
    2000
  );
}

function atualizarHistorico(valor, tipo) {
  historicoResultados.unshift({ valor, tipo });
  if (historicoResultados.length > 5) {
    historicoResultados.pop();
  }
  historicoLista.innerHTML = "";
  historicoResultados.forEach((item) => {
    const li = document.createElement("li");
    li.textContent =
      item.tipo === "ganho" ? `+${item.valor}` : `-${item.valor}`;
    li.className = item.tipo;
    historicoLista.appendChild(li);
  });
}

// --- LÓGICA PRINCIPAL DO JOGO ---

function girarRoleta() {
  return new Promise((resolve) => {
    let intervalo = setInterval(() => {
      celulas.forEach((celula) => {
        celula.textContent =
          simbolos[Math.floor(Math.random() * simbolos.length)];
      });
    }, 50);
    setTimeout(() => {
      clearInterval(intervalo);
      resolve();
    }, 2000);
  });
}

function pararRoleta() {
  const resultadosFinais = [];
  celulas.forEach((celula) => resultadosFinais.push(celula.textContent));
  return resultadosFinais;
}

function preencherCelulas(indicesParaPreencher) {
  return new Promise((resolve) => {
    indicesParaPreencher.forEach((index, i) => {
      const celula = celulas[index];
      const novoSimbolo = simbolos[Math.floor(Math.random() * simbolos.length)];

      // Atraso para cada célula cair individualmente
      setTimeout(() => {
        celula.textContent = novoSimbolo;
        celula.classList.add("falling");
        // Remove a classe de animação depois que ela termina
        celula.addEventListener(
          "animationend",
          () => {
            celula.classList.remove("falling");
          },
          { once: true }
        );
      }, i * 100);
    });
    setTimeout(resolve, 500 + indicesParaPreencher.length * 100);
  });
}

async function processarVitoriaEmCascata(apostaAtual) {
  let houveVitoriaNestaRodada = true;
  while (houveVitoriaNestaRodada) {
    const resultadosAtuais = pararRoleta();
    const { premio, celulasVencedorasIndices } = verificarLinhas(
      resultadosAtuais,
      apostaAtual
    );
    if (premio > 0) {
      somVitoria.pause();
      somVitoria.currentTime = 0;
      somVitoria.play();
      sequenceCount++;
      premioTotalRodada += premio;
      atualizarSaldo(premio);
      premioAtualEl.textContent = premioTotalRodada;
      brilharCelulasVencedoras(celulasVencedorasIndices);

      celulasVencedorasIndices.forEach((index) => {
        celulas[index].classList.add("exploding");
      });

      await new Promise((resolve) => setTimeout(resolve, 300)); // Espera a animação de explodir

      celulasVencedorasIndices.forEach((index) => {
        celulas[index].textContent = "";
        celulas[index].classList.remove("exploding");
      });

      await preencherCelulas(celulasVencedorasIndices);

      resultado.textContent = `🎉 +${premio} moedas! ${
        sequenceCount > 1 ? `Sequência ${sequenceCount}!` : ""
      } Total: ${premioTotalRodada} moedas.`;
      resultado.classList.add("ganhou");
      await new Promise((resolve) => setTimeout(resolve, 800));
    } else {
      houveVitoriaNestaRodada = false;
    }
  }
}

function verificarLinhas(resultados, aposta) {
  let premio = 0;
  const celulasVencedorasIndices = new Set();
  const linhas = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Horizontais
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Verticais
    [0, 4, 8],
    [2, 4, 6], // Diagonais
  ];

  linhas.forEach((indices) => {
    const [a, b, c] = indices;
    const s1 = resultados[a],
      s2 = resultados[b],
      s3 = resultados[c];
    let winningSymbol = null;

    if (s1 === s2 && s1 === s3) winningSymbol = s1;
    else if (s1 === "🧙" && s2 === s3) winningSymbol = s2;
    else if (s2 === "🧙" && s1 === s3) winningSymbol = s1;
    else if (s3 === "🧙" && s1 === s2) winningSymbol = s1;
    else if (
      (s1 === "🧙" && s2 === "🧙") ||
      (s1 === "🧙" && s3 === "🧙") ||
      (s2 === "🧙" && s3 === "🧙")
    ) {
      const nonWilds = [s1, s2, s3].filter((s) => s !== "🧙");
      if (nonWilds.length === 1) winningSymbol = nonWilds[0];
      else if (nonWilds.length === 0) winningSymbol = "🐉";
    }

    if (winningSymbol && tabelaDePremios[winningSymbol] !== undefined) {
      premio += aposta * tabelaDePremios[winningSymbol];
      indices.forEach((i) => celulasVencedorasIndices.add(i));
    }
  });

  return {
    premio,
    celulasVencedorasIndices: Array.from(celulasVencedorasIndices),
  };
}

function verificarRecompensaRara(resultados) {
  const linhas = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const indices of linhas) {
    const linhaDeSimbolos = [
      resultados[indices[0]],
      resultados[indices[1]],
      resultados[indices[2]],
    ];
    const contagemLontras = linhaDeSimbolos.filter((s) => s === "🦦").length;
    const contagemShorts = linhaDeSimbolos.filter((s) => s === "🩳").length;
    if (contagemLontras === 2 && contagemShorts === 1) return true;
  }
  return false;
}

function ativarRecompensaRara() {
  const premioRaro = 5000;
  atualizarSaldo(premioRaro);
  atualizarHistorico(premioRaro, "ganho");
  somVitoria.play();
  resultado.textContent = `RECOMPENSA RARÍSSIMA! 🦦🦦🩳 Você ganhou +${premioRaro} moedas!`;
  resultado.className = "mensagem ganhou";
  premioAtualEl.textContent = premioRaro;
  document
    .querySelector(".maquina-completa")
    .classList.add("super-win", "super-scale");
  setTimeout(() => {
    document
      .querySelector(".maquina-completa")
      .classList.remove("super-win", "super-scale");
  }, 5000);
}

async function executarRodadaUnica(aposta) {
  if (isNaN(aposta) || aposta < 10) {
    resultado.textContent = "A aposta mínima é 10 moedas.";
    resultado.className = "mensagem perdeu";
    return;
  }
  if (aposta > saldo) {
    resultado.textContent = "Saldo insuficiente!";
    resultado.className = "mensagem perdeu";
    if (modoTurbo) modoTurbo = false;
    return;
  }

  atualizarSaldo(-aposta);
  atualizarHistorico(aposta, "perda");
  premioAtualEl.textContent = "0";
  if (!modoTurbo) {
    alavanca.classList.add("puxando");
    resultado.textContent = "Girando a roleta...";
    resultado.className = "mensagem";
  }

  await girarRoleta();
  if (!modoTurbo) setTimeout(() => alavanca.classList.remove("puxando"), 200);

  celulas.forEach((celula) =>
    celula.classList.remove("winner", "exploding", "falling")
  );
  premioTotalRodada = 0;
  sequenceCount = 0;
  const resultadosFinais = pararRoleta();

  if (verificarRecompensaRara(resultadosFinais)) {
    ativarRecompensaRara();
    return;
  }

  const { premio } = verificarLinhas(resultadosFinais, aposta);
  if (premio > 0) {
    await processarVitoriaEmCascata(aposta);
    resultado.textContent = `VOCÊ GANHOU! 🎉 Total: +${premioTotalRodada} moedas!`;
    resultado.classList.add("ganhou");
    atualizarHistorico(premioTotalRodada, "ganho");

    if (premioTotalRodada >= 1000) {
      document
        .querySelector(".maquina-completa")
        .classList.add("super-win", "super-scale");
      setTimeout(
        () =>
          document
            .querySelector(".maquina-completa")
            .classList.remove("super-win", "super-scale"),
        5000
      );
    }
  } else {
    resultado.textContent = "Você perdeu. Tente novamente.";
    resultado.classList.add("perdeu");
  }

  if (modoTurbo) {
    resultado.textContent = `Rodada ${rodadasRestantes + 1} de ${
      rodadasTurboEl.value
    }.`;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function iniciarTurbo() {
  if (isPlaying) return;
  const rodadasDesejadas = parseInt(rodadasTurboEl.value, 10);
  const aposta = parseInt(apostaEl.value, 10);
  if (isNaN(rodadasDesejadas) || rodadasDesejadas < 1) {
    resultado.textContent = "Insira um número válido de rodadas.";
    resultado.className = "mensagem perdeu";
    return;
  }

  modoTurbo = true;
  isPlaying = true;
  rodadasRestantes = rodadasDesejadas;
  toggleMusica();
  alavanca.classList.add("puxando");
  resultado.textContent = `Iniciando modo Turbo...`;

  while (rodadasRestantes > 0 && saldo >= aposta) {
    await executarRodadaUnica(aposta);
    rodadasRestantes--;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  modoTurbo = false;
  isPlaying = false;
  alavanca.classList.remove("puxando");

  if (saldo < aposta) {
    resultado.textContent = "Modo turbo finalizado por saldo insuficiente.";
    resultado.classList.add("perdeu");
  } else {
    resultado.textContent = "Modo turbo finalizado.";
    resultado.classList.add("ganhou");
  }
}

// --- FUNÇÕES DOS MODAIS ---

function openSelectionModal(type) {
  currentSelectionType = type;
  modalGrid.innerHTML = "";
  let values = [];
  if (type === "aposta") {
    modalTitle.textContent = "Selecione sua Aposta";
    values = apostaValues;
    const btnApostarTudo = document.createElement("button");
    btnApostarTudo.className = "modal-option-btn apostar-tudo-btn";
    btnApostarTudo.textContent = "Apostar Tudo";
    btnApostarTudo.addEventListener("click", () => selectValue(saldo));
    modalGrid.appendChild(btnApostarTudo);
  } else {
    modalTitle.textContent = "Selecione as Rodadas Turbo";
    values = turboValues;
  }

  values.forEach((value) => {
    const btn = document.createElement("button");
    btn.className = "modal-option-btn";
    btn.textContent = formatarValor(value);
    btn.addEventListener("click", () => selectValue(value));
    modalGrid.appendChild(btn);
  });
  selectionModal.classList.remove("hidden");
}

function closeSelectionModal() {
  selectionModal.classList.add("hidden");
}

function selectValue(value) {
  if (currentSelectionType === "aposta") {
    apostaEl.value = value;
    apostaSelector.textContent = formatarValor(value);
  } else {
    rodadasTurboEl.value = value;
    rodadasTurboSelector.textContent = value;
  }
  closeSelectionModal();
}

function abrirModalPagamentos() {
  pagamentosGrid.innerHTML = "";
  const regrasEspeciais = {
    "🧙": "<strong>Wild (Coringa):</strong> Substitui qualquer outro símbolo.",
    "🦦": "<strong>Prêmio Raro:</strong> Linha com 2 Lontras e 1 Shorts (🩳) = <strong>5000 moedas!</strong>",
  };

  for (const simbolo in tabelaDePremios) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "pagamento-item";
    let descricao = `Prêmio: <strong>x${tabelaDePremios[simbolo]}</strong> da aposta.`;
    if (regrasEspeciais[simbolo]) {
      descricao += `<br><small>${regrasEspeciais[simbolo]}</small>`;
    }
    itemDiv.innerHTML = `<span>${simbolo}</span><p>${descricao}</p>`;
    pagamentosGrid.appendChild(itemDiv);
  }
  modalPagamentos.classList.remove("hidden");
}

function fecharModalPagamentos() {
  modalPagamentos.classList.add("hidden");
}

// --- EVENT LISTENERS ---

alavanca.addEventListener("click", async () => {
  if (isPlaying) return;
  toggleMusica();
  const aposta = parseInt(apostaEl.value, 10);
  isPlaying = true;
  await executarRodadaUnica(aposta);
  isPlaying = false;
});

btnTurbo.addEventListener("click", iniciarTurbo);
btnAudio.addEventListener("click", toggleMute);

apostaSelector.addEventListener("click", () => openSelectionModal("aposta"));
rodadasTurboSelector.addEventListener("click", () =>
  openSelectionModal("turbo")
);

modalCloseBtn.addEventListener("click", closeSelectionModal);
selectionModal.addEventListener("click", (event) => {
  if (event.target === selectionModal) {
    closeSelectionModal();
  }
});

btnPagamentos.addEventListener("click", abrirModalPagamentos);
pagamentosModalCloseBtn.addEventListener("click", fecharModalPagamentos);
modalPagamentos.addEventListener("click", (event) => {
  if (event.target === modalPagamentos) {
    fecharModalPagamentos();
  }
});

// Inicialização
aplicarVolume();
