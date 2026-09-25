const servicoEstoque = require('../servicos/servicoEstoque');
const asyncHandler = require('../middlewares/asyncHandler');

async function listarMovimentacoes(req, res) {
  const filtros = {
    produto_id: req.query.produto_id,
    tipo: req.query.tipo,
    usuario_id: req.query.usuario_id,
    data_inicio: req.query.data_inicio,
    data_fim: req.query.data_fim,
    busca: req.query.busca,
  };
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const resultado = await servicoEstoque.listarMovimentacoes(filtros, page, limit);
  return res.json({ status: 'sucesso', dados: resultado.dados, meta: resultado.meta });
}
async function listarAlertas(req, res) {
  return res.json({ status: 'sucesso', dados: await servicoEstoque.listarAlertas() });
}
async function listarRastreabilidade(req, res) {
  return res.json({
    status: 'sucesso',
    dados: await servicoEstoque.listarRastreabilidade(
      req.query.produto_id ? Number(req.query.produto_id) : null,
    ),
  });
}
async function registrarEntrada(req, res) {
  const body = req.body;
  const dados = await servicoEstoque.registrarEntrada(
    body.produto_id,
    body.quantidade,
    body.fornecedor_id,
    req.user.id,
    body.numero_nota_fiscal,
    body.itens_rastreaveis || [],
    body,
  );
  return res
    .status(201)
    .json({ status: 'sucesso', mensagem: 'Entrada registrada com sucesso.', dados });
}
async function registrarSaida(req, res) {
  const body = req.body;
  const dados = await servicoEstoque.registrarSaida(
    body.produto_id,
    body.quantidade,
    body.destinatario,
    body.motivo,
    req.user.id,
    body,
  );
  return res
    .status(201)
    .json({ status: 'sucesso', mensagem: 'Saída de estoque registrada com sucesso.', dados });
}
async function registrarAjusteManual(req, res) {
  const body = req.body;
  const dados = await servicoEstoque.registrarAjusteManual(
    body.produto_id,
    body.nova_quantidade,
    body.justificativa,
    req.user.id,
  );
  return res
    .status(201)
    .json({ status: 'sucesso', mensagem: 'Ajuste manual realizado com sucesso.', dados });
}
async function registrarDevolucao(req, res) {
  const dados = await servicoEstoque.registrarDevolucao(req.body, req.user.id);
  return res
    .status(201)
    .json({ status: 'sucesso', mensagem: 'Devolução registrada com sucesso.', dados });
}
async function registrarEstorno(req, res) {
  const dados = await servicoEstoque.registrarEstorno(
    req.params.id,
    req.user.id,
    req.body.motivo,
    req.body.observacao || '',
  );
  return res
    .status(201)
    .json({ status: 'sucesso', mensagem: 'Estorno registrado com sucesso.', dados });
}
async function resumo(req, res) {
  return res.json({ status: 'sucesso', dados: await servicoEstoque.obterResumo() });
}
async function relatorio(req, res) {
  const filtros = {
    produto_id: req.query.produto_id,
    tipo: req.query.tipo,
    usuario_id: req.query.usuario_id,
    data_inicio: req.query.data_inicio,
    data_fim: req.query.data_fim,
    busca: req.query.busca,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
  };
  const dados = await servicoEstoque.obterRelatorio(filtros);
  return res.json({ status: 'sucesso', dados });
}
async function notificacoes(req, res) {
  const setor = req.query.setor || null;
  return res.json({
    status: 'sucesso',
    dados: await servicoEstoque.listarNotificacoes(setor),
  });
}
async function marcarNotificacaoLida(req, res) {
  const marcada = await servicoEstoque.marcarNotificacaoLida(req.params.id);
  if (!marcada)
    return res.status(404).json({ status: 'erro', mensagem: 'Notificação não encontrada' });
  return res.json({ status: 'sucesso', mensagem: 'Notificação marcada como lida.' });
}
async function buscarCodigo(req, res) {
  const produto = await servicoEstoque.buscarPorCodigo(req.params.codigo);
  if (!produto)
    return res
      .status(404)
      .json({ status: 'erro', mensagem: 'Produto não encontrado para o código informado.' });
  return res.json({ status: 'sucesso', dados: produto });
}
async function marcarAlerta(req, res) {
  await servicoEstoque.marcarAlertaLido(req.params.id);
  return res.json({ status: 'sucesso', mensagem: 'Alerta marcado como lido.' });
}
module.exports = {
  listarMovimentacoes: asyncHandler(listarMovimentacoes),
  listarAlertas: asyncHandler(listarAlertas),
  listarRastreabilidade: asyncHandler(listarRastreabilidade),
  registrarEntrada: asyncHandler(registrarEntrada),
  registrarSaida: asyncHandler(registrarSaida),
  registrarAjusteManual: asyncHandler(registrarAjusteManual),
  registrarDevolucao: asyncHandler(registrarDevolucao),
  registrarEstorno: asyncHandler(registrarEstorno),
  resumo: asyncHandler(resumo),
  relatorio: asyncHandler(relatorio),
  notificacoes: asyncHandler(notificacoes),
  marcarNotificacaoLida: asyncHandler(marcarNotificacaoLida),
  buscarCodigo: asyncHandler(buscarCodigo),
  marcarAlerta: asyncHandler(marcarAlerta),
};
