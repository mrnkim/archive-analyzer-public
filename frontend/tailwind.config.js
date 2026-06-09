/** @type {import('tailwindcss').Config} */
// Palette mapped to the TwelveLabs "Strand" design system (dark theme).
// We redefine the `neutral` and `brand` ramps the components already use, so
// the whole app adopts Strand's warm-charcoal surfaces + UI-green accent
// without rewriting every className. Tokens: Strand css/variables.css.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Strand UI green (WCAG-safe derivative of brand green #00FF00).
        brand: {
          50: "#1A3D2A", // dark accent tint (for /10 fills + subtle bg)
          100: "#1A3D2A",
          500: "#00DC82", // --strand-ui-accent
          600: "#00B86E", // --strand-ui-accent-hover
          900: "#30710E", // masterbrand dark green
        },
        // Masterbrand highlight green — for emphatic accents.
        highlight: "#60E21B",
        // Strand semantic status colors (tokens/colors.json → ui.*).
        warning: { DEFAULT: "#FABA17", dark: "#7D5D0C", light: "#FDE3A2" },
        error: { DEFAULT: "#E22622", dark: "#9D422B", light: "#FFCCC0" },
        destructive: "#E22622",
        success: { DEFAULT: "#60E21B", dark: "#30710E", light: "#BFF3A4" },
        info: { DEFAULT: "#6CD5FD", dark: "#366B7F", light: "#C4EEFE" },
        // Warm-charcoal ramp (Strand brand-charcoal → masterbrand neutrals).
        neutral: {
          50: "#F4F3F3", // brand white / primary text
          100: "#ECECEC", // body text
          200: "#D3D1CF", // light grey
          300: "#BDBCBB",
          400: "#9B9895", // secondary / muted text
          500: "#8F8984", // mid grey
          600: "#6B6966", // tertiary text, timestamps
          700: "#45423F", // strong border / hover
          800: "#333231", // card bg, subtle border
          900: "#2A2928", // surface — panels, inputs, cards
          950: "#1D1C1B", // brand charcoal — page background
        },
      },
      fontFamily: {
        sans: ["Noto Sans", "Helvetica", "Arial", "sans-serif"],
        display: ["Geist", "Noto Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};
