'use client';

import { Text, StyleSheet, TextStyle, View } from 'react-native';
import { useTheme } from '@/components/theme-provider';

interface MarkdownViewProps {
  content: string;
  style?: TextStyle;
}

interface Segment {
  type: 'text' | 'bold' | 'italic' | 'code' | 'heading' | 'list' | 'link';
  content: string;
  level?: number;
}

function parseMarkdown(text: string): Segment[][] {
  const lines = text.split('\n');
  const result: Segment[][] = [];

  for (const line of lines) {
    const lineSegments: Segment[] = [];

    if (line.startsWith('# ')) {
      lineSegments.push({ type: 'heading', content: line.slice(2), level: 1 });
    } else if (line.startsWith('## ')) {
      lineSegments.push({ type: 'heading', content: line.slice(3), level: 2 });
    } else if (line.startsWith('### ')) {
      lineSegments.push({ type: 'heading', content: line.slice(4), level: 3 });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      lineSegments.push({ type: 'list', content: line.slice(2) });
    } else {
      let remaining = line;
      while (remaining.length > 0) {
        const codeMatch = remaining.match(/^`([^`]+)`/);
        if (codeMatch) {
          lineSegments.push({ type: 'code', content: codeMatch[1] });
          remaining = remaining.slice(codeMatch[0].length);
          continue;
        }

        const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
        if (boldMatch) {
          lineSegments.push({ type: 'bold', content: boldMatch[1] });
          remaining = remaining.slice(boldMatch[0].length);
          continue;
        }

        const italicMatch = remaining.match(/^\*([^*]+)\*/);
        if (italicMatch) {
          lineSegments.push({ type: 'italic', content: italicMatch[1] });
          remaining = remaining.slice(italicMatch[0].length);
          continue;
        }

        const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          lineSegments.push({ type: 'link', content: linkMatch[1], level: 0 });
          remaining = remaining.slice(linkMatch[0].length);
          continue;
        }

        const textMatch = remaining.match(/^[\*\`\[#\-]+/);
        if (textMatch) {
          lineSegments.push({ type: 'text', content: textMatch[0] });
          remaining = remaining.slice(textMatch[0].length);
          continue;
        }

        if (remaining.length > 0) {
          lineSegments.push({ type: 'text', content: remaining[0] });
          remaining = remaining.slice(1);
        }
      }
    }

    if (lineSegments.length === 0) {
      lineSegments.push({ type: 'text', content: '' });
    }
    result.push(lineSegments);
  }

  return result;
}

export function MarkdownView({ content, style }: MarkdownViewProps) {
  const { theme } = useTheme();
  const parsed = parseMarkdown(content);

  return (
    <Text style={[styles.container, style, { color: theme.colors.textPrimary }]}>
      {parsed.map((line, lineIndex) => (
        <Text key={lineIndex}>
          {lineIndex > 0 ? '\n' : ''}
          {line.map((segment, segIndex) => {
            const baseStyle: TextStyle = {
              color: theme.colors.textPrimary,
            };

            if (segment.type === 'heading') {
              const sizes = [28, 24, 20];
              return (
                <Text key={segIndex} style={[baseStyle, { fontWeight: '700', fontSize: sizes[segment.level! - 1] }]}>
                  {segment.content}
                </Text>
              );
            }
            if (segment.type === 'bold') {
              return (
                <Text key={segIndex} style={[baseStyle, { fontWeight: '700' }]}>
                  {segment.content}
                </Text>
              );
            }
            if (segment.type === 'italic') {
              return (
                <Text key={segIndex} style={[baseStyle, { fontStyle: 'italic' }]}>
                  {segment.content}
                </Text>
              );
            }
            if (segment.type === 'code') {
              return (
                <Text key={segIndex} style={[baseStyle, { fontFamily: 'monospace', backgroundColor: theme.colors.bg, paddingHorizontal: 4, borderRadius: 4 }]}>
                  {segment.content}
                </Text>
              );
            }
            if (segment.type === 'list') {
              return (
                <Text key={segIndex}>
                  <Text style={[baseStyle, { fontWeight: '600' }]}>• </Text>
                  <Text style={baseStyle}>{segment.content}</Text>
                </Text>
              );
            }
            if (segment.type === 'link') {
              return (
                <Text key={segIndex} style={[baseStyle, { color: theme.colors.accent, textDecorationLine: 'underline' }]}>
                  {segment.content}
                </Text>
              );
            }
            return (
              <Text key={segIndex} style={baseStyle}>
                {segment.content}
              </Text>
            );
          })}
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    fontSize: 16,
    lineHeight: 24,
  },
});