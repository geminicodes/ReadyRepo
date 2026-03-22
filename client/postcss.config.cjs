const path = require("node:path");

module.exports = {
  plugins: {
    // Use the root Tailwind config, but resolve plugins from `client/node_modules`
    // (important when Vercel sets Root Directory to `client/`).
    tailwindcss: { config: path.resolve(__dirname, "../tailwind.config.ts") },
    autoprefixer: {},
  },
};

