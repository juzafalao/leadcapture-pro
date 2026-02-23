#!/usr/bin/env python3
"""
Script: Atualiza main e faz build do frontend
Uso: python3 build_local.py
"""

import subprocess
import sys
import os
from pathlib import Path

# ─────────────────────────────────────────────
# CONFIGURAÇÕES
# ─────────────────────────────────────────────
BASE_DIR     = Path("/Users/julianazafalao/Projetos/leadcapture-pro")
FRONTEND_DIR = BASE_DIR / "frontend" / "dashboard-admin"

# Arquivos a ignorar no stash (não vão atrapalhar o pull)
IGNORAR = [
    "frontend/dashboard-admin/package-lock.json"
]

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────
class Cor:
    RESET    = "\033[0m"
    VERDE    = "\033[92m"
    AZUL     = "\033[94m"
    AMARELO  = "\033[93m"
    VERMELHO = "\033[91m"
    NEGRITO  = "\033[1m"

def log(msg, cor=Cor.AZUL):
    print(f"\n{cor}{Cor.NEGRITO}▶ {msg}{Cor.RESET}")

def sucesso(msg):
    print(f"{Cor.VERDE}{Cor.NEGRITO}✅ {msg}{Cor.RESET}")

def erro(msg):
    print(f"{Cor.VERMELHO}{Cor.NEGRITO}❌ {msg}{Cor.RESET}")
    sys.exit(1)

def run(cmd, cwd=None):
    """Executa comando mostrando saída em tempo real. Retorna código de saída."""
    print(f"{Cor.AMARELO}  $ {cmd}{Cor.RESET}")
    result = subprocess.run(cmd, shell=True, cwd=cwd)
    return result.returncode

# ─────────────────────────────────────────────
# ETAPAS
# ─────────────────────────────────────────────

def verificar_diretorios():
    log("Verificando diretórios...")
    if not BASE_DIR.exists():
        erro(f"Diretório do projeto não encontrado: {BASE_DIR}")
    if not FRONTEND_DIR.exists():
        erro(f"Diretório do frontend não encontrado: {FRONTEND_DIR}")
    sucesso(f"Projeto:  {BASE_DIR}")
    sucesso(f"Frontend: {FRONTEND_DIR}")


def atualizar_main():
    log("Atualizando branch main do GitHub...")
    os.chdir(BASE_DIR)

    # Verifica branch atual
    result = subprocess.run(
        "git branch --show-current",
        shell=True, capture_output=True, text=True
    )
    branch_atual = result.stdout.strip()
    print(f"  Branch atual: {Cor.AMARELO}{branch_atual}{Cor.RESET}")

    if branch_atual != "main":
        log(f"Trocando para main (estava em '{branch_atual}')...")
        if run("git checkout main") != 0:
            erro("Falha ao trocar para branch main.")

    # Restaura os arquivos ignorados para o estado do git (descarta alterações locais neles)
    log("Descartando alterações nos arquivos ignorados...")
    for arquivo in IGNORAR:
        caminho = BASE_DIR / arquivo
        if caminho.exists():
            run(f"git checkout -- {arquivo}")
            sucesso(f"Ignorado: {arquivo}")

    # Verifica se ainda há outras alterações locais
    status = subprocess.run(
        "git status --porcelain",
        shell=True, capture_output=True, text=True
    )
    tem_alteracoes = bool(status.stdout.strip())

    if tem_alteracoes:
        log("Outras alterações locais detectadas — salvando com git stash...")
        print(f"{Cor.AMARELO}  Arquivos:{Cor.RESET}")
        for linha in status.stdout.strip().split("\n"):
            print(f"    {linha}")
        if run("git stash") != 0:
            erro("Falha ao fazer git stash.")
        sucesso("Alterações salvas no stash!")

    # Pull
    if run("git pull origin main") != 0:
        if tem_alteracoes:
            log("Restaurando stash...")
            run("git stash pop")
        erro("Falha ao executar git pull.")

    sucesso("Repositório atualizado com a main!")

    # Restaura o stash se tinha alterações
    if tem_alteracoes:
        log("Restaurando alterações do stash...")
        if run("git stash pop") != 0:
            log("⚠️  Conflito ao restaurar stash. Resolva com: git stash pop", Cor.AMARELO)
        else:
            sucesso("Alterações locais restauradas!")


def instalar_dependencias():
    log("Instalando dependências do frontend (npm install)...")
    if run("npm install", cwd=FRONTEND_DIR) != 0:
        erro("Falha no npm install. Verifique os erros acima.")
    sucesso("Dependências instaladas!")


def executar_build():
    log("Executando build do frontend (npm run build)...")

    result = subprocess.run(
        "npm run build",
        shell=True,
        cwd=FRONTEND_DIR
    )

    print()
    if result.returncode == 0:
        sucesso("BUILD CONCLUÍDO COM SUCESSO! 🎉")
        print(f"\n{Cor.VERDE}  Build gerado em:{Cor.RESET}")
        print(f"  {FRONTEND_DIR / 'dist'}\n")
    else:
        print(f"\n{Cor.VERMELHO}{Cor.NEGRITO}")
        print("╔══════════════════════════════════════════════╗")
        print("║  ❌  BUILD FALHOU                            ║")
        print("║  Leia os erros acima, copie e cole aqui      ║")
        print("║  para análise e correção.                    ║")
        print("╚══════════════════════════════════════════════╝")
        print(Cor.RESET)
        sys.exit(1)


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
def main():
    print(f"""
{Cor.NEGRITO}{Cor.AZUL}
╔══════════════════════════════════════════════╗
║  🚀  LeadCapture Pro — Build Local           ║
║  frontend/dashboard-admin                    ║
╚══════════════════════════════════════════════╝
{Cor.RESET}""")

    verificar_diretorios()
    atualizar_main()
    instalar_dependencias()
    executar_build()


if __name__ == "__main__":
    main()
