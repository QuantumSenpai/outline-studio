import type { ChatRequest } from '@outline-studio/schemas';

export function chatHistory(messages: ChatRequest['messages']) {
  const selected: ChatRequest['messages'] = []; let size = 0;
  for (const message of messages.slice(-20).reverse()) {
    if (!message.text.trim()) continue;
    if (size + message.text.length > 60000) break;
    selected.unshift({ role: message.role, text: message.text }); size += message.text.length;
  }
  return selected;
}
