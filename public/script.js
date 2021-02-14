let urlBase = `${window.location.href}`;
//urlBase = `http://localhost:3333/`; //rodar local

let carteira = {
  totalAcoes: 0,
  totalFiis: 0,
  acoes: [],
  fiis: [],
};


jQuery.extend(jQuery.fn.dataTableExt.oSort, {
  "currency-pre": function (a) {
    a = (a === "-") ? 0 : a.replace(/[^\d\-\.]/g, "");
    return parseFloat(a);
  },

  "currency-asc": function (a, b) {
    return a - b;
  },

  "currency-desc": function (a, b) {
    return b - a;
  }
});

let configDataTable = {
  stateSave: true,
  language: {
    url: 'https://cdn.datatables.net/plug-ins/1.10.22/i18n/Portuguese-Brasil.json'
  },
  columnDefs: [
    { type: 'currency', targets: [3, 4, 5, 6] }
  ]
};

let dataUltimaPesquisa;

$(document).ready(function () {
  $('#TabelaAcoes').DataTable(configDataTable);
  $('#TabelaFii').DataTable(configDataTable);
  $(".dataTables_empty").remove();
});


const salvaCarteira = () => {
  localStorage.setItem("carteira", JSON.stringify(carteira));
};

const carregaCarteira = () => {
  const c = JSON.parse(localStorage.getItem("carteira"));
  if (c) {
    carteira = c;
  }
};

function salvaDataUltimaPesquisa() {
  localStorage.setItem("ultimaPesquisa", JSON.stringify(new Date().toLocaleDateString()));
}

function carregaDataUltimaPesquisa() {
  const d = JSON.parse(localStorage.getItem("ultimaPesquisa"));
  if (d) {
    return d;
  }
  else {
    return null;
  }
}

onload = () => {
  carregaCarteira();

  if (verificaDataPesquisa()) {
    recarregarValorAcoes();
    recarregarValorFiis();
    calcularPorcentagemAcoes();
    calcularPorcentagemFiis();
    salvaDataUltimaPesquisa();
    salvaCarteira();
  }
  else {
    recarregarValorAcoes();
    salvaDataUltimaPesquisa();
  }

  mostraItens();
};

function verificaDataPesquisa() {
  const ultimaPesquisa = carregaDataUltimaPesquisa();
  if (ultimaPesquisa) {
    if (new Date().toLocaleDateString() > ultimaPesquisa) {
      return true;
    }
  }
  return false;
}

function recarregarValorAcoes() {
  if (carteira.acoes.length > 0) {
    carteira.acoes.forEach(acao => {
      acao.valor = buscarPrecoAcao(acao.tickerAcao);
    });
  }
}

function recarregarValorFiis() {
  if (carteira.fiis.length > 0) {
    carteira.fiis.forEach(fii => {
      fii.valor = buscarPrecoFii(fii.tickerFii);
    });
  }
}

const mostraItens = () => {
  limparCampos();

  let valoresAcao = {
    total: 0,
    valorPago: 0,
    valorTotal: 0
  }

  let valoresFiis = {
    total: 0,
    valorPago: 0,
    valorTotal: 0
  }

  carteira.acoes.forEach(acao => {
    inserirTabelaAcoes(acao);
    adicionarNovaAcaoSelect(acao.tickerAcao)
    valoresAcao.total += acao.qntd;
    valoresAcao.valorPago += acao.precoMedio * acao.qntd;
    valoresAcao.valorTotal += acao.valor > 0 ? acao.valor * acao.qntd : 0
  });

  carteira.fiis.forEach(fii => {
    inserirTabelaFiis(fii);
    adicionarNovoFiiSelect(fii.tickerFii)
    valoresFiis.total += fii.qntd;
    valoresFiis.valorPago += fii.precoMedio * fii.qntd;
    valoresFiis.valorTotal += fii.valor > 0 ? fii.valor * fii.qntd : 0
  });

  montarLabelsValoresAcao(valoresAcao);
  montarLabelsValoresFiis(valoresFiis);
};

