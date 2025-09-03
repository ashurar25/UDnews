import { performance } from 'node:perf_hooks';
import process from 'node:process';

interface MemoryUsage {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers?: number;
}

let lastMemoryUsage: MemoryUsage = {
  rss: 0,
  heapTotal: 0,
  heapUsed: 0,
  external: 0,
};

const GC_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastGcTime = 0;

function formatMemory(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function logMemoryUsage(label = 'Memory usage') {
  try {
    const currentMemory = process.memoryUsage();
    const now = Date.now();
    
    // Calculate differences
    const diff = {
      rss: currentMemory.rss - lastMemoryUsage.rss,
      heapTotal: currentMemory.heapTotal - lastMemoryUsage.heapTotal,
      heapUsed: currentMemory.heapUsed - lastMemoryUsage.heapUsed,
      external: (currentMemory as any).external - (lastMemoryUsage.external || 0),
    };
    
    // Log memory stats with colors for better visibility
    console.log(`\n\x1b[36m=== ${label} ===\x1b[0m`);
    console.log(`RSS:          \x1b[33m${formatMemory(currentMemory.rss)}\x1b[0m (${diff.rss > 0 ? '\x1b[31m+' : '\x1b[32m'}${formatMemory(diff.rss)}\x1b[0m)`);
    console.log(`Heap Total:   \x1b[33m${formatMemory(currentMemory.heapTotal)}\x1b[0m (${diff.heapTotal > 0 ? '\x1b[31m+' : '\x1b[32m'}${formatMemory(diff.heapTotal)}\x1b[0m)`);
    console.log(`Heap Used:    \x1b[33m${formatMemory(currentMemory.heapUsed)}\x1b[0m (${diff.heapUsed > 0 ? '\x1b[31m+' : '\x1b[32m'}${formatMemory(diff.heapUsed)}\x1b[0m)`);
    console.log(`External:     \x1b[33m${formatMemory((currentMemory as any).external)}\x1b[0m (${diff.external > 0 ? '\x1b[31m+' : '\x1b[32m'}${formatMemory(diff.external)}\x1b[0m)`);
    
    // Log additional memory info if available
    if ((currentMemory as any).arrayBuffers !== undefined) {
      const arrayBuffers = (currentMemory as any).arrayBuffers;
      console.log(`ArrayBuffers: \x1b[33m${formatMemory(arrayBuffers)}\x1b[0m`);
    }
    
    // Force garbage collection if it's been a while
    if (now - lastGcTime > GC_INTERVAL) {
      if (global.gc) {
        console.log('\n\x1b[36m=== Running garbage collection ===\x1b[0m');
        const startTime = performance.now();
        global.gc();
        const endTime = performance.now();
        console.log(`Garbage collection took \x1b[33m${(endTime - startTime).toFixed(2)}ms\x1b[0m`);
      } else {
        console.log('\n\x1b[33mWarning: Garbage collection not available. Run with --expose-gc\x1b[0m');
      }
      lastGcTime = now;
    }
    
    lastMemoryUsage = currentMemory as MemoryUsage;
  } catch (error) {
    console.error('Error in memory monitor:', error);
  }
}

// Log memory usage every 30 seconds in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => logMemoryUsage('Periodic Memory Check'), 30000);
}
