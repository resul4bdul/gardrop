module.exports = {
  plugins: {
    // Explicitly point Tailwind to the CommonJS config so PostCSS/Next doesn't try to require the TypeScript file.
    tailwindcss: { config: './tailwind.config.cjs' },
    autoprefixer: {},
  },
};