function montarLabelsValoresAcao(acao) {
  $("#TotalQntdAcao").html(acao.total);
  $("#TotalPagoAcao").html(formatarValor(acao.valorPago));
  $("#TotalValorAcao").html(formatarValor(acao.valorTotal));
  $("#Valorizacao").html(formatarValor(acao.valorTotal - acao.valorPago));
  $("#Valorizacao").addClass(acao.valorTotal - acao.valorPago > 0 ? "valorizacaoPositiva" : "valorizacaoNegativa")
}

function montarLabelsValoresFiis(fii) {
  $("#TotalQntdFii").html(fii.total);
  $("#TotalPagoFii").html(formatarValor(fii.valorPago));
  $("#TotalValorFii").html(formatarValor(fii.valorTotal));
  $("#ValorizacaoFii").html(formatarValor(fii.valorTotal - fii.valorPago));
  $("#ValorizacaoFii").addClass(fii.valorTotal - fii.valorPago > 0 ? "valorizacaoPositiva" : "valorizacaoNegativa")
}

function limparCampos() {
  const listaDeAcoes = document.querySelector('#bodyTabelaAcoes');
  listaDeAcoes.innerHTML = '';
  $('#selectAcoes option').each(function () {
    if ($(this).val() != '0') {
      $(this).remove();
    }
  });

  const listaDeFiis = document.querySelector('#bodyTabelaFii');
  listaDeFiis.innerHTML = '';
  $('#selectFii option').each(function () {
    if ($(this).val() != '0') {
      $(this).remove();
    }
  });

  $("#Valorizacao").removeClass();
  $("#ValorizacaoFii").removeClass();
}


function AdicionarCompraAcao() {
  const tickerSelectAcao = $("#selectAcoes option:selected")[0].value;
  const qntdSelectAcao = $("#inputInserirQntdCompraAcao")[0].value;
  const precoAcao = $("#inputInserirValorCompraAcao")[0].value;

  if (
    tickerSelectAcao &&
    tickerSelectAcao != 0 &&
    qntdSelectAcao &&
    qntdSelectAcao != "0" &&
    precoAcao &&
    precoAcao != "0,00"
  ) {
    const acao = carteira.acoes.find((x) => x.tickerAcao == tickerSelectAcao);
    const floatPrecoAcao = parseFloat(precoAcao.replace(',', '.'))

    acao.qntd += parseInt(qntdSelectAcao);
    acao.historico.push({
      qntdComprada: qntdSelectAcao,
      precoComprada: floatPrecoAcao,
      tipo: '+'
    });
    carteira.totalAcoes += parseInt(qntdSelectAcao);

    calcularPorcentagemAcoes();
    calcularPrecoMedioPorAcao(tickerSelectAcao);

    salvaCarteira();

    $("#selectAcoes").val("0");
    $("#inputInserirQntdCompraAcao").val("");
    $("#inputInserirValorCompraAcao").val("");

    mostraItens();
  }
}

function removerAcao() {
  const tickerSelectAcao = $("#selectAcoes option:selected")[0].value;
  const qntdSelectAcao = $("#inputInserirQntdCompraAcao")[0].value;

  if (
    tickerSelectAcao &&
    tickerSelectAcao != 0 &&
    qntdSelectAcao &&
    qntdSelectAcao != "0"
  ) {
    const acao = carteira.acoes.find((x) => x.tickerAcao == tickerSelectAcao);

    if (acao.qntd >= parseInt(qntdSelectAcao)) {
      acao.qntd -= parseInt(qntdSelectAcao);

      acao.historico.push({
        qntdComprada: qntdSelectAcao,
        precoComprada: 0,
        tipo: '-'
      });

      carteira.totalAcoes -= parseInt(qntdSelectAcao);

      calcularPorcentagemAcoes();
      calcularPrecoMedioPorAcao(tickerSelectAcao);

      salvaCarteira();

      $("#selectAcoes").val("0");
      $("#inputInserirQntdCompraAcao").val("");
      $("#inputInserirValorCompraAcao").val("");

      mostraItens();
    }
  }
}

function getSum(total, num) {
  return total + num
}

function calcularPorcentagemAcoes() {
  const arraySoma = carteira.acoes.map(x => x.qntd * x.valor);
  valorTotalCarteira = arraySoma.reduce(getSum, 0);

  carteira.acoes.forEach((acao) => {
    const ret = (((acao.qntd * acao.valor) / valorTotalCarteira) * 100).toFixed(2);
    acao.porcentagem = isNaN(ret) ? 0 : ret;
  });
}

