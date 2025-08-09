// Override Vite configuration to allow all hosts - specifically for Replit
const originalDefineConfig = require('vite').defineConfig;
const originalCreateServer = require('vite').createServer;

// Monkey patch createServer to force allowedHosts: true
require('vite').createServer = async function(config = {}) {
  // Force server configuration for Replit
  config.server = {
    ...config.server,
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: {
      ...config.server?.hmr,
      clientPort: 443,
      host: "0.0.0.0",
    },
  };
  
  config.preview = {
    ...config.preview,
    host: "0.0.0.0", 
    allowedHosts: true,
  };
  
  console.log('✓ Vite server config patched for Replit');
  return originalCreateServer.call(this, config);
};

// Export the patching function
module.exports = () => {
  console.log('✓ Vite configuration override loaded');
};