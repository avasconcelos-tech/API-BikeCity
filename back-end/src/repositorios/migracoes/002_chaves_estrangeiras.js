const tabelas = {
  usuarios: {
    colunas: [
      'id',
      'nome',
      'email',
      'senha_hash',
      'cargo',
      'perfil',
      'ativo',
      'tentativas_falhas',
      'bloqueado_until',
    ],
    definicao: `CREATE TABLE usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      cargo TEXT,
      perfil TEXT,
      ativo INTEGER DEFAULT 1,
      tentativas_falhas INTEGER DEFAULT 0,
      bloqueado_until DATETIME
    )`,
  },
  fornecedores: {
    colunas: ['id', 'nome', 'cnpj', 'contato', 'ativo'],
    definicao: `CREATE TABLE fornecedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cnpj TEXT,
      contato TEXT,
      ativo INTEGER DEFAULT 1
    )`,
  },
  produtos: {
    colunas: [
      'id',
      'nome',
      'codigo_interno',
      'categoria',
      'unidade_medida',
      'localizacao_deposito',
      'fornecedor_id',
      'custo',
      'dimensoes',
      'estoque_atual',
      'estoque_minimo',
      'estado_montagem',
      'ativo',
      'imagem_url',
      'tipo_rastreabilidade',
      'demanda_prevista',
    ],
    definicao: `CREATE TABLE produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      codigo_interno TEXT UNIQUE,
      categoria TEXT,
      unidade_medida TEXT,
      localizacao_deposito TEXT,
      fornecedor_id INTEGER,
      custo REAL DEFAULT 0,
      dimensoes TEXT,
      estoque_atual INTEGER DEFAULT 0,
      estoque_minimo INTEGER DEFAULT 0,
      estado_montagem TEXT,
      ativo INTEGER DEFAULT 1,
      imagem_url TEXT,
      tipo_rastreabilidade TEXT DEFAULT 'NENHUMA',
      demanda_prevista INTEGER DEFAULT 0,
      FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL
    )`,
  },
  movimentacoes: {
    colunas: [
      'id',
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
    ],
    definicao: `CREATE TABLE movimentacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      usuario_id INTEGER,
      tipo TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      data_movimentacao TEXT NOT NULL,
      numero_nota_fiscal TEXT,
      numero_pedido TEXT,
      numero_pedido_venda TEXT,
      destinatario TEXT,
      motivo TEXT,
      fornecedor_id INTEGER,
      tipo_transporte TEXT,
      montado_desmontado TEXT,
      localizacao TEXT,
      observacao TEXT,
      estoque_anterior INTEGER,
      estoque_novo INTEGER,
      movimentacao_origem_id INTEGER,
      FOREIGN KEY (produto_id) REFERENCES produtos(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
      FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL,
      FOREIGN KEY (movimentacao_origem_id) REFERENCES movimentacoes(id) ON DELETE SET NULL
    )`,
  },
  rastreabilidade: {
    colunas: [
      'id',
      'produto_id',
      'movimentacao_id',
      'tipo',
      'numero_serie',
      'lote',
      'data_validade',
      'identificador_unico',
      'status',
      'localizacao',
    ],
    definicao: `CREATE TABLE rastreabilidade (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      movimentacao_id INTEGER,
      tipo TEXT NOT NULL,
      numero_serie TEXT,
      lote TEXT,
      data_validade TEXT,
      identificador_unico TEXT,
      status TEXT DEFAULT 'EM_ESTOQUE',
      localizacao TEXT,
      FOREIGN KEY (produto_id) REFERENCES produtos(id),
      FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes(id) ON DELETE SET NULL
    )`,
  },
  alertas: {
    colunas: ['id', 'produto_id', 'mensagem', 'lido', 'criado_em'],
    definicao: `CREATE TABLE alertas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      mensagem TEXT NOT NULL,
      lido INTEGER DEFAULT 0,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    )`,
  },
  auditoria: {
    colunas: [
      'id',
      'produto_id',
      'usuario_id',
      'acao',
      'antigo_valor',
      'novo_valor',
      'justificativa',
      'data',
    ],
    definicao: `CREATE TABLE auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER,
      usuario_id INTEGER,
      acao TEXT,
      antigo_valor TEXT,
      novo_valor TEXT,
      justificativa TEXT,
      data TEXT NOT NULL,
      FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    )`,
  },
  devolucoes: {
    colunas: [
      'id',
      'produto_id',
      'usuario_id',
      'origem',
      'motivo',
      'estado_produto',
      'numero_pedido_venda',
      'reaproveitavel',
      'quantidade',
      'data_devolucao',
      'status',
      'observacao',
    ],
    definicao: `CREATE TABLE devolucoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      usuario_id INTEGER,
      origem TEXT NOT NULL,
      motivo TEXT NOT NULL,
      estado_produto TEXT NOT NULL,
      numero_pedido_venda TEXT,
      reaproveitavel INTEGER DEFAULT 0,
      quantidade INTEGER NOT NULL,
      data_devolucao TEXT NOT NULL,
      status TEXT DEFAULT 'APROVADA',
      observacao TEXT,
      FOREIGN KEY (produto_id) REFERENCES produtos(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    )`,
  },
  notificacoes: {
    colunas: ['id', 'setor', 'titulo', 'mensagem', 'produto_id', 'lida', 'criada_em'],
    definicao: `CREATE TABLE notificacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setor TEXT NOT NULL,
      titulo TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      produto_id INTEGER,
      lida INTEGER DEFAULT 0,
      criada_em TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL
    )`,
  },
};

