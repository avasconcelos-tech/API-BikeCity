const servicoProduto = require('../servicos/servicoProduto');
function listarProdutos(req, res) {
  return res.json({
    status: 'sucesso',
    dados: servicoProduto.listarProdutos(req.query.incluirInativos === 'true'),
  });
}
function buscarProdutoPorId(req, res) {
  const p = servicoProduto.buscarProdutoPorId(req.params.id);
  if (!p) return res.status(404).json({ status: 'erro', mensagem: 'Produto não encontrado' });
  return res.json({ status: 'sucesso', dados: p });
}
function atualizarProduto(req, res) {
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
  const produto = servicoProduto.atualizarProduto(req.params.id, dados);
  return res.json({
    status: 'sucesso',
    mensagem: 'Produto atualizado com sucesso',
    dados: produto,
  });
}
function inativarProduto(req, res) {
  const produto = servicoProduto.inativarProduto(req.params.id);
  return res.json({ status: 'sucesso', mensagem: 'Produto inativado com sucesso', dados: produto });
}
function reativarProduto(req, res) {
  const produto = servicoProduto.reativarProduto(req.params.id);
  return res.json({ status: 'sucesso', mensagem: 'Produto reativado com sucesso', dados: produto });
}
function criarProduto(req, res) {
  const dados = servicoProduto.criarProduto(req.body);
  return res
    .status(201)
    .json({ status: 'sucesso', mensagem: 'Produto cadastrado com sucesso', dados });
}
module.exports = {
  listarProdutos,
  buscarProdutoPorId,
  atualizarProduto,
  inativarProduto,
  reativarProduto,
  criarProduto,
};
