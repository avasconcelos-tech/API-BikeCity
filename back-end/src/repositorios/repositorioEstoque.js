const banco = require('./conexaoBanco');

async function listarMovimentacoes(filtros = {}, page = 1, limit = 20) {
  const params = [];
  const clausulas = [];
  const { produto_id: produtoId, tipo, usuario_id: usuarioId, data_inicio: inicio, data_fim: fim, busca } = filtros;
  if (produtoId !== null && produtoId !== undefined && produtoId !== '') {
    clausulas.push('m.produto_id = ?');
    params.push(Number(produtoId));
  }
  if (tipo) {
    clausulas.push('UPPER(m.tipo) = ?');
    params.push(String(tipo).toUpperCase());
  }
  if (usuarioId !== null && usuarioId !== undefined && usuarioId !== '') {
    clausulas.push('m.usuario_id = ?');
    params.push(Number(usuarioId));
  }
  if (inicio) {
    clausulas.push('DATE(m.data_movimentacao) >= DATE(?)');
    params.push(inicio);
  }
  if (fim) {
    clausulas.push('DATE(m.data_movimentacao) <= DATE(?)');
    params.push(fim);
  }
  if (busca) {
    const termo = `%${String(busca).toLowerCase()}%`;
    clausulas.push(
      `(LOWER(COALESCE(p.nome, '')) LIKE ? OR LOWER(COALESCE(u.nome, '')) LIKE ? OR LOWER(COALESCE(m.destinatario, '')) LIKE ? OR LOWER(COALESCE(m.motivo, '')) LIKE ? OR LOWER(COALESCE(m.numero_nota_fiscal, '')) LIKE ? OR LOWER(COALESCE(m.numero_pedido_venda, '')) LIKE ?)`,
    );
    params.push(termo, termo, termo, termo, termo, termo);
  }
  const where = clausulas.length ? ` WHERE ${clausulas.join(' AND ')}` : '';
  const [contagem] = await banco.consultar(
    `SELECT COUNT(*) AS total
     FROM movimentacoes m
     LEFT JOIN produtos p ON p.id = m.produto_id
     LEFT JOIN usuarios u ON u.id = m.usuario_id${where}`,
    params,
  );
  const pagina = Number(page) > 0 ? Number(page) : 1;
  const limite = Number(limit) > 0 ? Number(limit) : 20;
  const offset = (pagina - 1) * limite;
  const dados = await banco.consultar(
    `SELECT m.*, p.nome AS produto_nome, u.nome AS usuario_nome
     FROM movimentacoes m
     LEFT JOIN produtos p ON p.id = m.produto_id
     LEFT JOIN usuarios u ON u.id = m.usuario_id${where}
     ORDER BY m.data_movimentacao DESC, m.id DESC LIMIT ? OFFSET ?`,
    [...params, limite, offset],
  );
  return {
    dados,
    meta: {
      page: pagina,
      limit: limite,
      total: Number(contagem.total),
      total_pages: Math.max(1, Math.ceil(Number(contagem.total) / limite)),
    },
  };
}

async function adicionarMovimentacao(m) {
  const campos = [
    'produto_id',
    'usuario_id',
    'tipo',
    'quantidade',
    'data_movimentacao',
    'numero_nota_fiscal',
    'numero_pedido',
    'numero_pedido_venda',
    'destinatario',
    'motivo',
    'fornecedor_id',
    'tipo_transporte',
    'montado_desmontado',
    'localizacao',
    'observacao',
    'estoque_anterior',
    'estoque_novo',
    'movimentacao_origem_id',
  ];
  const valores = [
    m.produto_id,
    m.usuario_id,
    m.tipo,
    m.quantidade,
    m.data_movimentacao,
    m.numero_nota_fiscal ?? null,
    m.numero_pedido ?? null,
    m.numero_pedido_venda ?? null,
    m.destinatario ?? null,
    m.motivo ?? null,
    m.fornecedor_id ?? null,
    m.tipo_transporte ?? null,
    m.montado_desmontado ?? null,
    m.localizacao ?? null,
    m.observacao ?? null,
    m.estoque_anterior ?? null,
    m.estoque_novo ?? null,
    m.movimentacao_origem_id ?? null,
  ];
  const placeholders = campos.map(() => '?').join(', ');
  const resultado = await banco.executar(
    `INSERT INTO movimentacoes (${campos.join(',')}) VALUES (${placeholders})`,
    valores,
  );
  return { id: resultado.insertId, ...m };
}

