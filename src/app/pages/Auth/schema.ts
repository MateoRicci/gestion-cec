import * as Yup from 'yup'

export interface AuthFormValues {
    usuario: string
    password: string
}

export const schema = Yup.object().shape({
    usuario: Yup.string()
        .trim()
        .required('Product Title Required'),
    password: Yup.string().trim()
        .required('Product Title Required'),
})