function calcularPrecoMedioPorAcao(tickerAcao) {
  const acao = carteira.acoes.find((x) => x.tickerAcao == tickerAcao);
  if (acao.qntd == 0) {
    acao.precoMedio = 0;
  }
  else {
    let sum = 0;
    let qntd = 0;
    acao.historico.forEach(compra => {
      if (compra.tipo == "+") {
        sum += (compra.qntdComprada * compra.precoComprada);
        qntd += parseInt(compra.qntdComprada);
      }
    });
    acao.precoMedio = sum / qntd;
  }
}

function inserirTabelaAcoes(acao) {
  const valorizacao = (acao.qntd * acao.valor) - (acao.qntd * acao.precoMedio);
  $("#TabelaAcoes").find("tbody").append(`
        <tr id="acao_${acao.tickerAcao}"> 
            <td class="nomeAcao">${acao.tickerAcao}</td>
            <td>${acao.qntd}</td>
            <td>${acao.porcentagem}%</td>
            <td>${formatarValor(acao.precoMedio)}</td>
            <td>${formatarValor(acao.valor)}</td> 
            <td>${formatarValor(acao.valor * acao.qntd)}</td> 
            <td class="${valorizacao > 0 ? "valorizacaoPositiva" : "valorizacaoNegativa"}">${formatarValor(valorizacao)}</td> 
        </tr>`);
}

function formatarValor(valor) {
  return valor.toLocaleString("pt-br", { style: "currency", currency: "BRL" });
}

function inserirAcao() {
  const input = $("#input_inserir")[0];
  const tickerAcao = input.value;
  if (tickerAcao) {
    const uppertickerAcao = tickerAcao.toUpperCase();
    const acaoExistente = carteira.acoes.find(x => x.tickerAcao == uppertickerAcao);
    if (!acaoExistente) {
      const valorAcao = buscarPrecoAcao(uppertickerAcao);
      const objetoAcao = {
        tickerAcao: uppertickerAcao,
        qntd: 0,
        porcentagem: 0,
        precoMedio: parseFloat(0),
        valor: valorAcao,
        historico: [],
      };
      inserirAcaoVariavel(objetoAcao);
      inserirTabelaAcoes(objetoAcao);
      adicionarNovaAcaoSelect(uppertickerAcao);

      salvaCarteira();

      input.value = "";
    }
  }
}

function adicionarNovaAcaoSelect(tickerAcao) {
  $("#selectAcoes").append(new Option(tickerAcao, tickerAcao));
}

function inserirAcaoVariavel(acao) {
  carteira.acoes.push(acao);
  carteira.totalAcoes += acao.qntd;
}

function buscarPrecoAcao(ticker) {
  let retorno = 0;

  $.ajax({
    url: `${urlBase}acao/${ticker}`,
    type: "get",
    async: false,
    success: function (data) {
      retorno = data.valor;
    },
    error: function (request, status, error) {
      retorno = 0;
    },
  });

  return retorno;
}

function inserirFii() {
  const input = $("#input_inserir_fii")[0];
  const tickerFii = input.value;
  if (tickerFii) {
    const uppertickerFii = tickerFii.toUpperCase();
    const fiiExistente = carteira.fiis.find(x => x.tickerFii == uppertickerFii);
    if (!fiiExistente) {
      const valorTicker = buscarPrecoFii(uppertickerFii);
      const objetoFii = {
        tickerFii: uppertickerFii,
        qntd: 0,
        porcentagem: 0,
        precoMedio: parseFloat(0),
        valor: valorTicker,
        historico: [],
      };
      inserirFiiVariavel(objetoFii);
      inserirTabelaFiis(objetoFii);
      adicionarNovoFiiSelect(uppertickerFii);

      salvaCarteira();

      input.value = "";
    }
  }
}

function inserirFiiVariavel(fii) {
  carteira.fiis.push(fii);
  carteira.totalFiis += fii.qntd;
}

