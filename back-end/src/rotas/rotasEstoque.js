const express = require('express');
const c = require('../controladores/controladorEstoque');
const { validarAutenticacao, autorizarPerfil } = require('../servicos/servicoAutenticacao');
const router = express.Router();
const todos = autorizarPerfil('OPERACIONAL', 'ANALISTA', 'GERENTE');
router.get('/movimentacoes', validarAutenticacao, todos, c.listarMovimentacoes);
router.post('/movimentacoes/:id/estorno', validarAutenticacao, todos, c.registrarEstorno);
router.get('/rastreabilidade', validarAutenticacao, todos, c.listarRastreabilidade);
router.get('/alertas', validarAutenticacao, todos, c.listarAlertas);
router.patch('/alertas/:id/lido', validarAutenticacao, todos, c.marcarAlerta);
router.get('/notificacoes', validarAutenticacao, todos, c.notificacoes);
router.patch('/notificacoes/:id/lida', validarAutenticacao, todos, c.marcarNotificacaoLida);
router.get('/buscar-codigo/:codigo', validarAutenticacao, todos, c.buscarCodigo);
router.get('/relatorios', validarAutenticacao, todos, c.relatorio);
router.post('/entradas', validarAutenticacao, todos, c.registrarEntrada);
router.post('/saidas', validarAutenticacao, todos, c.registrarSaida);
router.post('/devolucoes', validarAutenticacao, todos, c.registrarDevolucao);
router.post(
  '/ajuste-manual',
  validarAutenticacao,
  autorizarPerfil('GERENTE'),
  c.registrarAjusteManual,
);
module.exports = router;
