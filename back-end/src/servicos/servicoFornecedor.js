const repositorio = require('../repositorios/repositorioFornecedor');
const ErroNegocio = require('../erros/ErroNegocio');

function normalizarCnpj(valor) {
  if (valor === undefined || valor === null || String(valor).trim() === '') return null;
  const texto = String(valor).trim().toUpperCase();
  if (
    !/^(?:[A-Z0-9]{12}\d{2}|[A-Z0-9]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2})$/.test(texto)
  )
    return undefined;

  const cnpj = texto.replace(/[./-]/g, '');
  if (/^([A-Z0-9])\1{11}\d{2}$/.test(cnpj)) return undefined;

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
  if (Number(cnpj[12]) !== primeiroDigito || Number(cnpj[13]) !== segundoDigito) return undefined;
  return cnpj;
}

function validarNome(nome) {
  return typeof nome === 'string' && nome.trim().length > 0;
}

function erroCnpj(status, mensagem) {
  throw new ErroNegocio(status, mensagem);
}

function listarFornecedores(incluirInativos = false) {
  return repositorio.listarFornecedores(incluirInativos);
}

function buscarFornecedorPorId(id) {
  const fornecedor = repositorio.buscarFornecedorPorId(id);
  if (!fornecedor) throw new ErroNegocio(404, 'Fornecedor não encontrado');
  return fornecedor;
}

function criarFornecedor(data) {
  const nome = data?.nome;
  if (!validarNome(nome)) {
    throw new ErroNegocio(400, 'Nome do fornecedor é obrigatório');
  }

  const cnpj = normalizarCnpj(data?.cnpj);
  if (cnpj === undefined) return erroCnpj(400, 'CNPJ inválido');
  if (cnpj && repositorio.existeCnpj(cnpj)) return erroCnpj(409, 'CNPJ já cadastrado');

  let fornecedor;
  try {
    fornecedor = repositorio.criarFornecedor({
      nome: nome.trim(),
      cnpj,
      contato: data?.contato ?? null,
    });
  } catch (erro) {
    if (String(erro.message).includes('UNIQUE')) throw new ErroNegocio(409, 'CNPJ já cadastrado');
    throw erro;
  }

  return fornecedor;
}

function atualizarFornecedor(id, data) {
  const nome = data?.nome;
  if (!validarNome(nome)) throw new ErroNegocio(400, 'Nome do fornecedor é obrigatório');
  const cnpj = normalizarCnpj(data?.cnpj);
  if (cnpj === undefined) return erroCnpj(400, 'CNPJ inválido');
  if (cnpj && repositorio.existeCnpj(cnpj, id)) return erroCnpj(409, 'CNPJ já cadastrado');

  let fornecedor;
  try {
    fornecedor = repositorio.atualizarFornecedor(id, {
      nome: nome.trim(),
      cnpj,
      contato: data?.contato ?? null,
    });
  } catch (erro) {
    if (String(erro.message).includes('UNIQUE')) throw new ErroNegocio(409, 'CNPJ já cadastrado');
    throw erro;
  }
  if (!fornecedor) throw new ErroNegocio(404, 'Fornecedor não encontrado');
  return fornecedor;
}

function inativarFornecedor(id) {
  const resultado = repositorio.inativarFornecedor(id);
  if (!resultado.fornecedor && resultado.possuiProdutosAtivos) {
    throw new ErroNegocio(409, 'Não é possível inativar fornecedor vinculado a produto ativo.');
  }
  if (!resultado.fornecedor) {
    throw new ErroNegocio(404, 'Fornecedor não encontrado');
  }
  return resultado.fornecedor;
}

module.exports = {
  listarFornecedores,
  buscarFornecedorPorId,
  criarFornecedor,
  atualizarFornecedor,
  inativarFornecedor,
};
