const repositorioProduto = require('../repositorios/repositorioProduto');
const repositorioEstoque = require('../repositorios/repositorioEstoque');
const repositorioFornecedor = require('../repositorios/repositorioFornecedor');
const conexaoBanco = require('../repositorios/conexaoBanco');
const db = conexaoBanco.getDb();
const executarEmTransacao = conexaoBanco.executarEmTransacao;

function erro(codigo, mensagem) { return { statusCode: codigo, payload: { status: 'erro', mensagem } }; }
function sucesso(codigo, mensagem, dados) { return { statusCode: codigo, payload: { status: 'sucesso', mensagem, dados } }; }
function obrigatorio(v, campo) { return v === undefined || v === null || String(v).trim() === '' ? `${campo} é obrigatório.` : null; }
function quantidadePositiva(v,c='quantidade'){const n=Number(v);return Number.isInteger(n)&&n>0?null:`${c} deve ser um número inteiro maior que zero.`;}
function estoqueBaixo(produto, quantidade){return Number(quantidade)<=Number(produto.estoque_minimo);}

function tipoRastreabilidade(produto) {
  const tipo = String(produto.tipo_rastreabilidade || '').toUpperCase();
  if (tipo !== 'NENHUMA') return tipo;
  const cat = String(produto.categoria || '').toUpperCase();
  if (cat === 'COMPONENTE_ELETRICO') return 'BATERIA';
  if (cat === 'VEICULO' || cat === 'BICICLETA' || cat === 'PATINETE') return 'VEICULO';
  if (cat === 'PECA_SEGURANCA') return 'PECA_SEGURANCA';
  return 'NENHUMA';
}
function validarRastreabilidade(produto, body={}) {
  const tipo = tipoRastreabilidade(produto);
  const itens = Array.isArray(body.itens_rastreaveis) ? body.itens_rastreaveis : [];
  const quantidade = Number(body.quantidade || 1);
  const dadosItem = quantidade === 1 && itens.length ? { ...body, ...itens[0] } : body;
  if (['BATERIA', 'MOTOR_CONTROLADOR', 'VEICULO'].includes(tipo) && quantidade > 1) {
    if (itens.length !== quantidade) {
      const campos = tipo === 'BATERIA' ? 'numero_serie e data_validade' : tipo === 'MOTOR_CONTROLADOR' ? 'numero_serie e lote' : 'identificador_unico';
      return `Informe ${campos} para cada um dos ${quantidade} itens.`;
    }
    const identificadores = itens.map((item) => tipo === 'VEICULO' ? String(item.identificador_unico).trim() : String(item.numero_serie).trim());
    if (new Set(identificadores).size !== identificadores.length) return 'Os identificadores de rastreabilidade não podem se repetir na mesma entrada.';
    for (const item of itens) {
      if (tipo === 'BATERIA' && (!item.numero_serie || !item.data_validade)) return 'Para baterias, cada item exige numero_serie e data_validade.';
      if (tipo === 'MOTOR_CONTROLADOR' && (!item.numero_serie || !item.lote)) return 'Para motores e controladores, cada item exige numero_serie e lote.';
      if (tipo === 'VEICULO' && !item.identificador_unico) return 'Para cada veículo, informe o ID único de rastreabilidade.';
    }
    return null;
  }
  if (tipo === 'BATERIA') {
    if (!dadosItem.numero_serie || !dadosItem.data_validade) return 'Para baterias, é obrigatório informar numero_serie e data_validade.';
  } else if (tipo === 'MOTOR_CONTROLADOR') {
    if (!dadosItem.numero_serie || !dadosItem.lote) return 'Para motores e controladores, é obrigatório informar numero_serie e lote.';
  } else if (tipo === 'VEICULO') {
    if (!dadosItem.identificador_unico) return 'Para bicicletas e patinetes, é obrigatório informar o ID único de rastreabilidade.';
  } else if (tipo === 'PECA_SEGURANCA') {
    if (!dadosItem.lote) return 'Para peças de segurança (freios e pneus), é obrigatório informar o lote.';
  }
  return null;
}
function validarEntrada(produto,b) {
  let e=obrigatorio(b.produto_id,'produto_id')||quantidadePositiva(b.quantidade); if(e)return e;
  e=obrigatorio(b.numero_nota_fiscal,'numero_nota_fiscal')||obrigatorio(b.numero_pedido_compra || b.numero_pedido,'numero_pedido_compra'); if(e)return e;
  e=validarRastreabilidade(produto,b); if(e)return e;
  return null;
}

