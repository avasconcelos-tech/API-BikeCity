import { checarAutenticacao, obterUsuarioLogado } from '../utilitarios/auth.js';
import { getUsuarios, postUsuario, deleteUsuario } from '../api/services.js';
import { habilitarMostrarSenha } from '../utilitarios/mostrarSenha.js';
import { mostrarToast, configurarModal, abrirModal, fecharModal } from '../utilitarios/ui.js';
if (!checarAutenticacao()) throw new Error('Não autenticado');
if (obterUsuarioLogado()?.perfil !== 'GERENTE') {
  mostrarToast('Apenas gerentes podem gerenciar usuários.', 'erro');
  location.href = 'dashboard.html';
  throw new Error('Permissão');
}
const $ = (id) => document.getElementById(id),
  modal = $('modal-usuario');
async function carregar() {
  const r = await getUsuarios(true);
  $('tbody').innerHTML = (r.dados || [])
    .map(
      (u) =>
        `<tr><td>${u.nome}</td><td>${u.email}</td><td>${u.cargo || '-'}</td><td>${u.perfil}</td><td>${u.ativo ? 'Ativo' : 'Inativo'}</td><td>${u.ativo && u.id !== obterUsuarioLogado().id ? `<button data-id="${u.id}" class="desativar">Desativar</button>` : '-'}</td></tr>`,
    )
    .join('');
  document.querySelectorAll('.desativar').forEach(
    (b) =>
      (b.onclick = async () => {
        if (confirm('Desativar este usuário?')) {
          b.disabled = true;
          try {
            await deleteUsuario(b.dataset.id);
            mostrarToast('Usuário desativado.');
            carregar();
          } catch (err) {
            mostrarToast(err.message || 'Não foi possível desativar o usuário.', 'erro');
          } finally {
            b.disabled = false;
          }
        }
      }),
  );
}
$('novo').onclick = () => abrirModal(modal, 'nome');
$('fechar').onclick = () => fecharModal(modal, 'novo');
document
  .querySelectorAll('.btn-close')
  .forEach((botao) => botao.setAttribute('aria-label', 'Fechar'));
configurarModal(modal, () => fecharModal(modal, 'novo'));
$('form').onsubmit = async (e) => {
  e.preventDefault();
  const botao = e.target.querySelector('button[type="submit"]');
  botao.disabled = true;
  try {
    const cargo = $('cargo').value;
    await postUsuario({
      nome: $('nome').value,
      email: $('email').value,
      cargo,
      perfil: cargo,
      senha: $('senha').value,
    });
    mostrarToast('Usuário cadastrado!');
    e.target.reset();
    fecharModal(modal, 'novo');
    carregar();
  } catch (err) {
    mostrarToast(err.message || 'Erro ao cadastrar usuário.', 'erro');
  } finally {
    botao.disabled = false;
  }
};
habilitarMostrarSenha('senha', 'mostrar-senha-usuario');
carregar();
