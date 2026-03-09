import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				border: 'hsl(var(--border) / 0.15)',
				sidebar: 'hsl(var(--sidebar-bg))',
				surface: 'hsl(var(--surface))',
				'surface-elevated': 'hsl(var(--surface-elevated))',
				'surface-muted': 'hsl(var(--surface-muted))',
				'assistant-bubble': 'hsl(var(--assistant-bubble))',
				'user-bubble': 'hsl(var(--user-bubble))',
				amber: 'hsl(var(--amber))',
				'amber-hover': 'hsl(var(--amber-hover))',
				// Model identity
				gpt: 'var(--color-gpt)',
				claude: 'var(--color-claude)',
				gemini: 'var(--color-gemini)',
				llama: 'var(--color-llama)',
				// Shadcn tokens
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
			},
			fontFamily: {
				serif: ['var(--font-playfair)', 'serif'],
				mono: ['var(--font-jetbrains-mono)', 'monospace'],
				sans: ['var(--font-inter)', 'sans-serif'],
			},
			transitionDuration: {
				fast: '140ms',
				normal: '220ms',
				hero: '420ms',
			},
			transitionTimingFunction: {
				spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
				smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				xl: '1rem',
				'2xl': '1.25rem',
			},
			boxShadow: {
				'theme-glow': '0 0 20px hsl(var(--primary) / 0.35)',
				'theme-soft': '0 0 15px hsl(var(--primary) / 0.2)',
				'theme-inner': 'inset 0 0 12px hsl(var(--primary) / 0.14)',
			},
			keyframes: {
				'amber-pulse': {
					'0%, 80%, 100%': { transform: 'scale(0.8)', opacity: '0.4' },
					'40%': { transform: 'scale(1.2)', opacity: '1' },
				},
				'msg-in': {
					from: { opacity: '0', transform: 'translateY(10px)' },
					to: { opacity: '1', transform: 'translateY(0)' },
				},
				'amber-flash': {
					'0%': { boxShadow: '0 0 0px rgba(245, 158, 11, 0)' },
					'50%': { boxShadow: '0 0 16px rgba(245, 158, 11, 0.5)' },
					'100%': { boxShadow: '0 0 0px rgba(245, 158, 11, 0)' },
				},
				'pill-slide': {
					'0%': { transform: 'translateX(-4px)', opacity: '0.8' },
					'100%': { transform: 'translateX(0)', opacity: '1' },
				},
				'fade-up': {
					from: { opacity: '0', transform: 'translateY(6px)' },
					to: { opacity: '1', transform: 'translateY(0)' },
				},
			},
			animation: {
				'amber-pulse': 'amber-pulse 1.2s ease-in-out infinite',
				'msg-in': 'msg-in 0.3s ease forwards',
				'amber-flash': 'amber-flash 0.5s ease',
				'pill-slide': 'pill-slide 0.3s ease',
				'fade-up': 'fade-up 0.4s ease forwards',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
};
export default config;
