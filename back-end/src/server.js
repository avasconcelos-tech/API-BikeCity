const app = require("./app");
const conexaoBanco = require("./repositorios/conexaoBanco");
const os = require("os");

const PORT = process.env.PORT || 5500;

function resetState() {
  conexaoBanco.resetarBanco();
}

async function startServer() {
  try {
    // Valida se o banco SQLite foi instanciado e responde a uma consulta básica
    const db = conexaoBanco.getDb();
    db.prepare("SELECT 1").get();

    console.log("Conexão com SQLite estabelecida com sucesso! ✔️");

    const HOST = process.env.HOST || "0.0.0.0";

    app.listen(PORT, HOST, () => {
      console.log(`Servidor rodando em ${HOST}:${PORT} 🚀`);
      console.log(`Acesso local: http://localhost:${PORT}/login.html`);

      const interfaces = os.networkInterfaces();
      const enderecos = [];
      for (const lista of Object.values(interfaces)) {
        for (const item of lista || []) {
          if (item.family === "IPv4" && !item.internal)
            enderecos.push(item.address);
        }
      }

      if (enderecos.length) {
        console.log("Acesso pela rede local:");
        enderecos.forEach((ip) =>
          console.log(`  http://${ip}:${PORT}/login.html`),
        );
      }
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
