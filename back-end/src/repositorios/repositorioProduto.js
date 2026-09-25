const banco = require('./conexaoBanco');

function mapearProduto(produto) {
  return produto ? { ...produto, ativo: Boolean(produto.ativo) } : null;
}

async function listarProdutos(incluirInativos = false) {
  const filtro = incluirInativos ? '' : ' WHERE ativo = 1';
  const produtos = await banco.consultar(`SELECT * FROM produtos${filtro} ORDER BY id`);
  return produtos.map(mapearProduto);
}

async function criarProduto(produtoInput) {
  const resultado = await banco.executar(
    `INSERT INTO produtos (nome,codigo_interno,categoria,unidade_medida,localizacao_deposito,fornecedor_id,custo,dimensoes,estoque_atual,estoque_minimo,estado_montagem,ativo,tipo_rastreabilidade,demanda_prevista)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      produtoInput.nome,
      produtoInput.codigo_interno,
      produtoInput.categoria,
      produtoInput.unidade_medida,
      produtoInput.localizacao_deposito,
      produtoInput.fornecedor_id ?? null,
      produtoInput.custo ?? 0,
      produtoInput.dimensoes ?? null,
      produtoInput.estoque_atual ?? 0,
      produtoInput.estoque_minimo ?? 5,
      produtoInput.estado_montagem ?? 'NAO_APLICA',
      produtoInput.ativo === undefined ? 1 : Number(Boolean(produtoInput.ativo)),
      produtoInput.tipo_rastreabilidade ?? 'NENHUMA',
      produtoInput.demanda_prevista ?? 0,
    ],
  );
  return buscarProdutoPorId(resultado.insertId);
}

async function buscarProdutoPorId(id) {
  const [produto] = await banco.consultar('SELECT * FROM produtos WHERE id = ?', [Number(id)]);
  return mapearProduto(produto);
}

async function buscarPorCodigo(codigo) {
  const [produto] = await banco.consultar(
    'SELECT * FROM produtos WHERE ativo = 1 AND codigo_interno = ?',
    [codigo],
  );
  return mapearProduto(produto);
}

async function atualizarProduto(id, dadosParaAtualizar) {
  const campos = [];
  const valores = [];
  const permitidos = [
    'nome',
    'codigo_interno',
    'categoria',
    'unidade_medida',
    'localizacao_deposito',
    'fornecedor_id',
    'custo',
    'dimensoes',
    'estoque_minimo',
    'estado_montagem',
    'imagem_url',
    'tipo_rastreabilidade',
    'demanda_prevista',
  ];
  for (const campo of permitidos) {
    if (Object.prototype.hasOwnProperty.call(dadosParaAtualizar, campo)) {
      campos.push(`${campo} = ?`);
      valores.push(dadosParaAtualizar[campo]);
    }
  }
  if (campos.length) {
    valores.push(Number(id));
    await banco.executar(`UPDATE produtos SET ${campos.join(', ')} WHERE id = ?`, valores);
  }
  return buscarProdutoPorId(id);
}

async function inativarProduto(id) {
  await banco.executar('UPDATE produtos SET ativo = 0 WHERE id = ?', [Number(id)]);
  return buscarProdutoPorId(id);
}

async function reativarProduto(id) {
  await banco.executar('UPDATE produtos SET ativo = 1 WHERE id = ?', [Number(id)]);
  return buscarProdutoPorId(id);
}

async function atualizarEstoqueProduto(id, novoEstoque) {
  await banco.executar('UPDATE produtos SET estoque_atual = ? WHERE id = ?', [
    novoEstoque,
    Number(id),
  ]);
  return buscarProdutoPorId(id);
}

module.exports = {
  listarProdutos,
  criarProduto,
  buscarProdutoPorId,
  buscarPorCodigo,
  atualizarProduto,
  inativarProduto,
  reativarProduto,
  atualizarEstoqueProduto,
};
