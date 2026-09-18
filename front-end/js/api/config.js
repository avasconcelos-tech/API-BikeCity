// Configuração da API para uso local e em outros computadores da mesma rede.
// Quando o front-end é aberto pelo Node (porta 3000), usamos a própria origem.
// Se alguém abrir por Live Server (porta 5500), redirecionamos a API para a
// mesma máquina na porta 3000.
const hostname = window.location.hostname || 'localhost';
const porta = window.location.port;

export const API_BASE_URL =
    porta === '5500'
        ? `${window.location.protocol}//${hostname}:3000`
        : `${window.location.protocol}//${hostname}${porta ? `:${porta}` : ''}`;
