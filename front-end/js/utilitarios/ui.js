export function mostrarToast(mensagem, tipo = 'sucesso') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
  toast.textContent = mensagem;
  container.appendChild(toast);
  window.setTimeout(() => toast.remove(), 5000);
}

export function configurarModal(modal, fechar) {
  if (!modal) return;
  modal.setAttribute('aria-hidden', modal.classList.contains('active') ? 'false' : 'true');
  modal
    .querySelectorAll('.btn-close')
    .forEach((botao) => botao.setAttribute('aria-label', 'Fechar'));
  const obterFocos = () =>
    [
      ...modal.querySelectorAll(
        'button, input, select, textarea, a, [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((elemento) => !elemento.disabled && elemento.offsetParent !== null);
  modal.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      fechar();
      return;
    }
    if (evento.key !== 'Tab') return;
    const focos = obterFocos();
    if (!focos.length) return;
    const primeiro = focos[0];
    const ultimo = focos[focos.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  });
  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) fechar();
  });
}

export function abrirModal(modal, focoInicial) {
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  window.setTimeout(() => document.getElementById(focoInicial)?.focus(), 0);
}

export function fecharModal(modal, focoAnterior) {
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.getElementById(focoAnterior)?.focus();
}
