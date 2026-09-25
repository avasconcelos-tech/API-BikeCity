const express = require('express');
const controladorProduto = require('../controladores/controladorProduto');
const controladorUpload = require('../controladores/controladorUpload');
const { validarAutenticacao, autorizarPerfil } = require('../servicos/servicoAutenticacao');
const processarUploadImagem = require('../middlewares/processarUploadImagem');

const router = express.Router();

router.get(
  '/',
  validarAutenticacao,
  autorizarPerfil('OPERACIONAL', 'ANALISTA', 'GERENTE'),
  controladorProduto.listarProdutos,
);
router.patch(
  '/:id/reativar',
  validarAutenticacao,
  autorizarPerfil('ANALISTA', 'GERENTE'),
  controladorProduto.reativarProduto,
);
router.get(
  '/:id',
  validarAutenticacao,
  autorizarPerfil('OPERACIONAL', 'ANALISTA', 'GERENTE'),
  controladorProduto.buscarProdutoPorId,
);
router.post(
  '/',
  validarAutenticacao,
  autorizarPerfil('ANALISTA', 'GERENTE'),
  controladorProduto.criarProduto,
);
router.put(
  '/:id',
  validarAutenticacao,
  autorizarPerfil('ANALISTA', 'GERENTE'),
  controladorProduto.atualizarProduto,
);
router.delete(
  '/:id',
  validarAutenticacao,
  autorizarPerfil('ANALISTA', 'GERENTE'),
  controladorProduto.inativarProduto,
);
router.patch(
  '/:id/ativar',
  validarAutenticacao,
  autorizarPerfil('ANALISTA', 'GERENTE'),
  controladorProduto.reativarProduto,
);

router.post(
  '/:id/imagem',
  validarAutenticacao,
  autorizarPerfil('ANALISTA', 'GERENTE'),
  processarUploadImagem,
  controladorUpload.vincularImagemProduto,
);

module.exports = router;
