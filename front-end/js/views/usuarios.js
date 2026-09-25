import { checarAutenticacao, obterUsuarioLogado } from '../utilitarios/auth.js';
import {
  getUsuarios,
  postUsuario,
  putUsuario,
  deleteUsuario,
  reativarUsuario,
} from '../api/services.js';
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
let usuarioEmEdicao = null;
async function carregar() {
  const r = await getUsuarios(true);
  $('tbody').innerHTML = (r.dados || [])
    .map(
      (u) =>
        `<tr><td>${u.nome}</td><td>${u.email}</td><td>${u.cargo || '-'}</td><td>${u.perfil}</td><td>${u.ativo ? 'Ativo' : 'Inativo'}</td><td><button type="button" data-id="${u.id}" class="editar">Editar</button> ${u.ativo && u.id !== obterUsuarioLogado().id ? `<button type="button" data-id="${u.id}" class="desativar">Desativar</button>` : ''} ${!u.ativo ? `<button type="button" data-id="${u.id}" class="reativar">Reativar</button>` : ''}</td></tr>`,
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
  document
    .querySelectorAll('.editar')
    .forEach((botao) =>
      botao.addEventListener('click', () =>
        abrirModalUsuario(
          (r.dados || []).find((usuario) => usuario.id === Number(botao.dataset.id)),
        ),
      ),
    );
  document.querySelectorAll('.reativar').forEach((botao) =>
    botao.addEventListener('click', async () => {
      botao.disabled = true;
      try {
        await reativarUsuario(botao.dataset.id);
        mostrarToast('Usuário reativado.');
        await carregar();
      } catch (err) {
        mostrarToast(err.message || 'Não foi possível reativar o usuário.', 'erro');
      } finally {
        botao.disabled = false;
      }
    }),
  );
}
function abrirModalUsuario(usuario = null) {
  usuarioEmEdicao = usuario;
  $('titulo-modal-usuario').textContent = usuario ? 'Editar Usuário' : 'Novo Usuário';
  $('nome').value = usuario?.nome || '';
  $('email').value = usuario?.email || '';
  $('cargo').value = usuario?.cargo || '';
  $('perfil').value = usuario?.perfil || '';
  $('senha').value = '';
  $('senha').required = !usuario;
  $('senha').placeholder = usuario
    ? 'Deixe em branco para manter a senha'
    : 'Digite uma senha com pelo menos 6 caracteres';
  abrirModal(modal, 'nome');
}
$('novo').onclick = () => abrirModalUsuario();
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
    const dados = {
      nome: $('nome').value,
      email: $('email').value,
      cargo: $('cargo').value,
      perfil: $('perfil').value,
    };
    if ($('senha').value) dados.senha = $('senha').value;
    if (usuarioEmEdicao) await putUsuario(usuarioEmEdicao.id, dados);
    else await postUsuario(dados);
    mostrarToast(usuarioEmEdicao ? 'Usuário atualizado!' : 'Usuário cadastrado!');
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
