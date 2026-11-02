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
                    tertiary: 'var(--text-tertiary)',
                    muted: 'var(--text-muted)',
                },
                border: {
                    subtle: 'var(--border-subtle)',
                    DEFAULT: 'var(--border-default)',
                    strong: 'var(--border-strong)',
                },
                risk: {
                    safe: 'var(--green)',
                    caution: 'var(--yellow)',
                    danger: 'var(--orange)',
                    critical: 'var(--red)',
                },

                // --- New design-system tokens (2026 redesign) ---
                // Semantic surface scale. Prefer these over raw hex / legacy
                // aliases above for anything touched in the redesign.
                // DEFAULT colors below use the `rgb(var(--x-rgb) / <alpha-value>)`
                // pattern (Tailwind's documented recipe for CSS-var colors) so
                // opacity modifiers like `bg-danger/10` or `border-accent/40`
                // work anywhere in the app instead of failing at build time.
                base: 'rgb(var(--bg-base-rgb) / <alpha-value>)',
                'surface-1': 'rgb(var(--bg-surface-rgb) / <alpha-value>)',
                'surface-2': 'rgb(var(--bg-surface-2-rgb) / <alpha-value>)',
                'surface-3': 'var(--bg-surface-3)',
                overlay: 'var(--bg-overlay)',

                accent: {
                    DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
                    hover: 'var(--accent-hover)',
                    active: 'var(--accent-active)',
                    soft: 'var(--accent-soft)',
                    'soft-strong': 'var(--accent-soft-strong)',
                    foreground: 'var(--accent-foreground)',
                },
                success: {
                    DEFAULT: 'rgb(var(--success-rgb) / <alpha-value>)',
                    soft: 'var(--success-soft)',
                },
                warning: {
                    DEFAULT: 'rgb(var(--warning-rgb) / <alpha-value>)',
                    soft: 'var(--warning-soft)',
                },
                danger: {
                    DEFAULT: 'rgb(var(--danger-rgb) / <alpha-value>)',
                    hover: 'var(--danger-hover)',
                    soft: 'var(--danger-soft)',
                },
                info: {
                    DEFAULT: 'rgb(var(--info-rgb) / <alpha-value>)',
                    soft: 'var(--info-soft)',
                },
            },
            fontFamily: {
                orbitron:  ['Orbitron', 'sans-serif'],
                mono:      ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
                sans:      ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
                display: ['Inter', '-apple-system', 'sans-serif'],   // Alias
                body: ['Inter', '-apple-system', 'sans-serif'],
                ui: ['Inter', '-apple-system', 'sans-serif'],        // Alias
            },
            fontSize: {
                '2xs': ['0.6875rem', { lineHeight: '1rem' }],
            },
            borderRadius: {
                xl2: '1.25rem',
            },
            boxShadow: {
                'glow-cyan':   '0 0 20px rgba(0,255,255,0.4)',
                'glow-green':  '0 0 20px rgba(0,255,127,0.4)',
                'glow-red':    '0 0 20px rgba(255,23,68,0.4)',
                'glow-yellow': '0 0 20px rgba(255,224,0,0.4)',
                'glow-orange': '0 0 20px rgba(255,107,0,0.4)',
                // Soft, professional elevation (replaces heavy neon glows for
                // general chrome; glows are still available above for status
                // / live-scan accents used sparingly).
                xs: 'var(--shadow-xs)',
                sm: 'var(--shadow-sm)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
                'accent-ring': '0 0 0 3px var(--accent-soft)',
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
                'grid-pattern': 'linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)',
            },
            backgroundSize: {
                'grid': '30px 30px',
            },
        },
    },
    plugins: [],
}