async function buscarMovimentacaoPorId(id) {
  const [movimentacao] = await banco.consultar('SELECT * FROM movimentacoes WHERE id = ?', [
    Number(id),
  ]);
  return movimentacao || null;
}

async function adicionarRastreabilidade(r) {
  const resultado = await banco.executar(
    `INSERT INTO rastreabilidade
     (produto_id,movimentacao_id,tipo,numero_serie,lote,data_validade,identificador_unico,status,localizacao)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      r.produto_id,
      r.movimentacao_id,
      r.tipo,
      r.numero_serie ?? null,
      r.lote ?? null,
      r.data_validade ?? null,
      r.identificador_unico ?? null,
      r.status ?? 'EM_ESTOQUE',
      r.localizacao ?? null,
    ],
  );
  return { id: resultado.insertId, ...r };
}

async function listarRastreabilidade(produtoId = null) {
  const filtro = produtoId ? ' WHERE r.produto_id = ?' : '';
  return banco.consultar(
    `SELECT r.*,p.nome AS produto_nome
     FROM rastreabilidade r JOIN produtos p ON p.id = r.produto_id${filtro}
     ORDER BY r.id DESC`,
    produtoId ? [Number(produtoId)] : [],
  );
}

async function atualizarStatusRastreabilidadePorIds(ids, status) {
  if (!ids.length) return 0;
  const placeholders = ids.map(() => '?').join(', ');
  const resultado = await banco.executar(
    `UPDATE rastreabilidade SET status = ? WHERE id IN (${placeholders})`,
    [status, ...ids.map(Number)],
  );
  return resultado.affectedRows;
}

async function atualizarStatusRastreabilidadePorMovimentacao(movimentacaoId, status) {
  const resultado = await banco.executar(
    'UPDATE rastreabilidade SET status = ? WHERE movimentacao_id = ? AND status <> ?',
    [status, Number(movimentacaoId), status],
  );
  return resultado.affectedRows;
}

async function buscarAlertaAberto(produtoId) {
  const [alerta] = await banco.consultar(
    'SELECT * FROM alertas WHERE produto_id = ? AND lido = 0 ORDER BY id DESC LIMIT 1',
    [Number(produtoId)],
  );
  return alerta || null;
}

async function adicionarAlerta(a) {
  return banco.executarEmTransacao(async () => {
    const existente = await buscarAlertaAberto(a.produto_id);
    if (existente) return { ...existente, lido: false, criado: false };

    const criadoEm = new Date().toISOString();
    const inserido = await banco.executar(
      'INSERT INTO alertas(produto_id,mensagem,lido,criado_em) VALUES(?,?,0,?)',
      [a.produto_id, a.mensagem, criadoEm],
    );
    for (const setor of ['COMPRAS', 'LOGISTICA']) {
      await banco.executar(
        'INSERT INTO notificacoes(setor,titulo,mensagem,produto_id,lida,criada_em) VALUES(?,?,?,?,0,?)',
        [setor, 'Estoque baixo', a.mensagem, a.produto_id, criadoEm],
      );
    }
    return { id: inserido.insertId, ...a, lido: false, criado: true };
  });
}

async function listarAlertas() {
  const alertas = await banco.consultar(
    `SELECT a.*,p.nome AS produto_nome
     FROM alertas a LEFT JOIN produtos p ON p.id = a.produto_id ORDER BY a.id DESC`,
  );
  return alertas.map((a) => ({ ...a, lido: Boolean(a.lido) }));
}

async function marcarAlertaLido(id) {
  await banco.executar('UPDATE alertas SET lido = 1 WHERE id = ?', [Number(id)]);
  return true;
}

async function fecharAlertasAbertos(produtoId) {
  const resultado = await banco.executar(
    'UPDATE alertas SET lido = 1 WHERE produto_id = ? AND lido = 0',
    [Number(produtoId)],
  );
  return resultado.affectedRows;
}

async function adicionarAuditoria(r) {
  const resultado = await banco.executar(
    `INSERT INTO auditoria(produto_id,usuario_id,acao,antigo_valor,novo_valor,justificativa,data)
     VALUES(?,?,?,?,?,?,?)`,
    [
      r.produto_id ?? null,
      r.usuario_id,
      r.acao ?? 'AJUSTE_MANUAL',
      String(r.antigo_valor ?? ''),
      String(r.novo_valor ?? ''),
      r.justificativa ?? null,
      r.data,
    ],
  );
  return { id: resultado.insertId, ...r };
}

async function adicionarDevolucao(d) {
  const resultado = await banco.executar(
    `INSERT INTO devolucoes(produto_id,usuario_id,origem,motivo,estado_produto,numero_pedido_venda,reaproveitavel,quantidade,data_devolucao,status,observacao)
     VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
    [
      d.produto_id,
      d.usuario_id,
      d.origem,
      d.motivo,
      d.estado_produto,
      d.numero_pedido_venda ?? null,
      d.reaproveitavel ? 1 : 0,
      d.quantidade,
      d.data_devolucao,
      d.status ?? 'APROVADA',
      d.observacao ?? null,
    ],
  );
  return { id: resultado.insertId, ...d };
}

