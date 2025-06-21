import type { Config } from "tailwindcss"

const config: Config = {
  // darkMode: ["class"], // Removed darkMode configuration
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{ts,tsx,mdx}",
    "./content/blog/**/*.mdx",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Custom colors for the theme
        neutral: {
          900: "#171717",
          800: "#262626",
          750: "#303030",
          700: "#404040",
          600: "#525252",
          500: "#737373",
          400: "#a3a3a3",
          300: "#d4d4d4",
          200: "#e5e5e5",
          100: "#f5f5f5",
        },
        green: {
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      typography: ({ theme }: { theme: any }) => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": theme("colors.neutral[300]"),
            "--tw-prose-headings": theme("colors.neutral[100]"),
            "--tw-prose-lead": theme("colors.neutral[400]"),
            "--tw-prose-links": theme("colors.green[400]"),
            "--tw-prose-bold": theme("colors.neutral[200]"),
            "--tw-prose-counters": theme("colors.neutral[500]"),
            "--tw-prose-bullets": theme("colors.neutral[600]"),
            "--tw-prose-hr": theme("colors.neutral[700]"),
            "--tw-prose-quotes": theme("colors.neutral[200]"),
            "--tw-prose-quote-borders": theme("colors.green[500]"),
            "--tw-prose-captions": theme("colors.neutral[400]"),
            "--tw-prose-code": theme("colors.neutral[300]"),
            "--tw-prose-pre-code": theme("colors.neutral[300]"),
            "--tw-prose-pre-bg": theme("colors.neutral[800]"),
            "--tw-prose-th-borders": theme("colors.neutral[600]"),
            "--tw-prose-td-borders": theme("colors.neutral[700]"),
            kbd: {
              padding: "0",
              margin: "0",
              fontSize: "inherit",
              fontWeight: "inherit",
              backgroundColor: "transparent",
              border: "none",
              borderRadius: "0",
              boxShadow: "none",
              color: "inherit",
            },
            "pre code": {
              backgroundColor: "transparent",
              padding: "0",
            },
          },
        },
      }),
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}

export default config
