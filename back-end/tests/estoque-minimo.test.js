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

test('cadastro e edição preservam estoque_minimo e validam inteiros não negativos', () => {
  const cadastro = servicoProduto.criarProduto({
    nome: 'Produto com limite',
    codigo_interno: 'LIM-001',
    categoria: 'PECA_ESTRUTURAL',
    unidade_medida: 'UN',
    localizacao_deposito: 'Setor A',
    fornecedor_id: 1,
    custo: 10,
    estoque_minimo: 8
  });
  assert.equal(cadastro.statusCode, 201);
  assert.equal(cadastro.payload.dados.estoque_minimo, 8);

  const atualizado = servicoProduto.atualizarProduto(cadastro.payload.dados.id, { estoque_minimo: 3 });
  assert.equal(atualizado.estoque_minimo, 3);
  assert.equal(servicoProduto.criarProduto({
    nome: 'Limite inválido',
    codigo_interno: 'LIM-002',
    categoria: 'PECA_ESTRUTURAL',
    unidade_medida: 'UN',
    localizacao_deposito: 'Setor A',
    fornecedor_id: 1,
    custo: 10,
    estoque_minimo: 1.5
  }).statusCode, 400);
});

test('alerta e resumo usam o estoque_minimo do produto', () => {
  const produto = repositorioProduto.buscarProdutoPorId(2);
  repositorioProduto.atualizarProduto(2, { estoque_minimo: 1 });
  const entrada = servicoEstoque.registrarEntrada(2, 1, 1, 1, 'NF-LIM', [], { numero_pedido_compra: 'PC-LIM' });
  assert.equal(entrada.statusCode, 201);
  assert.equal(repositorioEstoque.listarAlertas().some((alerta) => alerta.produto_id === produto.id), false);

  repositorioProduto.atualizarProduto(2, { estoque_minimo: 5 });
  const resumo = repositorioEstoque.resumo();
  assert.equal(resumo.estoque_critico >= 1, true);
});
