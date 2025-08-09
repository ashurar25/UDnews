// Fix for Vite host blocking issue in Replit
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Patch vite config to allow all hosts
async function patchViteConfig() {
  try {
    const viteConfigPath = resolve(__dirname, 'vite.config.ts');
    let content = await fs.readFile(viteConfigPath, 'utf-8');
    
    // Check if server config already exists
    if (!content.includes('server:')) {
      // Add server configuration before the last closing brace
      const insertIndex = content.lastIndexOf('});');
      if (insertIndex !== -1) {
        const serverConfig = `  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: {
      clientPort: 443,
    },
  },
`;
        content = content.slice(0, insertIndex) + serverConfig + content.slice(insertIndex);
        
        // Create backup and write new config
        await fs.writeFile(viteConfigPath + '.backup', content);
        console.log('✓ Vite config patched to allow all hosts');
      }
    }
  } catch (error) {
    console.log('Could not patch vite config:', error.message);
  }
}

// Set environment variables
process.env.DANGEROUSLY_DISABLE_HOST_CHECK = 'true';
process.env.HOST = '0.0.0.0';

patchViteConfig();