import { checarAutenticacao } from '../utilitarios/auth.js';
import { getRelatorio } from '../api/services.js';

if (!checarAutenticacao()) throw new Error('Não autenticado');

const $ = (id) => document.getElementById(id);
const resposta = await getRelatorio();
const dados = resposta.dados;
const estoque = dados.estoque || [];

function estaEmAlerta(produto) {
    return Number(produto.estoque_atual || 0) <= Math.max(
        Number(produto.estoque_minimo || 0),
        Number(produto.demanda_prevista || 0)
    );
}

const produtosEmAlerta = estoque.filter(estaEmAlerta);

$('r-produtos').textContent = estoque.length;
$('r-movs').textContent = (dados.movimentacoes || []).length;
$('r-alertas').textContent = produtosEmAlerta.length;
$('tbody-relatorio').innerHTML = estoque.map((produto) => {
    const alerta = estaEmAlerta(produto);
    return `<tr><td>${produto.nome}</td><td>${produto.categoria}</td><td>${produto.estoque_atual}</td><td>${produto.estoque_minimo}</td><td>R$ ${Number(produto.custo || 0).toFixed(2).replace('.', ',')}</td><td>${produto.localizacao_deposito || '-'}</td><td>${alerta ? 'Baixo' : 'Normal'}</td></tr>`;
}).join('');
$('btn-imprimir').onclick = () => window.print();
