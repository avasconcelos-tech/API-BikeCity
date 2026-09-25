import {checarAutenticacao,obterUsuarioLogado} from '../utilitarios/auth.js';
import {getProdutos,postProduto,putProduto,getFornecedores} from '../api/services.js';
import {mostrarToast,configurarModal,abrirModal,fecharModal} from '../utilitarios/ui.js';
if(!checarAutenticacao())throw new Error('Não autenticado');
const $=id=>document.getElementById(id),modal=$('modal-produto');
document.querySelectorAll('.btn-close').forEach((botao)=>botao.setAttribute('aria-label','Fechar'));
function associarLabels(container){container.querySelectorAll('label:not([for])').forEach(label=>{const campo=label.querySelector('input,select,textarea')||label.nextElementSibling;if(campo?.id)label.htmlFor=campo.id;});}
associarLabels(modal);
const fecharProduto=()=>fecharModal(modal,'btn-novo-produto');
configurarModal(modal,fecharProduto);
$('btn-novo-produto').onclick=async()=>{await carregarFornecedores();abrirModal(modal,'nome');};$('btn-fechar-modal').onclick=fecharProduto;
async function carregarFornecedores(){const r=await getFornecedores();$('fornecedor_id').innerHTML='<option value="">Selecione...</option>'+(r.dados||[]).map(f=>`<option value="${f.id}">${f.nome}</option>`).join('');}
const usuario=obterUsuarioLogado();
const podeEditar=usuario?.perfil==='ANALISTA'||usuario?.perfil==='GERENTE';
const modalEdicao=$('modal-editar-produto');
let produtoEmEdicao=null;
function abrirEdicao(produto){produtoEmEdicao=produto;$('editar-nome').value=produto.nome||'';$('editar-categoria').value=produto.categoria||'';$('editar-localizacao').value=produto.localizacao_deposito||'';$('editar-custo').value=produto.custo??0;modalEdicao.classList.add('active');}
async function carregarProdutos(){try{const r=await getProdutos();const lista=r.dados||[];$('tbody-produtos').innerHTML=lista.map(p=>`<tr><td>${p.id}</td><td>${p.codigo_interno||'-'}</td><td>${p.nome}</td><td>${p.categoria}</td><td>${p.localizacao_deposito||'-'}</td><td>R$ ${Number(p.custo||0).toFixed(2).replace('.',',')}</td><td>${p.estoque_atual}</td><td>${Number(p.estoque_atual||0)<=5?'Baixo':'Normal'}</td>${podeEditar?`<td><button type="button" class="btn-editar-produto" data-produto-id="${p.id}">Editar</button></td>`:''}</tr>`).join('')||`<tr><td colspan="${podeEditar?9:8}">Nenhum produto cadastrado.</td></tr>`;$('tbody-produtos').querySelectorAll('.btn-editar-produto').forEach(botao=>botao.addEventListener('click',()=>abrirEdicao(lista.find(p=>p.id===Number(botao.dataset.produtoId)))));}catch(e){console.error(e);}}
$('form-produto').onsubmit=async e=>{e.preventDefault();const dados={nome:$('nome').value,codigo_interno:$('codigo_interno').value,categoria:$('categoria').value,unidade_medida:$('unidade_medida').value,custo:Number($('custo').value),fornecedor_id:Number($('fornecedor_id').value),localizacao_deposito:$('localizacao_deposito').value,estado_montagem:$('estado_montagem').value,tipo_rastreabilidade:$('tipo_rastreabilidade').value,dimensoes:$('dimensoes').value};const botao=e.target.querySelector('button[type="submit"]');botao.disabled=true;try{await postProduto(dados);mostrarToast('Produto cadastrado com sucesso!');e.target.reset();fecharProduto();carregarProdutos();}catch(err){mostrarToast(err.message||'Erro ao cadastrar produto.','erro');}finally{botao.disabled=false;}};
if(obterUsuarioLogado()?.perfil!=='GERENTE'&&obterUsuarioLogado()?.perfil!=='ANALISTA')$('btn-novo-produto').style.display='none';carregarProdutos();
if(!podeEditar){modalEdicao.remove();}else{const fecharEdicao=()=>fecharModal(modalEdicao,'btn-novo-produto');associarLabels(modalEdicao);configurarModal(modalEdicao,fecharEdicao);$('btn-fechar-edicao').onclick=fecharEdicao;$('form-editar-produto').onsubmit=async e=>{e.preventDefault();const botao=e.target.querySelector('button[type="submit"]');botao.disabled=true;try{await putProduto(produtoEmEdicao.id,{nome:$('editar-nome').value,categoria:$('editar-categoria').value,localizacao_deposito:$('editar-localizacao').value,custo:Number($('editar-custo').value)});mostrarToast('Produto atualizado com sucesso!');fecharEdicao();await carregarProdutos();}catch(err){mostrarToast(err.message||'Erro ao editar produto.','erro');}finally{botao.disabled=false;}};}
