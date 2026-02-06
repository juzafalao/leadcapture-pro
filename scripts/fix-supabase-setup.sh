#!/usr/bin/env bash
set -euo pipefail

# Script: fix-supabase-setup.sh
# Uso: na raiz do repositório: ./scripts/fix-supabase-setup.sh
#
# O que faz:
#  - Faz backup do ./env (se existir) -> ./env.backup.TIMESTAMP
#  - Cria ./env (frontend) com VITE_... públicos extraídos do ./env backup
#  - Cria ./env.server com variáveis secretas (service key, DB password, etc)
#  - Faz backup de dashboard/src/App.jsx
#  - Remove declarações duplicadas de createClient/supabase em App.jsx
#  - Insere import { supabase } from './lib/supabaseClient' se necessário
#  - Cria dashboard/src/lib/supabaseClient.js (Vite: import.meta.env)
#  - Atualiza .gitignore para ignorar arquivos server-only
#
# Revise backups e depois comite as mudanças desejadas.

ROOT_DIR="$(pwd)"
TS="$(date +%Y%m%d%H%M%S)"

echo "Exec: fix-supabase-setup.sh"
echo "Working dir: ${ROOT_DIR}"
echo ""

# --- Paths
APP_FILE="dashboard/src/App.jsx"
LIB_DIR="dashboard/src/lib"
SUPABASE_CLIENT_FILE="${LIB_DIR}/supabaseClient.js"
ENV_FILE="./env"
FRONTEND_ENV_FILE="./.env"           # frontend file used by Vite
SERVER_ENV_FILE="./.env.server"      # local server-only env (will be gitignored)
GITIGNORE_FILE="./.gitignore"

# 1) Backup existing env file (if present)
if [ -f "${ENV_FILE}" ]; then
  ENV_BACKUP="${ENV_FILE}.backup.${TS}"
  echo "Backing up existing ${ENV_FILE} -> ${ENV_BACKUP}"
  cp "${ENV_FILE}" "${ENV_BACKUP}"
else
  echo "No ${ENV_FILE} found to backup."
fi

# 2) Parse env backup to extract keys
echo ""
echo "Building frontend .env (VITE_) and server .env.server from backup (if present)..."
VITE_SUPABASE_URL=""
VITE_SUPABASE_ANON_KEY=""
SERVICE_KEY_LINES=()
OTHER_SECRET_LINES=()

if [ -f "${ENV_FILE}.backup.${TS}" ]; then
  # Read each non-empty, non-comment line and categorize
  while IFS= read -r line || [ -n "$line" ]; do
    # skip empty or commented lines
    [[ -z "${line// }" ]] && continue
    [[ "${line#"${line%%[![:space:]]*}"}" = \#* ]] && continue

    # Trim spaces
    LTRIM="$(echo "$line" | sed -e 's/^[[:space:]]*//')"
    KEY="$(echo "$LTRIM" | cut -d= -f1)"
    VAL="$(echo "$LTRIM" | cut -d= -f2-)"
    case "$KEY" in
      SUPABASE_URL)
        VITE_SUPABASE_URL="$VAL"
        ;;
      SUPABASE_ANON_KEY)
        VITE_SUPABASE_ANON_KEY="$VAL"
        ;;
      SUPABASE_SERVICE_KEY|SUPABASE_DB_PASSWORD|N8N_USER|N8N_PASSWORD|DB_PASSWORD|DATABASE_URL)
        SERVICE_KEY_LINES+=("${KEY}=${VAL}")
        ;;
      *)
        # if the key looks secret (contains KEY|SECRET|PASSWORD|TOKEN) move to server file, else keep in server too
        if echo "$KEY" | egrep -i "KEY|SECRET|PASSWORD|TOKEN" >/dev/null; then
          SERVICE_KEY_LINES+=("${KEY}=${VAL}")
        else
          OTHER_SECRET_LINES+=("${KEY}=${VAL}")
        fi
        ;;
    esac
  done < "${ENV_FILE}.backup.${TS}"
fi

# 3) Write frontend .env for Vite
echo ""
echo "Writing frontend env -> ${FRONTEND_ENV_FILE}"
cat > "${FRONTEND_ENV_FILE}" <<EOF
# Frontend env for Vite (public keys only)
# DO NOT put secrets here. Only VITE_ prefixed public keys.
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
EOF

echo "Wrote ${FRONTEND_ENV_FILE}"

