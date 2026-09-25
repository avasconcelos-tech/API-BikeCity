const express = require('express');
const cors = require('cors');
const path = require('path');

// Importação das Rotas
const rotasAutenticacao = require('./rotas/rotasAutenticacao');
const rotasUsuario = require('./rotas/rotasUsuario');
const rotasProduto = require('./rotas/rotasProduto');
const rotasEstoque = require('./rotas/rotasEstoque');
const rotasUpload = require('./rotas/rotasUpload');
const rotasFornecedor = require('./rotas/rotasFornecedor');
const rotasDashboard = require('./rotas/rotasDashboard');
const tratarErros = require('./middlewares/tratarErros');

const app = express();

// Middlewares Globais
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json());

// Arquivos Estáticos (Uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../../front-end')));

// Rota de Healthcheck / Status
app.get('/', (req, res) => {
  res.json({ mensagem: 'API BikeCity rodando com sucesso! 🚀' });
});

// Registros dos Endpoints da API
app.use('/api/v1/auth', rotasAutenticacao);
app.use('/api/v1/usuarios', rotasUsuario);
app.use('/api/v1/produtos', rotasProduto);
app.use('/api/v1/fornecedores', rotasFornecedor);
app.use('/api/v1/estoque', rotasEstoque);
app.use('/api/v1/dashboard', rotasDashboard);
app.use('/api/v1/uploads', rotasUpload);

// Middleware Global de Tratamento de Erros (Sempre no final)
app.use(tratarErros);

module.exports = app;
