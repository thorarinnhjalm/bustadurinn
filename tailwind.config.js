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
                // Dark amber for TEXT/icons on light backgrounds (5.76:1 on bone, 5.91:1 on white)
                'amber-ink': '#8a5a12',
                'grey-warm': '#e8e4df',
                'grey-mid': '#6b665f',
                'grey-dark': '#4a4642',
            },
            fontFamily: {
                serif: ['Fraunces', 'serif'],
                sans: ['Inter', 'Inter Fallback', 'sans-serif'],
            },
            borderRadius: {
                sm: '2px',
                DEFAULT: '4px',
                md: '6px',
                // Design system: max 6px. Pills/avatars use rounded-full; device illustrations use explicit rounded-[..] values.
                lg: '6px',
                xl: '6px',
                '2xl': '6px',
                '3xl': '6px',
            },
        },
    },
    plugins: [],
}
