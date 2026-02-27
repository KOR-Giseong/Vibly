import { Tabs, Redirect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Home, Search, Bookmark, User, Users } from 'lucide-react-native';
import { useAuthStore } from '@stores/auth.store';
import { Colors } from '@constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 피그마: 활성 #9810FA / 비활성 #6A7282
const TAB_ACTIVE_COLOR   = '#9810FA';
const TAB_INACTIVE_COLOR = '#6A7282';

type IconComponent = typeof Home;

const ICON_MAP: Record<string, IconComponent> = {
  Home,
  Search,
  Bookmark,
  Users,
  User,
};

const TABS = [
  { name: 'index',     label: '홈',       icon: 'Home'     },
  { name: 'search',    label: '검색',     icon: 'Search'   },
  { name: 'bookmark',  label: '저장',     icon: 'Bookmark' },
  { name: 'community', label: '커뮤니티', icon: 'Users'    },
  { name: 'profile',   label: '프로필',   icon: 'User'     },
] as const;

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
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingHorizontal: 20,
          backgroundColor: Colors.white,
          borderTopColor: Colors.gray[100],
          borderTopWidth: 1,
        },
        tabBarActiveTintColor:   TAB_ACTIVE_COLOR,
        tabBarInactiveTintColor: TAB_INACTIVE_COLOR,
        tabBarLabelStyle: styles.label,
        tabBarIconStyle: styles.iconStyle,
      }}
    >
      {TABS.map(({ name, label, icon }) => {
        const Icon = ICON_MAP[icon];
        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title: label,
              tabBarIcon: ({ focused }) => (
                <View style={styles.iconWrap}>
                  <Icon
                    size={24}
                    color={focused ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR}
                    strokeWidth={focused ? 2.5 : 1.8}
                  />
                </View>
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  iconStyle: {
    marginBottom: -4,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
});
