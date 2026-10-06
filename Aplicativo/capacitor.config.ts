import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Configuração do Capacitor — empacota o build do Vite (dist/) no app Android.
 */
const config: CapacitorConfig = {
  appId: 'com.controledomestico.app',
  appName: 'Controle Doméstico',
  webDir: 'dist',
  android: {
    // Fundo escuro enquanto a WebView carrega (evita flash branco)
    backgroundColor: '#121220',
  },
};

export default config;
