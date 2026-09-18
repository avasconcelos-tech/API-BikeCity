import { obterToken } from '../utilitarios/auth.js';

export async function apiFetch(endpoint, options = {}) {
    const token = obterToken();
    
    // Prepara os cabeçalhos mesclando o Authorization caso o token exista
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    const resposta = await fetch(endpoint, {
        ...options,
        headers
    });

    if (!resposta.ok) {
        const erroData = await resposta.json().catch(() => ({}));
        throw new Error(erroData.mensagem || `Erro na requisição: ${resposta.status}`);
    }

    return resposta.json();
}