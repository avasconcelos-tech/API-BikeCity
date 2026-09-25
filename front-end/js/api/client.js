import { API_BASE_URL } from './config.js';
import { obterToken, removerToken } from '../utilitarios/auth.js';

export async function apiFetch(endpoint, options = {}) {
  const token = obterToken();

  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  let resposta;

  try {
    resposta = await fetch(url, {
      ...options,
      headers,
    });
  } catch (erro) {
    throw new Error(
      'Não foi possível conectar à API. Verifique se o servidor está ligado e tente novamente.',
    );
  }

  const texto = await resposta.text();
  let dados = {};

  try {
    dados = texto ? JSON.parse(texto) : {};
  } catch {
    dados = {};
  }

  if (resposta.status === 401 && token && !endpoint.includes('/auth/login')) {
    removerToken();
    window.location.href = './login.html?expirou=1';
    throw new Error('Sua sessão expirou. Faça login novamente.');
  }

  if (!resposta.ok) {
    throw new Error(dados.mensagem || `Erro na requisição: ${resposta.status}`);
  }

  return dados;
}
