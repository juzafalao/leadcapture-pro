#!/bin/bash

echo "🔍 ========================================="
echo "   DIAGNÓSTICO DE PERFORMANCE"
echo "=========================================="
echo ""

cd "$(dirname "$0")/.."

echo "1️⃣ Procurando useEffect sem cleanup..."
grep -rn "useEffect" frontend/dashboard-admin/src/pages/ | grep -v "return () =>" | wc -l
echo "   ↳ useEffects sem cleanup encontrados"
echo ""

echo "2️⃣ Procurando setInterval/setTimeout..."
grep -rn "setInterval\|setTimeout" frontend/dashboard-admin/src/pages/ | wc -l
echo "   ↳ Timers encontrados"
echo ""

echo "3️⃣ Procurando addEventListener..."
grep -rn "addEventListener" frontend/dashboard-admin/src/ | wc -l
echo "   ↳ Event listeners encontrados"
echo ""

echo "4️⃣ Procurando queries Supabase em loops..."
grep -rn "\.map.*supabase" frontend/dashboard-admin/src/pages/ | wc -l
echo "   ↳ Queries dentro de loops"
echo ""

echo "5️⃣ Páginas mais pesadas (linhas de código)..."
find frontend/dashboard-admin/src/pages -name "*.jsx" -exec wc -l {} \; | sort -rn | head -5
echo ""

echo "6️⃣ Componentes sem React.memo..."
grep -L "React.memo\|memo" frontend/dashboard-admin/src/components/**/*.jsx 2>/dev/null | wc -l
echo "   ↳ Componentes sem otimização"
echo ""

echo "✅ Diagnóstico completo!"
