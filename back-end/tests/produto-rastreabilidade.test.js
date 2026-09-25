const test = require('node:test');
const assert = require('node:assert/strict');
const conexaoBanco = require('../src/repositorios/conexaoBanco');
const repositorioEstoque = require('../src/repositorios/repositorioEstoque');
const servicoProduto = require('../src/servicos/servicoProduto');
const servicoEstoque = require('../src/servicos/servicoEstoque');
const ErroNegocio = require('../src/erros/ErroNegocio');

test.beforeEach(() => conexaoBanco.resetarBancoParaTestes());
test.after(() => conexaoBanco.fecharBanco());

test('vehicle dimensions are required on create and when category or dimensions change', async () => {
  const dadosProduto = {
    nome: 'Veículo sem dimensões',
    codigo_interno: 'VEI-DIM-001',
    categoria: 'VEICULO',
    unidade_medida: 'UN',
    localizacao_deposito: 'Setor A',
    fornecedor_id: 1,
    custo: 1000,
  };
  await assert.rejects(
    servicoProduto.criarProduto(dadosProduto),
    (erro) => erro instanceof ErroNegocio && erro.status === 400 && /dimensões.*veículos/i.test(erro.message),
  );
  const veiculoValido = await servicoProduto.criarProduto({
    ...dadosProduto,
    dimensoes: '180x70x110 cm',
  });
  assert.equal(veiculoValido.dimensoes, '180x70x110 cm');

  const peca = await servicoProduto.criarProduto({
    ...dadosProduto,
    nome: 'Peça estrutural',
    codigo_interno: 'VEI-DIM-002',
    categoria: 'PECA_ESTRUTURAL',
  });
  assert.equal(peca.dimensoes, null);
  await assert.rejects(
    servicoProduto.atualizarProduto(peca.id, { categoria: 'VEICULO' }),
    (erro) => erro instanceof ErroNegocio && erro.status === 400,
  );
  await assert.rejects(
    servicoProduto.atualizarProduto(veiculoValido.id, { dimensoes: '  ' }),
    (erro) => erro instanceof ErroNegocio && erro.status === 400,
  );
});

test('registered battery products require traceability when receiving stock', async () => {
  const produto = await servicoProduto.criarProduto({
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
    demanda_prevista: 3,
  });
  assert.equal(produto.dimensoes, '10x10');
  assert.equal(produto.estoque_minimo, 7);
  assert.equal(produto.tipo_rastreabilidade, 'BATERIA');
  await assert.rejects(
    servicoEstoque.registrarEntrada(produto.id, 1, 1, 1, 'NF-BAT-REG', [], {
      numero_pedido_compra: 'PC-BAT-REG',
    }),
    (erro) => erro instanceof ErroNegocio && erro.status === 400 && /numero_serie|data_validade/i.test(erro.message),
  );
});

test('receiving traced products requires one unique identity per item', async () => {
  const produto = await servicoProduto.criarProduto({
    nome: 'Bateria em lote',
    codigo_interno: 'BAT-REG-002',
    categoria: 'COMPONENTE_ELETRICO',
    unidade_medida: 'UN',
    localizacao_deposito: 'Setor B',
    fornecedor_id: 1,
    custo: 100,
    tipo_rastreabilidade: 'BATERIA',
  });
  await assert.rejects(
    servicoEstoque.registrarEntrada(produto.id, 2, 1, 1, 'NF-BAT-2', [], {
      numero_pedido_compra: 'PC-BAT-2',
      numero_serie: 'SERIE-UNICA',
      data_validade: '2027-01-01',
    }),
    (erro) => erro instanceof ErroNegocio && erro.status === 400,
  );
  const entrada = await servicoEstoque.registrarEntrada(
    produto.id,
    2,
    1,
    1,
    'NF-BAT-3',
    [
      { numero_serie: 'SERIE-A', data_validade: '2027-01-01' },
      { numero_serie: 'SERIE-B', data_validade: '2027-02-01' },
    ],
    { numero_pedido_compra: 'PC-BAT-3' },
  );
  assert.equal(entrada.quantidade_adicionada, 2);
  assert.deepEqual(
    (await repositorioEstoque.listarRastreabilidade(produto.id))
      .map((item) => item.numero_serie)
      .sort(),
    ['SERIE-A', 'SERIE-B'],
  );
  await assert.rejects(
    servicoEstoque.registrarEntrada(
      produto.id,
      1,
      1,
      1,
      'NF-BAT-4',
      [{ numero_serie: 'SERIE-A', data_validade: '2027-03-01' }],
      { numero_pedido_compra: 'PC-BAT-4' },
    ),
    (erro) => erro instanceof ErroNegocio && erro.status === 409,
  );
});
