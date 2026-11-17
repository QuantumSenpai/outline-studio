export function ChatText({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return <div className="chat-text">{parts.map((part, index) => part.startsWith('```')
    ? <pre key={index}><code>{part.replace(/^```[^\n]*\n?/, '').replace(/```$/, '')}</code></pre>
    : <p key={index}>{part}</p>)}</div>;
}
