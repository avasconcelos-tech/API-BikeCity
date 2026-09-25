const conexaoBanco = require('./conexaoBanco');

const db = conexaoBanco.getDb();

function listarProdutos(incluirInativos = false) {
  const query = incluirInativos ? 'SELECT * FROM produtos ORDER BY id' : 'SELECT * FROM produtos WHERE ativo = 1 ORDER BY id';
  return db.prepare(query).all().map((produto) => ({
    ...produto,
    ativo: Boolean(produto.ativo)
  }));
}

function criarProduto(produtoInput) {
  const resultado = db.prepare(
    `INSERT INTO produtos (nome,codigo_interno,categoria,unidade_medida,localizacao_deposito,fornecedor_id,custo,dimensoes,estoque_atual,estoque_minimo,estado_montagem,ativo,tipo_rastreabilidade,demanda_prevista)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    produtoInput.nome,
    produtoInput.codigo_interno,
    produtoInput.categoria,
    produtoInput.unidade_medida,
    produtoInput.localizacao_deposito,
    produtoInput.fornecedor_id ?? null,
    produtoInput.custo ?? 0,
    produtoInput.dimensoes ?? null,
    produtoInput.estoque_atual ?? 0,
    produtoInput.estoque_minimo ?? 0,
    produtoInput.estado_montagem ?? 'NAO_APLICA',
    produtoInput.ativo === undefined ? 1 : Number(Boolean(produtoInput.ativo)),
    produtoInput.tipo_rastreabilidade ?? 'NENHUMA',
    produtoInput.demanda_prevista ?? 0
  );
  return buscarProdutoPorId(Number(resultado.lastInsertRowid));
}

function buscarProdutoPorId(id) {
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(Number(id));
  if (!produto) return null;
  return {
    ...produto,
    ativo: Boolean(produto.ativo)
  };
}

function atualizarProduto(id, dadosParaAtualizar) {
  const campos = [];
  const valores = [];

  const camposPermitidos = ['nome', 'codigo_interno', 'categoria', 'unidade_medida', 'localizacao_deposito', 'fornecedor_id', 'custo', 'dimensoes', 'estado_montagem', 'imagem_url', 'tipo_rastreabilidade', 'demanda_prevista'];
  for (const campo of camposPermitidos) {
    if (Object.prototype.hasOwnProperty.call(dadosParaAtualizar, campo)) {
      campos.push(`${campo} = ?`);
      valores.push(dadosParaAtualizar[campo]);
    }
  }

  if (!campos.length) {
    return buscarProdutoPorId(id);
  }

  valores.push(Number(id));
  db.prepare(`UPDATE produtos SET ${campos.join(', ')} WHERE id = ?`).run(...valores);
  return buscarProdutoPorId(id);
}

function inativarProduto(id) {
  db.prepare('UPDATE produtos SET ativo = 0 WHERE id = ?').run(Number(id));
  return buscarProdutoPorId(id);
}

function atualizarEstoqueProduto(id, novoEstoque) {
  db.prepare('UPDATE produtos SET estoque_atual = ? WHERE id = ?').run(novoEstoque, Number(id));
  return buscarProdutoPorId(id);
}

module.exports = {
  listarProdutos,
  criarProduto,
  buscarProdutoPorId,
  atualizarProduto,
  inativarProduto,
  atualizarEstoqueProduto
};