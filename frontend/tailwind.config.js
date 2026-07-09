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

        // --- TLDS semantic tokens (Track 1) --------------------------------
        // Backed by the --tl-* custom properties in src/tokens.css. Prefer
        // these over the neutral/brand ramps above; the ramps stay only until
        // every call site is migrated (see docs/tlds-migration-plan.md).
        // NOTE: values are hex-valued CSS vars, so Tailwind opacity modifiers
        // (e.g. bg-surface-body/80) do NOT inject alpha — for the few
        // translucent spots use an explicit color-mix arbitrary value.
        surface: {
          body: "var(--tl-surface-body)",
          white: "var(--tl-surface-white)",
          card: "var(--tl-surface-card)",
          primary: "var(--tl-surface-primary)",
          "primary-inverse": "var(--tl-surface-primary-inverse)",
          "primary-hover": "var(--tl-surface-primary-hover)",
          secondary: "var(--tl-surface-secondary)",
          "secondary-hover": "var(--tl-surface-secondary-hover)",
          muted: "var(--tl-surface-muted)",
          disabled: "var(--tl-surface-disabled)",
          destructive: "var(--tl-surface-destructive)",
          tooltip: "var(--tl-surface-tooltip)",
          "status-success": "var(--tl-surface-status-success)",
          "status-warning": "var(--tl-surface-status-warning)",
          "status-error": "var(--tl-surface-status-error)",
          embed: "var(--tl-surface-embed)",
          analyze: "var(--tl-surface-analyze)",
          search: "var(--tl-surface-search)",
        },
        foreground: {
          body: "var(--tl-foreground-body)",
          primary: "var(--tl-foreground-primary)",
          "primary-inverse": "var(--tl-foreground-primary-inverse)",
          secondary: "var(--tl-foreground-secondary)",
          muted: "var(--tl-foreground-muted)",
          subtle: "var(--tl-foreground-subtle)",
          disabled: "var(--tl-foreground-disabled)",
          destructive: "var(--tl-foreground-destructive)",
          tooltip: "var(--tl-foreground-tooltip)",
          overlay: "var(--tl-foreground-overlay)",
          "status-success": "var(--tl-foreground-status-success)",
          "status-warning": "var(--tl-foreground-status-warning)",
          "status-error": "var(--tl-foreground-status-error)",
          "status-info": "var(--tl-foreground-status-info)",
          embed: "var(--tl-foreground-embed)",
          analyze: "var(--tl-foreground-analyze)",
          search: "var(--tl-foreground-search)",
          "accent-purple": "var(--tl-foreground-accent-purple)",
        },
        border: {
          secondary: "var(--tl-border-secondary)",
          primary: "var(--tl-border-primary)",
          disabled: "var(--tl-border-disabled)",
          destructive: "var(--tl-border-destructive)",
        },
        misc: {
          overlay: "var(--tl-misc-overlay)",
          "border-light": "var(--tl-misc-border-light)",
          "border-medium": "var(--tl-misc-border-medium)",
          ring: "var(--tl-misc-ring)",
          "status-success": "var(--tl-misc-status-success)",
          "status-warning": "var(--tl-misc-status-warning)",
          "status-error": "var(--tl-misc-status-error)",
          "status-info": "var(--tl-misc-status-info)",
        },
        // TLDS primitive ramps — use only when no semantic token fits.
        tl: {
          black: "var(--tl-color-black)",
          white: "var(--tl-color-white)",
          gray: {
            50: "var(--tl-color-gray-50)",
            100: "var(--tl-color-gray-100)",
            200: "var(--tl-color-gray-200)",
            300: "var(--tl-color-gray-300)",
            400: "var(--tl-color-gray-400)",
            500: "var(--tl-color-gray-500)",
            600: "var(--tl-color-gray-600)",
            700: "var(--tl-color-gray-700)",
          },
          embed: {
            "lightest-green": "var(--tl-color-embed-lightest-green)",
            "light-green": "var(--tl-color-embed-light-green)",
            green: "var(--tl-color-embed-green)",
            "dark-green": "var(--tl-color-embed-dark-green)",
            "lightest-blue": "var(--tl-color-embed-lightest-blue)",
            "light-blue": "var(--tl-color-embed-light-blue)",
            blue: "var(--tl-color-embed-blue)",
            "dark-blue": "var(--tl-color-embed-dark-blue)",
          },
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
        // TLDS font families (Track 1) — backed by --tl-font-family-* tokens.
        "tl-sans": [
          "var(--tl-font-family-primary)",
          "Noto Sans",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        "tl-mono": ["var(--tl-font-family-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        md: "8px",
        lg: "12px",
        xl: "16px",

        // TLDS radius scale + semantic aliases (Track 1), backed by
        // --tl-radius-* in src/tokens.css.
        "tlds-1": "var(--tl-radius-1)",
        "tlds-2": "var(--tl-radius-2)",
        "tlds-3": "var(--tl-radius-3)",
        "tlds-4": "var(--tl-radius-4)",
        "tlds-5": "var(--tl-radius-5)",
        "tlds-6": "var(--tl-radius-6)",
        "tlds-1-half": "var(--tl-radius-1-half)",
        "tlds-2-half": "var(--tl-radius-2-half)",
        "tlds-full": "var(--tl-radius-full)",
        dialog: "var(--tl-radius-dialog)",
        menu: "var(--tl-radius-menu)",
        tooltip: "var(--tl-radius-tooltip)",
        textarea: "var(--tl-radius-textarea)",
        spinner: "var(--tl-radius-spinner)",
        "nav-item": "var(--tl-radius-nav-item)",
        "video-thumbnail": "var(--tl-radius-video-thumbnail)",
        "input-sm": "var(--tl-radius-input-sm)",
        "input-md": "var(--tl-radius-input-md)",
        "input-lg": "var(--tl-radius-input-lg)",
        "button-mini": "var(--tl-radius-button-mini)",
        "button-small": "var(--tl-radius-button-small)",
        "button-regular": "var(--tl-radius-button-regular)",
        "button-medium": "var(--tl-radius-button-medium)",
        "button-large": "var(--tl-radius-button-large)",
        "chip-root": "var(--tl-radius-chip-root)",
        "chip-container": "var(--tl-radius-chip-container)",
      },
    },
  },
  plugins: [],
};
