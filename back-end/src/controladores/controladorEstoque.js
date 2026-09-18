const servicoEstoque=require('../servicos/servicoEstoque');
const conexaoBanco=require('../repositorios/conexaoBanco');
const db=conexaoBanco.getDb();
function listarMovimentacoes(req,res){const id=req.query.produto_id;return res.json({status:'sucesso',dados:servicoEstoque.listarMovimentacoes(id?Number(id):null)});}
function listarAlertas(req,res){return res.json({status:'sucesso',dados:servicoEstoque.listarAlertas()});}
function listarRastreabilidade(req,res){return res.json({status:'sucesso',dados:servicoEstoque.listarRastreabilidade(req.query.produto_id?Number(req.query.produto_id):null)});}
function registrarEntrada(req,res){const b=req.body;const r=servicoEstoque.registrarEntrada(b.produto_id,b.quantidade,b.fornecedor_id,req.user.id,b.numero_nota_fiscal,b.itens_rastreaveis||[],b);return res.status(r.statusCode).json(r.payload);}
function registrarSaida(req,res){const b=req.body;const r=servicoEstoque.registrarSaida(b.produto_id,b.quantidade,b.destinatario,b.motivo,req.user.id,b);return res.status(r.statusCode).json(r.payload);}
function registrarAjusteManual(req,res){const b=req.body;const r=servicoEstoque.registrarAjusteManual(b.produto_id,b.nova_quantidade,b.justificativa,req.user.id);return res.status(r.statusCode).json(r.payload);}
function registrarDevolucao(req,res){const r=servicoEstoque.registrarDevolucao(req.body,req.user.id);return res.status(r.statusCode).json(r.payload);}
function resumo(req,res){return res.json({status:'sucesso',dados:servicoEstoque.obterResumo()});}
function relatorio(req,res){return res.json({status:'sucesso',dados:servicoEstoque.obterRelatorio()});}
function notificacoes(req,res){const setor=req.query.setor||null;return res.json({status:'sucesso',dados:require('../repositorios/repositorioEstoque').listarNotificacoes(setor)});}
function buscarCodigo(req,res){const p=servicoEstoque.buscarPorCodigo(req.params.codigo);if(!p)return res.status(404).json({status:'erro',mensagem:'Produto não encontrado para o código informado.'});return res.json({status:'sucesso',dados:p});}
function marcarAlerta(req,res){require('../repositorios/repositorioEstoque').marcarAlertaLido(req.params.id);return res.json({status:'sucesso',mensagem:'Alerta marcado como lido.'});}
module.exports={listarMovimentacoes,listarAlertas,listarRastreabilidade,registrarEntrada,registrarSaida,registrarAjusteManual,registrarDevolucao,resumo,relatorio,notificacoes,buscarCodigo,marcarAlerta};
