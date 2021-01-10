let carteira = {
  totalAcoes: 0,
  acoes: [],
};

let dataUltimaPesquisa;

const urlA = `${window.location.href}`;


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
    salvaDataUltimaPesquisa();
    salvaCarteira();
  }
  else {
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
      acao.valor = buscarPrecoAcao(acao.ticketAcao);
    });
  }
}

const mostraItens = () => {
  const listaDeAcoes = document.querySelector('#bodyTabelaAcoes');
  listaDeAcoes.innerHTML = '';
  $('#selectAcoes option').each(function () {
    if ($(this).val() != '0') {
      $(this).remove();
    }
  });

  let total = 0;
  let valorPago = 0;
  let valorTotal = 0;

  carteira.acoes.forEach(acao => {
    inserirTabelaAcoes(acao);
    adicionarNovaAcaoSelect(acao.ticketAcao)
    total += acao.qntd;
    valorPago += acao.precoMedio * acao.qntd;
    valorTotal += acao.valor > 0 ? acao.valor * acao.qntd : 0
  });

  $("#TotalQntdAcao").html(total);
  $("#TotalPagoAcao").html(formatarValor(valorPago));
  $("#TotalValorAcao").html(formatarValor(valorTotal));
  $("#Valorizacao").html(formatarValor(valorTotal - valorPago));
  $("#Valorizacao").addClass(valorTotal - valorPago > 0 ? "valorizacaoPositiva" : "valorizacaoNegativa")
};


function AdicionarCompraAcao() {
  const ticketSelectAcao = $("#selectAcoes option:selected")[0].value;
  const qntdSelectAcao = $("#inputInserirQntdCompraAcao")[0].value;
  const precoAcao = $("#inputInserirValorCompraAcao")[0].value;

  if (
    ticketSelectAcao &&
    ticketSelectAcao != 0 &&
    qntdSelectAcao &&
    qntdSelectAcao != "0" &&
    precoAcao &&
    precoAcao != "0,00"
  ) {
    const acao = carteira.acoes.find((x) => x.ticketAcao == ticketSelectAcao);
    const floatPrecoAcao = parseFloat(precoAcao.replace(',', '.'))

    acao.qntd += parseInt(qntdSelectAcao);
    acao.historico.push({
      qntdComprada: qntdSelectAcao,
      precoComprada: floatPrecoAcao,
      tipo: '+'
    });
    carteira.totalAcoes += parseInt(qntdSelectAcao);

    calcularPorcentagemAcoes();
    calcularPrecoMedioPorAcao(ticketSelectAcao);

    salvaCarteira();

    $("#selectAcoes").val("0");
    $("#inputInserirQntdCompraAcao").val("");
    $("#inputInserirValorCompraAcao").val("");

    mostraItens();
  }
}

function removerAcao() {
  const ticketSelectAcao = $("#selectAcoes option:selected")[0].value;
  const qntdSelectAcao = $("#inputInserirQntdCompraAcao")[0].value;

  if (
    ticketSelectAcao &&
    ticketSelectAcao != 0 &&
    qntdSelectAcao &&
    qntdSelectAcao != "0"
  ) {
    const acao = carteira.acoes.find((x) => x.ticketAcao == ticketSelectAcao);

    if (acao.qntd >= parseInt(qntdSelectAcao)) {
      acao.qntd -= parseInt(qntdSelectAcao);
    }

    acao.historico.push({
      qntdComprada: qntdSelectAcao,
      precoComprada: 0,
      tipo: '-'
    });

    if (carteira.totalAcoes >= parseInt(qntdSelectAcao)) {
      carteira.totalAcoes -= parseInt(qntdSelectAcao);
    }

    calcularPorcentagemAcoes();
    calcularPrecoMedioPorAcao(ticketSelectAcao);

    salvaCarteira();

    $("#selectAcoes").val("0");
    $("#inputInserirQntdCompraAcao").val("");
    $("#inputInserirValorCompraAcao").val("");

    mostraItens();
  }
}

function calcularPorcentagemAcoes() {
  carteira.acoes.forEach((acao) => {
    const ret = Math.round((acao.qntd / carteira.totalAcoes) * 100);
    acao.porcentagem = isNaN(ret) ? 0 : ret;
  });
}

function calcularPrecoMedioPorAcao(ticketAcao) {
  const acao = carteira.acoes.find((x) => x.ticketAcao == ticketAcao);
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
    console.log('sun', sum);
    console.log(qntd);
    acao.precoMedio = sum / qntd;
  }
}

function inserirTabelaAcoes(acao) {
  const valorizacao = (acao.qntd * acao.valor) - (acao.qntd * acao.precoMedio);
  $("#TabelaAcoes").find("tbody").append(`
        <tr id="acao_${acao.ticketAcao}"> 
            <td class="nomeAcao">${acao.ticketAcao}</td>
            <td>${acao.qntd}</td>
            <td>${acao.porcentagem}%</td>
            <td>${formatarValor(acao.precoMedio)}</td>
            <td>${formatarValor(acao.valor)}</td> 
            <td class="${valorizacao > 0 ? "valorizacaoPositiva" : "valorizacaoNegativa"}">${formatarValor(valorizacao)}</td> 
        </tr>`);
}

function formatarValor(valor) {
  return valor.toLocaleString("pt-br", { style: "currency", currency: "BRL" });
}

function inserirAcao() {
  const input = $("#input_inserir")[0];
  const ticketAcao = input.value;
  if (ticketAcao) {
    const upperTicketAcao = ticketAcao.toUpperCase();
    const acaoExistente = carteira.acoes.find(x => x.ticketAcao == upperTicketAcao);
    if (!acaoExistente) {
      const valorAcao = buscarPrecoAcao(upperTicketAcao);
      const objetoAcao = {
        ticketAcao: upperTicketAcao,
        qntd: 0,
        porcentagem: 0,
        precoMedio: parseFloat(0),
        valor: valorAcao,
        historico: [],
      };
      inserirAcaoVariavel(objetoAcao);
      inserirTabelaAcoes(objetoAcao);
      adicionarNovaAcaoSelect(upperTicketAcao);

      salvaCarteira();

      input.value = "";
    }
  }
}

function adicionarNovaAcaoSelect(ticketAcao) {
  $("#selectAcoes").append(new Option(ticketAcao, ticketAcao));
}

function inserirAcaoVariavel(acao) {
  carteira.acoes.push(acao);
  carteira.totalAcoes += acao.qntd;
}

function buscarPrecoAcao(ticket) {
  let retorno = 0;

  $.ajax({
    url: urlA + ticket,
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
