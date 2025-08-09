// Replit Vite Fix for allowedHosts issue
// This script patches the Vite configuration to allow all hosts
const originalDefineConfig = require('vite').defineConfig;

module.exports = function patchVite() {
  // Monkey patch defineConfig to always include allowedHosts: true
  require('vite').defineConfig = function(config) {
    if (config && typeof config === 'object') {
      config.server = config.server || {};
      config.server.allowedHosts = true;
      config.server.host = "0.0.0.0";
    }
    return originalDefineConfig(config);
  };
};

// Auto-apply the patch
if (process.env.NODE_ENV === 'development') {
  module.exports();
}