const express = require('express');
const controladorFornecedor = require('../controladores/controladorFornecedor');
const { validarAutenticacao, autorizarPerfil } = require('../servicos/servicoAutenticacao');

const router = express.Router();

router.get('/', validarAutenticacao, autorizarPerfil('OPERACIONAL', 'ANALISTA', 'GERENTE'), controladorFornecedor.listarFornecedores);
router.get('/:id', validarAutenticacao, autorizarPerfil('OPERACIONAL', 'ANALISTA', 'GERENTE'), controladorFornecedor.buscarFornecedorPorId);
router.post('/', validarAutenticacao, autorizarPerfil('ANALISTA', 'GERENTE'), controladorFornecedor.criarFornecedor);
router.put('/:id', validarAutenticacao, autorizarPerfil('ANALISTA', 'GERENTE'), controladorFornecedor.atualizarFornecedor);
router.delete('/:id', validarAutenticacao, autorizarPerfil('ANALISTA', 'GERENTE'), controladorFornecedor.inativarFornecedor);

module.exports = router;