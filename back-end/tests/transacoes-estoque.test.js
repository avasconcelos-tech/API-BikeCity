process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-only';

const test = require('node:test');
const assert = require('node:assert/strict');
const conexaoBanco = require('../src/repositorios/conexaoBanco');
const repositorioEstoque = require('../src/repositorios/repositorioEstoque');
const servicoEstoque = require('../src/servicos/servicoEstoque');
const ErroNegocio = require('../src/erros/ErroNegocio');

test.beforeEach(() => conexaoBanco.resetarBancoParaTestes());
test.after(() => conexaoBanco.fecharBanco());

async function scalar(sql, params = []) {
  const [row] = await conexaoBanco.consultar(sql, params);
  return Object.values(row)[0];
}

test('manual stock adjustment rolls back balance and history when movement insertion fails', async () => {
  const estoqueInicial = await scalar('SELECT estoque_atual FROM produtos WHERE id = 2');
  const original = repositorioEstoque.adicionarMovimentacao;
  repositorioEstoque.adicionarMovimentacao = async () => {
    throw new Error('falha simulada na movimentação');
  };
  try {
    await assert.rejects(
      servicoEstoque.registrarAjusteManual(2, estoqueInicial + 10, 'Correção', 1),
      /falha simulada na movimentação/,
    );
  } finally {
    repositorioEstoque.adicionarMovimentacao = original;
  }
  assert.equal(await scalar('SELECT estoque_atual FROM produtos WHERE id = 2'), estoqueInicial);
  assert.equal(
    await scalar("SELECT COUNT(*) AS total FROM movimentacoes WHERE produto_id = 2 AND tipo = 'AJUSTE_MANUAL'"),
    0,
  );
  assert.equal(
    await scalar("SELECT COUNT(*) AS total FROM auditoria WHERE produto_id = 2 AND acao = 'AJUSTE_MANUAL'"),
    0,
  );
});

test('returns roll back and balance does not change when movement insertion fails', async () => {
  const estoqueInicial = await scalar('SELECT estoque_atual FROM produtos WHERE id = 2');
  const original = repositorioEstoque.adicionarMovimentacao;
  repositorioEstoque.adicionarMovimentacao = async () => {
    throw new Error('falha simulada na movimentação');
  };
  try {
    await assert.rejects(
      servicoEstoque.registrarDevolucao(
        {
          produto_id: 2,
          quantidade: 1,
          origem: 'CLIENTE',
          motivo: 'Teste',
          estado_produto: 'INTACTO',
          numero_pedido_venda: 'PV-TESTE',
          reaproveitavel: true,
        },
        1,
      ),
      /falha simulada/,
    );
  } finally {
    repositorioEstoque.adicionarMovimentacao = original;
  }
  assert.equal(await scalar('SELECT estoque_atual FROM produtos WHERE id = 2'), estoqueInicial);
  assert.equal(await scalar('SELECT COUNT(*) AS total FROM devolucoes WHERE produto_id = 2'), 0);
  assert.equal(
    await scalar("SELECT COUNT(*) AS total FROM movimentacoes WHERE produto_id = 2 AND tipo = 'DEVOLUCAO'"),
    0,
  );
});

test('history contains only movement events and retains same-key transactions', async () => {
  const data = '2026-01-01T10:00:00.000Z';
  await repositorioEstoque.adicionarMovimentacao({
    produto_id: 2,
    usuario_id: 1,
    tipo: 'AJUSTE_MANUAL',
    quantidade: 1,
    data_movimentacao: data,
    motivo: 'Correção',
    estoque_anterior: 10,
    estoque_novo: 11,
  });
  await repositorioEstoque.adicionarMovimentacao({
    produto_id: 2,
    usuario_id: 1,
    tipo: 'AJUSTE_MANUAL',
    quantidade: 1,
    data_movimentacao: data,
    motivo: 'Correção',
    estoque_anterior: 10,
    estoque_novo: 11,
  });
  await repositorioEstoque.adicionarAuditoria({
    produto_id: 2,
    usuario_id: 1,
    acao: 'AJUSTE_MANUAL',
    antigo_valor: 10,
    novo_valor: 11,
    justificativa: 'Correção',
    data,
  });
  const movimentacoes = (await repositorioEstoque.listarMovimentacoes(2)).dados;
  assert.equal(movimentacoes.length, 2);
  assert.ok(movimentacoes.every((movimentacao) => Number.isInteger(movimentacao.id)));
  assert.deepEqual(
    movimentacoes.map((movimentacao) => movimentacao.id),
    [...movimentacoes.map((movimentacao) => movimentacao.id)].sort((a, b) => b - a),
  );
});

