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
        // --- TLDS semantic tokens (Track 1) --------------------------------
        // Backed by the --tl-* custom properties in src/tokens.css. These are
        // now the ONLY palette: the legacy Strand `neutral`/`brand`/`warning`/
        // `error`/etc. ramps were retired in PR5 once every call site had moved
        // to these tokens (see docs/tlds-migration-plan.md).
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
