// Generate a unique device fingerprint based on browser/device characteristics
export const generateDeviceFingerprint = (): string => {
  const components: string[] = [];
  
  // Screen properties
  components.push(`${screen.width}x${screen.height}`);
  components.push(`${screen.colorDepth}`);
  components.push(`${screen.pixelDepth}`);
  
  // Navigator properties
  components.push(navigator.language);
  components.push(navigator.platform);
  components.push(String(navigator.hardwareConcurrency || 0));
  components.push(String(navigator.maxTouchPoints || 0));
  
  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // User agent
  components.push(navigator.userAgent);
  
  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch (e) {
    components.push('canvas-error');
  }
  
  // Generate hash from components
  const fingerprint = components.join('|');
  return hashString(fingerprint);
};

// Simple hash function
const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Convert to positive hex string
  return Math.abs(hash).toString(16).padStart(8, '0') + 
         Date.now().toString(16).slice(-8);
};

// Store fingerprint in localStorage for consistency
export const getStoredFingerprint = (): string => {
  const stored = localStorage.getItem('device_fingerprint');
  if (stored) return stored;
  
  const fingerprint = generateDeviceFingerprint();
  localStorage.setItem('device_fingerprint', fingerprint);
  return fingerprint;
};
