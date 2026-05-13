import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from '@/components/theme-provider';
import { NoteListDrawer } from '@/components/note-list-drawer';
import HomeScreen from './index';
import SettingsScreen from './settings';

const Drawer = createDrawerNavigator();

export default function AppLayout() {
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props: any) => <NoteListDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { backgroundColor: theme.colors.surface, width: '82%' },
        swipeEdgeWidth: 50,
        overlayColor: 'transparent',
      }}
    >
      <Drawer.Screen name="index" component={HomeScreen} />
      <Drawer.Screen name="settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}
