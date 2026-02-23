import katex from 'katex';

function renderMath(html: string): string {
  // Block math: $$...$$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_match, tex) => {
    try {
      return `<div style="text-align:center;margin:16px 0;overflow-x:auto;">${katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<code style="color:#e53e3e;">${tex}</code>`;
    }
  });

  // Inline math: $...$  (but not $$)
  html = html.replace(/\$([^\$\n]+?)\$/g, (_match, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `<code style="color:#e53e3e;">${tex}</code>`;
    }
  });

  return html;
}

function renderCodeBlocks(html: string): string {
  // Fenced code blocks: ```lang\n...\n```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const langLabel = lang ? `<div style="font-size:11px;color:#999;margin-bottom:4px;font-family:monospace;">${lang}</div>` : '';
    return `<div style="background:#1e1e2e;border-radius:10px;padding:16px;margin:12px 0;overflow-x:auto;">${langLabel}<pre style="margin:0;color:#cdd6f4;font-family:'Fira Code',Consolas,monospace;font-size:14px;line-height:1.6;white-space:pre-wrap;word-break:break-word;"><code>${escapeHtml(code.trim())}</code></pre></div>`;
  });

  // Inline code: `...`
  html = html.replace(/`([^`\n]+?)`/g, '<code style="background:var(--bg-tertiary,#f0f0f0);padding:2px 6px;border-radius:4px;font-family:\'Fira Code\',Consolas,monospace;font-size:0.9em;">$1</code>');

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderMarkdown(text: string, variant: 'lesson' | 'chat' = 'lesson'): string {
  const isLesson = variant === 'lesson';

  // Code blocks first (before other processing can break them)
  let html = renderCodeBlocks(text);

  // Math (before bold/italic so $...$ aren't eaten by * processing)
  html = renderMath(html);

  // Headers
  html = html.replace(/### (.*?)(\n|$)/g, `<h3 style="font-size: ${isLesson ? '20px' : '18px'}; font-weight: 600; margin: ${isLesson ? '20px 0 10px 0' : '16px 0 8px 0'}; color: ${isLesson ? 'var(--text-primary)' : '#333'};">$1</h3>`);

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #667eea;">$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>');

  // Blockquotes (lesson only)
  if (isLesson) {
    html = html.replace(/^> (.*?)$/gm, '<blockquote style="border-left: 4px solid var(--accent-primary); padding-left: 16px; margin: 16px 0; color: var(--text-secondary); font-style: italic;">$1</blockquote>');
  }

  // Lists: • and - and *
  html = html.replace(/^[•\-\*] (.*?)$/gm, `<li style="margin: ${isLesson ? '8px' : '4px'} 0;">$1</li>`);
  html = html.replace(/(<li.*?<\/li>\n?)+/g, `<ul style="padding-left: ${isLesson ? '24px' : '20px'}; margin: ${isLesson ? '16px' : '12px'} 0;">$&</ul>`);

  // Numbered lists
  html = html.replace(/^\d+\.\s+(.*?)$/gm, `<li style="margin: ${isLesson ? '8px' : '4px'} 0;">$1</li>`);

  // Paragraphs
  const lineHeight = isLesson ? '1.8' : '1.6';
  const pMargin = isLesson ? '16px' : '8px';
  html = html.replace(/\n\n/g, `</p><p style="margin: ${pMargin} 0; line-height: ${lineHeight};">`);
  html = `<p style="margin: ${pMargin} 0; line-height: ${lineHeight};">` + html + '</p>';

  return html;
}
