const path = require("node:path");

module.exports = {
  plugins: {
    // Explicit path so Vite (running from /client) still loads root config.
    tailwindcss: { config: path.resolve(__dirname, "./tailwind.config.ts") },
    autoprefixer: {},
  },
};