async function listarDevolucoes() {
  const devolucoes = await banco.consultar(
    `SELECT d.*,p.nome AS produto_nome,u.nome AS usuario_nome
     FROM devolucoes d
     LEFT JOIN produtos p ON p.id = d.produto_id
     LEFT JOIN usuarios u ON u.id = d.usuario_id ORDER BY d.id DESC`,
  );
  return devolucoes.map((d) => ({ ...d, reaproveitavel: Boolean(d.reaproveitavel) }));
}

async function adicionarNotificacao(n) {
  const resultado = await banco.executar(
    'INSERT INTO notificacoes(setor,titulo,mensagem,produto_id,lida,criada_em) VALUES(?,?,?,?,0,?)',
    [n.setor, n.titulo, n.mensagem, n.produto_id ?? null, new Date().toISOString()],
  );
  return { id: resultado.insertId, ...n, lida: false };
}

async function listarNotificacoes(setor = null) {
  const notificacoes = setor
    ? await banco.consultar('SELECT * FROM notificacoes WHERE setor = ? ORDER BY id DESC', [setor])
    : await banco.consultar('SELECT * FROM notificacoes ORDER BY id DESC');
  return notificacoes.map((n) => ({ ...n, lida: Boolean(n.lida) }));
}

async function marcarNotificacaoLida(id) {
  const resultado = await banco.executar('UPDATE notificacoes SET lida = 1 WHERE id = ?', [
    Number(id),
  ]);
  return resultado.affectedRows > 0;
}

async function resumo() {
  const [resultado] = await banco.consultar(
    `SELECT COUNT(*) total_produtos,
       COALESCE(SUM(estoque_atual * custo), 0) valor_total_estoque,
       SUM(CASE WHEN estoque_atual <= estoque_minimo THEN 1 ELSE 0 END) estoque_critico
     FROM produtos WHERE ativo = 1`,
  );
  return resultado;
}

async function relatorio(filtros = {}) {
  const movimentacoes = await listarMovimentacoes(
    filtros,
    filtros.page || 1,
    filtros.limit || 20,
  );
  const [estoque, devolucoes, alertas, resumoGeral] = await Promise.all([
    banco.consultar(
      `SELECT id,nome,codigo_interno,categoria,estoque_atual,estoque_minimo,custo,localizacao_deposito,estado_montagem
       FROM produtos WHERE ativo = 1 ORDER BY nome`,
    ),
    listarDevolucoes(),
    listarAlertas(),
    resumo(),
  ]);
  return {
    estoque,
    movimentacoes: movimentacoes.dados,
    devolucoes,
    alertas,
    resumo: resumoGeral,
    meta: movimentacoes.meta,
  };
}

module.exports = {
  listarMovimentacoes,
  adicionarMovimentacao,
  buscarMovimentacaoPorId,
  adicionarRastreabilidade,
  listarRastreabilidade,
  atualizarStatusRastreabilidadePorIds,
  atualizarStatusRastreabilidadePorMovimentacao,
  buscarAlertaAberto,
  adicionarAlerta,
  fecharAlertasAbertos,
  listarAlertas,
  marcarAlertaLido,
  adicionarAuditoria,
  adicionarDevolucao,
  listarDevolucoes,
  adicionarNotificacao,
  listarNotificacoes,
  marcarNotificacaoLida,
  resumo,
  relatorio,
};
