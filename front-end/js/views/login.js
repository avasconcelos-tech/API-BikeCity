import { postLogin } from '../api/services.js';
import { salvarToken } from '../utilitarios/auth.js';
import { habilitarMostrarSenha } from '../utilitarios/mostrarSenha.js';

const formLogin = document.getElementById('form-login');
habilitarMostrarSenha('senha', 'mostrar-senha');

formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const btnSubmit = document.getElementById('btn-entrar');

    try {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Carregando...';

        const data = await postLogin(email, senha);
        salvarToken(data.dados?.token || data.token);

        window.location.href = './dashboard.html';
    } catch (error) {
        alert(error.message || 'Falha ao autenticar.');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Entrar';
    }
});