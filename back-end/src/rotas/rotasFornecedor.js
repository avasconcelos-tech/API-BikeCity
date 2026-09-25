const express = require('express');
const controladorFornecedor = require('../controladores/controladorFornecedor');
const { authenticate, authorizePerfil } = require('../servicos/servicoAutenticacao');

const router = express.Router();

router.get('/', authenticate, authorizePerfil('OPERACIONAL', 'ANALISTA', 'GERENTE'), controladorFornecedor.listarFornecedores);
router.get('/:id', authenticate, authorizePerfil('OPERACIONAL', 'ANALISTA', 'GERENTE'), controladorFornecedor.buscarFornecedorPorId);
router.post('/', authenticate, authorizePerfil('ANALISTA', 'GERENTE'), controladorFornecedor.criarFornecedor);
router.put('/:id', authenticate, authorizePerfil('ANALISTA', 'GERENTE'), controladorFornecedor.atualizarFornecedor);
router.delete('/:id', authenticate, authorizePerfil('ANALISTA', 'GERENTE'), controladorFornecedor.inativarFornecedor);

module.exports = router;