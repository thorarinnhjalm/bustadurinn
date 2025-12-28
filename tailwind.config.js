/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bone: '#fdfcf8',
                charcoal: '#1a1a1a',
                amber: {
                    DEFAULT: '#e8b058',
                    dark: '#d49b3d',
                },
                'grey-warm': '#e8e4df',
                'grey-mid': '#8a8580',
                'grey-dark': '#4a4642',
            },
            fontFamily: {
                serif: ['Fraunces', 'serif'],
                sans: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                sm: '2px',
                DEFAULT: '4px',
                md: '4px',
                lg: '8px',
            },
        },
    },
    plugins: [],
}
