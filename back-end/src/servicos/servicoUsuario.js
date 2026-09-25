const bcrypt = require('bcryptjs');
const repositorio = require('../repositorios/repositorioUsuario');

const PERFIS_VALIDOS = ['OPERACIONAL', 'ANALISTA', 'GERENTE'];
const CAMPOS_EDITAVEIS = ['nome', 'email', 'cargo', 'perfil'];

function respostaErro(statusCode, mensagem) {
  return { statusCode, payload: { status: 'erro', mensagem } };
}

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
      if (typeof valor !== 'string' || !valor.trim()) return { erro: 'O nome é obrigatório e deve ser um texto.' };
      resultado.nome = valor.trim();
    } else if (campo === 'email') {
      if (typeof valor !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())) {
        return { erro: 'Informe um e-mail válido.' };
      }
      resultado.email = valor.trim().toLowerCase();
    } else if (campo === 'cargo') {
      if (valor !== null && typeof valor !== 'string') return { erro: 'O cargo deve ser um texto.' };
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

function buscarUsuarioPorId(id) {
  if (!Number.isInteger(Number(id)) || Number(id) < 1) return null;
  return repositorio.buscarUsuarioPorId(id);
}

function atualizarUsuario(id, dadosParaAtualizar) {
  const usuario = buscarUsuarioPorId(id);
  if (!usuario) return respostaErro(404, 'Usuário não encontrado');

  const validacao = validarUsuario(dadosParaAtualizar, { parcial: true });
  if (validacao.erro) return respostaErro(400, validacao.erro);

  const dados = validacao.dados;
  if (dados.email) {
    const existe = repositorio.buscarUsuarioPorEmail(dados.email);
    if (existe && existe.id !== usuario.id) return respostaErro(409, 'E-mail já cadastrado');
  }

  const resultado = repositorio.atualizarUsuario(id, dados);
  if (resultado.ultimoGerenteProtegido) {
    return respostaErro(409, 'Não é possível remover ou desativar o último gerente ativo.');
  }

  return {
    statusCode: 200,
    payload: { status: 'sucesso', mensagem: 'Usuário atualizado com sucesso', dados: resultado.usuario }
  };
}

function desativarUsuario(id, solicitanteId) {
  const usuario = buscarUsuarioPorId(id);
  if (!usuario) return respostaErro(404, 'Usuário não encontrado');
  if (usuario.id === Number(solicitanteId)) return respostaErro(400, 'Não é permitido desativar a própria conta.');

  const resultado = repositorio.desativarUsuario(id);
  if (resultado.ultimoGerenteProtegido) {
    return respostaErro(409, 'Não é possível desativar o último gerente ativo.');
  }
  return {
    statusCode: 200,
    payload: { status: 'sucesso', mensagem: 'Usuário desativado com sucesso', dados: resultado.usuario }
  };
}

function reativarUsuario(id) {
  const usuario = buscarUsuarioPorId(id);
  if (!usuario) return respostaErro(404, 'Usuário não encontrado');
  return {
    statusCode: 200,
    payload: { status: 'sucesso', mensagem: 'Usuário reativado com sucesso', dados: repositorio.reativarUsuario(id) }
  };
}

function salvarNovaSenha(id, novaSenha) {
  if (!validarSenha(novaSenha)) {
    return respostaErro(400, 'A nova senha deve ter pelo menos 6 caracteres.');
  }
  const usuario = buscarUsuarioPorId(id);
  if (!usuario) return respostaErro(404, 'Usuário não encontrado');

  repositorio.atualizarSenha(id, bcrypt.hashSync(novaSenha, 10));
  return {
    statusCode: 200,
    payload: { status: 'sucesso', mensagem: 'Senha alterada com sucesso', dados: { senha_alterada: true } }
  };
}

function trocarSenha(id, senhaAtual, novaSenha) {
  if (typeof senhaAtual !== 'string') {
    return respostaErro(400, 'As senhas são obrigatórias e devem ser textos.');
  }

  const usuario = buscarUsuarioPorId(id);
  if (!usuario) return respostaErro(404, 'Usuário não encontrado');
  if (!bcrypt.compareSync(senhaAtual, usuario.senha_hash)) return respostaErro(400, 'Senha atual incorreta');

  return salvarNovaSenha(id, novaSenha);
}

function redefinirSenha(id, novaSenha, solicitanteId) {
  if (Number(id) === Number(solicitanteId)) {
    return respostaErro(400, 'Use a rota de troca da própria senha.');
  }
  return salvarNovaSenha(id, novaSenha);
}

function criarUsuario(data) {
  const validacao = validarUsuario(data);
  if (validacao.erro) return respostaErro(400, validacao.erro);
  if (!validarSenha(data.senha)) return respostaErro(400, 'A senha deve ter pelo menos 6 caracteres.');

  const existe = repositorio.buscarUsuarioPorEmail(validacao.dados.email);
  if (existe) return respostaErro(409, 'E-mail já cadastrado');

  const usuario = repositorio.criarUsuario({ ...validacao.dados, senha: data.senha });
  return {
    statusCode: 201,
    payload: { status: 'sucesso', mensagem: 'Usuário cadastrado com sucesso', dados: { id: usuario.id } }
  };
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
  criarUsuario
};