function inserirTabelaFiis(fii) {
  const valorizacao = (fii.qntd * fii.valor) - (fii.qntd * fii.precoMedio);
  $("#TabelaFii").find("tbody").append(`
        <tr id="fii_${fii.tickerFii}"> 
            <td class="nomeFii">${fii.tickerFii}</td>
            <td>${fii.qntd}</td>
            <td>${fii.porcentagem}%</td>
            <td>${formatarValor(fii.precoMedio)}</td>
            <td>${formatarValor(fii.valor)}</td> 
            <td>${formatarValor(fii.valor * fii.qntd)}</td> 
            <td class="${valorizacao > 0 ? "valorizacaoPositiva" : "valorizacaoNegativa"}">${formatarValor(valorizacao)}</td> 
        </tr>`);
}

function adicionarNovoFiiSelect(fii) {
  $("#selectFii").append(new Option(fii, fii));
}

function buscarPrecoFii(ticker) {
  let retorno = 0;

  $.ajax({
    url: `${urlBase}fii/${ticker}`,
    type: "get",
    async: false,
    success: function (data) {
      retorno = data.valor;
    },
    error: function (request, status, error) {
      retorno = 0;
    },
  });

  return retorno;
}

function AdicionarCompraFii() {
  const tickerSelectFii = $("#selectFii option:selected")[0].value;
  const qntdSelectFii = $("#inputInserirQntdCompraFii")[0].value;
  const precoFii = $("#inputInserirValorCompraFii")[0].value;

  if (
    tickerSelectFii &&
    tickerSelectFii != 0 &&
    qntdSelectFii &&
    qntdSelectFii != "0" &&
    precoFii &&
    precoFii != "0,00"
  ) {
    const fii = carteira.fiis.find((x) => x.tickerFii == tickerSelectFii);
    const floatPrecoFii = parseFloat(precoFii.replace(',', '.'))

    fii.qntd += parseInt(qntdSelectFii);
    fii.historico.push({
      qntdComprada: qntdSelectFii,
      precoComprada: floatPrecoFii,
      tipo: '+'
    });
    carteira.totalFiis += parseInt(qntdSelectFii);

    calcularPorcentagemFiis();
    calcularPrecoMedioPorFii(tickerSelectFii);

    salvaCarteira();

    $("#selectFii").val("0");
    $("#inputInserirQntdCompraFii").val("");
    $("#inputInserirValorCompraFii").val("");

    mostraItens();
  }
}

function calcularPorcentagemFiis() {
  const arraySoma = carteira.acoes.map(x => x.qntd * x.valor);
  valorTotalCarteira = arraySoma.reduce(getSum, 0);

  carteira.fiis.forEach((fii) => {
    const ret = (((fii.qntd * fii.valor) / valorTotalCarteira) * 100).toFixed(2);
    fii.porcentagem = isNaN(ret) ? 0 : ret;
  });
}

function calcularPrecoMedioPorFii(tickerFii) {
  const fii = carteira.fiis.find((x) => x.tickerFii == tickerFii);
  if (fii.qntd == 0) {
    fii.precoMedio = 0;
  }
  else {
    let sum = 0;
    let qntd = 0;
    fii.historico.forEach(compra => {
      if (compra.tipo == "+") {
        sum += (compra.qntdComprada * compra.precoComprada);
        qntd += parseInt(compra.qntdComprada);
      }
    });
    fii.precoMedio = sum / qntd;
  }
}

function removerFii() {
  const tickerSelectFii = $("#selectFii option:selected")[0].value;
  const qntdSelectFii = $("#inputInserirQntdCompraFii")[0].value;

  if (
    tickerSelectFii &&
    tickerSelectFii != 0 &&
    qntdSelectFii &&
    qntdSelectFii != "0"
  ) {
    const fii = carteira.fiis.find((x) => x.tickerFii == tickerSelectFii);

    if (fii.qntd >= parseInt(qntdSelectFii)) {
      fii.qntd -= parseInt(qntdSelectFii);
      carteira.totalFiis -= parseInt(qntdSelectFii);

      fii.historico.push({
        qntdComprada: qntdSelectFii,
        precoComprada: 0,
        tipo: '-'
      });


      calcularPorcentagemFiis();
      calcularPrecoMedioPorFii(tickerSelectFii);

      salvaCarteira();

      $("#selectFii").val("0");
      $("#inputInserirQntdCompraFii").val("");
      $("#inputInserirValorCompraFii").val("");

      mostraItens();
    }
  }
}
