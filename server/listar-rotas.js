import fs from 'fs'

const content = fs.readFileSync('index.js', 'utf8')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📋 ROTAS DO BACKEND')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

const routes = []

// Buscar todas as rotas
const regex = /app\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g
let match

while ((match = regex.exec(content)) !== null) {
  routes.push({
    method: match[1].toUpperCase(),
    path: match[2]
  })
}

// Agrupar por tipo
const essential = []
const landing = []
const admin = []
const outros = []

routes.forEach(route => {
  if (route.path === '/health' || route.path === '/') {
    essential.push(route)
  } else if (route.path.includes('lead')) {
    landing.push(route)
  } else if (route.path.includes('admin')) {
    admin.push(route)
  } else {
    outros.push(route)
  }
})

console.log('✅ ESSENCIAIS (manter):')
essential.forEach(r => console.log(`   ${r.method.padEnd(6)} ${r.path}`))

console.log('')
console.log('🧼 LANDING PAGE (manter):')
landing.forEach(r => console.log(`   ${r.method.padEnd(6)} ${r.path}`))

console.log('')
console.log('👤 ADMIN (manter):')
admin.forEach(r => console.log(`   ${r.method.padEnd(6)} ${r.path}`))

console.log('')
console.log('❓ OUTROS (verificar se precisa):')
if (outros.length > 0) {
  outros.forEach(r => console.log(`   ${r.method.padEnd(6)} ${r.path}`))
} else {
  console.log('   (nenhum)')
}

console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`📊 Total: ${routes.length} rotas`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
