const conexaoBanco = require('./conexaoBanco');
const db = conexaoBanco.getDb();

function listarMovimentacoes(produtoId = null) {
  const params = [];
  let query = `SELECT m.*, p.nome AS produto_nome, u.nome AS usuario_nome
    FROM movimentacoes m LEFT JOIN produtos p ON p.id=m.produto_id LEFT JOIN usuarios u ON u.id=m.usuario_id`;
  if (produtoId !== null && produtoId !== undefined) { query += ' WHERE m.produto_id = ?'; params.push(Number(produtoId)); }
  query += ' ORDER BY m.id DESC';
  const movimentacoes = db.prepare(query).all(...params);
  const ajustes = db.prepare(`SELECT a.*, p.nome AS produto_nome, u.nome AS usuario_nome
    FROM auditoria a LEFT JOIN produtos p ON p.id=a.produto_id LEFT JOIN usuarios u ON u.id=a.usuario_id
    WHERE a.acao = 'AJUSTE_MANUAL'${produtoId !== null && produtoId !== undefined ? ' AND a.produto_id = ?' : ''}`)
    .all(...(produtoId !== null && produtoId !== undefined ? [Number(produtoId)] : []));
  const idsDeAjustes = new Set(movimentacoes.filter(m => m.tipo === 'AJUSTE_MANUAL').map(m => `${m.produto_id}|${m.data_movimentacao}|${m.estoque_anterior}|${m.estoque_novo}`));
  for (const ajuste of ajustes) {
    const chave = `${ajuste.produto_id}|${ajuste.data}|${ajuste.antigo_valor}|${ajuste.novo_valor}`;
    if (idsDeAjustes.has(chave)) continue;
    movimentacoes.push({
      id: `auditoria-${ajuste.id}`,
      produto_id: ajuste.produto_id,
      usuario_id: ajuste.usuario_id,
      tipo: 'AJUSTE_MANUAL',
      quantidade: Number(ajuste.novo_valor) - Number(ajuste.antigo_valor),
      data_movimentacao: ajuste.data,
      motivo: ajuste.justificativa,
      observacao: `Estoque anterior: ${ajuste.antigo_valor}; novo estoque: ${ajuste.novo_valor}`,
      estoque_anterior: Number(ajuste.antigo_valor),
      estoque_novo: Number(ajuste.novo_valor),
      produto_nome: ajuste.produto_nome,
      usuario_nome: ajuste.usuario_nome
    });
  }
  return movimentacoes.sort((a, b) => new Date(b.data_movimentacao).getTime() - new Date(a.data_movimentacao).getTime());
}
function adicionarMovimentacao(m) {
  const r = db.prepare(`INSERT INTO movimentacoes
    (produto_id,usuario_id,tipo,quantidade,data_movimentacao,numero_nota_fiscal,numero_pedido,numero_pedido_venda,destinatario,motivo,fornecedor_id,tipo_transporte,montado_desmontado,localizacao,observacao,estoque_anterior,estoque_novo)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      m.produto_id,m.usuario_id,m.tipo,m.quantidade,m.data_movimentacao,m.numero_nota_fiscal??null,m.numero_pedido??null,m.numero_pedido_venda??null,
      m.destinatario??null,m.motivo??null,m.fornecedor_id??null,m.tipo_transporte??null,m.montado_desmontado??null,m.localizacao??null,m.observacao??null,m.estoque_anterior??null,m.estoque_novo??null);
  return { id:Number(r.lastInsertRowid), ...m };
}
function adicionarRastreabilidade(r) {
  const result=db.prepare(`INSERT INTO rastreabilidade
    (produto_id,movimentacao_id,tipo,numero_serie,lote,data_validade,identificador_unico,status,localizacao) VALUES (?,?,?,?,?,?,?,?,?)`).run(
      r.produto_id,r.movimentacao_id,r.tipo,r.numero_serie??null,r.lote??null,r.data_validade??null,r.identificador_unico??null,r.status??'EM_ESTOQUE',r.localizacao??null);
  return {id:Number(result.lastInsertRowid),...r};
}
function listarRastreabilidade(produtoId=null) {
  if (produtoId) return db.prepare(`SELECT r.*,p.nome AS produto_nome FROM rastreabilidade r JOIN produtos p ON p.id=r.produto_id WHERE r.produto_id=? ORDER BY r.id DESC`).all(Number(produtoId));
  return db.prepare(`SELECT r.*,p.nome AS produto_nome FROM rastreabilidade r JOIN produtos p ON p.id=r.produto_id ORDER BY r.id DESC`).all();
}
function adicionarAlerta(a){ const r=db.prepare('INSERT INTO alertas(produto_id,mensagem,lido,criado_em) VALUES(?,?,0,?)').run(a.produto_id,a.mensagem,new Date().toISOString()); return {id:Number(r.lastInsertRowid),...a,lido:false}; }
function listarAlertas(){return db.prepare(`SELECT a.*,p.nome AS produto_nome FROM alertas a LEFT JOIN produtos p ON p.id=a.produto_id ORDER BY a.id DESC`).all().map(a=>({...a,lido:Boolean(a.lido)}));}
function marcarAlertaLido(id){db.prepare('UPDATE alertas SET lido=1 WHERE id=?').run(Number(id)); return true;}
function adicionarAuditoria(r){const x=db.prepare(`INSERT INTO auditoria(produto_id,usuario_id,acao,antigo_valor,novo_valor,justificativa,data) VALUES(?,?,?,?,?,?,?)`).run(r.produto_id??null,r.usuario_id,r.acao??'AJUSTE_MANUAL',String(r.antigo_valor??''),String(r.novo_valor??''),r.justificativa??null,r.data); return {id:Number(x.lastInsertRowid),...r};}
function adicionarDevolucao(d){const r=db.prepare(`INSERT INTO devolucoes(produto_id,usuario_id,origem,motivo,estado_produto,numero_pedido_venda,reaproveitavel,quantidade,data_devolucao,status,observacao) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(d.produto_id,d.usuario_id,d.origem,d.motivo,d.estado_produto,d.numero_pedido_venda??null,d.reaproveitavel?1:0,d.quantidade,d.data_devolucao,d.status??'APROVADA',d.observacao??null);return {id:Number(r.lastInsertRowid),...d};}
function listarDevolucoes(){return db.prepare(`SELECT d.*,p.nome AS produto_nome,u.nome AS usuario_nome FROM devolucoes d LEFT JOIN produtos p ON p.id=d.produto_id LEFT JOIN usuarios u ON u.id=d.usuario_id ORDER BY d.id DESC`).all().map(d=>({...d,reaproveitavel:Boolean(d.reaproveitavel)}));}
function adicionarNotificacao(n){const r=db.prepare('INSERT INTO notificacoes(setor,titulo,mensagem,produto_id,lida,criada_em) VALUES(?,?,?,?,0,?)').run(n.setor,n.titulo,n.mensagem,n.produto_id??null,new Date().toISOString());return {id:Number(r.lastInsertRowid),...n,lida:false};}
function listarNotificacoes(setor=null){if(setor)return db.prepare('SELECT * FROM notificacoes WHERE setor=? ORDER BY id DESC').all(setor);return db.prepare('SELECT * FROM notificacoes ORDER BY id DESC').all();}
function resumo(){return db.prepare(`SELECT COUNT(*) total_produtos, COALESCE(SUM(estoque_atual*custo),0) valor_total_estoque, SUM(CASE WHEN estoque_atual<=5 THEN 1 ELSE 0 END) estoque_critico FROM produtos WHERE ativo=1`).get();}
function relatorio(){return {estoque:db.prepare(`SELECT id,nome,codigo_interno,categoria,estoque_atual,custo,localizacao_deposito,estado_montagem FROM produtos WHERE ativo=1 ORDER BY nome`).all(), movimentacoes:db.prepare(`SELECT m.*,p.nome produto_nome FROM movimentacoes m JOIN produtos p ON p.id=m.produto_id ORDER BY m.id DESC`).all(), devolucoes:listarDevolucoes(), alertas:listarAlertas()};}
module.exports={listarMovimentacoes,adicionarMovimentacao,adicionarRastreabilidade,listarRastreabilidade,adicionarAlerta,listarAlertas,marcarAlertaLido,adicionarAuditoria,adicionarDevolucao,listarDevolucoes,adicionarNotificacao,listarNotificacoes,resumo,relatorio};
