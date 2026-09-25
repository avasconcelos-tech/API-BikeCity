class ErroNegocio extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.name = 'ErroNegocio';
    this.status = status;
  }
}

module.exports = ErroNegocio;