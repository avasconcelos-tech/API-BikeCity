const servicoEstoque = require('../servicos/servicoEstoque');

function listarMovimentacoes(req, res) {
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
  const resultado = servicoEstoque.listarMovimentacoes(filtros, page, limit);
  return res.json({ status: 'sucesso', dados: resultado.dados, meta: resultado.meta });
}
function listarAlertas(req, res) {
  return res.json({ status: 'sucesso', dados: servicoEstoque.listarAlertas() });
}
function listarRastreabilidade(req, res) {
  return res.json({
    status: 'sucesso',
    dados: servicoEstoque.listarRastreabilidade(
      req.query.produto_id ? Number(req.query.produto_id) : null,
    ),
  });
}
function registrarEntrada(req, res) {
  const body = req.body;
  const dados = servicoEstoque.registrarEntrada(
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
function registrarSaida(req, res) {
  const body = req.body;
  const dados = servicoEstoque.registrarSaida(
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
function registrarAjusteManual(req, res) {
  const body = req.body;
  const dados = servicoEstoque.registrarAjusteManual(
    body.produto_id,
    body.nova_quantidade,
    body.justificativa,
    req.user.id,
  );
  return res
    .status(201)
    .json({ status: 'sucesso', mensagem: 'Ajuste manual realizado com sucesso.', dados });
}
function registrarDevolucao(req, res) {
  const dados = servicoEstoque.registrarDevolucao(req.body, req.user.id);
  return res
    .status(201)
    .json({ status: 'sucesso', mensagem: 'Devolução registrada com sucesso.', dados });
}
function registrarEstorno(req, res) {
  const dados = servicoEstoque.registrarEstorno(
    req.params.id,
    req.user.id,
    req.body.motivo,
    req.body.observacao || '',
  );
  return res
    .status(201)
    .json({ status: 'sucesso', mensagem: 'Estorno registrado com sucesso.', dados });
}
function resumo(req, res) {
  return res.json({ status: 'sucesso', dados: servicoEstoque.obterResumo() });
}
function relatorio(req, res) {
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
  const dados = servicoEstoque.obterRelatorio(filtros);
  return res.json({ status: 'sucesso', dados });
}
function notificacoes(req, res) {
  const setor = req.query.setor || null;
  return res.json({
    status: 'sucesso',
    dados: servicoEstoque.listarNotificacoes(setor),
  });
}
function marcarNotificacaoLida(req, res) {
  const marcada = servicoEstoque.marcarNotificacaoLida(req.params.id);
  if (!marcada)
    return res.status(404).json({ status: 'erro', mensagem: 'Notificação não encontrada' });
  return res.json({ status: 'sucesso', mensagem: 'Notificação marcada como lida.' });
}
function buscarCodigo(req, res) {
  const produto = servicoEstoque.buscarPorCodigo(req.params.codigo);
  if (!produto)
    return res
      .status(404)
      .json({ status: 'erro', mensagem: 'Produto não encontrado para o código informado.' });
  return res.json({ status: 'sucesso', dados: produto });
}
function marcarAlerta(req, res) {
  servicoEstoque.marcarAlertaLido(req.params.id);
  return res.json({ status: 'sucesso', mensagem: 'Alerta marcado como lido.' });
}
module.exports = {
  listarMovimentacoes,
  listarAlertas,
  listarRastreabilidade,
  registrarEntrada,
  registrarSaida,
  registrarAjusteManual,
  registrarDevolucao,
  registrarEstorno,
  resumo,
  relatorio,
  notificacoes,
  marcarNotificacaoLida,
  buscarCodigo,
  marcarAlerta,
};
