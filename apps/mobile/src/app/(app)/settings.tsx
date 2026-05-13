import { View, Text, Pressable } from 'react-native';
import { useNavigation } from 'expo-router';
import { useTheme } from '@/components/theme-provider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsPanel } from '@/components/settings-panel';
import { ChevronLeft } from 'lucide-react-native';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const s = theme.spacing;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: insets.top }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: s.lg, paddingVertical: s.md,
        borderBottomWidth: 1, borderBottomColor: theme.colors.border,
      }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surfaceAlt, justifyContent: 'center', alignItems: 'center', marginRight: s.md }}
        >
          <ChevronLeft size={20} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary }}>Settings</Text>
      </View>
      <SettingsPanel />
    </View>
  );
}
