#!/usr/bin/env python3
"""
Script de desenvolvimento local - LeadCapture Pro
Uso: python3 dev_local.py [opções]

Opções:
  --branch NOME     Troca para uma branch específica antes de tudo
  --no-install      Pula o npm install
  --only-frontend   Roda só o frontend (sem o server)
  --only-server     Roda só o server (sem o frontend)
  --build           Faz build do frontend em vez de rodar em modo dev
"""

import subprocess
import sys
import os
import argparse
import signal
import time
from pathlib import Path

# ─────────────────────────────────────────────
# CONFIGURAÇÕES DO PROJETO
# ─────────────────────────────────────────────
BASE_DIR = Path("/Projetos/leadcapture-pro")

FRONTEND_DIR = BASE_DIR / "frontend" / "dashboard-admin"  # Frontend principal
SERVER_DIR   = BASE_DIR / "server"                         # Backend/Server
BRANCH_PADRAO = "main"

# Cor para o terminal
class Cor:
    RESET  = "\033[0m"
    VERDE  = "\033[92m"
    AZUL   = "\033[94m"
    AMARELO= "\033[93m"
    VERMELHO="\033[91m"
    NEGRITO= "\033[1m"

def log(msg, cor=Cor.AZUL):
    print(f"{cor}{Cor.NEGRITO}[LeadCapture]{Cor.RESET} {cor}{msg}{Cor.RESET}")

def erro(msg):
    print(f"{Cor.VERMELHO}{Cor.NEGRITO}[ERRO]{Cor.RESET} {Cor.VERMELHO}{msg}{Cor.RESET}")
    sys.exit(1)

def run(cmd, cwd=None, capturar=False):
    """Executa um comando e mostra saída em tempo real."""
    log(f"$ {cmd}", Cor.AMARELO)
    result = subprocess.run(
        cmd, shell=True, cwd=cwd,
        capture_output=capturar, text=True
    )
    if result.returncode != 0:
        erro(f"Comando falhou: {cmd}")
    return result

# ─────────────────────────────────────────────
# 1. VERIFICAÇÕES INICIAIS
# ─────────────────────────────────────────────
def verificar_ambiente():
    log("Verificando ambiente...", Cor.AZUL)

    if not BASE_DIR.exists():
        erro(f"Diretório do projeto não encontrado: {BASE_DIR}")

    for tool in ["git", "node", "npm"]:
        result = subprocess.run(f"which {tool}", shell=True, capture_output=True)
        if result.returncode != 0:
            erro(f"'{tool}' não está instalado ou não está no PATH.")

    log(f"Diretório do projeto: {BASE_DIR}", Cor.VERDE)

# ───────────────────────────────────────���─────
# 2. GIT: ATUALIZAR LOCAL
# ─────────────────────────────────────────────
def atualizar_git(branch):
    log(f"Atualizando repositório (branch: {branch})...", Cor.AZUL)
    os.chdir(BASE_DIR)

    # Verifica status (avisa se houver alterações locais não commitadas)
    status = subprocess.run("git status --porcelain", shell=True, capture_output=True, text=True)
    if status.stdout.strip():
        log("⚠️  Há alterações locais não commitadas:", Cor.AMARELO)
        print(status.stdout)
        resposta = input(f"{Cor.AMARELO}Deseja continuar mesmo assim? (s/N): {Cor.RESET}").strip().lower()
        if resposta != "s":
            erro("Operação cancelada. Comite ou faça stash das suas alterações primeiro.")

    run(f"git fetch origin")
    run(f"git checkout {branch}")
    run(f"git pull origin {branch}")
    log(f"✅ Branch '{branch}' atualizada com sucesso!", Cor.VERDE)

# ─────────────────────────────────────────────
# 3. INSTALAR DEPENDÊNCIAS
# ─────────────────────────────────────────────
def instalar_dependencias(dirs):
    for d in dirs:
        if not d.exists():
            log(f"Diretório não encontrado, pulando: {d}", Cor.AMARELO)
            continue
        log(f"Instalando dependências em: {d.relative_to(BASE_DIR)}", Cor.AZUL)
        run("npm install", cwd=d)
    log("✅ Dependências instaladas!", Cor.VERDE)

