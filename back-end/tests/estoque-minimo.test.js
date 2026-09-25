process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-only';

const test = require('node:test');
const assert = require('node:assert/strict');
const conexaoBanco = require('../src/repositorios/conexaoBanco');
const repositorioProduto = require('../src/repositorios/repositorioProduto');
const repositorioEstoque = require('../src/repositorios/repositorioEstoque');
const servicoProduto = require('../src/servicos/servicoProduto');
const servicoEstoque = require('../src/servicos/servicoEstoque');

test.beforeEach(() => conexaoBanco.resetarBancoParaTestes());
test.after(() => conexaoBanco.fecharBanco());

test('create and update preserve estoque_minimo and validate non-negative integers', async () => {
  const cadastro = await servicoProduto.criarProduto({
    nome: 'Produto com limite',
    codigo_interno: 'LIM-001',
    categoria: 'PECA_ESTRUTURAL',
    unidade_medida: 'UN',
    localizacao_deposito: 'Setor A',
    fornecedor_id: 1,
    custo: 10,
    estoque_minimo: 8,
  });
  assert.equal(cadastro.estoque_minimo, 8);

  const atualizado = await servicoProduto.atualizarProduto(cadastro.id, { estoque_minimo: 3 });
  assert.equal(atualizado.estoque_minimo, 3);
  await assert.rejects(
    servicoProduto.criarProduto({
      nome: 'Limite inválido',
      codigo_interno: 'LIM-002',
      categoria: 'PECA_ESTRUTURAL',
      unidade_medida: 'UN',
      localizacao_deposito: 'Setor A',
      fornecedor_id: 1,
      custo: 10,
      estoque_minimo: 1.5,
    }),
    { status: 400 },
  );
});

test('alerts and summary use each product minimum stock', async () => {
  const produto = await repositorioProduto.buscarProdutoPorId(2);
  await repositorioProduto.atualizarProduto(2, { estoque_minimo: 1 });
  const entrada = await servicoEstoque.registrarEntrada(2, 1, 1, 1, 'NF-LIM', [], {
    numero_pedido_compra: 'PC-LIM',
  });
  assert.equal(entrada.quantidade_adicionada, 1);
  assert.equal(
    (await repositorioEstoque.listarAlertas()).some((alerta) => alerta.produto_id === produto.id),
    false,
  );

  await repositorioProduto.atualizarProduto(2, { estoque_minimo: 5 });
  const resumo = await repositorioEstoque.resumo();
  assert.equal(resumo.estoque_critico >= 1, true);
});
