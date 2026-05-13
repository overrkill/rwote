import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';

export default function Index() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized) return;
    if (user) {
      router.replace('/(app)' as any);
    } else {
      router.replace('/auth');
    }
  }, [user, initialized]);

  return null;
}
