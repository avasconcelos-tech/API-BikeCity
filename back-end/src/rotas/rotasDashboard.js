const express = require('express');
const controladorEstoque = require('../controladores/controladorEstoque');
const { validarAutenticacao, autorizarPerfil } = require('../servicos/servicoAutenticacao');

const router = express.Router();

router.get(
  '/resumo',
  validarAutenticacao,
  autorizarPerfil('OPERACIONAL', 'ANALISTA', 'GERENTE'),
  controladorEstoque.resumo,
);

module.exports = router;
