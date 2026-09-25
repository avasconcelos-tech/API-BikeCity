const banco = require('./conexaoBanco');

async function listarFornecedores(incluirInativos = false) {
  const filtro = incluirInativos ? '' : ' WHERE ativo = 1';
  const fornecedores = await banco.consultar(`SELECT * FROM fornecedores${filtro} ORDER BY id`);
  return fornecedores.map((f) => ({ ...f, ativo: Boolean(f.ativo) }));
}

async function buscarFornecedorPorId(id) {
  const [fornecedor] = await banco.consultar('SELECT * FROM fornecedores WHERE id = ?', [
    Number(id),
  ]);
  return fornecedor ? { ...fornecedor, ativo: Boolean(fornecedor.ativo) } : null;
}

async function criarFornecedor(dados) {
  const resultado = await banco.executar(
    'INSERT INTO fornecedores (nome, cnpj, contato, ativo) VALUES (?, ?, ?, ?)',
    [dados.nome, dados.cnpj ?? null, dados.contato ?? null, 1],
  );
  return {
    id: resultado.insertId,
    nome: dados.nome,
    cnpj: dados.cnpj ?? null,
    contato: dados.contato ?? null,
    ativo: true,
  };
}

async function atualizarFornecedor(id, dados) {
  const resultado = await banco.executar(
    'UPDATE fornecedores SET nome = ?, cnpj = ?, contato = ? WHERE id = ?',
    [dados.nome, dados.cnpj ?? null, dados.contato ?? null, Number(id)],
  );
  if (!resultado.affectedRows) return null;
  return buscarFornecedorPorId(id);
}

async function existeCnpj(cnpj, excetoId = null) {
  const sql =
    excetoId === null
      ? 'SELECT 1 FROM fornecedores WHERE cnpj = ? LIMIT 1'
      : 'SELECT 1 FROM fornecedores WHERE cnpj = ? AND id <> ? LIMIT 1';
  const parametros = excetoId === null ? [cnpj] : [cnpj, Number(excetoId)];
  return (await banco.consultar(sql, parametros)).length > 0;
}

async function inativarFornecedor(id) {
  return banco.executarEmTransacao(async () => {
    const fornecedorId = Number(id);
    const fornecedor = await buscarFornecedorPorId(fornecedorId);
    if (!fornecedor) return { fornecedor: null, possuiProdutosAtivos: false };

    const produtoAtivo = await banco.consultar(
      'SELECT 1 FROM produtos WHERE fornecedor_id = ? AND ativo = 1 LIMIT 1',
      [fornecedorId],
    );
    if (produtoAtivo.length) return { fornecedor: null, possuiProdutosAtivos: true };

    await banco.executar('UPDATE fornecedores SET ativo = 0 WHERE id = ?', [fornecedorId]);
    return { fornecedor: await buscarFornecedorPorId(fornecedorId), possuiProdutosAtivos: false };
  });
}

module.exports = {
  listarFornecedores,
  buscarFornecedorPorId,
  criarFornecedor,
  atualizarFornecedor,
  existeCnpj,
  inativarFornecedor,
};
