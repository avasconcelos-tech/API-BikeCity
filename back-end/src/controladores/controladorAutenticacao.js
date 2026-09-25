const servicoAutenticacao = require('../servicos/servicoAutenticacao');

function login(req, res) {
  const dados = servicoAutenticacao.realizarLogin(req.body.email, req.body.senha);
  return res
    .status(200)
    .json({ status: 'sucesso', mensagem: 'Login realizado com sucesso', dados });
}

module.exports = {
  login,
};
