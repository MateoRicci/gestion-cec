import * as Yup from 'yup'

// Tipos de documentos con sus IDs
export const TIPOS_DOCUMENTO = [
    { id: 1, nombre: 'DNI' },
    { id: 2, nombre: 'CUIL' },
    { id: 3, nombre: 'CUIT' },
    { id: 4, nombre: 'Pasaporte' },
    { id: 5, nombre: 'CDI' },
] as const

export interface SignUpFormValues {
    tipoDocumento: number
    numeroDocumento: string
    usuario: string
    email: string
    password: string
}

// Schema para el primer paso (tipo y número de documento)
export const step1Schema = Yup.object().shape({
    tipoDocumento: Yup.number()
        .required('El tipo de documento es requerido')
        .oneOf([1, 2, 3, 4, 5], 'Tipo de documento inválido'),
    numeroDocumento: Yup.string()
        .trim()
        .required('El número de documento es requerido')
        .min(3, 'El número de documento debe tener al menos 3 caracteres'),
})

// Schema para el segundo paso (usuario, email, contraseña)
export const step2Schema = Yup.object().shape({
    usuario: Yup.string()
        .trim()
        .required('El usuario es requerido')
        .min(3, 'El usuario debe tener al menos 3 caracteres'),
    email: Yup.string()
        .trim()
        .required('El email es requerido')
        .email('Por favor, ingresa un email válido'),
    password: Yup.string()
        .trim()
        .required('La contraseña es requerida')
        .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

// Schema completo para validación final
export const schema = step1Schema.concat(step2Schema)

