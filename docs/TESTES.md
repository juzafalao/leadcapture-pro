# 🧪 Guia de Testes - LeadCapture Pro

## Instalação

```bash
# Instalar dependências de teste
npm install -D vitest @vitest/coverage-v8 @vitest/ui
```

## Executar Testes

```bash
# Executar todos os testes
npm test

# Executar em modo watch
npm run test:watch

# Executar com coverage
npm run test:coverage

# Abrir UI interativa
npm run test:ui
```

## Estrutura de Testes

```
server/
├── __tests__/
│   └── api.test.js           # Testes de integração da API
├── core/__tests__/
│   ├── scoring.test.js       # Testes do serviço de scoring
│   ├── validation.test.js    # Testes do serviço de validação
│   └── retry.test.js         # Testes do serviço de retry
├── comunicacao/__tests__/
│   └── whatsapp.test.js      # Testes do serviço de WhatsApp
├── routes/__tests__/
│   └── whatsapp.test.js      # Testes do webhook WhatsApp
└── middleware/__tests__/
    └── rateLimiter.test.js   # Testes do rate limiter
```

## Cobertura Atual

| Módulo | Cobertura | Testes |
|--------|-----------|--------|
| scoring.js | 100% | 15 |
| validation.js | 95% | 25 |
| whatsapp.js | 85% | 12 |
| retry.js | 100% | 5 |
| rateLimiter.js | 80% | 7 |
| API Routes | 70% | 8 |

## Escrevendo Novos Testes

### Exemplo: Teste Unitário

```javascript
// server/core/__tests__/meu-modulo.test.js
import { describe, it, expect } from 'vitest'
import { minhaFuncao } from '../meu-modulo.js'

describe('Meu Módulo', () => {
  it('deve fazer algo', () => {
    expect(minhaFuncao('input')).toBe('output')
  })
})
```

### Exemplo: Teste com Mock

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest'

global.fetch = vi.fn()

describe('API Calls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve chamar a API', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' })
    })

    const resultado = await minhaApiCall()
    expect(resultado.data).toBe('test')
  })
})
```

## CI/CD

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Debugging

```bash
# Executar teste específico
npm test -- scoring.test.js

# Executar com logs detalhados
npm test -- --reporter=verbose

# Debug com Node inspector
node --inspect-brk node_modules/.bin/vitest run
```
