import { useLeads } from './hooks/useLeads'

export default function App() {
  const { data: leads, isLoading, error } = useLeads()

  if (isLoading) return <div className="p-8">Carregando...</div>
  if (error) return <div className="p-8 text-red-400">Erro ao carregar leads</div>

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <h1 className="text-3xl font-bold mb-6">LeadCapture Pro</h1>

      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700 text-left">
            <tr>
              <th className="p-4">Nome</th>
              <th className="p-4">Email</th>
              <th className="p-4">Telefone</th>
              <th className="p-4">Fonte</th>
              <th className="p-4">Categoria</th>
            </tr>
          </thead>
          <tbody>
            {leads?.map((lead) => (
              <tr key={lead.id} className="border-t border-slate-700">
                <td className="p-4">{lead.nome || '-'}</td>
                <td className="p-4">{lead.email || '-'}</td>
                <td className="p-4">{lead.telefone || '-'}</td>
                <td className="p-4">{lead.fonte}</td>
                <td className="p-4">{lead.categoria}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
