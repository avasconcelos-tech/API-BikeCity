import { checarAutenticacao, obterUsuarioLogado } from '../utilitarios/auth.js';
import { getFornecedores, postFornecedor, putFornecedor } from '../api/services.js';
import { mostrarToast } from '../utilitarios/ui.js';

if (!checarAutenticacao()) throw new Error('Não autenticado');

const $ = (id) => document.getElementById(id);
const usuario = obterUsuarioLogado();
const podeEditar = ['ANALISTA', 'GERENTE'].includes(usuario?.perfil);
let fornecedorEmEdicao = null;
let fornecedores = [];

function escapeHtml(valor) {
  return String(valor ?? '-').replace(
    /[&<>"']/g,
    (caractere) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caractere],
  );
}

function fecharFormulario() {
  $('form-fornecedor').reset();
  fornecedorEmEdicao = null;
  $('titulo-formulario-fornecedor').textContent = 'Cadastrar fornecedor';
  $('secao-formulario-fornecedor').hidden = true;
}

function abrirFormulario(fornecedor = null) {
  fornecedorEmEdicao = fornecedor;
  $('titulo-formulario-fornecedor').textContent = fornecedor
    ? 'Editar fornecedor'
    : 'Cadastrar fornecedor';
  $('fornecedor-nome').value = fornecedor?.nome || '';
  $('fornecedor-cnpj').value = fornecedor?.cnpj || '';
  $('fornecedor-contato').value = fornecedor?.contato || '';
  $('secao-formulario-fornecedor').hidden = false;
  $('fornecedor-nome').focus();
}

function renderizar() {
  $('tbody-fornecedores').innerHTML =
    fornecedores
      .map(
        (fornecedor) =>
          `<tr><td>${escapeHtml(fornecedor.nome)}</td><td>${escapeHtml(fornecedor.cnpj)}</td><td>${escapeHtml(fornecedor.contato)}</td><td>${fornecedor.ativo ? 'Ativo' : 'Inativo'}</td><td>${podeEditar && fornecedor.ativo ? `<button type="button" class="btn-editar-fornecedor" data-id="${fornecedor.id}">Editar</button>` : '-'}</td></tr>`,
      )
      .join('') || '<tr><td colspan="5">Nenhum fornecedor cadastrado.</td></tr>';
  document
    .querySelectorAll('.btn-editar-fornecedor')
    .forEach((botao) =>
      botao.addEventListener('click', () =>
        abrirFormulario(fornecedores.find((item) => item.id === Number(botao.dataset.id))),
      ),
    );
}

async function carregar() {
  try {
    fornecedores = (await getFornecedores(true)).dados || [];
    renderizar();
  } catch (erro) {
    mostrarToast(erro.message || 'Não foi possível carregar os fornecedores.', 'erro');
  }
}

$('btn-novo-fornecedor').hidden = !podeEditar;
$('btn-novo-fornecedor').addEventListener('click', () => abrirFormulario());
$('btn-cancelar-fornecedor').addEventListener('click', fecharFormulario);
$('form-fornecedor').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const botao = evento.target.querySelector('button[type="submit"]');
  botao.disabled = true;
  const dados = {
    nome: $('fornecedor-nome').value.trim(),
    cnpj: $('fornecedor-cnpj').value.trim(),
    contato: $('fornecedor-contato').value.trim(),
  };
  try {
    if (fornecedorEmEdicao) await putFornecedor(fornecedorEmEdicao.id, dados);
    else await postFornecedor(dados);
    mostrarToast(fornecedorEmEdicao ? 'Fornecedor atualizado.' : 'Fornecedor cadastrado.');
    fecharFormulario();
    await carregar();
  } catch (erro) {
    mostrarToast(erro.message || 'Não foi possível salvar o fornecedor.', 'erro');
  } finally {
    botao.disabled = false;
  }
});

$('secao-formulario-fornecedor').hidden = true;
carregar();
