import { apiFetch } from './client.js';
export function postLogin(email, senha) {
  return apiFetch('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
}
export function getProdutos(incluirInativos = false) {
  return apiFetch(`/api/v1/produtos${incluirInativos ? '?incluirInativos=true' : ''}`);
}
export function getProduto(id) {
  return apiFetch(`/api/v1/produtos/${id}`);
}
export function postProduto(dados) {
  return apiFetch('/api/v1/produtos', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}
export function putProduto(id, dados) {
  return apiFetch(`/api/v1/produtos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
}
export function postEntradaEstoque(dados) {
  return apiFetch('/api/v1/estoque/entradas', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}
export function postSaidaEstoque(dados) {
  return apiFetch('/api/v1/estoque/saidas', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}
export function postDevolucao(dados) {
  return apiFetch('/api/v1/estoque/devolucoes', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}
export function postAjuste(dados) {
  return apiFetch('/api/v1/estoque/ajuste-manual', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}
export function getFornecedores() {
  return apiFetch('/api/v1/fornecedores');
}
export function getUsuarios(incluirInativos = false) {
  return apiFetch(`/api/v1/usuarios${incluirInativos ? '?incluirInativos=true' : ''}`);
}
export function postUsuario(dados) {
  return apiFetch('/api/v1/usuarios', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}
export function putUsuario(id, dados) {
  return apiFetch(`/api/v1/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
}
export function deleteUsuario(id) {
  return apiFetch(`/api/v1/usuarios/${id}`, { method: 'DELETE' });
}
export function getRelatorio() {
  return apiFetch('/api/v1/estoque/relatorios');
}
export function getRastreabilidade() {
  return apiFetch('/api/v1/estoque/rastreabilidade');
}
export function getNotificacoes(setor = '') {
  return apiFetch(
    `/api/v1/estoque/notificacoes${setor ? `?setor=${encodeURIComponent(setor)}` : ''}`,
  );
}
