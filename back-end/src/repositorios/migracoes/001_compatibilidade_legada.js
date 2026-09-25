function adicionarColunaSeFaltar(db, tabela, coluna, definicao) {
  const colunas = db.prepare(`PRAGMA table_info(${tabela})`).all().map((colunaTabela) => colunaTabela.name);
  if (!colunas.includes(coluna)) {
    db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
  }
}

function normalizarCnpjsFornecedores(db) {
  const fornecedores = db.prepare(
    'SELECT id, cnpj FROM fornecedores WHERE cnpj IS NOT NULL ORDER BY id'
  ).all();
  const cnpjsEncontrados = new Set();
  const atualizarCnpj = db.prepare('UPDATE fornecedores SET cnpj = ? WHERE id = ?');

  for (const fornecedor of fornecedores) {
    const cnpj = String(fornecedor.cnpj).replace(/[./-]/g, '').toUpperCase();
    if (!cnpj || cnpjsEncontrados.has(cnpj)) {
      atualizarCnpj.run(null, fornecedor.id);
      continue;
    }
    cnpjsEncontrados.add(cnpj);
    if (cnpj !== fornecedor.cnpj) atualizarCnpj.run(cnpj, fornecedor.id);
  }
}

function corrigirProdutosComColunasTrocadas(db) {
  db.prepare(`
    UPDATE produtos
    SET dimensoes = NULL,
        estado_montagem = dimensoes,
        tipo_rastreabilidade = estado_montagem,
        demanda_prevista = CAST(tipo_rastreabilidade AS INTEGER)
    WHERE demanda_prevista IS NULL
      AND tipo_rastreabilidade GLOB '[0-9]*'
      AND estado_montagem IN ('NENHUMA', 'BATERIA', 'MOTOR_CONTROLADOR', 'VEICULO', 'PECA_SEGURANCA')
      AND dimensoes IN ('NAO_APLICA', 'MONTADO', 'DESMONTADO')
  `).run();
}

function up(db) {
  for (const [tabela, coluna, definicao] of [
    ['produtos', 'imagem_url', 'TEXT'],
    ['produtos', 'tipo_rastreabilidade', "TEXT DEFAULT 'NENHUMA'"],
    ['produtos', 'demanda_prevista', 'INTEGER DEFAULT 0'],
    ['produtos', 'codigo_interno', 'TEXT'],
    ['movimentacoes', 'produto_id', 'INTEGER'],
    ['movimentacoes', 'usuario_id', 'INTEGER'],
    ['movimentacoes', 'tipo', 'TEXT'],
    ['movimentacoes', 'quantidade', 'INTEGER'],
    ['movimentacoes', 'data_movimentacao', 'TEXT'],
    ['movimentacoes', 'numero_nota_fiscal', 'TEXT'],
    ['movimentacoes', 'numero_pedido', 'TEXT'],
    ['movimentacoes', 'numero_pedido_venda', 'TEXT'],
    ['movimentacoes', 'destinatario', 'TEXT'],
    ['movimentacoes', 'motivo', 'TEXT'],
    ['movimentacoes', 'fornecedor_id', 'INTEGER'],
    ['movimentacoes', 'tipo_transporte', 'TEXT'],
    ['movimentacoes', 'montado_desmontado', 'TEXT'],
    ['movimentacoes', 'localizacao', 'TEXT'],
    ['movimentacoes', 'observacao', 'TEXT'],
    ['movimentacoes', 'estoque_anterior', 'INTEGER'],
    ['movimentacoes', 'estoque_novo', 'INTEGER'],
    ['movimentacoes', 'movimentacao_origem_id', 'INTEGER'],
    ['alertas', 'produto_id', 'INTEGER'],
    ['alertas', 'mensagem', 'TEXT'],
    ['alertas', 'lido', 'INTEGER DEFAULT 0'],
    ['alertas', 'criado_em', 'TEXT'],
    ['auditoria', 'produto_id', 'INTEGER'],
    ['auditoria', 'usuario_id', 'INTEGER'],
    ['auditoria', 'acao', 'TEXT'],
    ['auditoria', 'antigo_valor', 'TEXT'],
    ['auditoria', 'novo_valor', 'TEXT'],
    ['auditoria', 'justificativa', 'TEXT'],
    ['auditoria', 'data', 'TEXT']
  ]) {
    adicionarColunaSeFaltar(db, tabela, coluna, definicao);
  }

  db.exec(`UPDATE alertas SET lido = 1
    WHERE lido = 0
      AND id NOT IN (
        SELECT MAX(id) FROM alertas WHERE lido = 0 GROUP BY produto_id
      )`);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_alertas_produto_aberto
    ON alertas(produto_id) WHERE lido = 0`);

  normalizarCnpjsFornecedores(db);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_fornecedores_cnpj
    ON fornecedores(cnpj) WHERE cnpj IS NOT NULL`);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_rastreabilidade_numero_serie
    ON rastreabilidade(numero_serie)
    WHERE numero_serie IS NOT NULL AND TRIM(numero_serie) <> ''`);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_rastreabilidade_identificador_unico
    ON rastreabilidade(identificador_unico)
    WHERE identificador_unico IS NOT NULL AND TRIM(identificador_unico) <> ''`);
  corrigirProdutosComColunasTrocadas(db);
}

module.exports = { up };
