import { checarAutenticacao, obterUsuarioLogado } from '../utilitarios/auth.js';
import { getFornecedores, postFornecedor, putFornecedor } from '../api/services.js';
import { mostrarToast } from '../utilitarios/ui.js';
import { escaparHtml } from '../utilitarios/html.js';

if (!checarAutenticacao()) throw new Error('Não autenticado');

const $ = (id) => document.getElementById(id);
const usuario = obterUsuarioLogado();
const podeEditar = ['ANALISTA', 'GERENTE'].includes(usuario?.perfil);
let fornecedorEmEdicao = null;
let fornecedores = [];

function formatarCnpj(valor) {
  const cnpj = String(valor || '')
    .replace(/[^a-z\d]/gi, '')
    .toUpperCase()
    .slice(0, 14);
  if (cnpj.length <= 2) return cnpj;
  if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
  if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
  if (cnpj.length <= 12)
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

function validarCnpj(valor) {
  const cnpj = String(valor || '')
    .replace(/[./-]/g, '')
    .toUpperCase();
  if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpj) || /^([A-Z0-9])\1{11}\d{2}$/.test(cnpj)) return false;
  const calcularDigito = (base, pesos) => {
    const soma = [...base].reduce(
      (total, digito, indice) => total + (digito.charCodeAt(0) - 48) * pesos[indice],
      0,
    );
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const primeiroDigito = calcularDigito(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundoDigito = calcularDigito(
    cnpj.slice(0, 12) + primeiroDigito,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  return Number(cnpj[12]) === primeiroDigito && Number(cnpj[13]) === segundoDigito;
}

function atualizarCnpj() {
  const campo = $('fornecedor-cnpj');
  campo.value = formatarCnpj(campo.value);
  campo.setCustomValidity(
    validarCnpj(campo.value) ? '' : 'Informe um CNPJ válido, incluindo os dígitos verificadores.',
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
  atualizarCnpj();
  $('fornecedor-contato').value = fornecedor?.contato || '';
  $('secao-formulario-fornecedor').hidden = false;
  $('fornecedor-nome').focus();
}

function renderizar() {
  $('tbody-fornecedores').innerHTML =
    fornecedores
      .map(
        (fornecedor) =>
          `<tr><td>${escaparHtml(fornecedor.nome)}</td><td>${escaparHtml(fornecedor.cnpj)}</td><td>${escaparHtml(fornecedor.contato)}</td><td>${fornecedor.ativo ? 'Ativo' : 'Inativo'}</td><td>${podeEditar && fornecedor.ativo ? `<button type="button" class="btn-editar-fornecedor" data-id="${escaparHtml(fornecedor.id)}">Editar</button>` : '-'}</td></tr>`,
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
$('fornecedor-cnpj').addEventListener('input', atualizarCnpj);
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
