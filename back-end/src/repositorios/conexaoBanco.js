const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const nomeBanco = process.env.NODE_ENV === 'test' ? 'database.test.sqlite' : 'database.sqlite';
const caminhoBanco = path.join(__dirname, '../../', nomeBanco);
const db = new DatabaseSync(caminhoBanco);
db.exec('PRAGMA foreign_keys = ON');

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

}

function executarMigracoes() {
  const fs = require('fs');
  const diretorioMigracoes = path.join(__dirname, 'migracoes');
  db.exec(`CREATE TABLE IF NOT EXISTS schema_versao (
    versao INTEGER PRIMARY KEY,
    nome TEXT NOT NULL,
    aplicado_em TEXT NOT NULL
  )`);
  const migracoes = fs.readdirSync(diretorioMigracoes)
    .filter((arquivo) => /^\d+_[a-z0-9_]+\.js$/.test(arquivo))
    .sort()
    .map((arquivo) => ({
      arquivo,
      versao: Number(arquivo.match(/^(\d+)_/)[1]),
      migracao: require(path.join(diretorioMigracoes, arquivo))
    }));

  let versaoAtual = Number(db.prepare('SELECT COALESCE(MAX(versao), 0) AS versao FROM schema_versao').get().versao);
  for (const { arquivo, versao, migracao } of migracoes) {
    if (versao <= versaoAtual) continue;
    if (versao !== versaoAtual + 1) {
      throw new Error(`Sequência de migrações incompleta: esperado ${versaoAtual + 1}, encontrado ${versao} (${arquivo}).`);
    }
    db.exec('BEGIN');
    try {
      migracao.up(db);
      db.prepare('INSERT INTO schema_versao (versao, nome, aplicado_em) VALUES (?, ?, ?)').run(
        versao,
        arquivo,
        new Date().toISOString()
      );
      db.exec('COMMIT');
      versaoAtual = versao;
    } catch (erro) {
      db.exec('ROLLBACK');
      throw new Error(`Falha ao aplicar migração ${arquivo}: ${erro.message}`, { cause: erro });
    }
  }
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
executarMigracoes();
if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
  seedDadosIniciais();
}

function executarEmTransacao(fn) {
  db.exec('BEGIN');
  try {
    const resultado = fn();
    db.exec('COMMIT');
    return resultado;
  } catch (erro) {
    db.exec('ROLLBACK');
    throw erro;
  }
}

const conexaoInstancia = {
  obterBanco: () => db,
  executarEmTransacao,
  resetarBancoParaTestes: () => {
    db.exec(`DELETE FROM movimentacoes; DELETE FROM rastreabilidade; DELETE FROM alertas; DELETE FROM auditoria; DELETE FROM devolucoes; DELETE FROM notificacoes; DELETE FROM produtos; DELETE FROM usuarios; DELETE FROM fornecedores;`);
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      seedDadosIniciais();
    }
  }
};

module.exports = conexaoInstancia;
