module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Migrações do Drizzle são arquivos .sql importados como texto
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
