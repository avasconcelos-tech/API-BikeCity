const express = require('express');
const controladorUsuario = require('../controladores/controladorUsuario');
const { validarAutenticacao, autorizarPerfil } = require('../servicos/servicoAutenticacao');

const router = express.Router();

router.get('/', validarAutenticacao, autorizarPerfil('GERENTE'), controladorUsuario.listarUsuarios);
router.get('/:id', validarAutenticacao, autorizarPerfil('GERENTE'), controladorUsuario.buscarUsuarioPorId);
router.post('/', validarAutenticacao, autorizarPerfil('GERENTE'), controladorUsuario.criarUsuario);
router.patch('/me/senha', validarAutenticacao, controladorUsuario.trocarSenha);
router.patch('/:id/senha', validarAutenticacao, autorizarPerfil('GERENTE'), controladorUsuario.redefinirSenha);
router.patch('/:id/reativar', validarAutenticacao, autorizarPerfil('GERENTE'), controladorUsuario.reativarUsuario);
router.put('/:id', validarAutenticacao, autorizarPerfil('GERENTE'), controladorUsuario.atualizarUsuario);
router.delete('/:id', validarAutenticacao, autorizarPerfil('GERENTE'), controladorUsuario.desativarUsuario);
router.patch('/:id/ativar', validarAutenticacao, autorizarPerfil('GERENTE'), controladorUsuario.reativarUsuario);

module.exports = router;