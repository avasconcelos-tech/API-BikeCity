const test = require('node:test');
const assert = require('node:assert/strict');
const conexaoBanco = require('../src/repositorios/conexaoBanco');
const servicoProduto = require('../src/servicos/servicoProduto');
const servicoEstoque = require('../src/servicos/servicoEstoque');
const repositorioEstoque = require('../src/repositorios/repositorioEstoque');

test.beforeEach(() => conexaoBanco.resetarBancoParaTestes());

test('produto bateria cadastrado exige rastreabilidade na entrada', () => {
  const produto = servicoProduto.criarProduto({
    nome: 'Bateria cadastrada',
    codigo_interno: 'BAT-REG-001',
    categoria: 'COMPONENTE_ELETRICO',
    unidade_medida: 'UN',
    localizacao_deposito: 'Setor B',
    fornecedor_id: 1,
    custo: 100,
    dimensoes: '10x10',
    estoque_minimo: 7,
    estado_montagem: 'NAO_APLICA',
    tipo_rastreabilidade: 'BATERIA',
    demanda_prevista: 3
  });

  assert.equal(produto.statusCode, 201);
  assert.equal(produto.payload.dados.dimensoes, '10x10');
  assert.equal(produto.payload.dados.estoque_minimo, 7);
  assert.equal(produto.payload.dados.tipo_rastreabilidade, 'BATERIA');

  const entrada = servicoEstoque.registrarEntrada(
    produto.payload.dados.id,
    1,
    1,
    1,
    'NF-BAT-REG',
    [],
    { numero_pedido_compra: 'PC-BAT-REG' }
  );

  assert.equal(entrada.statusCode, 400);
  assert.match(entrada.payload.mensagem, /numero_serie|data_validade/i);
});

test('entrada exige uma identificação por unidade e rejeita duplicatas', () => {
  const produto = servicoProduto.criarProduto({
    nome: 'Bateria em lote',
    codigo_interno: 'BAT-REG-002',
    categoria: 'COMPONENTE_ELETRICO',
    unidade_medida: 'UN',
    localizacao_deposito: 'Setor B',
    fornecedor_id: 1,
    custo: 100,
    tipo_rastreabilidade: 'BATERIA'
  }).payload.dados;

  const incompleta = servicoEstoque.registrarEntrada(produto.id, 2, 1, 1, 'NF-BAT-2', [], {
    numero_pedido_compra: 'PC-BAT-2',
    numero_serie: 'SERIE-UNICA',
    data_validade: '2027-01-01'
  });
  assert.equal(incompleta.statusCode, 400);

  const entrada = servicoEstoque.registrarEntrada(produto.id, 2, 1, 1, 'NF-BAT-3', [
    { numero_serie: 'SERIE-A', data_validade: '2027-01-01' },
    { numero_serie: 'SERIE-B', data_validade: '2027-02-01' }
  ], { numero_pedido_compra: 'PC-BAT-3' });
  assert.equal(entrada.statusCode, 201);
  assert.deepEqual(
    repositorioEstoque.listarRastreabilidade(produto.id).map((item) => item.numero_serie).sort(),
    ['SERIE-A', 'SERIE-B']
  );

  const duplicada = servicoEstoque.registrarEntrada(produto.id, 1, 1, 1, 'NF-BAT-4', [
    { numero_serie: 'SERIE-A', data_validade: '2027-03-01' }
  ], { numero_pedido_compra: 'PC-BAT-4' });
  assert.equal(duplicada.statusCode, 409);
});
