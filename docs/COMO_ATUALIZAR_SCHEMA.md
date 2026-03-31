# Como Atualizar o Schema do Banco

## Pré-requisitos
- Node.js instalado
- Acesso ao Supabase do projeto

## Passo a Passo

### 1. Configure o .env
Adicione no arquivo `.env` na raiz do projeto:
```
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.SEU_PROJECT_REF.supabase.co:5432/postgres
```
> Encontre em: Supabase → Project Settings → Database → Connection string → URI

### 2. Instale as dependências
```bash
npm install
```

### 3. Rode o script
```bash
npm run export-schema
```

### 4. Commit e faça push
```bash
git add supabase/scripts/DATABASE_SCHEMA.sql
git commit -m "chore: atualiza schema do banco - $(date +%Y-%m-%d)"
git push
```

O arquivo `supabase/scripts/DATABASE_SCHEMA.sql` será atualizado com a estrutura atual do banco.
