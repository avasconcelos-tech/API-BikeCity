const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { SECRET } = require('../configuracoes');
const repositorio = require('../repositorios/repositorioUsuario');
const ErroNegocio = require('../erros/ErroNegocio');
const asyncHandler = require('../middlewares/asyncHandler');

async function validarAutenticacao(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ status: 'erro', mensagem: 'Token ausente' });
  }

  let payload;
  try {
    payload = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ status: 'erro', mensagem: 'Token inválido' });
  }
  try {
    const usuario = await repositorio.buscarUsuarioPorId(payload.id);
    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ status: 'erro', mensagem: 'Usuário inválido ou inativo' });
    }
    req.user = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      cargo: usuario.cargo,
      ativo: usuario.ativo,
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

function autorizarPerfil(...perfis) {
  return (req, res, next) => {
    if (!perfis.includes(req.user.perfil)) {
      return res.status(403).json({ status: 'erro', mensagem: 'Permissão insuficiente' });
    }
    return next();
  };
}

function criarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil, email: usuario.email },
    SECRET,
    { expiresIn: '30m' },
  );
}

async function realizarLogin(email, senha) {
  if (typeof email !== 'string' || !email.trim() || typeof senha !== 'string') {
    throw new ErroNegocio(400, 'E-mail e senha são obrigatórios e devem ser textos.');
  }

  email = email.trim().toLowerCase();
  const usuario = await repositorio.buscarUsuarioPorEmail(email);

  if (!usuario) {
    throw new ErroNegocio(401, 'Credenciais inválidas');
  }

  if (!usuario.ativo) throw new ErroNegocio(403, 'Conta inativa. Procure um administrador.');

  if (usuario.bloqueado_until && new Date(usuario.bloqueado_until) > new Date()) {
    throw new ErroNegocio(403, 'Conta temporariamente bloqueada');
  }

  const senhaValida = bcrypt.compareSync(senha, usuario.senha_hash);
  if (!senhaValida) {
    const tentativasFalhas = (usuario.tentativas_falhas || 0) + 1;
    let bloqueadoUntil = null;

    if (tentativasFalhas >= 3) {
      bloqueadoUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await repositorio.atualizarStatusLogin(email, 0, bloqueadoUntil);
      throw new ErroNegocio(403, 'Conta temporariamente bloqueada');
    }

    await repositorio.atualizarStatusLogin(email, tentativasFalhas, null);
    throw new ErroNegocio(401, 'Credenciais inválidas');
  }

  await repositorio.atualizarStatusLogin(email, 0, null);

  return { token: criarToken(usuario) };
}

module.exports = {
  validarAutenticacao: asyncHandler(validarAutenticacao),
  autorizarPerfil,
  realizarLogin,
};
