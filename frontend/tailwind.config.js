// tailwind.config.js
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "on-surface": "#0b1c30",
        "on-surface-variant": "#3f4850",
        "surface-container-high": "#dce9ff",
        "surface-variant": "#d3e4fe",
        "on-tertiary-fixed": "#25005a",
        "tertiary": "#712ae2",
        "on-error": "#ffffff",
        "outline-variant": "#bfc7d2",
        "surface-tint": "#006398",
        "on-error-container": "#93000a",
        "tertiary-fixed-dim": "#d2bbff",
        "tertiary-container": "#8a4cfc",
        "secondary-fixed": "#ffddb8",
        "on-tertiary": "#ffffff",
        "on-primary-fixed-variant": "#004b73",
        "on-primary-fixed": "#001d31",
        "outline": "#707881",
        "error-container": "#ffdad6",
        "on-background": "#0b1c30",
        "primary": "#006194",
        "primary-fixed": "#cce5ff",
        "on-tertiary-container": "#fffbff",
        "surface-container-low": "#eff4ff",
        "on-primary": "#ffffff",
        "secondary": "#855300",
        "on-primary-container": "#fdfcff",
        "secondary-container": "#fea619",
        "inverse-primary": "#93ccff",
        "inverse-surface": "#213145",
        "secondary-fixed-dim": "#ffb95f",
        "primary-container": "#007bb9",
        "on-secondary-fixed": "#2a1700",
        "surface-dim": "#cbdbf5",
        "on-secondary": "#ffffff",
        "background": "#f8f9ff",
        "surface-bright": "#f8f9ff",
        "surface-container-lowest": "#ffffff",
        "surface": "#f8f9ff",
        "surface-container-highest": "#d3e4fe",
        "on-tertiary-fixed-variant": "#5a00c6",
        "inverse-on-surface": "#eaf1ff",
        "error": "#ba1a1a",
        "primary-fixed-dim": "#93ccff",
        "on-secondary-container": "#684000",
        "surface-container": "#e5eeff",
        "tertiary-fixed": "#eaddff",
        "on-secondary-fixed-variant": "#653e00"
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem"
      },
      spacing: {
        "component-padding-y": "8px",
        "section-gap": "48px",
        "component-padding-x": "16px",
        "container-margin": "24px",
        gutter: "16px",
        base: "4px"
      },
      fontFamily: {
        "body-lg": ["Inter"],
        "headline-lg": ["Inter"],
        "label-md": ["Inter"],
        "headline-md": ["Inter"],
        "label-sm": ["Inter"],
        "display-lg": ["Inter"],
        "body-md": ["Inter"],
        "body-sm": ["Inter"]
      },
      fontSize: {
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "headline-lg": ["32px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        "label-md": ["14px", { lineHeight: "1", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "1.4", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "500" }],
        "display-lg": ["48px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }]
      }
    }
  },
  plugins: []
};
