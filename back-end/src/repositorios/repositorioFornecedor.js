const conexaoBanco = require('./conexaoBanco');

const db = conexaoBanco.getDb();

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

module.exports = {
  listarFornecedores,
  buscarFornecedorPorId,
  criarFornecedor,
  atualizarFornecedor
};