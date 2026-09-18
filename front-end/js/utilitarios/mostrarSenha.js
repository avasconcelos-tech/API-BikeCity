export function habilitarMostrarSenha(inputId, checkboxId) {
    const input = document.getElementById(inputId);
    const checkbox = document.getElementById(checkboxId);
    if (!input || !checkbox) return;

    checkbox.addEventListener('change', () => {
        input.type = checkbox.checked ? 'text' : 'password';
    });
}
