const bcrypt = require('bcryptjs');
const repositorio = require('../repositorios/repositorioUsuario');
const ErroNegocio = require('../erros/ErroNegocio');

const PERFIS_VALIDOS = ['OPERACIONAL', 'ANALISTA', 'GERENTE'];
const CAMPOS_EDITAVEIS = ['nome', 'email', 'cargo', 'perfil'];

function validarUsuario(dados, { parcial = false } = {}) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    return { erro: 'Os dados do usuário devem ser um objeto.' };
  }

  const resultado = {};
  const camposObrigatorios = parcial ? [] : ['nome', 'email', 'perfil'];
  for (const campo of camposObrigatorios) {
    if (!Object.prototype.hasOwnProperty.call(dados, campo)) {
      return { erro: `O campo ${campo} é obrigatório.` };
    }
  }

  if (!parcial && !Object.prototype.hasOwnProperty.call(dados, 'cargo')) {
    resultado.cargo = null;
  }

  for (const campo of CAMPOS_EDITAVEIS) {
    if (!Object.prototype.hasOwnProperty.call(dados, campo)) continue;
    const valor = dados[campo];

    if (campo === 'nome') {
      if (typeof valor !== 'string' || !valor.trim())
        return { erro: 'O nome é obrigatório e deve ser um texto.' };
      resultado.nome = valor.trim();
    } else if (campo === 'email') {
      if (typeof valor !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())) {
        return { erro: 'Informe um e-mail válido.' };
      }
      resultado.email = valor.trim().toLowerCase();
    } else if (campo === 'cargo') {
      if (valor !== null && typeof valor !== 'string')
        return { erro: 'O cargo deve ser um texto.' };
      resultado.cargo = typeof valor === 'string' ? valor.trim() : null;
    } else {
      if (typeof valor !== 'string' || !PERFIS_VALIDOS.includes(valor.trim().toUpperCase())) {
        return { erro: `O perfil deve ser um dos seguintes: ${PERFIS_VALIDOS.join(', ')}.` };
      }
      resultado.perfil = valor.trim().toUpperCase();
    }
  }

  if (parcial && !Object.keys(resultado).length) {
    return { erro: 'Informe ao menos um campo válido para atualizar.' };
  }

  return { dados: resultado };
}

function validarSenha(senha) {
  return typeof senha === 'string' && senha.trim().length >= 6;
}

function listarUsuarios(incluirInativos = false) {
  return repositorio.listarUsuarios(incluirInativos);
}

async function buscarUsuarioPorId(id) {
  if (!Number.isInteger(Number(id)) || Number(id) < 1)
    throw new ErroNegocio(404, 'Usuário não encontrado');
  const usuario = await repositorio.buscarUsuarioPorId(id);
  if (!usuario) throw new ErroNegocio(404, 'Usuário não encontrado');
  return usuario;
}

async function atualizarUsuario(id, dadosParaAtualizar) {
  const usuario = await buscarUsuarioPorId(id);
  if (!usuario) throw new ErroNegocio(404, 'Usuário não encontrado');

  const validacao = validarUsuario(dadosParaAtualizar, { parcial: true });
  if (validacao.erro) throw new ErroNegocio(400, validacao.erro);

  const dados = validacao.dados;
  if (dados.email) {
    const existe = await repositorio.buscarUsuarioPorEmail(dados.email);
    if (existe && existe.id !== usuario.id) throw new ErroNegocio(409, 'E-mail já cadastrado');
  }

  const resultado = await repositorio.atualizarUsuario(id, dados);
  if (resultado.ultimoGerenteProtegido) {
    throw new ErroNegocio(409, 'Não é possível remover ou desativar o último gerente ativo.');
  }
  return resultado.usuario;
}

async function desativarUsuario(id, solicitanteId) {
  const usuario = await buscarUsuarioPorId(id);
  if (!usuario) throw new ErroNegocio(404, 'Usuário não encontrado');
  if (usuario.id === Number(solicitanteId))
    throw new ErroNegocio(400, 'Não é permitido desativar a própria conta.');

  const resultado = await repositorio.desativarUsuario(id);
  if (resultado.ultimoGerenteProtegido) {
    throw new ErroNegocio(409, 'Não é possível desativar o último gerente ativo.');
  }
  return resultado.usuario;
}

async function reativarUsuario(id) {
  const usuario = await buscarUsuarioPorId(id);
  if (!usuario) throw new ErroNegocio(404, 'Usuário não encontrado');
  return repositorio.reativarUsuario(id);
}

async function salvarNovaSenha(id, novaSenha) {
  if (!validarSenha(novaSenha)) {
    throw new ErroNegocio(400, 'A nova senha deve ter pelo menos 6 caracteres.');
  }
  const usuario = await buscarUsuarioPorId(id);
  if (!usuario) throw new ErroNegocio(404, 'Usuário não encontrado');

  await repositorio.atualizarSenha(id, bcrypt.hashSync(novaSenha, 10));
  return { senha_alterada: true };
}

async function trocarSenha(id, senhaAtual, novaSenha) {
  if (typeof senhaAtual !== 'string') {
    throw new ErroNegocio(400, 'As senhas são obrigatórias e devem ser textos.');
  }

  const usuario = await buscarUsuarioPorId(id);
  if (!usuario) throw new ErroNegocio(404, 'Usuário não encontrado');
  if (!bcrypt.compareSync(senhaAtual, usuario.senha_hash))
    throw new ErroNegocio(400, 'Senha atual incorreta');

  return salvarNovaSenha(id, novaSenha);
}

async function redefinirSenha(id, novaSenha, solicitanteId) {
  if (Number(id) === Number(solicitanteId)) {
    throw new ErroNegocio(400, 'Use a rota de troca da própria senha.');
  }
  return salvarNovaSenha(id, novaSenha);
}

async function criarUsuario(data) {
  const validacao = validarUsuario(data);
  if (validacao.erro) throw new ErroNegocio(400, validacao.erro);
  if (!validarSenha(data.senha))
    throw new ErroNegocio(400, 'A senha deve ter pelo menos 6 caracteres.');

  const existe = await repositorio.buscarUsuarioPorEmail(validacao.dados.email);
  if (existe) throw new ErroNegocio(409, 'E-mail já cadastrado');

  const usuario = await repositorio.criarUsuario({ ...validacao.dados, senha: data.senha });
  return { id: usuario.id };
}

module.exports = {
  listarUsuarios,
  buscarUsuarioPorId,
  validarUsuario,
  atualizarUsuario,
  desativarUsuario,
  reativarUsuario,
  trocarSenha,
  redefinirSenha,
  criarUsuario,
};
