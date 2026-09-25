const test = require('node:test');
const assert = require('node:assert/strict');
const conexaoBanco = require('../src/repositorios/conexaoBanco');
const servicoProduto = require('../src/servicos/servicoProduto');
const servicoEstoque = require('../src/servicos/servicoEstoque');

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
