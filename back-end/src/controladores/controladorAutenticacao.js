const servicoAutenticacao = require('../servicos/servicoAutenticacao');

function login(req, res) {
  const result = servicoAutenticacao.loginUser(req.body.email, req.body.senha);
  return res.status(result.statusCode).json(result.payload);
}

module.exports = {
  login
};