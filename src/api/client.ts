// Cliente da API do Finora do computador (FastAPI), pela Tailscale.
// O celular se identifica com o token de aparelho (fd_…) recebido no pareamento.

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const OFFLINE = 'Não achei o seu Finora. O computador está ligado, com o Finora aberto e na Tailscale?';
const TIMEOUT_MS = 15_000;

/** Tira a barra do fim e põe http:// se a pessoa digitou só o IP */
export function normalizeUrl(raw: string) {
  const url = raw.trim().replace(/\/+$/, '');
  return /^https?:\/\//i.test(url) ? url : `http://${url}`;
}

function messageFor(status: number, detail: unknown) {
  if (typeof detail === 'string' && detail) return detail;
  if (status === 401) return 'Este celular não está mais conectado ao seu Finora.';
  if (status === 403) return 'O computador recusou o acesso. O acesso pelo celular está ligado no Perfil?';
  return `O Finora respondeu com erro (${status}).`;
}

export type Api = ReturnType<typeof createApi>;

export function createApi(baseUrl: string, token?: string | null) {
  const base = normalizeUrl(baseUrl);

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(`${base}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError(0, OFFLINE);
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(res.status, messageFor(res.status, (data as { detail?: unknown }).detail));
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  return {
    base,
    token: token ?? null,
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
    put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
    del: <T = void>(path: string) => request<T>('DELETE', path),
  };
}

/** Valor da API (número ou "123.45") em centavos inteiros */
export const cents = (v: number | string | null | undefined) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};
