/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",

        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",

        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",

        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",

        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",

        success: "hsl(var(--success))",
        "success-foreground": "hsl(var(--success-foreground))",

        // Figma color library
        "light-grey": "hsl(var(--light-grey))",
        "grey": "hsl(var(--grey))",
        "dark-grey": "hsl(var(--dark-grey))",
        "charcoal": "hsl(var(--charcoal))",
        "black-figma": "hsl(var(--black-figma))",
        "white-figma": "hsl(var(--white-figma))",
        "error": "hsl(var(--error))",

        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",

        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 12px)",
      },
      fontFamily: {
        'helvetica': ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
        body: "var(--body-font-family)",
        title: "var(--title-font-family)",
        "typography-button": "var(--typography-button-font-family)",
      },
      fontSize: {
        'hero-lg': ['57px', { letterSpacing: '-1.25px', fontWeight: 'bold' }],
        'hero-md': ['45px', { letterSpacing: '0', fontWeight: 'bold' }],
        'headline-lg': ['28px', { letterSpacing: '0', fontWeight: 'bold' }],
        'headline-md': ['24px', { letterSpacing: '0', fontWeight: '500' }],
        'headline-sm': ['24px', { letterSpacing: '0', fontWeight: '400' }],
        'title-lg': ['22px', { letterSpacing: '0', fontWeight: '400' }],
        'title-md': ['16px', { letterSpacing: '0.15%', fontWeight: '500' }],
        'title-md-bold': ['16px', { letterSpacing: '0.15%', fontWeight: 'bold' }],
        'label-lg': ['14px', { letterSpacing: '0.1%', fontWeight: '500' }],
        'label-md': ['12px', { letterSpacing: '2.5%', fontWeight: '400' }],
        'body-lg': ['16px', { letterSpacing: '0.5%', fontWeight: '400' }],
        'body-md': ['14px', { letterSpacing: '0', fontWeight: '400' }],
        'cta-md': ['16px', { letterSpacing: '0', fontWeight: 'bold' }],
      },
      boxShadow: {
        'glow-white': '0 0 20px 0 rgba(255, 255, 255, 0.50)',
        'glow-yellow' : '0 0 20px 0 rgba(255, 235, 86, 0.50);'
      },
      transitionProperty: {
        'all-300': 'all'
      },
      transitionDuration: {
        '300': '300ms'
      },
      transitionTimingFunction: {
        'ease': 'ease'
      },
      borderColor: {
        'debug1': '#F24137',
        'debug2': '#5076FF',
        'debug3': '#7FFF50'
      },
      borderWidth: {
        'debug': '1px'
      }
    },
  },
  plugins: [],
}

