#!/usr/bin/env python3
"""
Script: Commit e Push para o GitHub
Uso: python3 commit_local.py
"""

import subprocess
import sys
import os
from pathlib import Path

# ─────────────────────────────────────────────
# CONFIGURAÇÕES
# ─────────────────────────────────────────────
BASE_DIR = Path("/Users/julianazafalao/Projetos/leadcapture-pro")

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
    print(f"{Cor.AMARELO}  $ {cmd}{Cor.RESET}")
    result = subprocess.run(cmd, shell=True, cwd=cwd)
    return result.returncode

# ─────────────────────────────────────────────
# ETAPAS
# ─────────────────────────────────────────────

def verificar_diretorio():
    if not BASE_DIR.exists():
        erro(f"Diretório do projeto não encontrado: {BASE_DIR}")
    os.chdir(BASE_DIR)


def mostrar_status():
    log("Arquivos alterados:")
    result = subprocess.run(
        "git status --short",
        shell=True, capture_output=True, text=True
    )
    if not result.stdout.strip():
        print(f"{Cor.AMARELO}  Nenhuma alteração encontrada. Nada para commitar.{Cor.RESET}")
        sys.exit(0)

    print(result.stdout)
    return result.stdout.strip()


def mostrar_diff_resumido():
    log("Resumo das alterações (diff):")
    subprocess.run("git diff --stat", shell=True, cwd=BASE_DIR)


def solicitar_mensagem():
    log("Digite a mensagem do commit:")
    print(f"{Cor.AMARELO}  Dica: seja descritivo. Ex: 'fix: corrige paginação na LeadsSistemaPage'{Cor.RESET}\n")
    mensagem = input(f"{Cor.NEGRITO}  Mensagem: {Cor.RESET}").strip()

    if not mensagem:
        erro("Mensagem do commit não pode ser vazia.")

    return mensagem


def confirmar_branch():
    result = subprocess.run(
        "git branch --show-current",
        shell=True, capture_output=True, text=True
    )
    branch = result.stdout.strip()
    print(f"\n  Branch atual: {Cor.VERDE}{Cor.NEGRITO}{branch}{Cor.RESET}")

    confirma = input(f"{Cor.AMARELO}  Confirma push para '{branch}'? (s/N): {Cor.RESET}").strip().lower()
    if confirma != "s":
        erro("Push cancelado pelo usuário.")

    return branch


def fazer_commit_e_push(mensagem, branch):
    log("Adicionando arquivos...")
    if run("git add .") != 0:
        erro("Falha no git add.")

    log("Realizando commit...")
    if run(f'git commit -m "{mensagem}"') != 0:
        erro("Falha no git commit.")

    log(f"Enviando para o GitHub (branch: {branch})...")
    if run(f"git push origin {branch}") != 0:
        erro("Falha no git push. Verifique sua conexão ou permissões.")

    sucesso(f"Commit e push realizados com sucesso na branch '{branch}'! 🚀")
    print(f"\n{Cor.AZUL}  Acesse: https://github.com/juzafalao/leadcapture-pro/tree/{branch}{Cor.RESET}\n")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
def main():
    print(f"""
{Cor.NEGRITO}{Cor.VERDE}
╔══════════════════════════════════════════════╗
║  📦  LeadCapture Pro — Commit & Push         ║
╚══════════════════════════════════════════════╝
{Cor.RESET}""")

    verificar_diretorio()
    mostrar_status()
    mostrar_diff_resumido()
    mensagem = solicitar_mensagem()
    branch   = confirmar_branch()
    fazer_commit_e_push(mensagem, branch)


if __name__ == "__main__":
    main()