test('returns validate origin and state and supplier returns subtract stock', async () => {
  const estoqueInicial = await scalar('SELECT estoque_atual FROM produtos WHERE id = 2');
  await assert.rejects(
    servicoEstoque.registrarDevolucao(
      {
        produto_id: 2,
        quantidade: 1,
        origem: 'abc',
        motivo: 'Teste',
        estado_produto: 'INTACTO',
      },
      1,
    ),
    (erro) => erro instanceof ErroNegocio && erro.status === 400,
  );
  const resultado = await servicoEstoque.registrarDevolucao(
    {
      produto_id: 2,
      quantidade: 1,
      origem: 'PARA_FORNECEDOR',
      motivo: 'Peça com defeito',
      estado_produto: 'DANIFICADO',
    },
    1,
  );
  assert.equal(resultado.novo_estoque_total, estoqueInicial - 1);
  assert.equal(await scalar('SELECT estoque_atual FROM produtos WHERE id = 2'), estoqueInicial - 1);
});

test('traced returns require selected items and update traceability state', async () => {
  await conexaoBanco.executar(
    "UPDATE produtos SET tipo_rastreabilidade = 'BATERIA', estoque_atual = 1 WHERE id = 2",
  );
  const movimentacao = await repositorioEstoque.adicionarMovimentacao({
    produto_id: 2,
    usuario_id: 1,
    tipo: 'ENTRADA',
    quantidade: 1,
    data_movimentacao: new Date().toISOString(),
    estoque_anterior: 0,
    estoque_novo: 1,
  });
  const rastreabilidade = await repositorioEstoque.adicionarRastreabilidade({
    produto_id: 2,
    movimentacao_id: movimentacao.id,
    tipo: 'BATERIA',
    numero_serie: 'BAT-DEV-1',
    data_validade: '2027-01-01',
  });
  const devolucao = {
    produto_id: 2,
    quantidade: 1,
    origem: 'CLIENTE',
    motivo: 'Troca',
    estado_produto: 'INTACTO',
    numero_pedido_venda: 'PV-DEV',
  };
  await assert.rejects(
    servicoEstoque.registrarDevolucao(devolucao, 1),
    (erro) => erro instanceof ErroNegocio && erro.status === 400,
  );
  const resultado = await servicoEstoque.registrarDevolucao(
    { ...devolucao, rastreabilidade_ids: [rastreabilidade.id] },
    1,
  );
  assert.equal(resultado.reaproveitada, true);
  assert.equal(
    await scalar('SELECT status FROM rastreabilidade WHERE id = ?', [rastreabilidade.id]),
    'EM_ESTOQUE',
  );
});

test('sales without selected identifiers use FEFO for items with expiration dates', async () => {
  await conexaoBanco.executar(
    "UPDATE produtos SET tipo_rastreabilidade = 'BATERIA', estoque_atual = 2 WHERE id = 2",
  );
  const antiga = await repositorioEstoque.adicionarRastreabilidade({
    produto_id: 2,
    movimentacao_id: null,
    tipo: 'BATERIA',
    numero_serie: 'FEFO-ANTIGA',
    data_validade: '2026-10-01',
  });
  const nova = await repositorioEstoque.adicionarRastreabilidade({
    produto_id: 2,
    movimentacao_id: null,
    tipo: 'BATERIA',
    numero_serie: 'FEFO-NOVA',
    data_validade: '2027-10-01',
  });
  const resultado = await servicoEstoque.registrarSaida(2, 1, 'Cliente', 'Venda', 1, {
    numero_pedido_venda: 'PV-FEFO',
  });
  assert.ok(resultado.movimentacao_id);
  assert.equal(await scalar('SELECT status FROM rastreabilidade WHERE id = ?', [antiga.id]), 'SAIDA');
  assert.equal(await scalar('SELECT status FROM rastreabilidade WHERE id = ?', [nova.id]), 'EM_ESTOQUE');
});
