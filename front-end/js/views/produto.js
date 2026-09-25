import { checarAutenticacao, obterUsuarioLogado } from '../utilitarios/auth.js';
import {
  deleteProduto,
  getFornecedores,
  getProdutos,
  postImagemProduto,
  postProduto,
  putProduto,
  reativarProduto,
} from '../api/services.js';
import { mostrarToast, configurarModal, abrirModal, fecharModal } from '../utilitarios/ui.js';
import { estaEmAlerta } from '../utilitarios/estoque.js';
import { escaparHtml } from '../utilitarios/html.js';

if (!checarAutenticacao()) throw new Error('Não autenticado');

const $ = (id) => document.getElementById(id);
const modal = $('modal-produto');
const usuario = obterUsuarioLogado();
const podeEditar = ['ANALISTA', 'GERENTE'].includes(usuario?.perfil);
let produtoEmEdicao = null;
let produtos = [];

function associarLabels(container) {
  container.querySelectorAll('label:not([for])').forEach((label) => {
    const campo = label.querySelector('input,select,textarea') || label.nextElementSibling;
    if (campo?.id) label.htmlFor = campo.id;
  });
}

function fecharProduto() {
  fecharModal(modal, 'btn-novo-produto');
  produtoEmEdicao = null;
  $('form-produto').reset();
  $('estoque_minimo').value = 5;
  $('titulo-modal-produto').textContent = 'Novo Produto';
}

function abrirProduto(produto = null) {
  produtoEmEdicao = produto;
  $('titulo-modal-produto').textContent = produto ? 'Editar Produto' : 'Novo Produto';
  $('nome').value = produto?.nome || '';
  $('codigo_interno').value = produto?.codigo_interno || '';
  $('categoria').value = produto?.categoria || '';
  $('unidade_medida').value = produto?.unidade_medida || 'UN';
  $('custo').value = produto?.custo ?? '';
  $('fornecedor_id').value = produto?.fornecedor_id || '';
  $('localizacao_deposito').value = produto?.localizacao_deposito || '';
  $('estado_montagem').value = produto?.estado_montagem || 'NAO_APLICA';
  $('tipo_rastreabilidade').value = produto?.tipo_rastreabilidade || 'NENHUMA';
  $('demanda_prevista').value = produto?.demanda_prevista ?? 0;
  $('estoque_minimo').value = produto?.estoque_minimo ?? 5;
  $('dimensoes').value = produto?.dimensoes || '';
  $('imagem').value = '';
  abrirModal(modal, 'nome');
}

async function carregarFornecedores() {
  const resposta = await getFornecedores();
  $('fornecedor_id').innerHTML =
    '<option value="">Selecione...</option>' +
    (resposta.dados || [])
      .map(
        (fornecedor) =>
          `<option value="${escaparHtml(fornecedor.id)}">${escaparHtml(fornecedor.nome)}</option>`,
      )
      .join('');
}

function renderizarProdutos() {
  const termo = $('busca-produtos').value.trim().toLowerCase();
  const mostrarInativos = $('mostrar-inativos').checked;
  const lista = produtos.filter((produto) => {
    const correspondeBusca =
      !termo ||
      [produto.nome, produto.codigo_interno].some((valor) =>
        String(valor || '')
          .toLowerCase()
          .includes(termo),
      );
    return correspondeBusca && (mostrarInativos || produto.ativo);
  });
  $('tbody-produtos').innerHTML =
    lista
      .map(
        (produto) =>
          `<tr><td>${escaparHtml(produto.id)}</td><td>${escaparHtml(produto.codigo_interno || '-')}</td><td>${escaparHtml(produto.nome)}</td><td>${escaparHtml(produto.categoria)}</td><td>${escaparHtml(produto.localizacao_deposito || '-')}</td><td>R$ ${Number(
            produto.custo || 0,
          )
            .toFixed(2)
            .replace(
              '.',
              ',',
            )}</td><td>${escaparHtml(produto.estoque_atual)}</td><td>${produto.ativo ? (estaEmAlerta(produto) ? 'Baixo' : 'Normal') : 'Inativo'}</td>${podeEditar ? `<td><button type="button" class="btn-editar-produto" data-id="${escaparHtml(produto.id)}">Editar</button>${produto.ativo ? ` <button type="button" class="btn-inativar-produto" data-id="${escaparHtml(produto.id)}">Inativar</button>` : ` <button type="button" class="btn-reativar-produto" data-id="${escaparHtml(produto.id)}">Reativar</button>`}</td>` : ''}</tr>`,
      )
      .join('') || `<tr><td colspan="${podeEditar ? 9 : 8}">Nenhum produto encontrado.</td></tr>`;
  document
    .querySelectorAll('.btn-editar-produto')
    .forEach((botao) =>
      botao.addEventListener('click', () =>
        abrirProduto(produtos.find((produto) => produto.id === Number(botao.dataset.id))),
      ),
    );
  document
    .querySelectorAll('.btn-inativar-produto')
    .forEach((botao) =>
      botao.addEventListener('click', () => alterarAtivo(botao.dataset.id, false)),
    );
  document
    .querySelectorAll('.btn-reativar-produto')
    .forEach((botao) =>
      botao.addEventListener('click', () => alterarAtivo(botao.dataset.id, true)),
    );
}

