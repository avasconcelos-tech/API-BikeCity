const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { SECRET } = require('../configuracoes');
const repositorio = require('../repositorios/repositorioUsuario');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ status: 'erro', mensagem: 'Token ausente' });
  }

  try {
    const payload = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ status: 'erro', mensagem: 'Token inválido' });
  }
}

function authorizePerfil(...perfis) {
  return (req, res, next) => {
    if (!perfis.includes(req.user.perfil)) {
      return res.status(403).json({ status: 'erro', mensagem: 'Permissão insuficiente' });
    }
    return next();
  };
}

function createToken(usuario) {
  return jwt.sign({ id: usuario.id, nome: usuario.nome, perfil: usuario.perfil, email: usuario.email }, SECRET, { expiresIn: '30m' });
}

function loginUser(email, senha) {
  const usuario = repositorio.buscarUsuarioPorEmail(email);

  if (!usuario) {
    return { statusCode: 401, payload: { status: 'erro', mensagem: 'Credenciais inválidas' } };
  }

  if (!usuario.ativo) { return { statusCode: 403, payload: { status: 'erro', mensagem: 'Conta inativa. Procure um administrador.' } }; }

  if (usuario.bloqueado_until && new Date(usuario.bloqueado_until) > new Date()) {
    return { statusCode: 403, payload: { status: 'erro', mensagem: 'Conta temporariamente bloqueada' } };
  }

  const senhaValida = bcrypt.compareSync(senha, usuario.senha_hash);
  if (!senhaValida) {
    const tentativasFalhas = (usuario.tentativas_falhas || 0) + 1;
    let bloqueadoUntil = null;

    if (tentativasFalhas >= 3) {
      bloqueadoUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      repositorio.atualizarStatusLogin(email, 0, bloqueadoUntil);
      return { statusCode: 403, payload: { status: 'erro', mensagem: 'Conta temporariamente bloqueada' } };
    }

    repositorio.atualizarStatusLogin(email, tentativasFalhas, null);
    return { statusCode: 401, payload: { status: 'erro', mensagem: 'Credenciais inválidas' } };
  }

  repositorio.atualizarStatusLogin(email, 0, null);

  return {
    statusCode: 200,
    payload: {
      status: 'sucesso',
      mensagem: 'Login realizado com sucesso',
      dados: { token: createToken(usuario) }
    }
  };
}

module.exports = {
  authenticate,
  authorizePerfil,
  loginUser
};