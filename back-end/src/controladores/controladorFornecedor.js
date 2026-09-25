const servicoFornecedor = require('../servicos/servicoFornecedor');

function listarFornecedores(req, res) {
  const incluirInativos = req.query.incluirInativos === 'true';
  const fornecedores = servicoFornecedor.listarFornecedores(incluirInativos);
  return res.status(200).json({ status: 'sucesso', dados: fornecedores });
}

function buscarFornecedorPorId(req, res) {
  const fornecedor = servicoFornecedor.buscarFornecedorPorId(req.params.id);

  if (!fornecedor) {
    return res.status(404).json({ status: 'erro', mensagem: 'Fornecedor não encontrado' });
  }

  return res.status(200).json({ status: 'sucesso', dados: fornecedor });
}

function criarFornecedor(req, res) {
  const result = servicoFornecedor.criarFornecedor(req.body);
  return res.status(result.statusCode).json(result.payload);
}

function atualizarFornecedor(req, res) {
  const result = servicoFornecedor.atualizarFornecedor(req.params.id, req.body);
  return res.status(result.statusCode).json(result.payload);
}

module.exports = {
  listarFornecedores,
  buscarFornecedorPorId,
  criarFornecedor,
  atualizarFornecedor
};