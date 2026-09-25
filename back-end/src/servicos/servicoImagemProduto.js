const fs = require('fs');
const path = require('path');
const repositorioProduto = require('../repositorios/repositorioProduto');
const servicoProduto = require('./servicoProduto');
const ErroNegocio = require('../erros/ErroNegocio');

const diretorioUploads = path.resolve(__dirname, '../../uploads');

async function removerArquivo(caminho) {
  if (!caminho) return;
  try {
    await fs.promises.unlink(caminho);
  } catch (erro) {
    if (erro.code !== 'ENOENT') throw erro;
  }
}

function obterCaminhoImagemLocal(urlImagem) {
  if (typeof urlImagem !== 'string') return null;

  let pathname;
  try {
    const url = new URL(urlImagem, 'http://localhost');
    if (url.origin !== 'http://localhost') return null;
    pathname = url.pathname;
    pathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  if (!pathname.startsWith('/uploads/')) return null;
  const nomeArquivo = pathname.slice('/uploads/'.length);
  if (!nomeArquivo || path.basename(nomeArquivo) !== nomeArquivo) return null;

  const caminho = path.resolve(diretorioUploads, nomeArquivo);
  const relativo = path.relative(diretorioUploads, caminho);
  if (relativo.startsWith('..') || path.isAbsolute(relativo)) return null;
  return caminho;
}

async function vincularImagem(produtoId, arquivo) {
  if (!Number.isInteger(Number(produtoId)) || Number(produtoId) < 1) {
    await removerArquivo(arquivo?.path);
    throw new ErroNegocio(400, 'produto_id é obrigatório para vincular a imagem.');
  }
  if (!arquivo) throw new ErroNegocio(400, 'Nenhuma imagem enviada.');

  const produto = repositorioProduto.buscarProdutoPorId(produtoId);
  if (!produto) {
    await removerArquivo(arquivo.path);
    throw new ErroNegocio(404, 'Produto não encontrado.');
  }

  try {
    const { fileTypeFromBuffer } = await import('file-type');
    const dadosArquivo = await fs.promises.readFile(arquivo.path);
    const tipoArquivo = await fileTypeFromBuffer(dadosArquivo);
    if (!tipoArquivo || !['image/png', 'image/jpeg'].includes(tipoArquivo.mime)) {
      throw new ErroNegocio(400, 'Arquivo inválido: apenas imagens PNG e JPG/JPEG válidas.');
    }

    const caminhoImagem = `/uploads/${arquivo.filename}`;
    servicoProduto.vincularImagem(produto.id, caminhoImagem);

    const caminhoAnterior = obterCaminhoImagemLocal(produto.imagem_url);
    if (caminhoAnterior && caminhoAnterior !== path.resolve(arquivo.path)) {
      try {
        await removerArquivo(caminhoAnterior);
      } catch (erro) {
        console.error('Não foi possível remover a imagem substituída:', erro);
      }
    }

    return {
      produto_id: Number(produto.id),
      nomeArquivo: arquivo.filename,
      caminho: caminhoImagem,
    };
  } catch (erro) {
    await removerArquivo(arquivo.path).catch(() => {});
    throw erro;
  }
}

module.exports = { vincularImagem };
