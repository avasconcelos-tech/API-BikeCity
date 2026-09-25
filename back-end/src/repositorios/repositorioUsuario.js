const banco = require('./conexaoBanco');
const bcrypt = require('bcryptjs');

async function listarUsuarios(incluirInativos = false) {
  const filtro = incluirInativos ? '' : ' WHERE ativo = 1';
  const usuarios = await banco.consultar(`SELECT * FROM usuarios${filtro} ORDER BY id`);
  return usuarios.map((usuario) => ({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    cargo: usuario.cargo,
    perfil: usuario.perfil,
    ativo: Boolean(usuario.ativo),
  }));
}

function mapearUsuario(usuario) {
  if (!usuario) return null;
  return {
    ...usuario,
    ativo: Boolean(usuario.ativo),
    bloqueado_until: usuario.bloqueado_until ? new Date(usuario.bloqueado_until) : null,
  };
}

async function buscarUsuarioPorId(id) {
  const [usuario] = await banco.consultar('SELECT * FROM usuarios WHERE id = ?', [Number(id)]);
  return mapearUsuario(usuario);
}

async function buscarUsuarioPorEmail(email) {
  const [usuario] = await banco.consultar('SELECT * FROM usuarios WHERE email = ?', [email]);
  return mapearUsuario(usuario);
}

async function atualizarStatusLogin(email, tentativasFalhas, bloqueadoUntil) {
  await banco.executar(
    'UPDATE usuarios SET tentativas_falhas = ?, bloqueado_until = ? WHERE email = ?',
    [tentativasFalhas, bloqueadoUntil, email],
  );
  return buscarUsuarioPorEmail(email);
}

async function atualizarUsuario(id, dadosParaAtualizar) {
  return banco.executarEmTransacao(async () => {
    const usuarioAtual = await buscarUsuarioPorId(id);
    if (
      usuarioAtual?.ativo &&
      usuarioAtual.perfil === 'GERENTE' &&
      dadosParaAtualizar.perfil &&
      dadosParaAtualizar.perfil !== 'GERENTE'
    ) {
      const [{ total }] = await banco.consultar(
        'SELECT COUNT(*) AS total FROM usuarios WHERE ativo = 1 AND perfil = ?',
        ['GERENTE'],
      );
      if (total <= 1) return { ultimoGerenteProtegido: true };
    }

    const campos = [];
    const valores = [];
    for (const campo of ['nome', 'email', 'cargo', 'perfil']) {
      if (Object.prototype.hasOwnProperty.call(dadosParaAtualizar, campo)) {
        campos.push(`${campo} = ?`);
        valores.push(dadosParaAtualizar[campo]);
      }
    }
    if (campos.length) {
      valores.push(Number(id));
      await banco.executar(`UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`, valores);
    }
    return { usuario: await buscarUsuarioPorId(id) };
  });
}

async function desativarUsuario(id) {
  return banco.executarEmTransacao(async () => {
    const usuario = await buscarUsuarioPorId(id);
    if (usuario?.ativo && usuario.perfil === 'GERENTE') {
      const [{ total }] = await banco.consultar(
        'SELECT COUNT(*) AS total FROM usuarios WHERE ativo = 1 AND perfil = ?',
        ['GERENTE'],
      );
      if (total <= 1) return { ultimoGerenteProtegido: true };
    }
    await banco.executar('UPDATE usuarios SET ativo = 0 WHERE id = ?', [Number(id)]);
    return { usuario: await buscarUsuarioPorId(id) };
  });
}

async function reativarUsuario(id) {
  await banco.executar('UPDATE usuarios SET ativo = 1 WHERE id = ?', [Number(id)]);
  return buscarUsuarioPorId(id);
}

async function atualizarSenha(id, novaSenhaHash) {
  await banco.executar(
    'UPDATE usuarios SET senha_hash = ?, tentativas_falhas = 0, bloqueado_until = NULL WHERE id = ?',
    [novaSenhaHash, Number(id)],
  );
  return buscarUsuarioPorId(id);
}

async function criarUsuario({ nome, email, cargo, perfil, senha }) {
  const senhaHash = bcrypt.hashSync(senha, 10);
  const resultado = await banco.executar(
    'INSERT INTO usuarios (nome, email, senha_hash, cargo, perfil, ativo, tentativas_falhas, bloqueado_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [nome, email, senhaHash, cargo, perfil, 1, 0, null],
  );
  return {
    id: resultado.insertId,
    nome,
    email,
    senha_hash: senhaHash,
    cargo,
    perfil,
    ativo: true,
    tentativas_falhas: 0,
    bloqueado_until: null,
  };
}

module.exports = {
  listarUsuarios,
  buscarUsuarioPorId,
  buscarUsuarioPorEmail,
  atualizarStatusLogin,
  atualizarUsuario,
  desativarUsuario,
  reativarUsuario,
  atualizarSenha,
  criarUsuario,
};