const ordemDescarte = [
  'rastreabilidade',
  'alertas',
  'auditoria',
  'devolucoes',
  'notificacoes',
  'movimentacoes',
  'produtos',
  'usuarios',
  'fornecedores',
];
const ordemCriacao = [
  'usuarios',
  'fornecedores',
  'produtos',
  'movimentacoes',
  'rastreabilidade',
  'alertas',
  'auditoria',
  'devolucoes',
  'notificacoes',
];

function verificarColunasDesconhecidas(db) {
  for (const [tabela, { colunas }] of Object.entries(tabelas)) {
    const existentes = db
      .prepare(`PRAGMA table_info(${tabela})`)
      .all()
      .map((coluna) => coluna.name);
    const desconhecidas = existentes.filter((coluna) => !colunas.includes(coluna));
    if (desconhecidas.length) {
      throw new Error(
        `A tabela ${tabela} contém colunas sem mapeamento de migração: ${desconhecidas.join(', ')}.`,
      );
    }
  }
}

function verificarRegistrosOrfaos(db) {
  const referencias = [
    ['produtos', 'fornecedor_id', 'fornecedores'],
    ['movimentacoes', 'produto_id', 'produtos'],
    ['movimentacoes', 'usuario_id', 'usuarios'],
    ['movimentacoes', 'fornecedor_id', 'fornecedores'],
    ['movimentacoes', 'movimentacao_origem_id', 'movimentacoes'],
    ['rastreabilidade', 'produto_id', 'produtos'],
    ['rastreabilidade', 'movimentacao_id', 'movimentacoes'],
    ['alertas', 'produto_id', 'produtos'],
    ['auditoria', 'produto_id', 'produtos'],
    ['auditoria', 'usuario_id', 'usuarios'],
    ['devolucoes', 'produto_id', 'produtos'],
    ['devolucoes', 'usuario_id', 'usuarios'],
    ['notificacoes', 'produto_id', 'produtos'],
  ];
  const problemas = [];

  for (const [tabela, coluna, referenciada] of referencias) {
    const registros = db
      .prepare(
        `
      SELECT origem.id AS id, origem.${coluna} AS referencia
      FROM ${tabela} AS origem
      LEFT JOIN ${referenciada} AS destino ON destino.id = origem.${coluna}
      WHERE origem.${coluna} IS NOT NULL AND destino.id IS NULL
      LIMIT 5
    `,
      )
      .all();
    if (registros.length) {
      problemas.push(
        `${tabela}.${coluna}: ${registros.map((registro) => `${registro.id}->${registro.referencia}`).join(', ')}`,
      );
    }
  }

  if (problemas.length) {
    throw new Error(
      `Registros órfãos impedem a migração de chaves estrangeiras: ${problemas.join('; ')}.`,
    );
  }
}

function up(db) {
  verificarColunasDesconhecidas(db);
  verificarRegistrosOrfaos(db);
  db.exec('PRAGMA defer_foreign_keys = ON');
  const sequencias = db
    .prepare(
      `SELECT name, seq FROM sqlite_sequence WHERE name IN (${ordemCriacao.map(() => '?').join(', ')})`,
    )
    .all(...ordemCriacao);

  for (const tabela of ordemCriacao) {
    db.exec(`CREATE TEMP TABLE backup_${tabela} AS SELECT * FROM ${tabela}`);
  }
  for (const tabela of ordemDescarte) {
    db.exec(`DROP TABLE ${tabela}`);
  }
  for (const tabela of ordemCriacao) {
    db.exec(tabelas[tabela].definicao);
    const colunas = tabelas[tabela].colunas.join(', ');
    db.exec(`INSERT INTO ${tabela} (${colunas}) SELECT ${colunas} FROM backup_${tabela}`);
  }
  for (const tabela of ordemCriacao) {
    db.exec(`DROP TABLE backup_${tabela}`);
  }
  for (const { name, seq } of sequencias) {
    const existente = db.prepare('SELECT seq FROM sqlite_sequence WHERE name = ?').get(name);
    if (existente) {
      db.prepare('UPDATE sqlite_sequence SET seq = ? WHERE name = ?').run(
        Math.max(Number(seq), Number(existente.seq)),
        name,
      );
    } else {
      db.prepare('INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)').run(name, seq);
    }
  }

  db.exec(`CREATE UNIQUE INDEX idx_alertas_produto_aberto
    ON alertas(produto_id) WHERE lido = 0`);
  db.exec(`CREATE UNIQUE INDEX idx_fornecedores_cnpj
    ON fornecedores(cnpj) WHERE cnpj IS NOT NULL`);
  db.exec(`CREATE UNIQUE INDEX idx_rastreabilidade_numero_serie
    ON rastreabilidade(numero_serie)
    WHERE numero_serie IS NOT NULL AND TRIM(numero_serie) <> ''`);
  db.exec(`CREATE UNIQUE INDEX idx_rastreabilidade_identificador_unico
    ON rastreabilidade(identificador_unico)
    WHERE identificador_unico IS NOT NULL AND TRIM(identificador_unico) <> ''`);

  const violacoes = db.prepare('PRAGMA foreign_key_check').all();
  if (violacoes.length) {
    throw new Error(
      `A validação de chaves estrangeiras encontrou ${violacoes.length} violação(ões).`,
    );
  }
}

module.exports = { up };
