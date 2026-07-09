/** @type {import('tailwindcss').Config} */
// Palette mapped to the TwelveLabs "Strand" design system (light theme).
// We redefine the `neutral` and `brand` ramps the components already use, so
// the whole app adopts Strand's warm-white surfaces + UI-green accent
// without rewriting every className. Tokens: Strand css/variables.css.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Strand / Playground lime accent.
        brand: {
          50: "#BFF3A4",
          100: "#BFF3A4",
          500: "#60E21C",
          600: "#60E21C",
          800: "#60E21C",
          900: "#60E21C",
        },
        // Masterbrand highlight green — for emphatic accents.
        highlight: "#60E21C",
        // Strand semantic status colors (tokens/colors.json → ui.*).
        warning: { DEFAULT: "#FABA17", dark: "#7D5D0C", light: "#FDE3A2" },
        error: { DEFAULT: "#E22622", dark: "#9D422B", light: "#FFCCC0" },
        destructive: "#E22622",
        success: { DEFAULT: "#60E21C", dark: "#60E21C", light: "#BFF3A4" },
        info: { DEFAULT: "#6CD5FD", dark: "#366B7F", light: "#C4EEFE" },
        // Light Strand semantic ramp, mapped to the numeric classes already
        // used by the app:
        // - neutral-950 = page/subtle background
        // - neutral-900 = surface/card
        // - neutral-800/700 = borders and hover fills
        // - neutral-50/100/200/300 = primary text
        neutral: {
          50: "#1D1C1B", // primary text
          100: "#1D1C1B", // body/headings
          200: "#45423F", // strong body
          300: "#45423F", // section labels
          400: "#6B6966", // muted body
          500: "#6B6966", // secondary text
          600: "#9B9895", // tertiary text
          700: "#D3D1CF", // default border / hover border
          800: "#E8E7E5", // subtle border / subtle fill
          900: "#FFFFFF", // surface
          950: "#F4F3F3", // page background
        },
      },
      fontFamily: {
        sans: ["Milling", "Noto Sans", "Helvetica", "Arial", "sans-serif"],
        display: ["Milling", "Noto Sans", "Helvetica", "Arial", "sans-serif"],
        brand: ["Milling", "Noto Sans", "Helvetica", "Arial", "sans-serif"],
        "brand-bold": ["Milling", "Noto Sans", "Helvetica", "Arial", "sans-serif"],
        "brand-xbold": ["Milling", "Noto Sans", "Helvetica", "Arial", "sans-serif"],
        geist: ["Geist", "Inter", "system-ui", "sans-serif"],
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