# ─────────────────────────────────────────────
# 4. BUILD DO FRONTEND
# ─────────────────────────────────────────────
def build_frontend():
    if not FRONTEND_DIR.exists():
        erro(f"Diretório do frontend não encontrado: {FRONTEND_DIR}")

    log(f"Fazendo build do frontend em: {FRONTEND_DIR.relative_to(BASE_DIR)}", Cor.AZUL)
    run("npm run build", cwd=FRONTEND_DIR)
    log("✅ Build do frontend concluído!", Cor.VERDE)

# ─────────────────────────────────────────────
# 5. SUBIR SERVIÇOS EM PARALELO (modo dev)
# ─────────────────────────────────────��───────
processos = []

def subir_server():
    log("Subindo Server (Node.js)...", Cor.AZUL)
    proc = subprocess.Popen(
        "npm run dev",
        shell=True, cwd=SERVER_DIR
    )
    processos.append(("Server", proc))
    return proc

def subir_frontend_dev():
    log("Subindo Frontend (Vite dev server)...", Cor.AZUL)
    proc = subprocess.Popen(
        "npm run dev",
        shell=True, cwd=FRONTEND_DIR
    )
    processos.append(("Frontend", proc))
    return proc

def aguardar_processos():
    """Aguarda os processos e encerra tudo com Ctrl+C."""
    log("\n✅ Serviços rodando! Pressione Ctrl+C para encerrar tudo.\n", Cor.VERDE)

    def encerrar(sig, frame):
        log("\nEncerrando todos os serviços...", Cor.AMARELO)
        for nome, proc in processos:
            log(f"  Encerrando {nome}...", Cor.AMARELO)
            proc.terminate()
        time.sleep(1)
        log("👋 Encerrado. Até mais!", Cor.VERDE)
        sys.exit(0)

    signal.signal(signal.SIGINT, encerrar)
    signal.signal(signal.SIGTERM, encerrar)

    # Monitora se algum processo morreu inesperadamente
    while True:
        for nome, proc in processos:
            if proc.poll() is not None:
                erro(f"O serviço '{nome}' encerrou inesperadamente! (código: {proc.returncode})")
        time.sleep(2)

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Dev Local - LeadCapture Pro")
    parser.add_argument("--branch",       default=BRANCH_PADRAO, help="Branch para usar (padrão: main)")
    parser.add_argument("--no-install",   action="store_true",    help="Pular npm install")
    parser.add_argument("--only-frontend",action="store_true",    help="Subir só o frontend")
    parser.add_argument("--only-server",  action="store_true",    help="Subir só o server")
    parser.add_argument("--build",        action="store_true",    help="Fazer build do frontend (não sobe dev server)")
    args = parser.parse_args()

    print(f"""
{Cor.NEGRITO}{Cor.VERDE}
╔══════════════════════════════════════════╗
���    🚀  LeadCapture Pro - Dev Local       ║
╚══════════════════════════════════════════╝
{Cor.RESET}""")

    # 1. Verifica ambiente
    verificar_ambiente()

    # 2. Atualiza o git
    atualizar_git(args.branch)

    # 3. Instala dependências
    if not args.no_install:
        dirs_install = []
        if not args.only_server:
            dirs_install.append(FRONTEND_DIR)
        if not args.only_frontend:
            dirs_install.append(SERVER_DIR)
        instalar_dependencias(dirs_install)

    # 4. Build ou Dev server
    if args.build:
        build_frontend()
        log("Build finalizado. Para servir o build, rode: npm run preview", Cor.VERDE)
        return

    # 5. Sobe os serviços
    if not args.only_server:
        subir_frontend_dev()
        time.sleep(1)  # pequena pausa para não misturar os logs iniciais

    if not args.only_frontend:
        subir_server()

    aguardar_processos()


if __name__ == "__main__":
    main()
