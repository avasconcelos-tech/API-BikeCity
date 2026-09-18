const express = require('express');
const fs = require('fs');
const controladorProduto = require('../controladores/controladorProduto');
const { authenticate, authorizePerfil } = require('../servicos/servicoAutenticacao');
const upload = require('../configuracoes/multer');
const repositorioProduto = require('../repositorios/repositorioProduto');

const router = express.Router();

router.get('/', authenticate, authorizePerfil('OPERACIONAL', 'ANALISTA', 'GERENTE'), controladorProduto.listarProdutos);
router.get('/:id', authenticate, authorizePerfil('OPERACIONAL', 'ANALISTA', 'GERENTE'), controladorProduto.buscarProdutoPorId);
router.post('/', authenticate, authorizePerfil('ANALISTA', 'GERENTE'), controladorProduto.criarProduto);
router.put('/:id', authenticate, authorizePerfil('ANALISTA', 'GERENTE'), controladorProduto.atualizarProduto);
router.delete('/:id', authenticate, authorizePerfil('ANALISTA', 'GERENTE'), controladorProduto.inativarProduto);

router.post('/:id/imagem', authenticate, authorizePerfil('ANALISTA', 'GERENTE'), (req, res) => {
  const produtoId = Number(req.params.id);
  const produto = repositorioProduto.buscarProdutoPorId(produtoId);

  if (!produto) {
    return res.status(404).json({ status: 'erro', mensagem: 'Produto não encontrado' });
  }

  upload.single('imagem')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ status: 'erro', mensagem: 'Arquivo muito grande. O tamanho máximo permitido é 5MB.' });
      }

      return res.status(400).json({ status: 'erro', mensagem: err.message || 'Arquivo inválido' });
    }

    if (!req.file) {
      return res.status(400).json({ status: 'erro', mensagem: 'Nenhuma imagem enviada' });
    }

    try {
      // Importação dinâmica para contornar módulo ESM
      const { fileTypeFromBuffer } = await import('file-type');
      const dadosArquivo = await fs.promises.readFile(req.file.path);
      const tipoArquivo = await fileTypeFromBuffer(dadosArquivo);

      if (!tipoArquivo || !['image/png', 'image/jpeg'].includes(tipoArquivo.mime)) {
        await fs.promises.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ status: 'erro', mensagem: 'Arquivo inválido: apenas imagens PNG e JPG/JPEG válidas.' });
      }

      const caminhoImagem = `/uploads/${req.file.filename}`;
      repositorioProduto.atualizarProduto(produtoId, { imagem_url: caminhoImagem });

      return res.status(201).json({
        status: 'sucesso',
        mensagem: 'Imagem do produto enviada com sucesso',
        dados: {
          produto_id: produtoId,
          nomeArquivo: req.file.filename,
          caminho: caminhoImagem
        }
      });
    } catch (error) {
      return res.status(400).json({ status: 'erro', mensagem: 'Arquivo inválido' });
    }
  });
});

module.exports = router;