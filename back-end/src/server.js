const app = require("./app");
const conexaoBanco = require("./repositorios/conexaoBanco");

const PORT = process.env.PORT || 3000;

function resetState() {
  conexaoBanco.resetarBanco();
}

async function startServer() {
  try {
    // Valida se o banco SQLite foi instanciado e responde a uma consulta básica
    const db = conexaoBanco.getDb();
    db.prepare("SELECT 1").get();
    
    console.log("Conexão com SQLite estabelecida com sucesso! ✔️");

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT} 🚀`);
      console.log(`Rotas MVC ativas e escutando!`);
    });
  } catch (err) {
    console.error("Erro fatal ao conectar ao banco de dados:", err);
    process.exit(1);
  }
}

// Executa o servidor apenas quando o arquivo é chamado diretamente (não nos testes)
if (require.main === module) {
  startServer();
}

module.exports = { app, resetState };