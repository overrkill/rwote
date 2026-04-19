import { Tabs } from 'expo-router';
import { useTheme } from '@/components/theme-provider';
import { NotesIcon, SettingsIcon } from '@/components/icons';
import { TodoIcon } from '@/components/todo-icon';

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textTertiary,
      }}
    >
      <Tabs.Screen
        name="(notes)"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color }) => <NotesIcon size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(todos)"
        options={{
          title: 'Todos',
          tabBarIcon: ({ color }) => <TodoIcon size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(settings)"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <SettingsIcon size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
