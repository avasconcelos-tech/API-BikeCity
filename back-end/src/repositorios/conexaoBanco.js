require('dotenv').config();

const { createPool } = require('mysql2/promise');
const { AsyncLocalStorage } = require('node:async_hooks');
const fs = require('node:fs/promises');
const path = require('node:path');

const transacaoAtual = new AsyncLocalStorage();
const pool = createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bikecity',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  decimalNumbers: true,
  dateStrings: true,
});

async function inicializarBanco() {
  const executarArquivoSql = async (arquivo) => {
    const sql = await fs.readFile(path.join(__dirname, '../../sql', arquivo), 'utf8');
    for (const statement of sql
      .split(/;\s*(?:\r?\n|$)/)
      .map((parte) => parte.trim())
      .filter(Boolean)) {
      await pool.query(statement);
    }
  };
  await executarArquivoSql('schema.sql');
  const [colunasDevolucoes] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devolucoes'`,
  );
  if (!colunasDevolucoes.some((coluna) => coluna.COLUMN_NAME === 'nao_vendido')) {
    await pool.query(
      'ALTER TABLE devolucoes ADD COLUMN nao_vendido TINYINT(1) NOT NULL DEFAULT 0 AFTER reaproveitavel',
    );
  }
  await pool.query(
    `INSERT IGNORE INTO pedidos_venda (numero_pedido_venda)
     SELECT DISTINCT numero_pedido_venda
     FROM movimentacoes
     WHERE tipo = 'SAIDA' AND numero_pedido_venda IS NOT NULL AND TRIM(numero_pedido_venda) <> ''`,
  );
  if (!['test', 'development'].includes(process.env.NODE_ENV)) return;
  await executarArquivoSql('seed.sql');
}

async function executarEmTransacao(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const resultado = await transacaoAtual.run(connection, callback);
    await connection.commit();
    return resultado;
  } catch (erro) {
    await connection.rollback();
    throw erro;
  } finally {
    connection.release();
  }
}

function normalizarParametro(valor) {
  if (typeof valor !== 'string') return valor;
  return valor.replace(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/,
    (_, data, hora, milissegundos = '000') => `${data} ${hora}.${milissegundos.padEnd(3, '0')}`,
  );
}

function normalizarParametros(parametros) {
  return parametros.map(normalizarParametro);
}

async function consultar(sql, parametros = []) {
  const executor = transacaoAtual.getStore() || pool;
  const [linhas] = await executor.query(sql, normalizarParametros(parametros));
  return linhas;
}

async function executar(sql, parametros = []) {
  const executor = transacaoAtual.getStore() || pool;
  const [resultado] = await executor.execute(sql, normalizarParametros(parametros));
  return resultado;
}

async function resetarBancoParaTestes() {
  await executarEmTransacao(async () => {
    for (const tabela of [
      'rastreabilidade',
      'movimentacoes',
      'alertas',
      'auditoria',
      'devolucoes',
      'pedidos_venda',
      'notificacoes',
      'produtos',
      'usuarios',
      'fornecedores',
    ]) {
      await executar(`DELETE FROM ${tabela}`);
    }
  });
  await inicializarBanco();
}

module.exports = {
  consultar,
  executar,
  executarEmTransacao,
  inicializarBanco,
  resetarBancoParaTestes,
  fecharBanco: () => pool.end(),
};
