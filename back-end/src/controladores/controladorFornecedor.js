const servicoFornecedor = require('../servicos/servicoFornecedor');
const asyncHandler = require('../middlewares/asyncHandler');

async function listarFornecedores(req, res) {
  const incluirInativos = req.query.incluirInativos === 'true';
  const fornecedores = await servicoFornecedor.listarFornecedores(incluirInativos);
  return res.status(200).json({ status: 'sucesso', dados: fornecedores });
}

async function buscarFornecedorPorId(req, res) {
  const fornecedor = await servicoFornecedor.buscarFornecedorPorId(req.params.id);
  return res.status(200).json({ status: 'sucesso', dados: fornecedor });
}

async function criarFornecedor(req, res) {
  const fornecedor = await servicoFornecedor.criarFornecedor(req.body);
  return res
    .status(201)
    .json({ status: 'sucesso', mensagem: 'Fornecedor cadastrado com sucesso', dados: fornecedor });
}

async function atualizarFornecedor(req, res) {
  const fornecedor = await servicoFornecedor.atualizarFornecedor(req.params.id, req.body);
  return res
    .status(200)
    .json({ status: 'sucesso', mensagem: 'Fornecedor atualizado com sucesso', dados: fornecedor });
}

async function inativarFornecedor(req, res) {
  const fornecedor = await servicoFornecedor.inativarFornecedor(req.params.id);
  return res
    .status(200)
    .json({ status: 'sucesso', mensagem: 'Fornecedor inativado com sucesso', dados: fornecedor });
}

module.exports = {
  listarFornecedores: asyncHandler(listarFornecedores),
  buscarFornecedorPorId: asyncHandler(buscarFornecedorPorId),
  criarFornecedor: asyncHandler(criarFornecedor),
  atualizarFornecedor: asyncHandler(atualizarFornecedor),
  inativarFornecedor: asyncHandler(inativarFornecedor),
};
