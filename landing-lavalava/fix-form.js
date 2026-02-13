// Procurar no HTML a linha que tem:
// mensagem: formData.get('mensagem') || 'Interesse em franquia Lava Lava',

// Substituir para colocar mensagem dentro de metadata:

const leadData = {
  tenant: 'lava-lava',
  nome: formData.get('nome'),
  email: formData.get('email'),
  telefone: telefone,
  cidade: formData.get('cidade'),
  estado: formData.get('estado'),
  metadata: {
    capital: capital,
    capital_formatado: formData.get('capital'),
    mensagem: formData.get('mensagem') || 'Interesse em franquia Lava Lava',
    origem: 'landing-page',
    url: window.location.href
  },
  score: capital >= 300000 ? 90 : capital >= 150000 ? 80 : capital >= 80000 ? 70 : 60,
  status: 'new'
}
