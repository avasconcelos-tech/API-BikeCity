process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-only';

const test = require('node:test');
const assert = require('node:assert/strict');
const conexaoBanco = require('../src/repositorios/conexaoBanco');
const repositorioEstoque = require('../src/repositorios/repositorioEstoque');
const servicoEstoque = require('../src/servicos/servicoEstoque');

test.beforeEach(() => conexaoBanco.resetarBancoParaTestes());

test('ajuste manual desfaz saldo e histórico quando a movimentação falha', () => {
  const db = conexaoBanco.getDb();
  const estoqueInicial = db.prepare('SELECT estoque_atual FROM produtos WHERE id = 2').get().estoque_atual;
  const adicionarMovimentacaoOriginal = repositorioEstoque.adicionarMovimentacao;
  repositorioEstoque.adicionarMovimentacao = () => {
    throw new Error('falha simulada na movimentação');
  };

  try {
    assert.throws(
      () => servicoEstoque.registrarAjusteManual(2, estoqueInicial + 10, 'Correção', 1),
      /falha simulada na movimentação/
    );
  } finally {
    repositorioEstoque.adicionarMovimentacao = adicionarMovimentacaoOriginal;
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

test('histórico usa somente movimentações e preserva eventos com a mesma chave', () => {
  const data = '2026-01-01T10:00:00.000Z';
  repositorioEstoque.adicionarMovimentacao({
    produto_id: 2, usuario_id: 1, tipo: 'AJUSTE_MANUAL', quantidade: 1,
    data_movimentacao: data, motivo: 'Correção', estoque_anterior: 10, estoque_novo: 11
  });
  repositorioEstoque.adicionarMovimentacao({
    produto_id: 2, usuario_id: 1, tipo: 'AJUSTE_MANUAL', quantidade: 1,
    data_movimentacao: data, motivo: 'Correção', estoque_anterior: 10, estoque_novo: 11
  });
  repositorioEstoque.adicionarAuditoria({
    produto_id: 2, usuario_id: 1, acao: 'AJUSTE_MANUAL',
    antigo_valor: 10, novo_valor: 11, justificativa: 'Correção', data
  });

  const movimentacoes = repositorioEstoque.listarMovimentacoes(2);
  assert.equal(movimentacoes.length, 2);
  assert.ok(movimentacoes.every((movimentacao) => Number.isInteger(movimentacao.id)));
  assert.deepEqual(
    movimentacoes.map((movimentacao) => movimentacao.id),
    movimentacoes.map((movimentacao) => movimentacao.id).sort((a, b) => b - a)
  );
});
