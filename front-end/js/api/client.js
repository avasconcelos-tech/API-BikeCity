import { API_BASE_URL } from './config.js';
import { obterToken } from '../utilitarios/auth.js';

export async function apiFetch(endpoint, options = {}) {
    const token = obterToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(token
            ? { Authorization: `Bearer ${token}` }
            : {}),
        ...options.headers
    };

    // Garante que a requisição vá para a API,
    // e não para o Live Server (porta 5500).
    const url = `${API_BASE_URL}${endpoint}`;

    const resposta = await fetch(url, {
        ...options,
        headers
    });

    if (!resposta.ok) {
        const erroData = await resposta.json().catch(() => ({}));

        throw new Error(
            erroData.mensagem ||
            `Erro na requisição: ${resposta.status}`
        );
    }

    return resposta.json();
}