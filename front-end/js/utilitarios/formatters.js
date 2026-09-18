export function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor || 0);
}

export function formatarData(dataIso) {
    if (!dataIso) return '-';
    return new Date(dataIso).toLocaleString('pt-BR');
}