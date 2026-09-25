const servicoFornecedor = require('../servicos/servicoFornecedor');

function listarFornecedores(req, res) {
  const incluirInativos = req.query.incluirInativos === 'true';
  const fornecedores = servicoFornecedor.listarFornecedores(incluirInativos);
  return res.status(200).json({ status: 'sucesso', dados: fornecedores });
}

function buscarFornecedorPorId(req, res) {
  const fornecedor = servicoFornecedor.buscarFornecedorPorId(req.params.id);
  return res.status(200).json({ status: 'sucesso', dados: fornecedor });
}

function criarFornecedor(req, res) {
  const fornecedor = servicoFornecedor.criarFornecedor(req.body);
  return res
    .status(201)
    .json({ status: 'sucesso', mensagem: 'Fornecedor cadastrado com sucesso', dados: fornecedor });
}

function atualizarFornecedor(req, res) {
  const fornecedor = servicoFornecedor.atualizarFornecedor(req.params.id, req.body);
  return res
    .status(200)
    .json({ status: 'sucesso', mensagem: 'Fornecedor atualizado com sucesso', dados: fornecedor });
}

function inativarFornecedor(req, res) {
  const fornecedor = servicoFornecedor.inativarFornecedor(req.params.id);
  return res
    .status(200)
    .json({ status: 'sucesso', mensagem: 'Fornecedor inativado com sucesso', dados: fornecedor });
}

module.exports = {
  listarFornecedores,
  buscarFornecedorPorId,
  criarFornecedor,
  atualizarFornecedor,
  inativarFornecedor,
};
