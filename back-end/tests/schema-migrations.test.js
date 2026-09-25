process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const conexaoBanco = require('../src/repositorios/conexaoBanco');

const db = conexaoBanco.obterBanco();

test('schema versionada aplica migrações e ativa integridade referencial', () => {
  assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  assert.deepEqual(
    db.prepare('SELECT versao FROM schema_versao ORDER BY versao').all().map((row) => row.versao),
    [1, 2]
  );

  const fksMovimentacao = db.prepare('PRAGMA foreign_key_list(movimentacoes)').all();
  assert.ok(fksMovimentacao.some((fk) => fk.from === 'produto_id' && fk.table === 'produtos'));
  assert.ok(fksMovimentacao.some((fk) => fk.from === 'usuario_id' && fk.table === 'usuarios'));
  assert.ok(fksMovimentacao.some((fk) => fk.from === 'fornecedor_id' && fk.table === 'fornecedores'));
  assert.ok(fksMovimentacao.some((fk) => fk.from === 'movimentacao_origem_id' && fk.table === 'movimentacoes'));
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('banco rejeita referências inexistentes em movimentação, produto e rastreabilidade', () => {
  conexaoBanco.resetarBancoParaTestes();

  assert.throws(() => db.prepare(`
    INSERT INTO movimentacoes (produto_id, usuario_id, tipo, quantidade, data_movimentacao)
    VALUES (9999, 1, 'SAIDA', 1, '2026-09-25T00:00:00.000Z')
  `).run(), /FOREIGN KEY constraint failed/);

  assert.throws(() => db.prepare(`
    INSERT INTO movimentacoes (produto_id, usuario_id, tipo, quantidade, data_movimentacao)
    VALUES (2, 9999, 'SAIDA', 1, '2026-09-25T00:00:00.000Z')
  `).run(), /FOREIGN KEY constraint failed/);

  assert.throws(() => db.prepare(`
    INSERT INTO produtos (nome, fornecedor_id) VALUES ('Produto órfão', 9999)
  `).run(), /FOREIGN KEY constraint failed/);

  assert.throws(() => db.prepare(`
    INSERT INTO rastreabilidade (produto_id, movimentacao_id, tipo)
    VALUES (2, 9999, 'BATERIA')
  `).run(), /FOREIGN KEY constraint failed/);
});

test('restrições preservam os registros relacionados e SET NULL para referências opcionais', () => {
  conexaoBanco.resetarBancoParaTestes();
  const usuario = db.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, perfil)
    VALUES ('Usuário temporário', 'temp-schema@test.local', 'hash', 'OPERACIONAL')
  `).run();
  const movimento = db.prepare(`
    INSERT INTO movimentacoes (produto_id, usuario_id, tipo, quantidade, data_movimentacao)
    VALUES (2, ?, 'AJUSTE_MANUAL', 0, '2026-09-25T00:00:00.000Z')
  `).run(Number(usuario.lastInsertRowid));
  const rastreio = db.prepare(`
    INSERT INTO rastreabilidade (produto_id, movimentacao_id, tipo)
    VALUES (2, ?, 'BATERIA')
  `).run(Number(movimento.lastInsertRowid));

  db.prepare('DELETE FROM usuarios WHERE id = ?').run(Number(usuario.lastInsertRowid));
  assert.equal(
    db.prepare('SELECT usuario_id FROM movimentacoes WHERE id = ?').get(Number(movimento.lastInsertRowid)).usuario_id,
    null
  );
  db.prepare('DELETE FROM movimentacoes WHERE id = ?').run(Number(movimento.lastInsertRowid));

  assert.equal(db.prepare('SELECT usuario_id FROM movimentacoes WHERE id = ?').get(Number(movimento.lastInsertRowid)), undefined);
  assert.equal(db.prepare('SELECT movimentacao_id FROM rastreabilidade WHERE id = ?').get(Number(rastreio.lastInsertRowid)).movimentacao_id, null);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});
