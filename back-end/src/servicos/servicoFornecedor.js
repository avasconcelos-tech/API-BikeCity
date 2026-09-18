const repositorio = require('../repositorios/repositorioFornecedor');

function listarFornecedores(incluirInativos = false) {
  return repositorio.listarFornecedores(incluirInativos);
}

function buscarFornecedorPorId(id) {
  return repositorio.buscarFornecedorPorId(id);
}

function criarFornecedor(data) {
  const nome = data?.nome;
  if (!nome || String(nome).trim().length === 0) {
    return {
      statusCode: 400,
      payload: { status: 'erro', mensagem: 'Nome do fornecedor é obrigatório' }
    };
  }

  const fornecedor = repositorio.criarFornecedor({
    nome: String(nome).trim(),
    cnpj: data?.cnpj ?? null,
    contato: data?.contato ?? null
  });

  return {
    statusCode: 201,
    payload: {
      status: 'sucesso',
      mensagem: 'Fornecedor cadastrado com sucesso',
      dados: fornecedor
    }
  };
}

module.exports = {
  listarFornecedores,
  buscarFornecedorPorId,
  criarFornecedor
};