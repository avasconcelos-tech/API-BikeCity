const TOKEN_KEY = 'bikecity_token';
const LAST_ACTIVITY = 'bikecity_last_activity';
const INATIVIDADE_MS = 30 * 60 * 1000;
export function salvarToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  registrarAtividade();
}
export function obterToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function removerToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LAST_ACTIVITY);
}
export function obterUsuarioLogado() {
  const token = obterToken();
  if (!token) return null;
  try {
    const p = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (p.exp && Date.now() / 1000 >= p.exp) return null;
    return p;
  } catch {
    return null;
  }
}
export function registrarAtividade() {
  if (obterToken()) localStorage.setItem(LAST_ACTIVITY, String(Date.now()));
}
export function checarAutenticacao() {
  const token = obterToken();
  const usuario = obterUsuarioLogado();
  const ultima = Number(localStorage.getItem(LAST_ACTIVITY) || 0);
  const sessaoExpirada = Boolean(token && !usuario);
  const inativo = Boolean(ultima && Date.now() - ultima > INATIVIDADE_MS);
  if (!token || sessaoExpirada || inativo) {
    removerToken();
    window.location.href = sessaoExpirada || inativo ? './login.html?expirou=1' : './login.html';
    return false;
  }
  ['click', 'keydown', 'mousemove', 'touchstart'].forEach((e) =>
    window.addEventListener(e, registrarAtividade, { passive: true }),
  );
  setInterval(() => {
    const u = Number(localStorage.getItem(LAST_ACTIVITY) || 0);
    if (u && Date.now() - u > INATIVIDADE_MS) {
      removerToken();
      window.location.href = './login.html?expirou=1';
    }
  }, 60000);
  return true;
}
