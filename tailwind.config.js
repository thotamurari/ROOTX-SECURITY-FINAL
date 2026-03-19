/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                'bright-cyan':   '#00FFFF',
                'bright-green':  '#00FF7F',
                'bright-yellow': '#FFE000',
                'bright-orange': '#FF6B00',
                'bright-red':    '#FF1744',
                'bright-purple': '#BF00FF',
                'bright-blue':   '#2979FF',
                'bright-pink':   '#FF4081',
                
                // Legacy mappings preserving existing layout components
                primary: 'var(--bg-primary)',
                surface: 'var(--bg-secondary)',
                card: 'var(--bg-card)',
                cyan: 'var(--cyan)',
                
                neon: {
                    green: 'var(--green)',
                    red: 'var(--red)',
                    orange: 'var(--orange)',
                    cyan: 'var(--cyan)',
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    muted: 'var(--text-muted)',
                },
                border: {
                    subtle: 'var(--border-subtle)',
                    DEFAULT: 'var(--border-default)',
                },
                risk: {
                    safe: 'var(--green)',
                    caution: 'var(--yellow)',
                    danger: 'var(--orange)',
                    critical: 'var(--red)',
                },
            },
            fontFamily: {
                orbitron:  ['Orbitron', 'sans-serif'],
                mono:      ['IBM Plex Mono', 'monospace'],
                sans:      ['DM Sans', 'sans-serif'],
                display: ['Orbitron', 'sans-serif'],   // Alias
                body: ['IBM Plex Mono', 'monospace'],  // Alias
                ui: ['DM Sans', 'sans-serif'],        // Alias
            },
            boxShadow: {
                'glow-cyan':   '0 0 20px rgba(0,255,255,0.4)',
                'glow-green':  '0 0 20px rgba(0,255,127,0.4)',
                'glow-red':    '0 0 20px rgba(255,23,68,0.4)',
                'glow-yellow': '0 0 20px rgba(255,224,0,0.4)',
                'glow-orange': '0 0 20px rgba(255,107,0,0.4)',
            },
            animation: {
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
                'scan-sweep': 'scanSweep 2s linear infinite',
                'float': 'float 3s ease-in-out infinite',
                'slide-up': 'slideUp 0.5s ease-out',
                'fade-in': 'fadeIn 0.3s ease-out',
                'blink': 'blink 1.2s infinite',
                'pulse-cyan': 'pulse-cyan 2s infinite',
                'pulse-red': 'pulse-red 1s infinite',
                'pulse-green': 'pulse-green 2s infinite',
                'scanning-pulse': 'scanning-pulse 1s infinite',
                'critical-pulse': 'critical-pulse 0.8s infinite',
                'glow-float': 'glow-float 3s infinite',
                'scroll-up': 'scrollUp 12s linear infinite',
            },
            keyframes: {
                pulseGlow: {
                    '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
                    '50%': { opacity: '0.8', filter: 'brightness(1.3)' },
                },
                scanSweep: {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                scrollUp: {
                    '0%': { transform: 'translateY(0)' },
                    '100%': { transform: 'translateY(-50%)' },
                },
            },
            backgroundImage: {
                'grid-pattern': 'linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)',
            },
            backgroundSize: {
                'grid': '30px 30px',
            },
        },
    },
    plugins: [],
}
