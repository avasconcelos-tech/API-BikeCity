import { checarAutenticacao, obterUsuarioLogado } from '../utilitarios/auth.js';
import { apiFetch } from '../api/client.js';
import {
  getAlertas,
  getNotificacoes,
  getProdutos,
  marcarAlertaLido,
  marcarNotificacaoLida,
} from '../api/services.js';
import { formatarMoeda } from '../utilitarios/formatters.js';
import { estaEmAlerta } from '../utilitarios/estoque.js';
import { escaparHtml } from '../utilitarios/html.js';
import {
  configurarModal,
  abrirModal,
  fecharModal,
  mostrarToast,
} from '../utilitarios/ui.js';

if (!checarAutenticacao()) throw new Error('Não autenticado');

const $ = (id) => document.getElementById(id);
let produtos = [];

function abrirProdutos(titulo, lista) {
  $('titulo-produtos-dashboard').textContent = titulo;
  $('thead-dashboard-produtos').innerHTML =
    '<tr><th>Produto</th><th>Categoria</th><th>Estoque</th><th>Localização</th></tr>';
  $('tbody-dashboard-produtos').innerHTML = lista.length
    ? lista
        .map(
          (produto) =>
            `<tr><td>${escaparHtml(produto.nome)}</td><td>${escaparHtml(produto.categoria)}</td><td>${escaparHtml(produto.estoque_atual)}</td><td>${escaparHtml(produto.localizacao_deposito || '-')}</td></tr>`,
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
            `<tr><td>${escaparHtml(produto.nome)}</td><td>${escaparHtml(produto.estoque_atual)}</td><td>${escaparHtml(formatarMoeda(produto.custo || 0))}</td></tr>`,
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

function renderizarAlertas(alertas, notificacoes) {
  const lista = $('lista-alertas-dashboard');
  const grupos = new Map();
  const adicionarAoGrupo = (item) => {
    const mensagem = String(item.mensagem || item.titulo || '').trim().toLocaleLowerCase();
    const chave =
      item.produto_id == null
        ? `${item.tipo}:${item.id}`
        : `produto:${item.produto_id}:${mensagem}`;
    const grupo = grupos.get(chave) || { ...item, registros: [] };
    grupo.registros.push(item);
    grupos.set(chave, grupo);
  };
  alertas.forEach((alerta) =>
    adicionarAoGrupo({
      id: alerta.id,
      produto_id: alerta.produto_id,
      tipo: 'alerta',
      titulo: alerta.produto_nome || 'Alerta de estoque',
      mensagem: alerta.mensagem,
      lido: alerta.lido,
    }),
  );
  notificacoes.forEach((notificacao) =>
    adicionarAoGrupo({
      id: notificacao.id,
      produto_id: notificacao.produto_id,
      tipo: 'notificacao',
      titulo: notificacao.titulo,
      mensagem: notificacao.mensagem,
      lido: notificacao.lida,
    }),
  );
  const itens = [...grupos.values()];
  const pendentes = itens.filter((item) => item.registros.some((registro) => !registro.lido)).length;
  $('contador-alertas-dashboard').textContent =
    `${pendentes} pendente${pendentes === 1 ? '' : 's'}`;
  lista.innerHTML =
    itens
      .map((item, indice) => {
        const lido = item.registros.every((registro) => registro.lido);
        return `<article class="notification-item ${lido ? 'is-read' : ''}"><div><strong>${escaparHtml(item.titulo)}</strong><p>${escaparHtml(item.mensagem)}</p></div>${!lido ? `<button type="button" class="btn-marcar-alerta" data-indice="${indice}">Marcar como lido</button>` : '<span class="notification-status">Lido</span>'}</article>`;
      })
      .join('') || '<p>Nenhuma notificação registrada.</p>';
  lista.querySelectorAll('.btn-marcar-alerta').forEach((botao) =>
    botao.addEventListener('click', async () => {
      botao.disabled = true;
      try {
        const grupo = itens[Number(botao.dataset.indice)];
        await Promise.all(
          grupo.registros
            .filter((registro) => !registro.lido)
            .map((registro) =>
              registro.tipo === 'alerta'
                ? marcarAlertaLido(registro.id)
                : marcarNotificacaoLida(registro.id),
            ),
        );
        grupo.registros.forEach((registro) => {
          registro.lido = true;
          if (registro.tipo === 'notificacao') {
            const notificacao = notificacoes.find(
              (item) => String(item.id) === String(registro.id),
            );
            if (notificacao) notificacao.lida = true;
          } else {
            const alerta = alertas.find((item) => String(item.id) === String(registro.id));
            if (alerta) alerta.lido = true;
          }
        });
        renderizarAlertas(alertas, notificacoes);
      } catch (erro) {
        mostrarToast(erro.message || 'Não foi possível marcar como lido.', 'erro');
      }
    }),
  );
}

async function carregar() {
  try {
    const [resumo, respostaProdutos, respostaAlertas, respostaNotificacoes] = await Promise.all([
      apiFetch('/api/v1/dashboard/resumo'),
      getProdutos(),
      getAlertas(),
      getNotificacoes(),
    ]);
    produtos = respostaProdutos.dados || [];
    const dados = resumo.dados;
    const produtosEmAlerta = produtos.filter(estaEmAlerta);

    $('total-produtos').textContent = dados.total_produtos || 0;
    $('estoque-critico').textContent = dados.estoque_critico || 0;
    $('valor-estoque').textContent = formatarMoeda(dados.valor_total_estoque || 0);
    renderizarAlertas(respostaAlertas.dados || [], respostaNotificacoes.dados || []);

    ativarCard('card-total-produtos', () => abrirProdutos('Todos os produtos', produtos));
    ativarCard('card-estoque-critico', () =>
      abrirProdutos('Produtos em alerta de estoque', produtosEmAlerta),
    );
    ativarCard('card-valor-estoque', abrirRelatorioEstoque);
  } catch (erro) {
    mostrarToast(erro.message || 'Não foi possível carregar o painel.', 'erro');
  }
}

$('btn-fechar-dashboard-produtos').onclick = fecharProdutos;
configurarModal($('modal-dashboard-produtos'), fecharProdutos);
carregar();
