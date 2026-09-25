import { obterUsuarioLogado, removerToken } from './auth.js';
import { trocarMinhaSenha } from '../api/services.js';
import { mostrarToast, configurarModal, abrirModal, fecharModal } from './ui.js';
import { escaparHtml } from './html.js';

const paginas = [
  ['dashboard.html', 'Dashboard'],
  ['produtos.html', 'Produtos'],
  ['estoque.html', 'Estoque'],
  ['fornecedores.html', 'Fornecedores'],
  ['relatorios.html', 'Relatórios'],
  ['usuarios.html', 'Usuários'],
];

function criarSidebar(sidebar) {
  const usuario = obterUsuarioLogado();
  const paginasVisiveis = paginas.filter(
    ([href]) => href !== 'usuarios.html' || usuario?.perfil === 'GERENTE',
  );
  sidebar.innerHTML = `
    <a class="brand" href="dashboard.html" aria-label="BikeCity - Dashboard">
      <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="8" cy="23" r="5"></circle><circle cx="24" cy="23" r="5"></circle><path d="M8 23l6-11 5 11m-5-11h5l5 11M11 7h4"></path></svg></span>
      <span class="brand-name">Bike<span>City</span></span>
    </a>
    <button class="mobile-menu-btn" type="button" aria-label="Abrir menu" aria-expanded="false"><span></span></button>
    <ul class="sidebar-nav">${paginasVisiveis.map(([href, nome]) => `<li><a href="${href}">${nome}</a></li>`).join('')}</ul>`;
}

function criarCabecalho(main) {
  const usuario = obterUsuarioLogado();
  const cabecalho = document.createElement('div');
  cabecalho.className = 'app-header';
  cabecalho.innerHTML = `<button id="btn-minha-conta" class="account-link" type="button">${escaparHtml(usuario?.nome || usuario?.email || 'Minha conta')}</button><button id="btn-logout" class="btn-danger" type="button">Sair</button>`;
  main.prepend(cabecalho);
  criarModalConta(cabecalho.querySelector('#btn-minha-conta'));
  cabecalho.querySelector('#btn-logout').addEventListener('click', () => {
    removerToken();
    window.location.href = './login.html';
  });
}

function criarModalConta(botaoConta) {
  const modal = document.createElement('div');
  modal.id = 'modal-minha-conta';
  modal.className = 'modal-overlay';
  modal.innerHTML = `<div class="modal-card"><div class="modal-header"><h3>Minha conta</h3><button class="btn-close" type="button" aria-label="Fechar">&times;</button></div><form id="form-minha-conta"><div class="form-group"><label for="senha-atual-conta">Senha atual</label><input id="senha-atual-conta" type="password" required></div><div class="form-group"><label for="nova-senha-conta">Nova senha</label><input id="nova-senha-conta" type="password" minlength="6" required></div><div class="form-group"><label for="confirmar-senha-conta">Confirmar nova senha</label><input id="confirmar-senha-conta" type="password" minlength="6" required></div><button type="submit">Alterar senha</button></form></div>`;
  document.body.appendChild(modal);
  const fechar = () => fecharModal(modal, 'btn-minha-conta');
  configurarModal(modal, fechar);
  botaoConta.addEventListener('click', () => abrirModal(modal, 'senha-atual-conta'));
  modal.querySelector('.btn-close').addEventListener('click', fechar);
  modal.querySelector('#form-minha-conta').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const formulario = evento.target;
    const botao = formulario.querySelector('button[type="submit"]');
    if (
      formulario.querySelector('#nova-senha-conta').value !==
      formulario.querySelector('#confirmar-senha-conta').value
    ) {
      mostrarToast('A confirmação da nova senha não confere.', 'erro');
      return;
    }
    botao.disabled = true;
    try {
      await trocarMinhaSenha(
        formulario.querySelector('#senha-atual-conta').value,
        formulario.querySelector('#nova-senha-conta').value,
      );
      mostrarToast('Senha alterada com sucesso.');
      formulario.reset();
      fechar();
    } catch (erro) {
      mostrarToast(erro.message || 'Não foi possível alterar a senha.', 'erro');
    } finally {
      botao.disabled = false;
    }
  });
}

function marcarPaginaAtual(sidebar) {
  const paginaAtual = window.location.pathname.split('/').pop() || 'dashboard.html';
  sidebar.querySelectorAll('.sidebar-nav a').forEach((link) => {
    const ativo = link.getAttribute('href') === paginaAtual;
    link.classList.toggle('active', ativo);
    if (ativo) link.setAttribute('aria-current', 'page');
  });
}

export function inicializarNavegacao() {
  const sidebar = document.querySelector('.sidebar');
  const main = document.querySelector('main.content');
  if (!sidebar || !main) return;

  criarSidebar(sidebar);
  criarCabecalho(main);
  marcarPaginaAtual(sidebar);

  const button = sidebar.querySelector('.mobile-menu-btn');
  button.addEventListener('click', () => {
    const aberto = sidebar.classList.toggle('open');
    button.setAttribute('aria-expanded', String(aberto));
  });

  sidebar.querySelectorAll('.sidebar-nav a').forEach((link) => {
    link.addEventListener('click', () => sidebar.classList.remove('open'));
  });
}
