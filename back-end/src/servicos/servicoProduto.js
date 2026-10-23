const repositorioProduto = require('../repositorios/repositorioProduto');
const repositorioFornecedor = require('../repositorios/repositorioFornecedor');
const ErroNegocio = require('../erros/ErroNegocio');

async function validarFornecedorExiste(id) {
  if (id === undefined || id === null || id === '') return 'Fornecedor é obrigatório.';
  if (
    (typeof id !== 'number' && typeof id !== 'string') ||
    (typeof id === 'string' && !id.trim()) ||
    !Number.isInteger(Number(id)) ||
    Number(id) < 1
  ) {
    return 'Fornecedor informado não existe.';
  }
  const fornecedor = await repositorioFornecedor.buscarFornecedorPorId(id);
  if (!fornecedor) return 'Fornecedor informado não existe.';
  if (!fornecedor.ativo) return 'Fornecedor informado está inativo.';
  return null;
}

function validarEstoqueMinimo(valor) {
  if (valor === undefined) return 5;
  if ((typeof valor !== 'number' && typeof valor !== 'string') || String(valor).trim() === '')
    return null;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 0 ? numero : null;
}

function dimensoesObrigatorias(categoria, dimensoes) {
  const categoriasGrandes = ['VEICULO'];
  return (
    categoriasGrandes.includes(
      String(categoria || '')
        .trim()
        .toUpperCase(),
    ) &&
    (dimensoes === undefined || dimensoes === null || String(dimensoes).trim() === '')
  );
}

async function buscarProdutoPorId(id) {
  const produto = await repositorioProduto.buscarProdutoPorId(id);
  if (!produto) throw new ErroNegocio(404, 'Produto não encontrado');
  return produto;
}

async function criarProduto(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ErroNegocio(400, 'Os dados do produto devem ser um objeto.');
  }
  for (const [campo, nome] of [
    ['nome', 'Nome'],
    ['codigo_interno', 'Código interno'],
    ['categoria', 'Categoria'],
    ['unidade_medida', 'Unidade de medida'],
    ['localizacao_deposito', 'Localização'],
    ['custo', 'Custo'],
  ]) {
    if (campo === 'custo' && typeof data[campo] !== 'number' && typeof data[campo] !== 'string')
      throw new ErroNegocio(400, `${nome} deve ser um número válido.`);
    if (campo !== 'custo' && typeof data[campo] !== 'string')
      throw new ErroNegocio(400, `${nome} deve ser um texto válido.`);
    if (String(data[campo]).trim() === '') {
      throw new ErroNegocio(400, `${nome} é obrigatório.`);
    }
    if (campo !== 'custo') data[campo] = data[campo].trim();
  }

  const estoqueMinimo = validarEstoqueMinimo(data.estoque_minimo);
  if (estoqueMinimo === null) {
    throw new ErroNegocio(400, 'Estoque mínimo deve ser um número inteiro maior ou igual a 0.');
  }

  const erroFornecedor = await validarFornecedorExiste(data.fornecedor_id);
  if (erroFornecedor) throw new ErroNegocio(400, erroFornecedor);
  const custo = Number(data.custo);
  if (!Number.isFinite(custo) || custo < 0)
    throw new ErroNegocio(400, 'Custo deve ser um número válido maior ou igual a zero.');
  const demandaPrevista = Number(data.demanda_prevista ?? 0);
  if (
    typeof data.demanda_prevista === 'string' &&
    !data.demanda_prevista.trim()
  ) {
    throw new ErroNegocio(400, 'Demanda prevista deve ser um número inteiro maior ou igual a 0.');
  }
  if (typeof data.demanda_prevista !== 'undefined' &&
      typeof data.demanda_prevista !== 'number' &&
      typeof data.demanda_prevista !== 'string') {
    throw new ErroNegocio(400, 'Demanda prevista deve ser um número inteiro maior ou igual a 0.');
  }
  if (!Number.isInteger(demandaPrevista) || demandaPrevista < 0) {
    throw new ErroNegocio(400, 'Demanda prevista deve ser um número inteiro maior ou igual a 0.');
  }

  if (dimensoesObrigatorias(data.categoria, data.dimensoes)) {
    throw new ErroNegocio(400, 'Dimensões são obrigatórias para veículos.');
  }

  try {
    return await repositorioProduto.criarProduto({
      ...data,
      custo,
      demanda_prevista: demandaPrevista,
      estoque_atual: 0,
      estoque_minimo: estoqueMinimo,
    });
  } catch (erro) {
    if (String(erro.message).includes('UNIQUE'))
      throw new ErroNegocio(409, 'Código interno já cadastrado.');
    throw erro;
  }
}

