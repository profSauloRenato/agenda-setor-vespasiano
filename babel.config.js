// babel.config.js
// Criado para configurar o plugin 'react-native-dotenv'

module.exports = function(api) {
  // api.cache(true) garante que o Babel cacheie a configuração para builds mais rápidas
  api.cache(true); 
  return {
    // Preset padrão do Expo
    presets: ['babel-preset-expo'],
    
    // Configuração do plugin dotenv
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',         // Nome do módulo para importação (ex: import { KEY } from '@env')
        path: '.env',               // Onde o arquivo .env está
        safe: false,                // Não precisa de .env.example
        allowUndefined: true,       // Permite variáveis não definidas
      }],
      // Adicione outros plugins, como o do Reanimated, se for usar
      // 'react-native-reanimated/plugin', 
    ],
  };
};