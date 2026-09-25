process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-only';

const test = require('node:test');
const assert = require('node:assert/strict');
const conexaoBanco = require('../src/repositorios/conexaoBanco');
const repositorioEstoque = require('../src/repositorios/repositorioEstoque');
const servicoEstoque = require('../src/servicos/servicoEstoque');

test.beforeEach(() => conexaoBanco.resetarBancoParaTestes());

test('ajuste manual desfaz saldo e histórico quando a auditoria falha', () => {
  const db = conexaoBanco.getDb();
  const estoqueInicial = db.prepare('SELECT estoque_atual FROM produtos WHERE id = 2').get().estoque_atual;
  const adicionarAuditoriaOriginal = repositorioEstoque.adicionarAuditoria;
  repositorioEstoque.adicionarAuditoria = () => {
    throw new Error('falha simulada na auditoria');
  };

  try {
    assert.throws(
      () => servicoEstoque.registrarAjusteManual(2, estoqueInicial + 10, 'Correção', 1),
      /falha simulada/
    );
  } finally {
    repositorioEstoque.adicionarAuditoria = adicionarAuditoriaOriginal;
  }

  assert.equal(db.prepare('SELECT estoque_atual FROM produtos WHERE id = 2').get().estoque_atual, estoqueInicial);
  assert.equal(db.prepare("SELECT COUNT(*) AS total FROM movimentacoes WHERE produto_id = 2 AND tipo = 'AJUSTE_MANUAL'").get().total, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS total FROM auditoria WHERE produto_id = 2 AND acao = 'AJUSTE_MANUAL'").get().total, 0);
});

test('devolução desfaz registro e saldo quando a movimentação falha', () => {
  const db = conexaoBanco.getDb();
  const estoqueInicial = db.prepare('SELECT estoque_atual FROM produtos WHERE id = 2').get().estoque_atual;
  const adicionarMovimentacaoOriginal = repositorioEstoque.adicionarMovimentacao;
  repositorioEstoque.adicionarMovimentacao = () => {
    throw new Error('falha simulada na movimentação');
  };

  try {
    assert.throws(
      () => servicoEstoque.registrarDevolucao({
        produto_id: 2,
        quantidade: 1,
        origem: 'CLIENTE',
        motivo: 'Teste',
        estado_produto: 'INTACTO',
        numero_pedido_venda: 'PV-TESTE',
        reaproveitavel: true
      }, 1),
      /falha simulada/
    );
  } finally {
    repositorioEstoque.adicionarMovimentacao = adicionarMovimentacaoOriginal;
  }

  assert.equal(db.prepare('SELECT estoque_atual FROM produtos WHERE id = 2').get().estoque_atual, estoqueInicial);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM devolucoes WHERE produto_id = 2').get().total, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS total FROM movimentacoes WHERE produto_id = 2 AND tipo = 'DEVOLUCAO'").get().total, 0);
});
