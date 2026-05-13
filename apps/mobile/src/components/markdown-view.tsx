import { useMemo } from 'react';
import { useTheme } from '@/components/theme-provider';
import { WebView } from 'react-native-webview';
import { ViewStyle } from 'react-native';

interface MarkdownViewProps {
  content: string;
  style?: ViewStyle;
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderInline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function mdToHtml(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let inList = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push('<br/>');
      continue;
    }

    if (line.startsWith('### ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h3>${esc(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h2>${esc(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h1>${esc(line.slice(2))}</h1>`);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) { html.push('<ul>'); inList = true; }
      html.push(`<li>${renderInline(esc(line.slice(2)))}</li>`);
    } else if (line.startsWith('<')) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(line);
    } else {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<p>${renderInline(esc(line))}</p>`);
    }
  }

  if (inList) html.push('</ul>');
  return html.join('\n');
}

export function MarkdownView({ content, style }: MarkdownViewProps) {
  const { theme } = useTheme();

  const html = useMemo(() => {
    const body = mdToHtml(content);
    const bg = theme.colors.bg;
    const fg = theme.colors.textPrimary;
    const tertiary = theme.colors.textTertiary;
    const accent = theme.colors.accent;
    const codeBg = theme.colors.surfaceAlt;
    const border = theme.colors.border;

    return `
      <html>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font: -apple-system, system-ui, sans-serif;
            font-size: 15px; line-height: 24px;
            color: ${fg}; background: ${bg};
            padding: 0 0 60px; word-wrap: break-word;
          }
          h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; }
          h2 { font-size: 20px; font-weight: 700; margin: 16px 0 8px; }
          h3 { font-size: 18px; font-weight: 600; margin: 14px 0 6px; }
          p { margin: 0 0 8px; }
          ul { margin: 4px 0; padding-left: 20px; }
          li { margin: 2px 0; }
          code {
            background: ${codeBg}; padding: 2px 6px; border-radius: 4px;
            font-family: monospace; font-size: 14px;
          }
          a { color: ${accent}; text-decoration: underline; }
          strong { font-weight: 700; }
          em { font-style: italic; }
          br { display: block; content: ''; margin: 4px 0; }
          hr { border: none; border-top: 1px solid ${border}; margin: 24px 0 16px; }
          .meta { font-size: 12px; color: ${tertiary}; }
        </style>
      </head>
      <body>${body}</body>
      </html>
    `;
  }, [content, theme]);

  return (
    <WebView
      source={{ html }}
      scrollEnabled={true}
      showsVerticalScrollIndicator={false}
      style={[
        { backgroundColor: 'transparent', flex: 1 },
        style,
      ]}
    />
  );
}
