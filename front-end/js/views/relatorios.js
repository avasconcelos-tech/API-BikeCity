import { checarAutenticacao } from '../utilitarios/auth.js';
import { getRelatorio } from '../api/services.js';
import { formatarData } from '../utilitarios/formatters.js';

if (!checarAutenticacao()) throw new Error('Não autenticado');

const $ = (id) => document.getElementById(id);
const resposta = await getRelatorio();
const dados = resposta.dados;
const estoque = dados.estoque || [];
const movimentacoes = dados.movimentacoes || [];
const devolucoes = dados.devolucoes || [];
const alertas = dados.alertas || [];

function estaEmAlerta(produto) {
  return Number(produto.estoque_atual || 0) <= 5;
}

$('r-produtos').textContent = estoque.length;
$('tbody-relatorio').innerHTML = estoque
  .map((produto) => {
    const alerta = estaEmAlerta(produto);
    return `<tr><td>${produto.nome}</td><td>${produto.categoria}</td><td>${produto.estoque_atual}</td><td>R$ ${Number(
      produto.custo || 0,
    )
      .toFixed(2)
      .replace(
        '.',
        ',',
      )}</td><td>${produto.localizacao_deposito || '-'}</td><td>${alerta ? 'Baixo' : 'Normal'}</td></tr>`;
  })
  .join('');
$('r-movs').textContent = movimentacoes.length;
$('r-alertas').textContent = alertas.length;

const dentroDoPeriodo = (valor, inicio, fim) => {
  const data = valor ? new Date(valor) : null;
  if (!data || Number.isNaN(data.getTime())) return !inicio && !fim;
  if (inicio && data < new Date(`${inicio}T00:00:00`)) return false;
  if (fim && data > new Date(`${fim}T23:59:59.999`)) return false;
  return true;
};
const texto = (valor) =>
  String(valor ?? '-').replace(
    /[&<>"']/g,
    (caractere) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caractere],
  );
const tipoMovimentacao = (tipo) =>
  ({
    ENTRADA: 'Entrada',
    SAIDA: 'Saída',
    DEVOLUCAO: 'Devolução',
    AJUSTE_MANUAL: 'Ajuste manual',
  })[tipo] ||
  tipo ||
  '-';

function renderizarRegistros(inicio = '', fim = '') {
  const movimentacoesFiltradas = movimentacoes.filter((item) =>
    dentroDoPeriodo(item.data_movimentacao, inicio, fim),
  );
  const devolucoesFiltradas = devolucoes.filter((item) =>
    dentroDoPeriodo(item.data_devolucao, inicio, fim),
  );
  const alertasFiltrados = alertas.filter((item) => dentroDoPeriodo(item.criado_em, inicio, fim));
  $('r-movs').textContent = movimentacoesFiltradas.length;
  $('r-alertas').textContent = alertasFiltrados.length;
  $('tbody-movimentacoes').innerHTML =
    movimentacoesFiltradas
      .map(
        (item) =>
          `<tr><td>${texto(formatarData(item.data_movimentacao))}</td><td>${texto(item.produto_nome || item.produto_id)}</td><td>${texto(tipoMovimentacao(item.tipo))}</td><td>${texto(item.quantidade)}</td><td>${texto(item.motivo)}</td><td>${texto(item.usuario_nome)}</td></tr>`,
      )
      .join('') || '<tr><td colspan="6">Nenhuma movimentação no período.</td></tr>';
  $('tbody-devolucoes').innerHTML =
    devolucoesFiltradas
      .map(
        (item) =>
          `<tr><td>${texto(formatarData(item.data_devolucao))}</td><td>${texto(item.produto_nome || item.produto_id)}</td><td>${texto(item.quantidade)}</td><td>${texto(item.origem)}</td><td>${texto(item.motivo)}</td><td>${texto(item.status)}</td></tr>`,
      )
      .join('') || '<tr><td colspan="6">Nenhuma devolução no período.</td></tr>';
  $('tbody-alertas').innerHTML =
    alertasFiltrados
      .map(
        (item) =>
          `<tr><td>${texto(formatarData(item.criado_em))}</td><td>${texto(item.produto_nome || item.produto_id)}</td><td>${texto(item.mensagem)}</td><td>${item.lido ? 'Lido' : 'Pendente'}</td></tr>`,
      )
      .join('') || '<tr><td colspan="4">Nenhum alerta no período.</td></tr>';
  return { movimentacoesFiltradas, devolucoesFiltradas, alertasFiltrados };
}

const dadosFiltrados = () => renderizarRegistros($('periodo-inicio').value, $('periodo-fim').value);
$('filtro-periodo').addEventListener('submit', (evento) => {
  evento.preventDefault();
  dadosFiltrados();
});
$('btn-limpar-filtro').addEventListener('click', () => {
  $('filtro-periodo').reset();
  dadosFiltrados();
});
$('btn-exportar').addEventListener('click', () => {
  const { movimentacoesFiltradas, devolucoesFiltradas, alertasFiltrados } = dadosFiltrados();
  const linhas = [
    ['Tipo', 'Data', 'Produto', 'Detalhes', 'Quantidade', 'Status'],
    ...movimentacoesFiltradas.map((item) => [
      'Movimentação',
      item.data_movimentacao,
      item.produto_nome || item.produto_id,
      tipoMovimentacao(item.tipo),
      item.quantidade,
      '',
    ]),
    ...devolucoesFiltradas.map((item) => [
      'Devolução',
      item.data_devolucao,
      item.produto_nome || item.produto_id,
      item.motivo,
      item.quantidade,
      item.status,
    ]),
    ...alertasFiltrados.map((item) => [
      'Alerta',
      item.criado_em,
      item.produto_nome || item.produto_id,
      item.mensagem,
      '',
      item.lido ? 'Lido' : 'Pendente',
    ]),
  ];
  const csv = linhas
    .map((linha) => linha.map((valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'relatorio-bikecity.csv';
  link.click();
  URL.revokeObjectURL(url);
});
renderizarRegistros();
$('btn-imprimir').onclick = () => window.print();
