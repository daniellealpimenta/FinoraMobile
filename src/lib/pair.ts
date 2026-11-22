// Link do QR que o Perfil do Finora (computador) mostra para parear o celular.

/** "finora://parear?url=http%3A%2F%2F100.64.1.2%3A8765&code=123456" */
export function parsePairLink(data: string): { url: string; code: string } | null {
  const m = /^finora:\/\/parear\?(.+)$/.exec(data.trim());
  if (!m) return null;
  const params = new Map(m[1].split('&').map((kv) => kv.split('=').map(decodeURIComponent) as [string, string]));
  const url = params.get('url');
  const code = params.get('code');
  return url && code && /^\d{6}$/.test(code) ? { url, code } : null;
}