function listarMovimentacoes(filtros = {}, page = 1, limit = 20){
  if (arguments.length === 1 && (filtros === null || filtros === undefined || typeof filtros === 'number')) {
    return repositorioEstoque.listarMovimentacoes({ produto_id: filtros }, 1, 20);
  }
  return repositorioEstoque.listarMovimentacoes(filtros || {}, Number(page) || 1, Number(limit) || 20);
}
function listarAlertas(){return repositorioEstoque.listarAlertas();}
function listarRastreabilidade(id=null){return repositorioEstoque.listarRastreabilidade(id);}

function verificarEstoqueMinimo(produto) {
  const estoqueBaixoAgora = estoqueBaixo(produto, produto.estoque_atual);
  if (estoqueBaixoAgora) {
    repositorioEstoque.adicionarAlerta({
      produto_id: Number(produto.id),
      mensagem: `Estoque baixo para ${produto.nome}`
    });
  } else {
    repositorioEstoque.fecharAlertasAbertos(produto.id);
  }
  return estoqueBaixoAgora;
}

function registrarEntrada(produtoId, quantidade, fornecedorId, usuarioId, numeroNotaFiscal, itens, body={}) {
  const produto=repositorioProduto.buscarProdutoPorId(produtoId); if(!produto)return erro(404,'Produto não encontrado.'); if(!produto.ativo)return erro(400,'Produto inativo');
  const itensRastreaveis = Array.isArray(itens) && itens.length ? itens : (Array.isArray(body.itens_rastreaveis) ? body.itens_rastreaveis : []);
  const payload={...body,produto_id:produtoId,quantidade,numero_nota_fiscal:numeroNotaFiscal,numero_pedido_compra:body.numero_pedido_compra||body.numero_pedido,itens_rastreaveis:itensRastreaveis};
  const validacao=validarEntrada(produto,payload); if(validacao)return erro(400,validacao);
  if(!fornecedorId && !body.fornecedor_id) return erro(400,'Fornecedor é obrigatório no recebimento.');
  fornecedorId=fornecedorId||body.fornecedor_id;
  if(!repositorioFornecedor.buscarFornecedorPorId(fornecedorId))return erro(400,'Fornecedor informado não existe.');
  const n=Number(quantidade), novo=Number(produto.estoque_atual)+n, agora=new Date().toISOString();
  let mov;
  try { mov = executarEmTransacao(() => {
    repositorioProduto.atualizarEstoqueProduto(produtoId,novo);
    const movimentacao=repositorioEstoque.adicionarMovimentacao({produto_id:Number(produtoId),usuario_id:usuarioId,tipo:'ENTRADA',quantidade:n,data_movimentacao:agora,numero_nota_fiscal:numeroNotaFiscal,numero_pedido:payload.numero_pedido_compra,fornecedor_id:fornecedorId,tipo_transporte:body.tipo_transporte,montado_desmontado:body.montado_desmontado,localizacao:body.localizacao||produto.localizacao_deposito,observacao:body.observacao,estoque_anterior:produto.estoque_atual,estoque_novo:novo});
    const tipo=tipoRastreabilidade(produto);
    if(tipo!=='NENHUMA') {
      const origemItens = itensRastreaveis.length ? itensRastreaveis : [body];
      const itens = tipo === 'PECA_SEGURANCA' && origemItens.length === 1 ? Array.from({ length: n }, () => origemItens[0]) : origemItens;
      for (const item of itens) repositorioEstoque.adicionarRastreabilidade({produto_id:Number(produtoId),movimentacao_id:movimentacao.id,tipo,numero_serie:item.numero_serie||null,lote:item.lote||null,data_validade:item.data_validade||null,identificador_unico:item.identificador_unico||null,localizacao:item.localizacao||body.localizacao||produto.localizacao_deposito});
    }
    return movimentacao;
  }); } catch (error) {
    if (String(error.message).includes('UNIQUE')) return erro(409, 'Número de série ou identificador único já cadastrado.');
    throw error;
  }
  verificarEstoqueMinimo({ ...produto, estoque_atual: novo });
  return sucesso(201,'Entrada registrada com sucesso.',{movimentacao_id:mov.id,produto_id:Number(produtoId),quantidade_adicionada:n,novo_estoque_total:novo});
}

