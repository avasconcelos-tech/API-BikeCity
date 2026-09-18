import { API_BASE_URL } from './config.js';
import { obterToken } from '../utilitarios/auth.js';

export async function apiFetch(endpoint, options = {}) {
    const token = obterToken();

    const headers = {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    const url = endpoint.startsWith('http')
        ? endpoint
        : `${API_BASE_URL}${endpoint}`;

    let resposta;

    try {
        resposta = await fetch(url, {
            ...options,
            headers
        });
    } catch (erro) {
        throw new Error(
            `Não foi possível conectar à API em ${API_BASE_URL}. ` +
            `Verifique se o servidor está ligado e se a porta 3000 está liberada na rede.`
        );
    }

    const texto = await resposta.text();
    let dados = {};

    try {
        dados = texto ? JSON.parse(texto) : {};
    } catch {
        dados = {};
    }

    if (!resposta.ok) {
        throw new Error(
            dados.mensagem ||
            `Erro na requisição: ${resposta.status}`
        );
    }

    return dados;
}
