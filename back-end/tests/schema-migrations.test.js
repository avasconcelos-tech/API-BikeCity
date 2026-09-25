const test = require('node:test');
const assert = require('node:assert/strict');
const banco = require('../src/repositorios/conexaoBanco');

test.before(async () => banco.inicializarBanco());
test.after(async () => banco.fecharBanco());

test('canonical MySQL schema is installed and versioned', async () => {
  const versions = await banco.consultar('SELECT versao FROM schema_versao ORDER BY versao');
  assert.deepEqual(versions.map((row) => row.versao), [1]);

  const checks = await banco.consultar(
    `SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL`,
  );
  for (const [tabela, coluna, referenciada] of [
    ['movimentacoes', 'produto_id', 'produtos'],
    ['movimentacoes', 'usuario_id', 'usuarios'],
    ['movimentacoes', 'fornecedor_id', 'fornecedores'],
    ['movimentacoes', 'movimentacao_origem_id', 'movimentacoes'],
    ['produtos', 'fornecedor_id', 'fornecedores'],
    ['rastreabilidade', 'produto_id', 'produtos'],
    ['rastreabilidade', 'movimentacao_id', 'movimentacoes'],
  ]) {
    assert.ok(
      checks.some(
        (row) => row.TABLE_NAME === tabela && row.REFERENCED_TABLE_NAME === referenciada,
      ),
      `expected a foreign key from ${tabela}.${coluna} to ${referenciada}`,
    );
  }
});

test('foreign keys reject orphan records and preserve optional-reference behavior', async () => {
  await banco.resetarBancoParaTestes();
  await assert.rejects(
    banco.executar(
      `INSERT INTO movimentacoes (produto_id, usuario_id, tipo, quantidade, data_movimentacao)
       VALUES (9999, 1, 'SAIDA', 1, '2026-09-25T00:00:00.000Z')`,
    ),
    { code: 'ER_NO_REFERENCED_ROW_2' },
  );

  await banco.executar(
    `INSERT INTO usuarios (nome,email,senha_hash,perfil)
     VALUES ('Usuário temporário','temp-schema@test.local','hash','OPERACIONAL')`,
  );
  const [{ id: usuarioId }] = await banco.consultar(
    'SELECT id FROM usuarios WHERE email = ?',
    ['temp-schema@test.local'],
  );
  const movimento = await banco.executar(
    `INSERT INTO movimentacoes (produto_id,usuario_id,tipo,quantidade,data_movimentacao)
     VALUES (2,?,'AJUSTE_MANUAL',0,'2026-09-25T00:00:00.000Z')`,
    [usuarioId],
  );
  await banco.executar('DELETE FROM usuarios WHERE id = ?', [usuarioId]);
  const [movimentacao] = await banco.consultar(
    'SELECT usuario_id FROM movimentacoes WHERE id = ?',
    [movimento.insertId],
  );
  assert.equal(movimentacao.usuario_id, null);
});
