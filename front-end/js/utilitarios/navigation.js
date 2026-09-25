import { obterUsuarioLogado, removerToken } from './auth.js';

const paginas = [
  ['dashboard.html', 'Dashboard'],
  ['produtos.html', 'Produtos'],
  ['estoque.html', 'Estoque'],
  ['relatorios.html', 'Relatórios'],
  ['usuarios.html', 'Usuários'],
];

function criarSidebar(sidebar) {
  sidebar.innerHTML = `
    <a class="brand" href="dashboard.html" aria-label="BikeCity - Dashboard">
      <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="8" cy="23" r="5"></circle><circle cx="24" cy="23" r="5"></circle><path d="M8 23l6-11 5 11m-5-11h5l5 11M11 7h4"></path></svg></span>
      <span class="brand-name">Bike<span>City</span></span>
    </a>
    <button class="mobile-menu-btn" type="button" aria-label="Abrir menu" aria-expanded="false"><span></span></button>
    <ul class="sidebar-nav">${paginas.map(([href, nome]) => `<li><a href="${href}">${nome}</a></li>`).join('')}</ul>`;
}

function criarCabecalho(main) {
  const usuario = obterUsuarioLogado();
  const cabecalho = document.createElement('div');
  cabecalho.className = 'app-header';
  cabecalho.innerHTML = `<span class="user-email">${usuario?.nome || usuario?.email || ''}</span><button id="btn-logout" class="btn-danger" type="button">Sair</button>`;
  main.prepend(cabecalho);
  cabecalho.querySelector('#btn-logout').addEventListener('click', () => {
    removerToken();
    window.location.href = './login.html';
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
