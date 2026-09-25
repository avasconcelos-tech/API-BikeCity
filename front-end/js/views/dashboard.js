import { checarAutenticacao, obterUsuarioLogado } from '../utilitarios/auth.js';
import { apiFetch } from '../api/client.js';
import { getProdutos } from '../api/services.js';
import { formatarMoeda } from '../utilitarios/formatters.js';
import { configurarModal, abrirModal, fecharModal } from '../utilitarios/ui.js';

if (!checarAutenticacao()) throw new Error('Não autenticado');

const $ = (id) => document.getElementById(id);
let produtos = [];

function estoqueBaixo(produto) {
  return Number(produto.estoque_atual || 0) <= 5;
}

function abrirProdutos(titulo, lista) {
  $('titulo-produtos-dashboard').textContent = titulo;
  $('thead-dashboard-produtos').innerHTML =
    '<tr><th>Produto</th><th>Categoria</th><th>Estoque</th><th>Localização</th></tr>';
  $('tbody-dashboard-produtos').innerHTML = lista.length
    ? lista
        .map(
          (produto) =>
            `<tr><td>${produto.nome}</td><td>${produto.categoria}</td><td>${produto.estoque_atual}</td><td>${produto.localizacao_deposito || '-'}</td></tr>`,
        )
        .join('')
    : '<tr><td colspan="4">Nenhum produto encontrado.</td></tr>';
  abrirModal($('modal-dashboard-produtos'), 'btn-fechar-dashboard-produtos');
}

function abrirRelatorioEstoque() {
  $('titulo-produtos-dashboard').textContent = 'Relatório de peças em estoque';
  $('thead-dashboard-produtos').innerHTML =
    '<tr><th>Peça</th><th>Quantidade</th><th>Preço unitário</th></tr>';
  $('tbody-dashboard-produtos').innerHTML = produtos.length
    ? produtos
        .map(
          (produto) =>
            `<tr><td>${produto.nome}</td><td>${produto.estoque_atual}</td><td>${formatarMoeda(produto.custo || 0)}</td></tr>`,
        )
        .join('')
    : '<tr><td colspan="3">Nenhuma peça encontrada.</td></tr>';
  abrirModal($('modal-dashboard-produtos'), 'btn-fechar-dashboard-produtos');
}

function fecharProdutos() {
  fecharModal($('modal-dashboard-produtos'), 'card-total-produtos');
}

function ativarCard(id, acao) {
  $(id).onclick = acao;
  $(id).onkeydown = (evento) => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      acao();
    }
  };
}

async function carregar() {
  const usuario = obterUsuarioLogado();
  try {
    const [resumo, respostaProdutos] = await Promise.all([
      apiFetch('/api/v1/dashboard/resumo'),
      getProdutos(),
    ]);
    produtos = respostaProdutos.dados || [];
    const dados = resumo.dados;
    const produtosEmAlerta = produtos.filter(estoqueBaixo);

    $('total-produtos').textContent = dados.total_produtos || 0;
    $('estoque-critico').textContent = dados.estoque_critico || 0;
    $('valor-estoque').textContent = formatarMoeda(dados.valor_total_estoque || 0);

    ativarCard('card-total-produtos', () => abrirProdutos('Todos os produtos', produtos));
    ativarCard('card-estoque-critico', () =>
      abrirProdutos('Produtos em alerta de estoque', produtosEmAlerta),
    );
    ativarCard('card-valor-estoque', abrirRelatorioEstoque);
  } catch (erro) {
    console.error('Não foi possível carregar o painel:', erro);
  }
}

$('btn-fechar-dashboard-produtos').onclick = fecharProdutos;
configurarModal($('modal-dashboard-produtos'), fecharProdutos);
carregar();
