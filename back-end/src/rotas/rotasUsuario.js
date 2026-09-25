const express = require('express');
const controladorUsuario = require('../controladores/controladorUsuario');
const { authenticate, authorizePerfil } = require('../servicos/servicoAutenticacao');

const router = express.Router();

router.get('/', authenticate, authorizePerfil('GERENTE'), controladorUsuario.listarUsuarios);
router.get('/:id', authenticate, authorizePerfil('GERENTE'), controladorUsuario.buscarUsuarioPorId);
router.post('/', authenticate, authorizePerfil('GERENTE'), controladorUsuario.criarUsuario);
router.patch('/me/senha', authenticate, controladorUsuario.trocarSenha);
router.patch('/:id/senha', authenticate, authorizePerfil('GERENTE'), controladorUsuario.redefinirSenha);
router.patch('/:id/reativar', authenticate, authorizePerfil('GERENTE'), controladorUsuario.reativarUsuario);
router.put('/:id', authenticate, authorizePerfil('GERENTE'), controladorUsuario.atualizarUsuario);
router.delete('/:id', authenticate, authorizePerfil('GERENTE'), controladorUsuario.desativarUsuario);
router.patch('/:id/ativar', authenticate, authorizePerfil('GERENTE'), controladorUsuario.reativarUsuario);

module.exports = router;