import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Home, Search, Bookmark, User } from 'lucide-react-native';
import { useAuthStore } from '@stores/auth.store';
import { Colors, Gradients } from '@constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabIconProps = { name: string; focused: boolean };

function TabIcon({ name, focused }: TabIconProps) {
  const icons: Record<string, typeof Home> = { Home, Search, Bookmark, User };
  const Icon = icons[name];
  return (
    <View style={styles.iconWrap}>
      {focused && (
        <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      )}
      <Icon size={22} color={focused ? Colors.white : Colors.gray[400]} strokeWidth={focused ? 2.5 : 2} />
    </View>
  );
}

const TABS = [
  { name: 'index',    label: '홈',     icon: 'Home'     },
  { name: 'search',   label: '검색',   icon: 'Search'   },
  { name: 'bookmark', label: '저장',   icon: 'Bookmark' },
  { name: 'profile',  label: '프로필', icon: 'User'     },
];

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();
  const insets = useSafeAreaInsets();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: Colors.white,
          borderTopColor: Colors.gray[100],
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: Colors.primary[600],
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarLabelStyle: styles.label,
      }}
    >
      {TABS.map(({ name, label, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: label,
            tabBarIcon: ({ focused }) => <TabIcon name={icon} focused={focused} />,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: { fontSize: 10, fontWeight: '600', marginTop: 2 },
});