async function atualizarProduto(id, dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new ErroNegocio(400, 'Os dados do produto devem ser um objeto.');
  }
  const produtoAtual = await buscarProdutoPorId(id);
  if (
    Object.hasOwn(dados, 'estoque_minimo') &&
    validarEstoqueMinimo(dados.estoque_minimo) === null
  ) {
    throw new ErroNegocio(400, 'Estoque mínimo deve ser um número inteiro maior ou igual a 0.');
  }
  if (Object.hasOwn(dados, 'custo')) {
    if (
      (typeof dados.custo !== 'number' && typeof dados.custo !== 'string') ||
      (typeof dados.custo === 'string' && !dados.custo.trim())
    )
      throw new ErroNegocio(400, 'Custo deve ser um número válido maior ou igual a zero.');
    const custo = Number(dados.custo);
    if (!Number.isFinite(custo) || custo < 0)
      throw new ErroNegocio(400, 'Custo deve ser um número válido maior ou igual a zero.');
    dados.custo = custo;
  }
  if (Object.hasOwn(dados, 'demanda_prevista')) {
    if (
      (typeof dados.demanda_prevista !== 'number' &&
        typeof dados.demanda_prevista !== 'string') ||
      (typeof dados.demanda_prevista === 'string' && !dados.demanda_prevista.trim())
    ) {
      throw new ErroNegocio(400, 'Demanda prevista deve ser um número inteiro maior ou igual a 0.');
    }
    const demandaPrevista = Number(dados.demanda_prevista);
    if (!Number.isInteger(demandaPrevista) || demandaPrevista < 0) {
      throw new ErroNegocio(400, 'Demanda prevista deve ser um número inteiro maior ou igual a 0.');
    }
    dados.demanda_prevista = demandaPrevista;
  }
  if (
    (Object.hasOwn(dados, 'categoria') || Object.hasOwn(dados, 'dimensoes')) &&
    dimensoesObrigatorias(
      dados.categoria ?? produtoAtual.categoria,
      dados.dimensoes ??
        (Object.hasOwn(dados, 'dimensoes') ? dados.dimensoes : produtoAtual.dimensoes),
    )
  ) {
    throw new ErroNegocio(400, 'Dimensões são obrigatórias para veículos.');
  }
  if (Object.hasOwn(dados, 'fornecedor_id')) {
    const erroFornecedor = await validarFornecedorExiste(dados.fornecedor_id);
    if (erroFornecedor) throw new ErroNegocio(400, erroFornecedor);
  }
  try {
    return await repositorioProduto.atualizarProduto(id, dados);
  } catch (erro) {
    if (String(erro.message).includes('UNIQUE'))
      throw new ErroNegocio(409, 'Código interno já cadastrado.');
    throw erro;
  }
}

async function inativarProduto(id) {
  const produto = await buscarProdutoPorId(id);
  if (Number(produto.estoque_atual) > 0) {
    throw new ErroNegocio(400, 'Não é possível inativar produto com saldo em estoque.');
  }
  return repositorioProduto.inativarProduto(id);
}

async function reativarProduto(id) {
  await buscarProdutoPorId(id);
  return repositorioProduto.reativarProduto(id);
}

module.exports = {
  listarProdutos: (incluirInativos) => repositorioProduto.listarProdutos(incluirInativos),
  buscarProdutoPorId,
  atualizarProduto,
  inativarProduto,
  reativarProduto,
  criarProduto,
  validarFornecedorExiste,
  validarEstoqueMinimo,
  vincularImagem: (id, caminho) => repositorioProduto.atualizarProduto(id, { imagem_url: caminho }),
};
