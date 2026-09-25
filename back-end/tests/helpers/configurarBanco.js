const banco = require('../../src/repositorios/conexaoBanco');

function configurarBanco(test) {
  test.beforeEach(async () => {
    await banco.inicializarBanco();
    await banco.resetarBancoParaTestes();
  });
  test.after(async () => banco.fecharBanco());
}

module.exports = configurarBanco;
