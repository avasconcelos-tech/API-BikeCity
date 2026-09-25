const express = require('express');
const controladorAutenticacao = require('../controladores/controladorAutenticacao');

const router = express.Router();

router.post('/login', controladorAutenticacao.login);

module.exports = router;
