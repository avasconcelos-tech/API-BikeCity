export function inicializarNavegacao() {
    const sidebar = document.querySelector('.sidebar');
    const button = document.querySelector('.mobile-menu-btn');
    if (!sidebar || !button) return;

    button.addEventListener('click', () => {
        const aberto = sidebar.classList.toggle('open');
        button.setAttribute('aria-expanded', String(aberto));
    });

    sidebar.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', () => sidebar.classList.remove('open'));
    });
}
