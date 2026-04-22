import {
  isEmailValido,
  isTelefoneValido,
  validarDocumento,
  sanitizarTexto,
  sanitizarObjeto,
  validarCamposObrigatorios,
  normalizarTelefone,
  isSlugValido,
  isUUIDValido,
  isCpfCnpjValido,
} from '../validation.js'

describe('core/validation', () => {
  it('valida e-mail', () => {
    expect(isEmailValido('teste@empresa.com')).toBe(true)
    expect(isEmailValido('email-invalido')).toBe(false)
  })

  it('valida telefone', () => {
    expect(isTelefoneValido('(11) 99999-8888')).toBe(true)
    expect(isTelefoneValido('12345')).toBe(false)
  })

  it('valida CPF e CNPJ', () => {
    expect(validarDocumento('529.982.247-25')).toEqual({
      valido: true,
      tipo: 'CPF',
      limpo: '52998224725',
    })
    expect(validarDocumento('11.444.777/0001-61')).toEqual({
      valido: true,
      tipo: 'CNPJ',
      limpo: '11444777000161',
    })
    expect(isCpfCnpjValido('111.111.111-11')).toBe(false)
  })

  it('sanitiza texto e objeto', () => {
    expect(sanitizarTexto(' <b>Nome</b> ', 50)).toBe('bNome/b')

    expect(
      sanitizarObjeto({
        nome: ' <i>Ana</i> ',
        nested: { descricao: '<script>x</script>' },
        lista: [' <b>ok</b> '],
      })
    ).toEqual({
      nome: 'iAna/i',
      nested: { descricao: 'scriptx/script' },
      lista: ['bok/b'],
    })
  })

  it('valida campos obrigatórios e normaliza telefone', () => {
    expect(validarCamposObrigatorios({ nome: 'Ana', email: 'a@a.com' }, ['nome', 'email'])).toEqual({
      valido: true,
      campoFaltando: null,
    })
    expect(validarCamposObrigatorios({ nome: 'Ana' }, ['nome', 'email'])).toEqual({
      valido: false,
      campoFaltando: 'email',
    })
    expect(normalizarTelefone('(11) 99999-8888')).toBe('11999998888')
  })

  it('valida slug e uuid', () => {
    expect(isSlugValido('minha-marca-01')).toBe(true)
    expect(isSlugValido('Minha Marca')).toBe(false)
    expect(isUUIDValido('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(isUUIDValido('123')).toBe(false)
  })
})
