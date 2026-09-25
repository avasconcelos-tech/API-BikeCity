const servicoProduto = require('../servicos/servicoProduto');
const asyncHandler = require('../middlewares/asyncHandler');
async function listarProdutos(req, res) {
  return res.json({
    status: 'sucesso',
    dados: await servicoProduto.listarProdutos(req.query.incluirInativos === 'true'),
  });
}
async function buscarProdutoPorId(req, res) {
  const p = await servicoProduto.buscarProdutoPorId(req.params.id);
  if (!p) return res.status(404).json({ status: 'erro', mensagem: 'Produto não encontrado' });
  return res.json({ status: 'sucesso', dados: p });
}
async function atualizarProduto(req, res) {
  const permitidos = [
    'nome',
    'codigo_interno',
    'categoria',
    'unidade_medida',
    'localizacao_deposito',
    'fornecedor_id',
    'custo',
    'dimensoes',
    'estoque_minimo',
    'estado_montagem',
    'tipo_rastreabilidade',
    'demanda_prevista',
  ];
  const dados = {};
  for (const campo of permitidos)
    if (Object.hasOwn(req.body, campo)) dados[campo] = req.body[campo];
  const produto = await servicoProduto.atualizarProduto(req.params.id, dados);
  return res.json({
    status: 'sucesso',
    mensagem: 'Produto atualizado com sucesso',
    dados: produto,
  });
}
async function inativarProduto(req, res) {
  const produto = await servicoProduto.inativarProduto(req.params.id);
  return res.json({ status: 'sucesso', mensagem: 'Produto inativado com sucesso', dados: produto });
}
async function reativarProduto(req, res) {
  const produto = await servicoProduto.reativarProduto(req.params.id);
  return res.json({ status: 'sucesso', mensagem: 'Produto reativado com sucesso', dados: produto });
}
async function criarProduto(req, res) {
  const dados = await servicoProduto.criarProduto(req.body);
  return res
    .status(201)
    .json({ status: 'sucesso', mensagem: 'Produto cadastrado com sucesso', dados });
}
module.exports = {
  listarProdutos: asyncHandler(listarProdutos),
  buscarProdutoPorId: asyncHandler(buscarProdutoPorId),
  atualizarProduto: asyncHandler(atualizarProduto),
  inativarProduto: asyncHandler(inativarProduto),
  reativarProduto: asyncHandler(reativarProduto),
  criarProduto: asyncHandler(criarProduto),
};
