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
    for (const statement of sql.split(/;\s*(?:\r?\n|$)/).map((parte) => parte.trim()).filter(Boolean)) {
      await pool.query(statement);
    }
  };
  await executarArquivoSql('schema.sql');
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
