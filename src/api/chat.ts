// Conversa com o Pila de verdade: POST /assistant/chat responde em SSE ("data: {...}\n\n"),
// com o modelo rodando no Ollama do computador. O fetch padrão do React Native não lê
// streaming; o expo/fetch lê (response.body com getReader).
import { fetch } from 'expo/fetch';

import type { Api } from './client';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };
export type ChatEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool'; name: string; label: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

export async function streamChat(api: Api, messages: ChatMessage[], onEvent: (e: ChatEvent) => void) {
  const res = await fetch(`${api.base}/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', Authorization: `Bearer ${api.token}` },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok || !res.body) {
    onEvent({ type: 'error', message: `O Finora respondeu com erro (${res.status}).` });
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let cut: number;
    while ((cut = buffer.indexOf('\n\n')) >= 0) {
      const chunk = buffer.slice(0, cut);
      buffer = buffer.slice(cut + 2);
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data:')) continue;
        try {
          onEvent(JSON.parse(line.slice(5).trim()) as ChatEvent);
        } catch {
          // linha incompleta ou fora do formato: ignora
        }
      }
    }
  }
}
