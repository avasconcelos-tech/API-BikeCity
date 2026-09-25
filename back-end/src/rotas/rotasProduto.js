const express = require('express');
const controladorProduto = require('../controladores/controladorProduto');
const controladorUpload = require('../controladores/controladorUpload');
const { validarAutenticacao, autorizarPerfil } = require('../servicos/servicoAutenticacao');
const upload = require('../configuracoes/multer');

const router = express.Router();

router.get('/', validarAutenticacao, autorizarPerfil('OPERACIONAL', 'ANALISTA', 'GERENTE'), controladorProduto.listarProdutos);
router.patch('/:id/reativar', validarAutenticacao, autorizarPerfil('ANALISTA', 'GERENTE'), controladorProduto.reativarProduto);
router.get('/:id', validarAutenticacao, autorizarPerfil('OPERACIONAL', 'ANALISTA', 'GERENTE'), controladorProduto.buscarProdutoPorId);
router.post('/', validarAutenticacao, autorizarPerfil('ANALISTA', 'GERENTE'), controladorProduto.criarProduto);
router.put('/:id', validarAutenticacao, autorizarPerfil('ANALISTA', 'GERENTE'), controladorProduto.atualizarProduto);
router.delete('/:id', validarAutenticacao, autorizarPerfil('ANALISTA', 'GERENTE'), controladorProduto.inativarProduto);
router.patch('/:id/ativar', validarAutenticacao, autorizarPerfil('ANALISTA', 'GERENTE'), controladorProduto.reativarProduto);

router.post('/:id/imagem', validarAutenticacao, autorizarPerfil('ANALISTA', 'GERENTE'), (req, res, next) => {
  upload.single('imagem')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ status: 'erro', mensagem: 'Arquivo muito grande. O tamanho máximo permitido é 5MB.' });
      }

      return res.status(400).json({ status: 'erro', mensagem: err.message || 'Arquivo inválido' });
    }

    return controladorUpload.vincularImagemProduto(req, res, next);
  });
});

module.exports = router;