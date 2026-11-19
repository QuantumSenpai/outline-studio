import React from 'react';
import { marked, type Token, type Tokens } from 'marked';

function safeLink(value: string) {
  try { return ['https:', 'http:', 'mailto:'].includes(new URL(value).protocol) ? value : undefined; }
  catch { return undefined; }
}

function content(tokens: Token[]): React.ReactNode[] {
  return tokens.map((token, key) => {
    const children = 'tokens' in token && token.tokens ? content(token.tokens) : undefined;
    switch (token.type) {
      case 'space': case 'def': return null;
      case 'strong': return <strong key={key}>{children}</strong>;
      case 'em': return <em key={key}>{children}</em>;
      case 'del': return <del key={key}>{children}</del>;
      case 'codespan': return <code key={key}>{(token as Tokens.Codespan).text}</code>;
      case 'code': return <pre key={key}><code>{(token as Tokens.Code).text}</code></pre>;
      case 'paragraph': return <p key={key}>{children}</p>;
      case 'heading': return <h2 key={key}>{children}</h2>;
      case 'br': return <br key={key} />;
      case 'hr': return <hr key={key} />;
      case 'blockquote': return <blockquote key={key}>{children}</blockquote>;
      case 'list': {
        const list = token as Tokens.List;
        const items = list.items.map((item, index) => <li key={index}>{item.task && <input type="checkbox" checked={Boolean(item.checked)} disabled readOnly aria-label={item.checked ? 'Completed item' : 'Incomplete item'} />}{content(item.tokens)}</li>);
        return list.ordered ? <ol key={key} start={list.start === 1 || list.start === '' ? undefined : list.start}>{items}</ol> : <ul key={key}>{items}</ul>;
      }
      case 'link': {
        const link = token as Tokens.Link;
        const href = safeLink(link.href);
        return href ? <a key={key} href={href} title={link.title ?? undefined} target="_blank" rel="noopener noreferrer">{children}</a> : <React.Fragment key={key}>{children}</React.Fragment>;
      }
      case 'table': {
        const table = token as Tokens.Table;
        return <div key={key} className="chat-table-scroll"><table><thead><tr>{table.header.map((cell, index) => <th key={index} scope="col">{content(cell.tokens)}</th>)}</tr></thead>
          <tbody>{table.rows.map((row, index) => <tr key={index}>{row.map((cell, column) => <td key={column}>{content(cell.tokens)}</td>)}</tr>)}</tbody></table></div>;
      }
      case 'image': return <React.Fragment key={key}>{(token as Tokens.Image).text}</React.Fragment>;
      default: return <React.Fragment key={key}>{children ?? ('text' in token ? String(token.text) : token.raw)}</React.Fragment>;
    }
  });
}

export const ChatText = React.memo(function ChatText({ text }: { text: string }) {
  return <div className="chat-text">{content(marked.lexer(text, { gfm: true }))}</div>;
});
