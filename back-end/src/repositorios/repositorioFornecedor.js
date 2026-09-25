const conexaoBanco = require('./conexaoBanco');

const db = conexaoBanco.obterBanco();

function listarFornecedores(incluirInativos = false) {
  const query = incluirInativos ? 'SELECT * FROM fornecedores ORDER BY id' : 'SELECT * FROM fornecedores WHERE ativo = 1 ORDER BY id';
  return db.prepare(query).all().map((fornecedor) => ({
    ...fornecedor,
    ativo: Boolean(fornecedor.ativo)
  }));
}

function buscarFornecedorPorId(id) {
  const fornecedor = db.prepare('SELECT * FROM fornecedores WHERE id = ?').get(Number(id));
  if (!fornecedor) return null;
  return {
    ...fornecedor,
    ativo: Boolean(fornecedor.ativo)
  };
}

function criarFornecedor(dados) {
  const resultado = db.prepare(
    'INSERT INTO fornecedores (nome, cnpj, contato, ativo) VALUES (?, ?, ?, ?)' 
  ).run(dados.nome, dados.cnpj ?? null, dados.contato ?? null, 1);

  return {
    id: resultado.lastInsertRowid,
    nome: dados.nome,
    cnpj: dados.cnpj ?? null,
    contato: dados.contato ?? null,
    ativo: true
  };
}

function atualizarFornecedor(id, dados) {
  const resultado = db.prepare('UPDATE fornecedores SET nome = ?, cnpj = ?, contato = ? WHERE id = ?').run(dados.nome, dados.cnpj ?? null, dados.contato ?? null, Number(id));
  if (!resultado.changes) return null;
  return buscarFornecedorPorId(id);
}

function existeCnpj(cnpj, excetoId = null) {
  const query = excetoId === null
    ? 'SELECT 1 FROM fornecedores WHERE cnpj = ?'
    : 'SELECT 1 FROM fornecedores WHERE cnpj = ? AND id <> ?';
  const parametros = excetoId === null ? [cnpj] : [cnpj, Number(excetoId)];
  return Boolean(db.prepare(query).get(...parametros));
}

function inativarFornecedor(id) {
  return conexaoBanco.executarEmTransacao(() => {
    const fornecedorId = Number(id);
    const fornecedor = buscarFornecedorPorId(fornecedorId);
    if (!fornecedor) return { fornecedor: null, possuiProdutosAtivos: false };

    const produtoAtivo = db.prepare(
      'SELECT 1 FROM produtos WHERE fornecedor_id = ? AND ativo = 1 LIMIT 1'
    ).get(fornecedorId);
    if (produtoAtivo) return { fornecedor: null, possuiProdutosAtivos: true };

    db.prepare('UPDATE fornecedores SET ativo = 0 WHERE id = ?').run(fornecedorId);
    return { fornecedor: buscarFornecedorPorId(fornecedorId), possuiProdutosAtivos: false };
  });
}

module.exports = {
  listarFornecedores,
  buscarFornecedorPorId,
  criarFornecedor,
  atualizarFornecedor,
  existeCnpj,
  inativarFornecedor
};