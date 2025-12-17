/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                corporate: {
                    primary: {
                        DEFAULT: '#1e3a8a',
                        light: '#2563eb',
                        dark: '#1e40af',
                    },
                    secondary: '#06b6d4', // Turkuaz
                    accent: '#0891b2',
                    gray: {
                        50: '#f8fafc',
                        100: '#f1f5f9',
                        200: '#e2e8f0',
                        300: '#cbd5e1',
                        400: '#94a3b8',
                        500: '#64748b',
                        600: '#475569',
                        700: '#334155',
                        800: '#1e293b',
                        900: '#0f172a',
                    }
                }
            },
            backgroundColor: {
                'corporate-secondary': '#06b6d4',
            },
            borderColor: {
                'corporate-secondary': '#06b6d4',
            },
            textColor: {
                'corporate-secondary': '#06b6d4',
            }
        },
    },
    plugins: [],
}