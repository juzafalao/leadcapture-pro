# 📘 GUIA DE USO DAS LOGOS - LAVA LAVA

## 🎨 PALETA DE CORES OFICIAL

\`\`\`
Laranja Principal:  #ff6633
Verde Secundário:   #10b981
Azul Água:          #2563eb → #60a5fa (gradiente)
Azul Escuro:        #1e293b
Branco:             #ffffff
\`\`\`

---

## 📦 LOGOS E SEUS USOS

### 1️⃣ Logo Hero (logo-hero.png)
**Dimensões:** 800x600px  
**Formato:** PNG transparente  
**Onde usar:**
- ✅ Hero section da landing page
- ✅ Materiais de marketing impressos
- ✅ Apresentações comerciais
- ✅ Redes sociais (posts quadrados)

**Tamanho recomendado na web:** max-width: 500px

---

### 2️⃣ App Icon Dark (app-icon-dark.png)
**Dimensões:** 512x512px  
**Formato:** PNG com fundo escuro  
**Onde usar:**
- ✅ Dashboard header (compacto)
- ✅ Loading screens com fundo escuro
- ✅ Notificações push
- ✅ App preview (dark mode)

**Tamanho recomendado na web:** 48px - 64px

---

### 3️⃣ App Icon HD (app-icon-hd.png)
**Dimensões:** 1024x1024px  
**Formato:** PNG transparente alta resolução  
**Onde usar:**
- ✅ Apple App Store (ícone principal)
- ✅ Google Play Store
- ✅ PWA manifest (icon 1024x1024)
- ✅ Impressão em alta qualidade
- ✅ Touch icon (mobile)

**Não redimensionar** - usar original

---

### 4️⃣ Logo Horizontal (logo-horizontal.png)
**Dimensões:** 1500x500px  
**Formato:** PNG transparente  
**Onde usar:**
- ✅ Header principal do site
- ✅ Email signatures
- ✅ Documentos (topo)
- ✅ Banners web
- ✅ Footer

**Tamanho recomendado na web:**
- Desktop: height 48px
- Mobile: height 40px

---

### 5️⃣ Favicon (favicon.png)
**Dimensões:** 200x200px  
**Formato:** PNG transparente  
**Onde usar:**
- ✅ Favicon 16x16, 32x32
- ✅ Touch icon mobile
- ✅ Menu mobile (ícone compacto)
- ✅ Breadcrumbs

**Redimensionar para:**
- 16x16px (favicon browser)
- 32x32px (favicon HD)
- 192x192px (Android)

---

## 🖼️ ESTRUTURA DE PASTAS

\`\`\`
leadcapture-pro/
├── landing-lavalava/
│   ├── assets/
│   │   └── logos/
│   │       ├── logo-hero.png          (800x600)
│   │       ├── app-icon-hd.png        (1024x1024)
│   │       ├── logo-horizontal.png    (1500x500)
│   │       └── favicon.png            (200x200)
│   ├── favicon-16.ico
│   ├── favicon-32.ico
│   └── favicon-192.png
│
├── server/
│   ├── admin/
│   │   └── assets/
│   │       └── logo-horizontal.png
│   └── public/
│       └── dashboard/
│           └── public/
│               └── logos/
│                   └── app-icon-dark.png
\`\`\`

---

## 🎯 CASOS DE USO ESPECÍFICOS

### Landing Page
\`\`\`html
<!-- Header -->
<img src="assets/logos/logo-horizontal.png" alt="Lava Lava" class="h-12">

<!-- Hero -->
<img src="assets/logos/logo-hero.png" alt="Lava Lava" class="max-w-md">

<!-- Favicon -->
<link rel="icon" href="assets/logos/favicon.png">
\`\`\`

### Dashboard React
\`\`\`jsx
// Header compacto
<img src="/logos/app-icon-dark.png" alt="Lava Lava" className="w-12 h-12" />
\`\`\`

### Admin Panel
\`\`\`html
<!-- Header -->
<img src="assets/logo-horizontal.png" alt="Lava Lava" class="h-10">
\`\`\`

---

## ⚠️ REGRAS DE USO

✅ **PODE:**
- Usar em materiais de marketing da franquia
- Redimensionar proporcionalmente
- Usar em fundos escuros ou claros

❌ **NÃO PODE:**
- Distorcer ou esticar
- Mudar cores
- Adicionar efeitos não autorizados
- Usar em fundos que comprometam legibilidade

---

## 📐 TAMANHOS RECOMENDADOS

| Uso | Desktop | Mobile |
|-----|---------|--------|
| Header logo | 48-64px height | 40px height |
| Hero image | 400-600px width | 300px width |
| Favicon | 32x32 | 192x192 |
| App icon | 64x64 | 64x64 |

---

Powered by ⚡ LeadCapture Pro
