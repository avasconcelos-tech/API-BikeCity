const repositorioProduto = require('../repositorios/repositorioProduto');
const repositorioFornecedor = require('../repositorios/repositorioFornecedor');
const ErroNegocio = require('../erros/ErroNegocio');

function validarFornecedorExiste(id) {
	if (id === undefined || id === null || id === '') return 'Fornecedor é obrigatório.';
	return repositorioFornecedor.buscarFornecedorPorId(id) ? null : 'Fornecedor informado não existe.';
}

function validarEstoqueMinimo(valor) {
	if (valor === undefined) return 5;
	if ((typeof valor !== 'number' && typeof valor !== 'string') || String(valor).trim() === '') return null;
	const numero = Number(valor);
	return Number.isInteger(numero) && numero >= 0 ? numero : null;
}

function buscarProdutoPorId(id) {
	const produto = repositorioProduto.buscarProdutoPorId(id);
	if (!produto) throw new ErroNegocio(404, 'Produto não encontrado');
	return produto;
}

function criarProduto(data) {
	for (const [campo, nome] of [
		['nome', 'Nome'],
		['codigo_interno', 'Código interno'],
		['categoria', 'Categoria'],
		['unidade_medida', 'Unidade de medida'],
		['localizacao_deposito', 'Localização'],
		['custo', 'Custo']
	]) {
		if (data[campo] === undefined || data[campo] === null || String(data[campo]).trim() === '') {
			throw new ErroNegocio(400, `${nome} é obrigatório.`);
		}
	}

	const estoqueMinimo = validarEstoqueMinimo(data.estoque_minimo);
	if (estoqueMinimo === null) {
		throw new ErroNegocio(400, 'Estoque mínimo deve ser um número inteiro maior ou igual a 0.');
	}

	const erroFornecedor = validarFornecedorExiste(data.fornecedor_id);
	if (erroFornecedor) throw new ErroNegocio(400, erroFornecedor);
	if (Number(data.custo) < 0) throw new ErroNegocio(400, 'Custo não pode ser negativo.');

	if (['VEICULO', 'BICICLETA', 'PATINETE'].includes(String(data.categoria).toUpperCase()) && !data.dimensoes && data.categoria === 'PECA_GRANDE') {
		throw new ErroNegocio(400, 'Dimensões são obrigatórias para peças grandes.');
	}

	try {
		return repositorioProduto.criarProduto({ ...data, estoque_minimo: estoqueMinimo });
	} catch (erro) {
		if (String(erro.message).includes('UNIQUE')) throw new ErroNegocio(409, 'Código interno já cadastrado.');
		throw erro;
	}
}

function atualizarProduto(id, dados) {
	buscarProdutoPorId(id);
	if (Object.hasOwn(dados, 'estoque_minimo') && validarEstoqueMinimo(dados.estoque_minimo) === null) {
		throw new ErroNegocio(400, 'Estoque mínimo deve ser um número inteiro maior ou igual a 0.');
	}
	if (Object.hasOwn(dados, 'fornecedor_id')) {
		const erroFornecedor = validarFornecedorExiste(dados.fornecedor_id);
		if (erroFornecedor) throw new ErroNegocio(400, erroFornecedor);
	}
	try {
		return repositorioProduto.atualizarProduto(id, dados);
	} catch (erro) {
		if (String(erro.message).includes('UNIQUE')) throw new ErroNegocio(409, 'Código interno já cadastrado.');
		throw erro;
	}
}

function inativarProduto(id) {
	const produto = buscarProdutoPorId(id);
	if (Number(produto.estoque_atual) > 0) {
		throw new ErroNegocio(400, 'Não é possível inativar produto com saldo em estoque.');
	}
	return repositorioProduto.inativarProduto(id);
}

function reativarProduto(id) {
	buscarProdutoPorId(id);
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
	vincularImagem: (id, caminho) => repositorioProduto.atualizarProduto(id, { imagem_url: caminho })
};