# 4) Write server .env.server with secrets
echo ""
echo "Writing server-only env -> ${SERVER_ENV_FILE}"
{
  echo "# Server-only environment (do NOT commit)"
  if [ ${#SERVICE_KEY_LINES[@]} -gt 0 ]; then
    for l in "${SERVICE_KEY_LINES[@]}"; do
      echo "$l"
    done
  fi
  if [ ${#OTHER_SECRET_LINES[@]} -gt 0 ]; then
    for l in "${OTHER_SECRET_LINES[@]}"; do
      echo "$l"
    done
  fi
} > "${SERVER_ENV_FILE}"

echo "Wrote ${SERVER_ENV_FILE}"

# 5) Ensure .gitignore contains entries to ignore server env files
echo ""
echo "Updating .gitignore to ignore server env files..."
GITIGNORE_ADDITIONS=(
  ".env.server"
  ".env.*-server"
  ".env.local"
  ".env.local.*"
)

touch "${GITIGNORE_FILE}"
for pattern in "${GITIGNORE_ADDITIONS[@]}"; do
  if ! grep -Fxq "${pattern}" "${GITIGNORE_FILE}"; then
    echo "${pattern}" >> "${GITIGNORE_FILE}"
    echo "Added to .gitignore: ${pattern}"
  else
    echo ".gitignore already contains: ${pattern}"
  fi
done

# 6) Create lib dir and supabase client for Vite
echo ""
echo "Creating supabase client file at ${SUPABASE_CLIENT_FILE}..."
mkdir -p "${LIB_DIR}"

cat > "${SUPABASE_CLIENT_FILE}" <<'JS'
import { createClient } from '@supabase/supabase-js'

// Vite: use import.meta.env for client-side public keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase config not found. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no seu .env')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
JS

echo "Created ${SUPABASE_CLIENT_FILE}"

# 7) Modify App.jsx: remove duplicate createClient & const supabase declarations and import the client
if [ -f "${APP_FILE}" ]; then
  echo ""
  echo "Backing up ${APP_FILE} -> ${APP_FILE}.bak.${TS}"
  cp "${APP_FILE}" "${APP_FILE}.bak.${TS}"

  echo "Removing local createClient/supabase declarations and import { createClient } if present..."

  # Remove any import that imports createClient from @supabase/supabase-js
  # Use sed to delete lines containing createClient import
  sed -i.bak -E "/import[[:space:]]+\{[^}]*createClient[^}]*\}[[:space:]]+from[[:space:]]+['\"]@supabase\/supabase-js['\"];?/d" "${APP_FILE}"

  # Remove any standalone lines defining supabaseUrl, supabaseKey or supabase using createClient
  sed -i.bak -E "/const[[:space:]]+supabaseUrl[[:space:]]*=/d" "${APP_FILE}"
  sed -i.bak -E "/const[[:space:]]+supabaseKey[[:space:]]*=/d" "${APP_FILE}"
  sed -i.bak -E "/createClient[[:space:]]*\(/d" "${APP_FILE}"
  sed -i.bak -E "/const[[:space:]]+supabase[[:space:]]*=/d" "${APP_FILE}"

  # Remove any leftover lines that exactly match comment markers added earlier (safety)
  sed -i.bak -E "/\\(inicializa.*src\\/lib\\/supabaseClient\\.js\\)/d" "${APP_FILE}" || true

  # Ensure import { supabase } from './lib/supabaseClient' exists after the other imports
  if ! grep -q "import { supabase } from './lib/supabaseClient'" "${APP_FILE}"; then
    # Insert import after the last import line (simple approach)
    awk -v toinsert="import { supabase } from './lib/supabaseClient'" '
      BEGIN { inserted=0 }
      {
        print $0
        if (!inserted && $0 ~ /^import / && (getline peek) ) {
          # we peek ahead until a non-import or EOF is found. push peek back.
          # but simpler: track last import position by buffering lines
          # instead do nothing here (we will insert after finishing printing imports)
        }
      }
    ' "${APP_FILE}" > "${APP_FILE}.tmp.$$"

    # Better approach: find last import line number
    last_import_line=$(nl -ba "${APP_FILE}" | awk '/^ *[0-9]+/ { if ($0 ~ /^ *[0-9]+[[:space:]]+import /) last=$1 } END { print last }')
    if [ -z "${last_import_line}" ] || [ "${last_import_line}" = "0" ]; then
      # no imports found, prepend
      printf "%s\n\n%s\n" "import { supabase } from './lib/supabaseClient'" "$(cat "${APP_FILE}")" > "${APP_FILE}.new"
    else
    
      # insert after last_import_line
      awk -v lineno="${last_import_line}" -v ins="import { supabase } from './lib/supabaseClient'" 'NR==lineno{ print; print ins; next } { print }' "${APP_FILE}" > "${APP_FILE}.new"
    fi

    mv "${APP_FILE}.new" "${APP_FILE}"
    echo "Inserted import { supabase } from './lib/supabaseClient' into ${APP_FILE}"
  else
    echo "Import of supabase client already present in ${APP_FILE}"
  fi

  # Clean temporary files
  rm -f "${APP_FILE}.tmp."* || true
  # Keep sed backups with .bak for inspection
  echo "Edits completed on ${APP_FILE}. Backup saved as ${APP_FILE}.bak.${TS} and sed backups ${APP_FILE}.bak"
else
  echo "Warning: ${APP_FILE} not found. Skipping App.jsx edits."
fi

# 8) Show git status of changed files
echo ""
echo "Files modified (git status):"
git status --porcelain || true

echo ""
echo "Done. Summary of actions:"
echo "- Created/updated: ${SUPABASE_CLIENT_FILE}"
echo "- Written frontend env (Vite): ${FRONTEND_ENV_FILE}"
echo "- Written server-only env (gitignored): ${SERVER_ENV_FILE}"
echo "- App.jsx backup: ${APP_FILE}.bak.${TS}"
echo "- Original env backup (if existed): ${ENV_FILE}.backup.${TS}"
echo "- .gitignore possibly updated"

echo ""
echo "IMPORTANT next steps:"
echo "1) Inspect the backups and the changes. If OK, commit them."
echo "2) Restart Vite dev server: npm run dev (or yarn dev). Vite reads .env at startup."
echo "3) If SUPABASE_SERVICE_KEY or DB password were exposed in the repo previously, rotate/revoke them in Supabase immediately."
echo "4) Do NOT commit .env.server. The script added .env.server to .gitignore."
echo ""
echo "If you want, poste aqui a saída do 'git diff' e eu reviso as alterações antes de você commitar."
