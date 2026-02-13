// Procure no seu index.html a linha que tem:
// const { data, error } = await supabaseClient

// SUBSTITUA TODO O BLOCO try/catch por:

try {
  // Enviar para o backend (seguro!)
  console.log('📤 Enviando para API:', leadData)
  
  const response = await fetch('http://localhost:4000/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(leadData)
  })

  const result = await response.json()
  
  console.log('📥 Resposta da API:', result)

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao enviar formulário')
  }

  console.log('✅ Lead salvo com sucesso! ID:', result.leadId)

  successDiv.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-3xl">🎉</span>
      <div>
        <div class="font-bold text-lg mb-1">Formulário enviado com sucesso!</div>
        <div class="text-sm opacity-90">Nossa equipe entrará em contato em até 24 horas.</div>
      </div>
    </div>
  `
  successDiv.classList.remove('hidden')
  
  form.reset()
  successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' })

} catch (error) {
  console.error('❌ Erro:', error)
  
  errorDiv.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-2xl">❌</span>
      <div>
        <div class="font-bold mb-1">Erro ao enviar formulário</div>
        <div class="text-sm">${error.message}</div>
      </div>
    </div>
  `
  errorDiv.classList.remove('hidden')
  errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
