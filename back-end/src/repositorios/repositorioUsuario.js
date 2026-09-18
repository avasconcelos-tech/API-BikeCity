const conexaoBanco = require('./conexaoBanco');
const bcrypt = require('bcryptjs');

const db = conexaoBanco.getDb();

function listarUsuarios(incluirInativos = false) {
  const query = incluirInativos ? 'SELECT * FROM usuarios ORDER BY id' : 'SELECT * FROM usuarios WHERE ativo = 1 ORDER BY id';
  return db.prepare(query).all().map((usuario) => ({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    cargo: usuario.cargo,
    perfil: usuario.perfil,
    ativo: Boolean(usuario.ativo)
  }));
}

function buscarUsuarioPorId(id) {
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(Number(id));
  if (!usuario) return null;
  return {
    ...usuario,
    ativo: Boolean(usuario.ativo),
    bloqueado_until: usuario.bloqueado_until ? new Date(usuario.bloqueado_until) : null
  };
}

function buscarUsuarioPorEmail(email) {
  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!usuario) return null;
  return {
    ...usuario,
    ativo: Boolean(usuario.ativo),
    bloqueado_until: usuario.bloqueado_until ? new Date(usuario.bloqueado_until) : null
  };
}

function atualizarStatusLogin(email, tentativasFalhas, bloqueadoUntil) {
  db.prepare('UPDATE usuarios SET tentativas_falhas = ?, bloqueado_until = ? WHERE email = ?').run(tentativasFalhas, bloqueadoUntil, email);
  return buscarUsuarioPorEmail(email);
}

function atualizarUsuario(id, dadosParaAtualizar) {
  const campos = [];
  const valores = [];

  const camposPermitidos = ['nome', 'email', 'cargo', 'perfil'];
  for (const campo of camposPermitidos) {
    if (Object.prototype.hasOwnProperty.call(dadosParaAtualizar, campo)) {
      campos.push(`${campo} = ?`);
      valores.push(dadosParaAtualizar[campo]);
    }
  }

  if (!campos.length) {
    return buscarUsuarioPorId(id);
  }

  valores.push(Number(id));
  db.prepare(`UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`).run(...valores);
  return buscarUsuarioPorId(id);
}

function desativarUsuario(id) {
  db.prepare('UPDATE usuarios SET ativo = 0 WHERE id = ?').run(Number(id));
  return buscarUsuarioPorId(id);
}

function atualizarSenha(id, novaSenhaHash) {
  db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(novaSenhaHash, Number(id));
  return buscarUsuarioPorId(id);
}

function criarUsuario({ nome, email, cargo, perfil, senha }) {
  const senhaHash = bcrypt.hashSync(senha, 10);
  const resultado = db.prepare(
    'INSERT INTO usuarios (nome, email, senha_hash, cargo, perfil, ativo, tentativas_falhas, bloqueado_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?)' 
  ).run(nome, email, senhaHash, cargo, perfil, 1, 0, null);

  return {
    id: resultado.lastInsertRowid,
    nome,
    email,
    senha_hash: senhaHash,
    cargo,
    perfil,
    ativo: true,
    tentativas_falhas: 0,
    bloqueado_until: null
  };
}

module.exports = {
  listarUsuarios,
  buscarUsuarioPorId,
  buscarUsuarioPorEmail,
  atualizarStatusLogin,
  atualizarUsuario,
  desativarUsuario,
  atualizarSenha,
  criarUsuario
};