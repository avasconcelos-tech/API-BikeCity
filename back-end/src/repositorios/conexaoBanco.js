const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const nomeBanco = process.env.NODE_ENV === 'test' ? 'database.test.sqlite' : 'database.sqlite';
const caminhoBanco = path.join(__dirname, '../../', nomeBanco);
const db = new DatabaseSync(caminhoBanco);

function colunasDaTabela(tabela) {
  return db.prepare(`PRAGMA table_info(${tabela})`).all().map(c => c.name);
}

function adicionarColunaSeFaltar(tabela, coluna, definicao) {
  if (!colunasDaTabela(tabela).includes(coluna)) {
    db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
  }
}

function criarEstrutura() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      cargo TEXT,
      perfil TEXT,
      ativo INTEGER DEFAULT 1,
      tentativas_falhas INTEGER DEFAULT 0,
      bloqueado_until DATETIME
    );
    CREATE TABLE IF NOT EXISTS fornecedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cnpj TEXT,
      contato TEXT,
      ativo INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS produtos (
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
      imagem_url TEXT
    );
    CREATE TABLE IF NOT EXISTS movimentacoes (
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
      estoque_novo INTEGER
    );
    CREATE TABLE IF NOT EXISTS rastreabilidade (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      movimentacao_id INTEGER,
      tipo TEXT NOT NULL,
      numero_serie TEXT,
      lote TEXT,
      data_validade TEXT,
      identificador_unico TEXT,
      status TEXT DEFAULT 'EM_ESTOQUE',
      localizacao TEXT
    );
    CREATE TABLE IF NOT EXISTS alertas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      mensagem TEXT NOT NULL,
      lido INTEGER DEFAULT 0,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER,
      usuario_id INTEGER,
      acao TEXT,
      antigo_valor TEXT,
      novo_valor TEXT,
      justificativa TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS devolucoes (
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
      observacao TEXT
    );
    CREATE TABLE IF NOT EXISTS notificacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setor TEXT NOT NULL,
      titulo TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      produto_id INTEGER,
      lida INTEGER DEFAULT 0,
      criada_em TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migração segura para bancos antigos.
  adicionarColunaSeFaltar('produtos', 'imagem_url', 'TEXT');
  adicionarColunaSeFaltar('produtos', 'tipo_rastreabilidade', "TEXT DEFAULT 'NENHUMA'");
  adicionarColunaSeFaltar('produtos', 'demanda_prevista', 'INTEGER DEFAULT 0');
  adicionarColunaSeFaltar('produtos', 'codigo_interno', 'TEXT');
  adicionarColunaSeFaltar('movimentacoes', 'produto_id', 'INTEGER');
  adicionarColunaSeFaltar('movimentacoes', 'usuario_id', 'INTEGER');
  adicionarColunaSeFaltar('movimentacoes', 'tipo', 'TEXT');
  adicionarColunaSeFaltar('movimentacoes', 'quantidade', 'INTEGER');
  adicionarColunaSeFaltar('movimentacoes', 'data_movimentacao', 'TEXT');
  adicionarColunaSeFaltar('movimentacoes', 'numero_nota_fiscal', 'TEXT');
  adicionarColunaSeFaltar('movimentacoes', 'numero_pedido', 'TEXT');
  adicionarColunaSeFaltar('movimentacoes', 'numero_pedido_venda', 'TEXT');
  adicionarColunaSeFaltar('movimentacoes', 'destinatario', 'TEXT');
  adicionarColunaSeFaltar('movimentacoes', 'motivo', 'TEXT');
  adicionarColunaSeFaltar('movimentacoes', 'fornecedor_id', 'INTEGER');
  adicionarColunaSeFaltar('movimentacoes', 'tipo_transporte', 'TEXT');
  adicionarColunaSeFaltar('movimentacoes', 'montado_desmontado', 'TEXT');
  adicionarColunaSeFaltar('movimentacoes', 'localizacao', 'TEXT');
  adicionarColunaSeFaltar('movimentacoes', 'observacao', 'TEXT');
  adicionarColunaSeFaltar('movimentacoes', 'estoque_anterior', 'INTEGER');
  adicionarColunaSeFaltar('movimentacoes', 'estoque_novo', 'INTEGER');
  adicionarColunaSeFaltar('alertas', 'produto_id', 'INTEGER');
  adicionarColunaSeFaltar('alertas', 'mensagem', 'TEXT');
  adicionarColunaSeFaltar('alertas', 'lido', 'INTEGER DEFAULT 0');
  adicionarColunaSeFaltar('alertas', 'criado_em', 'TEXT');
  adicionarColunaSeFaltar('auditoria', 'produto_id', 'INTEGER');
  adicionarColunaSeFaltar('auditoria', 'usuario_id', 'INTEGER');
  adicionarColunaSeFaltar('auditoria', 'acao', 'TEXT');
  adicionarColunaSeFaltar('auditoria', 'antigo_valor', 'TEXT');
  adicionarColunaSeFaltar('auditoria', 'novo_valor', 'TEXT');
  adicionarColunaSeFaltar('auditoria', 'justificativa', 'TEXT');
  adicionarColunaSeFaltar('auditoria', 'data', 'TEXT');
}

function seedDadosIniciais() {
  db.prepare(`INSERT OR IGNORE INTO usuarios (id,nome,email,senha_hash,cargo,perfil,ativo,tentativas_falhas,bloqueado_until)
    VALUES (1,?,?,?,?,?,?,?,?)`).run(
    'Gerente Teste', 'gerente@teste.com', bcrypt.hashSync('senha123', 10), 'Gerente', 'GERENTE', 1, 0, null
  );
  db.prepare(`INSERT OR IGNORE INTO fornecedores (id,nome,cnpj,contato,ativo) VALUES (1,?,?,?,1)`)
    .run('Fornecedor Padrão', null, 'Contato padrão');

  const produtos = [
    [1,'Bateria X','BAT-001','COMPONENTE_ELETRICO','UN','Setor B',1,100,null,0,3,'NAO_APLICA'],
    [2,'Peça A','PEC-001','PECA_ESTRUTURAL','UN','Setor A',1,50,null,4,3,'NAO_APLICA'],
    [3,'Bicicleta City','BIKE-001','VEICULO','UN','Setor C',1,1500,null,2,1,'MONTADO'],
    [4,'Pneu de Segurança','PNEU-001','PECA_SEGURANCA','UN','Setor D',1,80,null,6,2,'NAO_APLICA']
  ];
  const stmt = db.prepare(`INSERT OR IGNORE INTO produtos
    (id,nome,codigo_interno,categoria,unidade_medida,localizacao_deposito,fornecedor_id,custo,dimensoes,estoque_atual,estoque_minimo,estado_montagem,ativo)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)`);
  for (const p of produtos) stmt.run(...p);
}

criarEstrutura();
seedDadosIniciais();

const conexaoInstancia = {
  getDb: () => db,
  resetarBancoParaTestes: () => {
    db.exec(`DELETE FROM movimentacoes; DELETE FROM rastreabilidade; DELETE FROM alertas; DELETE FROM auditoria; DELETE FROM devolucoes; DELETE FROM notificacoes; DELETE FROM produtos; DELETE FROM usuarios; DELETE FROM fornecedores;`);
    seedDadosIniciais();
  }
};

module.exports = conexaoInstancia;