async function carregarProdutos() {
  try {
    produtos = (await getProdutos($('mostrar-inativos').checked)).dados || [];
    renderizarProdutos();
  } catch (erro) {
    mostrarToast(erro.message || 'Não foi possível carregar os produtos.', 'erro');
  }
}

async function alterarAtivo(id, ativo) {
  if (!ativo && !window.confirm('Inativar este produto?')) return;
  const botao = document.querySelector(
    `[data-id="${id}"].btn-${ativo ? 'reativar' : 'inativar'}-produto`,
  );
  if (botao) botao.disabled = true;
  try {
    if (ativo) await reativarProduto(id);
    else await deleteProduto(id);
    mostrarToast(ativo ? 'Produto reativado.' : 'Produto inativado.');
    await carregarProdutos();
  } catch (erro) {
    mostrarToast(erro.message || 'Não foi possível alterar o status do produto.', 'erro');
  } finally {
    if (botao) botao.disabled = false;
  }
}

$('form-produto').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const formulario = evento.target;
  const botao = formulario.querySelector('button[type="submit"]');
  botao.disabled = true;
  const dados = {
    nome: $('nome').value.trim(),
    codigo_interno: $('codigo_interno').value.trim(),
    categoria: $('categoria').value,
    unidade_medida: $('unidade_medida').value,
    custo: Number($('custo').value),
    fornecedor_id: Number($('fornecedor_id').value),
    localizacao_deposito: $('localizacao_deposito').value.trim(),
    estado_montagem: $('estado_montagem').value,
    tipo_rastreabilidade: $('tipo_rastreabilidade').value,
    demanda_prevista: Number($('demanda_prevista').value),
    estoque_minimo: Number($('estoque_minimo').value),
    dimensoes: $('dimensoes').value.trim(),
  };
  try {
    const resposta = produtoEmEdicao
      ? await putProduto(produtoEmEdicao.id, dados)
      : await postProduto(dados);
    const produtoId = produtoEmEdicao?.id || resposta.dados?.id;
    const imagem = $('imagem').files[0];
    if (imagem && produtoId) await postImagemProduto(produtoId, imagem);
    mostrarToast(produtoEmEdicao ? 'Produto atualizado.' : 'Produto cadastrado.');
    fecharProduto();
    await carregarProdutos();
  } catch (erro) {
    mostrarToast(erro.message || 'Não foi possível salvar o produto.', 'erro');
  } finally {
    botao.disabled = false;
  }
});

$('busca-produtos').addEventListener('input', renderizarProdutos);
$('mostrar-inativos').addEventListener('change', carregarProdutos);
$('btn-novo-produto').hidden = !podeEditar;
$('th-acao-produto').hidden = !podeEditar;
$('btn-novo-produto').addEventListener('click', async () => {
  await carregarFornecedores();
  abrirProduto();
});
$('btn-fechar-modal').addEventListener('click', fecharProduto);
associarLabels(modal);
configurarModal(modal, fecharProduto);

if (!podeEditar) $('btn-novo-produto').hidden = true;
carregarFornecedores().then(carregarProdutos);
