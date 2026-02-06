# ✅ Checklist Pré-Sprint 1

Execute esta checklist ANTES de começar qualquer alteração:

## 1. Preparação do Ambiente

- [ ] Node.js 18+ instalado
- [ ] Git configurado corretamente
- [ ] Acesso ao Supabase confirmado
- [ ] .env.local configurado e testado
- [ ] Aplicação rodando localmente sem erros

## 2. Backups

- [ ] Executar `./scripts/backup-all.sh`
- [ ] Verificar que backups foram criados em `./backups/`
- [ ] Confirmar tamanho dos backups (devem ter alguns MB)
- [ ] Testar que consegue listar backups: `ls -lh backups/database/*.gz`

## 3. Git

- [ ] Commitar todas as mudanças pendentes
- [ ] Verificar status: `git status` (deve estar limpo)
- [ ] Push para GitHub: `git push origin main`
- [ ] Verificar que branch de backup foi criada

## 4. Supabase

- [ ] Acesso ao dashboard confirmado
- [ ] SQL Editor funcionando
- [ ] RLS (Row Level Security) ativo e testado
- [ ] Conexão via DATABASE_URL funcionando (se disponível)

## 5. Dependências

- [ ] `- [ ] `- [ ] `- [ ] `- [ ] `- [ ] `- ] - [ ] `- [ ] `- [ ] `- [ ] `ação
- [ ] Nenhum erro no console do browser

## 6. Documentaçã## 6. Documentaçã## 6. Docu co## 6. Documentaçã## 6. DRESSO_ATUAL.md commitado
- [ ] Issues- [ ] Issues- [ ] Issues- # 7. Comunicação

- [ ] Time/stakeholders avisa- [ ] Time/stakeholders avisa- [ ] Time/sta] Janela de tempo de- [ ] Time/stakeholders avisa- [ ] Timelb- [ ] Time/stakeholders avo pronto?

Se todos os itens estão marcados, você está pronto para começar a Sprint 1!Se todos os itens estão marcados, você está pronto para começar a Sos!Se todosmeçar a Sprint 1!"
```

## 🆘 Se algo falhar## 🆘 Se algo falhar## 🆘 Se algo falhar## 🆘 Setigue o erro
3. Corrija o problema
4. Execute os backups novamente
5. Só continue quando TODOS os backups estiverem OK
