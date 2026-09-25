const conexaoBanco = require('./conexaoBanco');
const db = conexaoBanco.getDb();

function listarMovimentacoes(filtros = {}, page = 1, limit = 20) {
  const params = [];
  const clausulas = [];
  const produtoId = filtros.produto_id;
  const tipo = filtros.tipo;
  const usuarioId = filtros.usuario_id;
  const dataInicio = filtros.data_inicio;
  const dataFim = filtros.data_fim;
  const busca = filtros.busca;

  if (produtoId !== null && produtoId !== undefined && produtoId !== '') { clausulas.push('m.produto_id = ?'); params.push(Number(produtoId)); }
  if (tipo) { clausulas.push('UPPER(m.tipo) = ?'); params.push(String(tipo).toUpperCase()); }
  if (usuarioId !== null && usuarioId !== undefined && usuarioId !== '') { clausulas.push('m.usuario_id = ?'); params.push(Number(usuarioId)); }
  if (dataInicio) { clausulas.push('date(m.data_movimentacao) >= date(?)'); params.push(dataInicio); }
  if (dataFim) { clausulas.push('date(m.data_movimentacao) <= date(?)'); params.push(dataFim); }
  if (busca) {
    const termo = `%${String(busca).toLowerCase()}%`;
    clausulas.push(`(LOWER(COALESCE(p.nome, '')) LIKE ? OR LOWER(COALESCE(u.nome, '')) LIKE ? OR LOWER(COALESCE(m.destinatario, '')) LIKE ? OR LOWER(COALESCE(m.motivo, '')) LIKE ? OR LOWER(COALESCE(m.numero_nota_fiscal, '')) LIKE ? OR LOWER(COALESCE(m.numero_pedido_venda, '')) LIKE ?)`);
    params.push(termo, termo, termo, termo, termo, termo);
  }

  const where = clausulas.length ? ` WHERE ${clausulas.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) AS total
    FROM movimentacoes m
    LEFT JOIN produtos p ON p.id = m.produto_id
    LEFT JOIN usuarios u ON u.id = m.usuario_id ${where}`).get(...params).total;

  const pagina = Number(page) > 0 ? Number(page) : 1;
  const limite = Number(limit) > 0 ? Number(limit) : 20;
  const offset = (pagina - 1) * limite;
  const dados = db.prepare(`SELECT m.*, p.nome AS produto_nome, u.nome AS usuario_nome
    FROM movimentacoes m
    LEFT JOIN produtos p ON p.id = m.produto_id
    LEFT JOIN usuarios u ON u.id = m.usuario_id ${where}
    ORDER BY m.data_movimentacao DESC, m.id DESC LIMIT ? OFFSET ?`).all(...params, limite, offset);

  return {
    dados,
    meta: {
      page: pagina,
      limit: limite,
      total: Number(total),
      total_pages: Math.max(1, Math.ceil(Number(total) / limite))
    }
  };
}
function adicionarMovimentacao(m) {
  const colunas = db.prepare('PRAGMA table_info(movimentacoes)').all().map((coluna) => coluna.name);
  const temOrigem = colunas.includes('movimentacao_origem_id');
  const campos = [
    'produto_id', 'usuario_id', 'tipo', 'quantidade', 'data_movimentacao', 'numero_nota_fiscal', 'numero_pedido', 'numero_pedido_venda',
    'destinatario', 'motivo', 'fornecedor_id', 'tipo_transporte', 'montado_desmontado', 'localizacao', 'observacao',
    'estoque_anterior', 'estoque_novo'
  ];

  if (temOrigem) campos.push('movimentacao_origem_id');

  const placeholders = campos.map(() => '?').join(', ');
  const sql = `INSERT INTO movimentacoes (${campos.join(',')}) VALUES (${placeholders})`;
  const params = [
    m.produto_id,m.usuario_id,m.tipo,m.quantidade,m.data_movimentacao,m.numero_nota_fiscal ?? null,m.numero_pedido ?? null,m.numero_pedido_venda ?? null,
    m.destinatario ?? null,m.motivo ?? null,m.fornecedor_id ?? null,m.tipo_transporte ?? null,m.montado_desmontado ?? null,m.localizacao ?? null,m.observacao ?? null,
    m.estoque_anterior ?? null,m.estoque_novo ?? null
  ];

  if (temOrigem) params.push(m.movimentacao_origem_id ?? null);

  const r = db.prepare(sql).run(...params);
  return { id: Number(r.lastInsertRowid), ...m };
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
function buscarAlertaAberto(produtoId) {
  return db.prepare(
    'SELECT * FROM alertas WHERE produto_id = ? AND lido = 0 ORDER BY id DESC LIMIT 1'
  ).get(Number(produtoId)) || null;
}
function adicionarAlerta(a) {
  const existente = buscarAlertaAberto(a.produto_id);
  if (existente) return { ...existente, lido: false, criado: false };

  const criadoEm = new Date().toISOString();
  const resultado = conexaoBanco.executarEmTransacao(() => {
    const inserido = db.prepare(
      'INSERT INTO alertas(produto_id,mensagem,lido,criado_em) VALUES(?,?,0,?)'
    ).run(a.produto_id, a.mensagem, criadoEm);
    for (const setor of ['COMPRAS', 'LOGISTICA']) {
      db.prepare(
        'INSERT INTO notificacoes(setor,titulo,mensagem,produto_id,lida,criada_em) VALUES(?,?,?,?,0,?)'
      ).run(setor, 'Estoque baixo', a.mensagem, a.produto_id, criadoEm);
    }
    return Number(inserido.lastInsertRowid);
  });
  return { id: resultado, ...a, lido: false, criado: true };
}
function listarAlertas(){return db.prepare(`SELECT a.*,p.nome AS produto_nome FROM alertas a LEFT JOIN produtos p ON p.id=a.produto_id ORDER BY a.id DESC`).all().map(a=>({...a,lido:Boolean(a.lido)}));}
function marcarAlertaLido(id){db.prepare('UPDATE alertas SET lido=1 WHERE id=?').run(Number(id)); return true;}
function fecharAlertasAbertos(produtoId) {
  return db.prepare('UPDATE alertas SET lido = 1 WHERE produto_id = ? AND lido = 0')
    .run(Number(produtoId)).changes;
}
function adicionarAuditoria(r){const x=db.prepare(`INSERT INTO auditoria(produto_id,usuario_id,acao,antigo_valor,novo_valor,justificativa,data) VALUES(?,?,?,?,?,?,?)`).run(r.produto_id??null,r.usuario_id,r.acao??'AJUSTE_MANUAL',String(r.antigo_valor??''),String(r.novo_valor??''),r.justificativa??null,r.data); return {id:Number(x.lastInsertRowid),...r};}
function adicionarDevolucao(d){const r=db.prepare(`INSERT INTO devolucoes(produto_id,usuario_id,origem,motivo,estado_produto,numero_pedido_venda,reaproveitavel,quantidade,data_devolucao,status,observacao) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(d.produto_id,d.usuario_id,d.origem,d.motivo,d.estado_produto,d.numero_pedido_venda??null,d.reaproveitavel?1:0,d.quantidade,d.data_devolucao,d.status??'APROVADA',d.observacao??null);return {id:Number(r.lastInsertRowid),...d};}
function listarDevolucoes(){return db.prepare(`SELECT d.*,p.nome AS produto_nome,u.nome AS usuario_nome FROM devolucoes d LEFT JOIN produtos p ON p.id=d.produto_id LEFT JOIN usuarios u ON u.id=d.usuario_id ORDER BY d.id DESC`).all().map(d=>({...d,reaproveitavel:Boolean(d.reaproveitavel)}));}
function adicionarNotificacao(n){const r=db.prepare('INSERT INTO notificacoes(setor,titulo,mensagem,produto_id,lida,criada_em) VALUES(?,?,?,?,0,?)').run(n.setor,n.titulo,n.mensagem,n.produto_id??null,new Date().toISOString());return {id:Number(r.lastInsertRowid),...n,lida:false};}
function listarNotificacoes(setor=null){const query=setor?'SELECT * FROM notificacoes WHERE setor=? ORDER BY id DESC':'SELECT * FROM notificacoes ORDER BY id DESC';const notificacoes=setor?db.prepare(query).all(setor):db.prepare(query).all();return notificacoes.map(n=>({...n,lida:Boolean(n.lida)}));}
function marcarNotificacaoLida(id) {
  const resultado = db.prepare('UPDATE notificacoes SET lida = 1 WHERE id = ?').run(Number(id));
  return resultado.changes > 0;
}
function resumo(){return db.prepare(`SELECT COUNT(*) total_produtos, COALESCE(SUM(estoque_atual*custo),0) valor_total_estoque, SUM(CASE WHEN estoque_atual<=estoque_minimo THEN 1 ELSE 0 END) estoque_critico FROM produtos WHERE ativo=1`).get();}
function relatorio(filtros = {}) {
  const movimentacoes = listarMovimentacoes(filtros, filtros.page || 1, filtros.limit || 20);
  const estoque = db.prepare(`SELECT id,nome,codigo_interno,categoria,estoque_atual,estoque_minimo,custo,localizacao_deposito,estado_montagem FROM produtos WHERE ativo=1 ORDER BY nome`).all();
  const resumoGeral = resumo();
  return {
    estoque,
    movimentacoes: movimentacoes.dados,
    devolucoes: listarDevolucoes(),
    alertas: listarAlertas(),
    resumo: resumoGeral,
    meta: movimentacoes.meta
  };
}
module.exports={listarMovimentacoes,adicionarMovimentacao,adicionarRastreabilidade,listarRastreabilidade,buscarAlertaAberto,adicionarAlerta,fecharAlertasAbertos,listarAlertas,marcarAlertaLido,adicionarAuditoria,adicionarDevolucao,listarDevolucoes,adicionarNotificacao,listarNotificacoes,marcarNotificacaoLida,resumo,relatorio};
