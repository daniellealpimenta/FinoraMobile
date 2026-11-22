const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Migrações do Drizzle (drizzle/*.sql)
config.resolver.sourceExts.push('sql');

module.exports = config;
