// O app fala com o Finora do computador por http://100.x.y.z:8765 (IP da Tailscale).
// No iOS, o App Transport Security bloqueia http sem TLS num app instalado (o Expo Go libera).
// O tráfego já vai criptografado pela Tailscale (WireGuard), então liberamos o http.
//
// Atenção: com NSAllowsLocalNetworking presente (o Expo põe por padrão), o iOS IGNORA
// o NSAllowsArbitraryLoads. Por isso a chave precisa sair, não só ficar como true.
const { withInfoPlist } = require('expo/config-plugins');

module.exports = function withTailscaleHttp(config) {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults.NSAppTransportSecurity = { NSAllowsArbitraryLoads: true };
    return cfg;
  });
};
