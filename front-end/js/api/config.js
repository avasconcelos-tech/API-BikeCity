// O front-end e a API são servidos pelo mesmo servidor na porta 5500.
const hostname = window.location.hostname || 'localhost';

export const API_BASE_URL = `${window.location.protocol}//${hostname}:5500`;
