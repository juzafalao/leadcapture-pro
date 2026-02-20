#!/bin/bash
cd /Users/julianazafalao/Projetos/leadcapture-pro
echo "🔍 Memory Leaks:"
grep -rn "useEffect" frontend/dashboard-admin/src/pages/*.jsx | grep -v "return () =>"
echo ""
echo "⏱️ Timers:"
grep -rn "setInterval\|setTimeout" frontend/dashboard-admin/src/pages/*.jsx
