'use client';

import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/components/theme-provider';
import { FileText, Plus } from 'lucide-react-native';

type EmptyType = 'notes' | 'todos' | 'search';

interface EmptyStateProps {
  type: EmptyType;
  message?: string;
  subMessage?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

const EMPTY_CONFIG: Record<EmptyType, { icon: React.ReactNode; defaultMessage: string; defaultSub: string }> = {
  notes: {
    icon: <FileText size={48} color="currentColor" />,
    defaultMessage: 'No notes yet',
    defaultSub: 'Tap + to add your first note',
  },
  todos: {
    icon: <FileText size={48} color="currentColor" />,
    defaultMessage: 'No todos yet',
    defaultSub: 'Tap + to create a todo',
  },
  search: {
    icon: (
      <View style={{ opacity: 0.5 }}>
        <FileText size={48} color="currentColor" />
      </View>
    ),
    defaultMessage: 'No results found',
    defaultSub: 'Try a different search term',
  },
};

export function EmptyState({
  type,
  message,
  subMessage,
  onAction,
  style,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const config = EMPTY_CONFIG[type];
  const s = theme.spacing;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.surfaceAlt }]}>
        {config.icon}
      </View>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
        {message || config.defaultMessage}
      </Text>
      <Text style={[styles.subMessage, { color: theme.colors.textTertiary }]}>
        {subMessage || config.defaultSub}
      </Text>
      {onAction && (
        <View
          style={[
            styles.action,
            { backgroundColor: theme.colors.accentBtn },
          ]}
        >
          <Plus size={20} color={theme.colors.bg} />
          <Text style={[styles.actionText, { color: theme.colors.bg }]}>
            Add {type === 'notes' ? 'Note' : 'Todo'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  } as ViewStyle,
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  } as ViewStyle,
  message: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  } as TextStyle,
  subMessage: {
    fontSize: 14,
    textAlign: 'center',
  } as TextStyle,
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginTop: 24,
  } as ViewStyle,
  actionText: {
    fontSize: 15,
    fontWeight: '600',
  } as TextStyle,
};