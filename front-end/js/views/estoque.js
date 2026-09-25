import { checarAutenticacao, obterUsuarioLogado } from '../utilitarios/auth.js';
import {
  getProdutos,
  postEntradaEstoque,
  postSaidaEstoque,
  postDevolucao,
  postAjuste,
  getRastreabilidade,
} from '../api/services.js';
import { apiFetch } from '../api/client.js';
import { formatarData } from '../utilitarios/formatters.js';
import { mostrarToast } from '../utilitarios/ui.js';
if (!checarAutenticacao()) throw new Error('Não autenticado');
let produtos = [];
let historico = [];
let paginaHistorico = 1;
const ITENS_POR_PAGINA = 10;
const $ = (id) => document.getElementById(id);
function associarLabels(container = document) {
  container.querySelectorAll('label:not([for])').forEach((label) => {
    const campo = label.querySelector('input,select,textarea') || label.nextElementSibling;
    if (campo?.id) label.htmlFor = campo.id;
  });
}
associarLabels();
function preencherProdutos(id) {
  const s = $(id);
  if (!s) return;
  const valorAtual = s.value;
  s.innerHTML =
    '<option value="">Selecione...</option>' +
    produtos
      .map((p) => `<option value="${p.id}">${p.nome} — estoque: ${p.estoque_atual}</option>`)
      .join('');
  if ([...s.options].some((option) => option.value === valorAtual)) s.value = valorAtual;
}
function preencherTodosProdutos() {
  ['produto-entrada', 'produto-saida', 'produto-devolucao', 'produto-ajuste'].forEach(
    preencherProdutos,
  );
}
async function atualizarProdutos() {
  produtos = (await getProdutos()).dados || [];
  preencherTodosProdutos();
}
await atualizarProdutos();
function pSelecionado(id) {
  return produtos.find((p) => p.id === Number($(id).value));
}
function tipoRastreabilidade(produto) {
  const tipo = String(produto?.tipo_rastreabilidade || '').toUpperCase();
  if (tipo !== 'NENHUMA') return tipo;
  const categoria = String(produto?.categoria || '').toUpperCase();
  if (categoria === 'COMPONENTE_ELETRICO') return 'BATERIA';
  if (['VEICULO', 'BICICLETA', 'PATINETE'].includes(categoria)) return 'VEICULO';
  if (categoria === 'PECA_SEGURANCA') return 'PECA_SEGURANCA';
  return 'NENHUMA';
}
function camposRastreio(prefix) {
  const p = pSelecionado(`produto-${prefix}`);
  const box = $(`rastreio-${prefix}`);
  if (!box) return;
  box.innerHTML = '';
  if (!p) return;
  const tipo = tipoRastreabilidade(p);
  const quantidade = Number($(`qtd-${prefix}`).value || 1);
  const unitario = ['BATERIA', 'MOTOR_CONTROLADOR', 'VEICULO'].includes(tipo);
  const totalCampos = unitario ? quantidade : 1;
  const campos = Array.from({ length: totalCampos }, (_, indice) => {
    const numero = indice + 1;
    if (tipo === 'BATERIA')
      return `<div class="form-row rastreio-item"><strong>Item ${numero}</strong><div class="form-group"><label for="serie-${prefix}-${numero}">Número de série</label><input id="serie-${prefix}-${numero}" data-rastreio="numero_serie" required></div><div class="form-group"><label for="validade-${prefix}-${numero}">Data de validade</label><input id="validade-${prefix}-${numero}" type="date" data-rastreio="data_validade" required></div></div>`;
    if (tipo === 'MOTOR_CONTROLADOR')
      return `<div class="form-row rastreio-item"><strong>Item ${numero}</strong><div class="form-group"><label for="serie-${prefix}-${numero}">Número de série</label><input id="serie-${prefix}-${numero}" data-rastreio="numero_serie" required></div><div class="form-group"><label for="lote-${prefix}-${numero}">Lote</label><input id="lote-${prefix}-${numero}" data-rastreio="lote" required></div></div>`;
    if (tipo === 'VEICULO')
      return `<div class="form-group rastreio-item"><label for="id-unico-${prefix}-${numero}">ID único do veículo</label><input id="id-unico-${prefix}-${numero}" data-rastreio="identificador_unico" required></div>`;
    if (tipo === 'PECA_SEGURANCA')
      return `<div class="form-group rastreio-item"><label for="lote-${prefix}-1">Lote</label><input id="lote-${prefix}-1" data-rastreio="lote" required></div>`;
    return '';
  });
  box.innerHTML = campos.join('');
  associarLabels(box);
}
$('produto-entrada')?.addEventListener('change', () => camposRastreio('entrada'));
$('qtd-entrada')?.addEventListener('input', () => camposRastreio('entrada'));
function coletarItensRastreaveis(prefix) {
  return [...document.querySelectorAll(`#rastreio-${prefix} .rastreio-item`)].map((item) => {
    const dados = {};
    item.querySelectorAll('[data-rastreio]').forEach((campo) => {
      dados[campo.dataset.rastreio] = campo.value.trim();
    });
    return dados;
  });
}
function extrasComuns(prefix) {
  return {
    tipo_transporte: $(`transporte-${prefix}`)?.value || '',
    montado_desmontado: $(`montagem-${prefix}`)?.value || '',
    localizacao: $(`localizacao-${prefix}`)?.value || '',
    observacao: $(`obs-${prefix}`)?.value || '',
  };
}
$('form-entrada')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const p = pSelecionado('produto-entrada');
  const dados = {
    produto_id: p.id,
    quantidade: Number($('qtd-entrada').value),
    fornecedor_id: Number($('fornecedor-entrada').value),
    numero_nota_fiscal: $('nf-entrada').value,
    numero_pedido_compra: $('pedido-entrada').value,
    ...extrasComuns('entrada'),
    itens_rastreaveis: coletarItensRastreaveis('entrada'),
  };
  await enviar(() => postEntradaEstoque(dados), 'Entrada registrada!', 'form-entrada');
});
$('produto-saida')?.addEventListener('change', () => carregarRastreabilidadeSaida());
$('qtd-saida')?.addEventListener('input', () => carregarRastreabilidadeSaida());
$('produto-devolucao')?.addEventListener('change', () => carregarRastreabilidadeDevolucao());
$('qtd-devolucao')?.addEventListener('input', () => carregarRastreabilidadeDevolucao());
async function carregarRastreabilidadeSaida() {
  const produto = pSelecionado('produto-saida');
  const box = $('rastreio-saida');
  if (!box) return;
  if (!produto) {
    box.innerHTML = '';
    return;
  }
  async function carregarRastreabilidadeDevolucao() {
    const produto = pSelecionado('produto-devolucao');
    const box = $('rastreio-devolucao');
    if (!box) return;
    if (!produto) {
      box.innerHTML = '';
      return;
    }
    const tipo = tipoRastreabilidade(produto);
    if (!['BATERIA', 'MOTOR_CONTROLADOR', 'VEICULO', 'PECA_SEGURANCA'].includes(tipo)) {
      box.innerHTML = '';
      return;
    }
    try {
      const resposta = await getRastreabilidade(produto.id);
      const itens = (resposta.dados || []).filter((item) => item.status === 'EM_ESTOQUE');
      box.innerHTML = `<fieldset class="rastreio-saida"><legend>Itens rastreáveis devolvidos</legend>${itens.map((item) => `<label class="rastreio-opcao"><input type="checkbox" name="rastreabilidade_devolucao" value="${item.id}"><span>${item.numero_serie || item.identificador_unico || `Lote ${item.lote || '-'}`}</span></label>`).join('') || '<p>Nenhum item rastreável disponível.</p>'}</fieldset>`;
      const quantidade = Number($('qtd-devolucao').value || 1);
      box.querySelectorAll('input').forEach((input) =>
        input.addEventListener('change', () => {
          if (box.querySelectorAll('input:checked').length > quantidade) input.checked = false;
        }),
      );
    } catch (erro) {
      box.innerHTML = `<p class="form-error">${erro.message || 'Não foi possível carregar os itens rastreáveis.'}</p>`;
    }
  }
  const tipo = tipoRastreabilidade(produto);
  if (!['BATERIA', 'MOTOR_CONTROLADOR', 'VEICULO', 'PECA_SEGURANCA'].includes(tipo)) {
    box.innerHTML = '';
    return;
  }
  try {
    const resposta = await getRastreabilidade(produto.id);
    const itens = (resposta.dados || []).filter((item) => item.status === 'EM_ESTOQUE');
    box.innerHTML = `<fieldset class="rastreio-saida"><legend>Itens rastreáveis disponíveis</legend>${itens.map((item) => `<label class="rastreio-opcao"><input type="checkbox" name="rastreabilidade_saida" value="${item.id}"><span>${item.numero_serie || item.identificador_unico || `Lote ${item.lote || '-'}`} · ${item.status}</span></label>`).join('') || '<p>Nenhum item rastreável disponível.</p>'}</fieldset>`;
    const quantidade = Number($('qtd-saida').value || 1);
    box.querySelectorAll('input').forEach((input) =>
      input.addEventListener('change', () => {
        const selecionados = box.querySelectorAll('input:checked');
        if (selecionados.length > quantidade) input.checked = false;
      }),
    );
  } catch (erro) {
    box.innerHTML = `<p class="form-error">${erro.message || 'Não foi possível carregar os itens rastreáveis.'}</p>`;
  }
}
$('form-saida')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dados = {
    produto_id: Number($('produto-saida').value),
    quantidade: Number($('qtd-saida').value),
    destinatario: $('destino-saida').value,
    motivo: $('motivo-saida').value,
    numero_pedido_venda: $('pedido-venda').value,
    rastreabilidade_ids: [
      ...document.querySelectorAll('input[name="rastreabilidade_saida"]:checked'),
    ].map((input) => Number(input.value)),
    ...extrasComuns('saida'),
  };
  await enviar(() => postSaidaEstoque(dados), 'Saída registrada!', 'form-saida');
});
$('form-devolucao')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dados = {
    produto_id: Number($('produto-devolucao').value),
    quantidade: Number($('qtd-devolucao').value),
    origem: $('origem-devolucao').value,
    motivo: $('motivo-devolucao').value,
    estado_produto: $('estado-devolucao').value,
    numero_pedido_venda: $('pedido-devolucao').value,
    reaproveitavel: $('reaproveitavel').checked,
    rastreabilidade_ids: [
      ...document.querySelectorAll('input[name="rastreabilidade_devolucao"]:checked'),
    ].map((input) => Number(input.value)),
    observacao: $('obs-devolucao').value,
  };
  await enviar(() => postDevolucao(dados), 'Devolução registrada!', 'form-devolucao');
});
$('origem-devolucao')?.addEventListener('change', (e) => {
  $('pedido-devolucao').required = e.target.value === 'CLIENTE';
});
$('pedido-devolucao').required = $('origem-devolucao')?.value === 'CLIENTE';
$('form-ajuste')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dados = {
    produto_id: Number($('produto-ajuste').value),
    nova_quantidade: Number($('nova-qtd').value),
    justificativa: $('justificativa').value,
  };
  await enviar(() => postAjuste(dados), 'Ajuste realizado!', 'form-ajuste');
});
async function enviar(fn, msg, form) {
  const formulario = $(form);
  const botao =
    formulario?.querySelector('button[type="submit"]') || formulario?.querySelector('button');
  if (botao) botao.disabled = true;
  try {
    await fn();
    mostrarToast(msg);
    formulario?.reset();
    await atualizarProdutos();
    camposRastreio('entrada');
    await carregarRastreabilidadeSaida();
    await carregarHistorico();
  } catch (e) {
    mostrarToast(e.message || 'Erro na operação.', 'erro');
  } finally {
    if (botao) botao.disabled = false;
  }
}
function tipoMovimentacao(tipo) {
  return (
    {
      ENTRADA: 'Entrada / Recebimento',
      SAIDA: 'Saída de estoque',
      DEVOLUCAO: 'Devolução',
      AJUSTE_MANUAL: 'Ajuste manual',
    }[tipo] ||
    tipo ||
    'Não especificado'
  );
}
function alteracaoMovimentacao(m) {
  if (
    m.estoque_anterior !== null &&
    m.estoque_anterior !== undefined &&
    m.estoque_novo !== null &&
    m.estoque_novo !== undefined
  )
    return `${m.estoque_anterior} → ${m.estoque_novo}`;
  return m.observacao || 'Não informado';
}
function criarAbas() {
  const secoes = [...document.querySelectorAll('main.content > section')].filter(
    (secao) => !secao.querySelector('h2')?.textContent.startsWith('Consulta'),
  );
  const abas = document.createElement('div');
  abas.className = 'tabs';
  secoes.forEach((secao, indice) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.textContent = secao.querySelector('h2')?.textContent || `Aba ${indice + 1}`;
    botao.className = indice === 0 ? 'active' : '';
    botao.addEventListener('click', () => {
      secoes.forEach((item) => {
        item.hidden = item !== secao;
      });
      abas
        .querySelectorAll('button')
        .forEach((item) => item.classList.toggle('active', item === botao));
    });
    abas.appendChild(botao);
    secao.hidden = indice !== 0;
  });
  secoes[0]?.before(abas);
}
function criarFiltrosHistorico() {
  const tabela = $('tbody-estoque')?.closest('.table-responsive');
  if (!tabela || $('filtros-historico')) return;
  const filtros = document.createElement('div');
  filtros.id = 'filtros-historico';
  filtros.className = 'history-filters';
  filtros.innerHTML = `<label for="filtro-produto-historico">Produto</label><select id="filtro-produto-historico"><option value="">Todos</option></select><label for="filtro-tipo-historico">Tipo</label><select id="filtro-tipo-historico"><option value="">Todos</option><option value="ENTRADA">Entrada</option><option value="SAIDA">Saída</option><option value="DEVOLUCAO">Devolução</option><option value="AJUSTE_MANUAL">Ajuste manual</option></select><label for="filtro-inicio-historico">De</label><input id="filtro-inicio-historico" type="date"><label for="filtro-fim-historico">Até</label><input id="filtro-fim-historico" type="date"><button id="limpar-filtros-historico" type="button" class="btn-secondary">Limpar</button>`;
  tabela.before(filtros);
  filtros.querySelectorAll('select, input').forEach((campo) =>
    campo.addEventListener('change', () => {
      paginaHistorico = 1;
      renderHistorico();
    }),
  );
  $('limpar-filtros-historico').addEventListener('click', () => {
    filtros.querySelectorAll('select, input').forEach((campo) => {
      campo.value = '';
    });
    paginaHistorico = 1;
    renderHistorico();
  });
}
function renderHistorico() {
  const produtoId = $('filtro-produto-historico')?.value;
  const tipo = $('filtro-tipo-historico')?.value;
  const inicio = $('filtro-inicio-historico')?.value;
  const fim = $('filtro-fim-historico')?.value;
  const filtrado = historico.filter(
    (item) =>
      (!produtoId || String(item.produto_id) === produtoId) &&
      (!tipo || item.tipo === tipo) &&
      (!inicio || item.data_movimentacao >= `${inicio}T00:00:00`) &&
      (!fim || item.data_movimentacao <= `${fim}T23:59:59.999`),
  );
  const inicioPagina = (paginaHistorico - 1) * ITENS_POR_PAGINA;
  const pagina = filtrado.slice(inicioPagina, inicioPagina + ITENS_POR_PAGINA);
  $('tbody-estoque').innerHTML =
    pagina
      .map(
        (m) =>
          `<tr><td>${m.id}</td><td>${m.produto_nome || m.produto_id}</td><td>${tipoMovimentacao(m.tipo)}</td><td>${m.quantidade}</td><td>${alteracaoMovimentacao(m)}</td><td>${m.destinatario || '-'}</td><td>${m.motivo || '-'}</td><td>${formatarData(m.data_movimentacao)}</td></tr>`,
      )
      .join('') || '<tr><td colspan="8">Nenhuma movimentação encontrada.</td></tr>';
  const totalPaginas = Math.max(1, Math.ceil(filtrado.length / ITENS_POR_PAGINA));
  paginaHistorico = Math.min(paginaHistorico, totalPaginas);
  let paginacao = $('paginacao-historico');
  if (!paginacao) {
    paginacao = document.createElement('div');
    paginacao.id = 'paginacao-historico';
    paginacao.className = 'pagination';
    $('tbody-estoque').closest('.table-responsive').after(paginacao);
  }
  paginacao.innerHTML = `<button type="button" ${paginaHistorico === 1 ? 'disabled' : ''}>Anterior</button><span>Página ${paginaHistorico} de ${totalPaginas}</span><button type="button" ${paginaHistorico === totalPaginas ? 'disabled' : ''}>Próxima</button>`;
  paginacao.querySelector('button:first-child').onclick = () => {
    paginaHistorico -= 1;
    renderHistorico();
  };
  paginacao.querySelector('button:last-child').onclick = () => {
    paginaHistorico += 1;
    renderHistorico();
  };
}
async function carregarHistorico() {
  try {
    const r = await apiFetch('/api/v1/estoque/movimentacoes');
    historico = r.dados || [];
    criarFiltrosHistorico();
    const filtroProduto = $('filtro-produto-historico');
    if (filtroProduto && filtroProduto.options.length === 1)
      filtroProduto.innerHTML += produtos
        .map((p) => `<option value="${p.id}">${p.nome}</option>`)
        .join('');
    renderHistorico();
  } catch (e) {
    $('tbody-estoque').innerHTML =
      `<tr><td colspan="8">${e.message || 'Não foi possível carregar o histórico.'}</td></tr>`;
  }
}
async function carregarFornecedores() {
  try {
    const r = await apiFetch('/api/v1/fornecedores');
    $('fornecedor-entrada').innerHTML = (r.dados || [])
      .map((f) => `<option value="${f.id}">${f.nome}</option>`)
      .join('');
  } catch {}
}
const u = obterUsuarioLogado();
if (u?.perfil !== 'GERENTE') document.querySelector('#secao-ajuste')?.remove();
criarAbas();
carregarFornecedores();
carregarHistorico();

$('btn-buscar-codigo')?.addEventListener('click', async () => {
  const c = $('busca-codigo').value.trim();
  if (!c) return;
  try {
    const r = await apiFetch(`/api/v1/estoque/buscar-codigo/${encodeURIComponent(c)}`);
    const p = r.dados;
    $('resultado-codigo').innerHTML =
      `<div class="card"><strong>${p.nome}</strong><br>Código: ${p.codigo_interno}<br>Estoque: ${p.estoque_atual}<br>Localização: ${p.localizacao_deposito || '-'}</div>`;
  } catch (e) {
    $('resultado-codigo').textContent = e.message;
  }
});
