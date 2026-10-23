const test = require('node:test');
const assert = require('node:assert/strict');
const repositorioProduto = require('../src/repositorios/repositorioProduto');
const repositorioFornecedor = require('../src/repositorios/repositorioFornecedor');
const servicoProduto = require('../src/servicos/servicoProduto');
const servicoEstoque = require('../src/servicos/servicoEstoque');

async function comRepositoriosFalsos(callback) {
  const originaisProduto = {
    criarProduto: repositorioProduto.criarProduto,
    buscarProdutoPorId: repositorioProduto.buscarProdutoPorId,
    atualizarProduto: repositorioProduto.atualizarProduto,
  };
  const originalBuscarFornecedor = repositorioFornecedor.buscarFornecedorPorId;

  repositorioFornecedor.buscarFornecedorPorId = async () => ({ id: 1, ativo: true });
  try {
    await callback();
  } finally {
    Object.assign(repositorioProduto, originaisProduto);
    repositorioFornecedor.buscarFornecedorPorId = originalBuscarFornecedor;
  }
}

test('new products always start with zero stock and normalized required fields', async () => {
  await comRepositoriosFalsos(async () => {
    let produtoSalvo;
    repositorioProduto.criarProduto = async (produto) => {
      produtoSalvo = produto;
      return produto;
    };

    await servicoProduto.criarProduto({
      nome: '  Bateria  ',
      codigo_interno: ' BAT-001 ',
      categoria: 'COMPONENTE_ELETRICO',
      unidade_medida: 'UN',
      localizacao_deposito: 'Setor A',
      fornecedor_id: 1,
      custo: 10,
      estoque_atual: 500,
    });

    assert.equal(produtoSalvo.nome, 'Bateria');
    assert.equal(produtoSalvo.codigo_interno, 'BAT-001');
    assert.equal(produtoSalvo.estoque_atual, 0);
  });
});

test('product creation rejects invalid cost and forecast values', async () => {
  await comRepositoriosFalsos(async () => {
    const base = {
      nome: 'Produto',
      codigo_interno: 'PROD-001',
      categoria: 'PECA_ESTRUTURAL',
      unidade_medida: 'UN',
      localizacao_deposito: 'Setor A',
      fornecedor_id: 1,
      custo: 10,
    };

    await assert.rejects(
      servicoProduto.criarProduto({ ...base, custo: 'Infinity' }),
      { status: 400 },
    );
    await assert.rejects(
      servicoProduto.criarProduto({ ...base, demanda_prevista: -1 }),
      { status: 400 },
    );
  });
});

test('product updates reject empty cost and invalid forecast values', async () => {
  await comRepositoriosFalsos(async () => {
    repositorioProduto.buscarProdutoPorId = async () => ({
      id: 1,
      categoria: 'PECA_ESTRUTURAL',
      dimensoes: null,
      ativo: true,
    });

    await assert.rejects(servicoProduto.atualizarProduto(1, { custo: '  ' }), {
      status: 400,
    });
    await assert.rejects(servicoProduto.atualizarProduto(1, { demanda_prevista: 'NaN' }), {
      status: 400,
    });
  });

  test('traced receipt rejects extra or malformed item records', () => {
    const bateria = { categoria: 'COMPONENTE_ELETRICO', tipo_rastreabilidade: 'BATERIA' };
    assert.match(
      servicoEstoque.validarRastreabilidade(bateria, {
        quantidade: 1,
        itens_rastreaveis: [
          { numero_serie: 'BAT-1', data_validade: '2027-01-01' },
          { numero_serie: 'BAT-2', data_validade: '2027-01-01' },
        ],
      }),
      /exatamente 1/,
    );
    assert.match(
      servicoEstoque.validarRastreabilidade(bateria, {
        quantidade: 1,
        itens_rastreaveis: [null],
      }),
      /objeto válido/,
    );
  });
});