function registrarSaida(produtoId,quantidade,destinatario,motivo,usuarioId,body={}) {
  const p=repositorioProduto.buscarProdutoPorId(produtoId);if(!p)return erro(404,'Produto não encontrado.');if(!p.ativo)return erro(400,'Produto inativo');
  let e=quantidadePositiva(quantidade)||obrigatorio(destinatario,'destinatario')||obrigatorio(motivo,'motivo')||obrigatorio(body.numero_pedido_venda,'numero_pedido_venda');if(e)return erro(400,e);
  const n=Number(quantidade);if(n>p.estoque_atual)return erro(400,'Estoque insuficiente para a quantidade solicitada.');
  const novo=p.estoque_atual-n, agora=new Date().toISOString();
  const tipo = tipoRastreabilidade(p);
  const disponiveis = repositorioEstoque.listarRastreabilidade(produtoId).filter((item) => item.status === 'EM_ESTOQUE');
  const idsSolicitados = Array.isArray(body.rastreabilidade_ids) ? body.rastreabilidade_ids.map(Number) : [];
  let rast;
  if (idsSolicitados.length) {
    rast = disponiveis.filter((item) => idsSolicitados.includes(Number(item.id)));
    if (tipo !== 'NENHUMA' && (idsSolicitados.length !== n || rast.length !== n)) return erro(400, `Selecione exatamente ${n} item(ns) de rastreabilidade disponíveis.`);
  } else {
    rast = [...disponiveis].sort((a, b) => {
      const validadeA = a.data_validade ? new Date(a.data_validade).getTime() : Number.POSITIVE_INFINITY;
      const validadeB = b.data_validade ? new Date(b.data_validade).getTime() : Number.POSITIVE_INFINITY;
      return validadeA - validadeB || Number(a.id) - Number(b.id);
    }).slice(0, n);
    if (tipo !== 'NENHUMA' && rast.length !== n) return erro(400, `Não há ${n} item(ns) de rastreabilidade disponível(is).`);
  }
  const mov = executarEmTransacao(() => {
    repositorioProduto.atualizarEstoqueProduto(produtoId,novo);
    const mov=repositorioEstoque.adicionarMovimentacao({produto_id:Number(produtoId),usuario_id:usuarioId,tipo:'SAIDA',quantidade:n,data_movimentacao:agora,numero_pedido_venda:body.numero_pedido_venda,destinatario,motivo,tipo_transporte:body.tipo_transporte,montado_desmontado:body.montado_desmontado,localizacao:body.localizacao,observacao:body.observacao,estoque_anterior:p.estoque_atual,estoque_novo:novo});
    for(const r of rast) db.prepare('UPDATE rastreabilidade SET status=\'SAIDA\' WHERE id=?').run(r.id);
    return mov;
  });
  const alerta=verificarEstoqueMinimo({ ...p, estoque_atual: novo });
  return sucesso(201,'Saída de estoque registrada com sucesso.',{movimentacao_id:mov.id,novo_estoque_total:novo,alerta_gerado:alerta});
}
function registrarAjusteManual(produtoId,novaQuantidade,justificativa,usuarioId){const p=repositorioProduto.buscarProdutoPorId(produtoId);if(!p)return erro(404,'Produto não encontrado.');const n=Number(novaQuantidade);if(!Number.isInteger(n)||n<0)return erro(400,'nova_quantidade deve ser um número inteiro maior ou igual a 0.');if(!justificativa||!String(justificativa).trim())return erro(400,'justificativa é obrigatória.');const antigo=p.estoque_atual;const data=new Date().toISOString();const mov=executarEmTransacao(()=>{repositorioProduto.atualizarEstoqueProduto(produtoId,n);const movimentacao=repositorioEstoque.adicionarMovimentacao({produto_id:Number(produtoId),usuario_id:usuarioId,tipo:'AJUSTE_MANUAL',quantidade:n-antigo,data_movimentacao:data,motivo:String(justificativa).trim(),observacao:`Estoque anterior: ${antigo}; novo estoque: ${n}`,estoque_anterior:antigo,estoque_novo:n});repositorioEstoque.adicionarAuditoria({produto_id:Number(produtoId),usuario_id:usuarioId,acao:'AJUSTE_MANUAL',antigo_valor:antigo,novo_valor:n,justificativa,data});return movimentacao;});const alerta=estoqueBaixo(p,n);if(alerta)repositorioEstoque.adicionarAlerta({produto_id:p.id,mensagem:`Estoque baixo para ${p.nome}`});return sucesso(201,'Ajuste manual realizado com sucesso.',{produto_id:Number(produtoId),estoque_anterior:antigo,estoque_atual:n,movimentacao_id:mov.id,log_auditoria_registrado:true,alerta_gerado:alerta});}
function registrarDevolucao(d,usuarioId){const p=repositorioProduto.buscarProdutoPorId(d.produto_id);if(!p)return erro(404,'Produto não encontrado.');let e=quantidadePositiva(d.quantidade)||obrigatorio(d.origem,'origem')||obrigatorio(d.motivo,'motivo')||obrigatorio(d.estado_produto,'estado_produto');if(e)return erro(400,e);if(d.origem==='CLIENTE'&&!d.numero_pedido_venda)return erro(400,'numero_pedido_venda é obrigatório para devolução de cliente.');const reap=d.estado_produto==='INTACTO'&&Boolean(d.reaproveitavel);const {devolucao:dev,movimentacao:mov}=executarEmTransacao(()=>{const devolucao=repositorioEstoque.adicionarDevolucao({...d,usuario_id:usuarioId,reaproveitavel:reap,data_devolucao:new Date().toISOString()});const novoEstoque=reap?p.estoque_atual+Number(d.quantidade):p.estoque_atual;if(reap)repositorioProduto.atualizarEstoqueProduto(p.id,novoEstoque);const movimentacao=repositorioEstoque.adicionarMovimentacao({produto_id:p.id,usuario_id:usuarioId,tipo:'DEVOLUCAO',quantidade:Number(d.quantidade),data_movimentacao:new Date().toISOString(),numero_pedido_venda:d.numero_pedido_venda,motivo:d.motivo,observacao:`Origem: ${d.origem}; Estado: ${d.estado_produto}`,estoque_anterior:p.estoque_atual,estoque_novo:novoEstoque});return {devolucao,movimentacao};});return sucesso(201,'Devolução registrada com sucesso.',{devolucao_id:dev.id,movimentacao_id:mov.id,reaproveitada:reap});}
function registrarAjusteManual(produtoId,novaQuantidade,justificativa,usuarioId){const p=repositorioProduto.buscarProdutoPorId(produtoId);if(!p)return erro(404,'Produto não encontrado.');const n=Number(novaQuantidade);if(!Number.isInteger(n)||n<0)return erro(400,'nova_quantidade deve ser um número inteiro maior ou igual a 0.');if(!justificativa||!String(justificativa).trim())return erro(400,'justificativa é obrigatória.');const antigo=p.estoque_atual;const data=new Date().toISOString();const mov=executarEmTransacao(()=>{repositorioProduto.atualizarEstoqueProduto(produtoId,n);return repositorioEstoque.adicionarMovimentacao({produto_id:Number(produtoId),usuario_id:usuarioId,tipo:'AJUSTE_MANUAL',quantidade:n-antigo,data_movimentacao:data,motivo:String(justificativa).trim(),observacao:`Estoque anterior: ${antigo}; novo estoque: ${n}`,estoque_anterior:antigo,estoque_novo:n});});const alerta=estoqueBaixo(p,n);if(alerta)repositorioEstoque.adicionarAlerta({produto_id:p.id,mensagem:`Estoque baixo para ${p.nome}`});return sucesso(201,'Ajuste manual realizado com sucesso.',{produto_id:Number(produtoId),estoque_anterior:antigo,estoque_atual:n,movimentacao_id:mov.id,alerta_gerado:alerta});}
function registrarDevolucao(d,usuarioId){const p=repositorioProduto.buscarProdutoPorId(d.produto_id);if(!p)return erro(404,'Produto não encontrado.');let e=quantidadePositiva(d.quantidade)||obrigatorio(d.origem,'origem')||obrigatorio(d.motivo,'motivo')||obrigatorio(d.estado_produto,'estado_produto');if(e)return erro(400,e);const origensPermitidas=['CLIENTE','PARA_FORNECEDOR'];const estadosPermitidos=['INTACTO','DANIFICADO'];if(!origensPermitidas.includes(d.origem))return erro(400,`origem deve ser um dos valores: ${origensPermitidas.join(', ')}.`);if(!estadosPermitidos.includes(d.estado_produto))return erro(400,`estado_produto deve ser um dos valores: ${estadosPermitidos.join(', ')}.`);if(d.origem==='CLIENTE'&&!d.numero_pedido_venda)return erro(400,'numero_pedido_venda é obrigatório para devolução de cliente.');const n=Number(d.quantidade), tipo=tipoRastreabilidade(p), ids=Array.isArray(d.rastreabilidade_ids)?d.rastreabilidade_ids.map(Number):[], rast=tipo==='NENHUMA'?[]:repositorioEstoque.listarRastreabilidade(p.id).filter((item)=>item.status==='EM_ESTOQUE'&&ids.includes(Number(item.id)));if(tipo!=='NENHUMA'&&(ids.length!==n||rast.length!==n))return erro(400,`Selecione exatamente ${n} item(ns) de rastreabilidade disponíveis para a devolução.`);if(d.origem==='PARA_FORNECEDOR'&&n>Number(p.estoque_atual))return erro(400,'Estoque insuficiente para a devolução ao fornecedor.');const reap=d.origem==='CLIENTE'&&d.estado_produto==='INTACTO';const delta=d.origem==='PARA_FORNECEDOR'?-n:(reap?n:0);const novoEstoque=Number(p.estoque_atual)+delta;const {devolucao:dev,movimentacao:mov}=executarEmTransacao(()=>{const agora=new Date().toISOString();const devolucao=repositorioEstoque.adicionarDevolucao({...d,usuario_id:usuarioId,reaproveitavel:reap,data_devolucao:agora});if(delta)repositorioProduto.atualizarEstoqueProduto(p.id,novoEstoque);const movimentacao=repositorioEstoque.adicionarMovimentacao({produto_id:p.id,usuario_id:usuarioId,tipo:'DEVOLUCAO',quantidade:delta,data_movimentacao:agora,numero_pedido_venda:d.numero_pedido_venda,motivo:d.motivo,observacao:`Origem: ${d.origem}; Estado: ${d.estado_produto}`,estoque_anterior:p.estoque_atual,estoque_novo:novoEstoque});const status=d.estado_produto==='DANIFICADO'?'AVARIA':d.origem==='PARA_FORNECEDOR'?'SAIDA':'EM_ESTOQUE';for(const item of rast)db.prepare('UPDATE rastreabilidade SET status=? WHERE id=?').run(status,item.id);return {devolucao,movimentacao};});return sucesso(201,'Devolução registrada com sucesso.',{devolucao_id:dev.id,movimentacao_id:mov.id,reaproveitada:reap,novo_estoque_total:novoEstoque});}
function registrarEstorno(movimentacaoId, usuarioId, motivo, observacao = '') {
  const origem = db.prepare(`SELECT m.*, p.estoque_atual AS estoque_produto_atual, p.nome AS produto_nome
    FROM movimentacoes m
    LEFT JOIN produtos p ON p.id = m.produto_id
    WHERE m.id = ?`).get(Number(movimentacaoId));

  if (!origem) return erro(404, 'Movimentação de origem não encontrada.');
  if (origem.tipo === 'ESTORNO') return erro(400, 'Não é possível estornar uma movimentação de estorno.');
  if (!motivo || !String(motivo).trim()) return erro(400, 'motivo é obrigatório para o estorno.');

  const produto = repositorioProduto.buscarProdutoPorId(origem.produto_id);
  if (!produto) return erro(404, 'Produto da movimentação não encontrado.');

  const deltaOriginal = Number(origem.quantidade || 0);
  const reversao = -deltaOriginal;
  const novoEstoque = Number(produto.estoque_atual) + reversao;

  const estorno = executarEmTransacao(() => {
    repositorioProduto.atualizarEstoqueProduto(origem.produto_id, novoEstoque);
    const movimentacao = repositorioEstoque.adicionarMovimentacao({
      produto_id: Number(origem.produto_id),
      usuario_id: Number(usuarioId),
      tipo: 'ESTORNO',
      quantidade: Math.abs(deltaOriginal),
      data_movimentacao: new Date().toISOString(),
      numero_nota_fiscal: origem.numero_nota_fiscal,
      numero_pedido: origem.numero_pedido,
      numero_pedido_venda: origem.numero_pedido_venda,
      destinatario: origem.destinatario,
      motivo: String(motivo).trim(),
      fornecedor_id: origem.fornecedor_id,
      tipo_transporte: origem.tipo_transporte,
      montado_desmontado: origem.montado_desmontado,
      localizacao: origem.localizacao,
      observacao: observacao || `Estorno da movimentação ${origem.id}.`,
      estoque_anterior: Number(produto.estoque_atual),
      estoque_novo: novoEstoque,
      movimentacao_origem_id: Number(origem.id)
    });

    db.prepare(`UPDATE rastreabilidade SET status = 'EM_ESTOQUE' WHERE movimentacao_id = ? AND status <> 'EM_ESTOQUE'`).run(Number(origem.id));
    return movimentacao;
  });

  verificarEstoqueMinimo({ ...produto, estoque_atual: novoEstoque });
  return sucesso(201, 'Estorno registrado com sucesso.', {
    movimentacao_id: estorno.id,
    movimentacao_origem_id: Number(origem.id),
    tipo: 'ESTORNO',
    produto_id: Number(origem.produto_id),
    quantidade_estornada: Math.abs(deltaOriginal),
    estoque_anterior: Number(produto.estoque_atual),
    estoque_atual: novoEstoque
  });
}
function registrarAjusteManualComAuditoria(produtoId,novaQuantidade,justificativa,usuarioId){const produto=repositorioProduto.buscarProdutoPorId(produtoId);const antigo=produto?.estoque_atual;const resultado=registrarAjusteManual(produtoId,novaQuantidade,justificativa,usuarioId);if(resultado.statusCode===201&&!resultado.payload.dados.log_auditoria_registrado){repositorioEstoque.adicionarAuditoria({produto_id:Number(produtoId),usuario_id:usuarioId,acao:'AJUSTE_MANUAL',antigo_valor:antigo,novo_valor:Number(novaQuantidade),justificativa,data:new Date().toISOString()});resultado.payload.dados.log_auditoria_registrado=true;}if(resultado.statusCode===201){const produtoAtualizado=repositorioProduto.buscarProdutoPorId(produtoId);if(produtoAtualizado)verificarEstoqueMinimo(produtoAtualizado);}return resultado;}
const registrarDevolucaoOriginal=registrarDevolucao;
function registrarDevolucaoComVerificacao(dados,usuarioId){const resultado=registrarDevolucaoOriginal(dados,usuarioId);if(resultado.statusCode===201){const produto=repositorioProduto.buscarProdutoPorId(dados.produto_id);if(produto)verificarEstoqueMinimo(produto);}return resultado;}
function obterResumo(){return repositorioEstoque.resumo();}
function obterRelatorio(filtros={}){return repositorioEstoque.relatorio(filtros);} 
function buscarPorCodigo(codigo){return db.prepare(`SELECT * FROM produtos WHERE ativo=1 AND codigo_interno=?`).get(codigo)||null;}
module.exports={listarMovimentacoes,listarAlertas,listarRastreabilidade,registrarEntrada,registrarSaida,registrarAjusteManual:registrarAjusteManualComAuditoria,registrarDevolucao:registrarDevolucaoComVerificacao,registrarEstorno,obterResumo,obterRelatorio,buscarPorCodigo,validarRastreabilidade,verificarEstoqueMinimo};
