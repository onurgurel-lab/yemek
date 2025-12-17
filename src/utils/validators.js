import * as yup from 'yup'

// Dinamik olarak translation key'leri döndüren fonksiyonlar
export const getValidationMessage = (key, params) => ({
    key,
    values: params
})

export const loginSchema = yup.object().shape({
    username: yup
        .string()
        .required(getValidationMessage('validation.required'))
        .min(3, getValidationMessage('validation.minLength', { min: 3 }))
        .max(50, getValidationMessage('validation.maxLength', { max: 50 })),
    password: yup
        .string()
        .required(getValidationMessage('validation.required'))
        .min(6, getValidationMessage('validation.minLength', { min: 6 })),
})

export const registerSchema = yup.object().shape({
    username: yup
        .string()
        .required(getValidationMessage('validation.required'))
        .min(3, getValidationMessage('validation.minLength', { min: 3 }))
        .max(50, getValidationMessage('validation.maxLength', { max: 50 })),
    email: yup
        .string()
        .required(getValidationMessage('validation.required'))
        .email(getValidationMessage('validation.email')),
    password: yup
        .string()
        .required(getValidationMessage('validation.required'))
        .min(6, getValidationMessage('validation.minLength', { min: 6 })),
    confirmPassword: yup
        .string()
        .required(getValidationMessage('validation.required'))
        .oneOf([yup.ref('password')], getValidationMessage('validation.passwordMatch')),
})

export const exampleSchema = yup.object().shape({
    name: yup
        .string()
        .required(getValidationMessage('validation.required'))
        .min(2, getValidationMessage('validation.minLength', { min: 2 }))
        .max(100, getValidationMessage('validation.maxLength', { max: 100 })),
    description: yup
        .string()
        .max(500, getValidationMessage('validation.maxLength', { max: 500 })),
})

// Utility validation functions
export const isEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export const isPhoneNumber = (phone) => {
    const phoneRegex = /^[0-9]{10,15}$/
    return phoneRegex.test(phone.replace(/\D/g, ''))
}

export const isUrl = (url) => {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

export const isStrongPassword = (password) => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return strongPasswordRegex.test(password)
}