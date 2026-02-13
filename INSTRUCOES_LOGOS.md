# 📸 INSTRUÇÕES PARA SALVAR AS LOGOS

## 1️⃣ BAIXAR AS 5 IMAGENS QUE VOCÊ CRIOU

Salve cada uma com o nome correto:

### Logo 1 - Hero Ilustrada (aquela colorida com máquina)
**Salvar como:** `logo-hero.png`
**Destino:** `landing-lavalava/assets/logos/`

### Logo 2 - App Icon com Fundo Escuro
**Salvar como:** `app-icon-dark.png`
**Destino:** `server/public/dashboard/public/logos/`

### Logo 3 - App Icon HD Transparente
**Salvar como:** `app-icon-hd.png`
**Destino:** `landing-lavalava/assets/logos/`

### Logo 4 - Logo Horizontal (ícone + texto)
**Salvar como:** `logo-horizontal.png`
**Destino:** `landing-lavalava/assets/logos/`

### Logo 5 - Favicon Mini
**Salvar como:** `favicon.png`
**Destino:** `landing-lavalava/assets/logos/`

---

## 2️⃣ COPIAR PARA OS LOCAIS CORRETOS

Execute no terminal:

\`\`\`bash
# Copiar logo hero
cp ~/Downloads/logo-hero.png landing-lavalava/assets/logos/

# Copiar app icon
cp ~/Downloads/app-icon-dark.png server/public/dashboard/public/logos/

# Copiar app icon HD
cp ~/Downloads/app-icon-hd.png landing-lavalava/assets/logos/

# Copiar logo horizontal
cp ~/Downloads/logo-horizontal.png landing-lavalava/assets/logos/

# Copiar favicon
cp ~/Downloads/favicon.png landing-lavalava/assets/logos/

# Copiar logo horizontal para admin
cp landing-lavalava/assets/logos/logo-horizontal.png server/admin/assets/

# Gerar favicons de múltiplos tamanhos
# (Opcional - se tiver ImageMagick instalado)
convert landing-lavalava/assets/logos/favicon.png -resize 16x16 landing-lavalava/favicon-16.ico
convert landing-lavalava/assets/logos/favicon.png -resize 32x32 landing-lavalava/favicon-32.ico
convert landing-lavalava/assets/logos/favicon.png -resize 192x192 landing-lavalava/favicon-192.png
\`\`\`

✅ PRONTO! Depois execute o script de integração.
