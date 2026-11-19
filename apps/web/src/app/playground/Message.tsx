'use client';

import { ChatText } from '@/ui/components/workspace/ChatText';
import { type ChatAttachment } from '@outline-studio/schemas';

export function Message({ message, isStreaming }: { message: { id: string; role: 'user' | 'studio'; text: string; documentation?: { sources: { title: string; url: string }[]; notice?: string }; attachments?: ChatAttachment[] }; isStreaming: boolean }) {
  return <article data-streaming={isStreaming} className={`playground-message ${message.role} ${isStreaming ? 'streaming' : ''}`}>
    <div className="playground-message-avatar">{message.role === 'user' ? 'U' : 'AI'}</div>
    <div className="playground-message-content">
      <ChatText text={message.text} />
      {Boolean(message.attachments?.length) && <ul className="playground-message-attachments">{message.attachments?.map(item => <li key={item.id}>
        <span>{item.name}</span>{item.text && <details><summary>Show text</summary><pre>{item.text}</pre></details>}
      </li>)}</ul>}
      {message.documentation && <><p className="small muted">{message.documentation.notice}</p>{message.documentation.sources.length > 0 && <details><summary>Sources</summary><ol>{message.documentation.sources.map((source, index) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">[{index + 1}] {source.title}</a></li>)}</ol></details>}</>}
    </div>
  </article>;
}
