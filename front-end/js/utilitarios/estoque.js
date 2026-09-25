export function estaEmAlerta(produto) {
  const estoqueAtual = Number(produto?.estoque_atual || 0);
  const estoqueMinimo = Number(produto?.estoque_minimo ?? 5);
  return estoqueAtual <= estoqueMinimo;
}
