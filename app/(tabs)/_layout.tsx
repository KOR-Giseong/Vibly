import { Tabs, Redirect, useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Animated, Easing } from 'react-native';
import { Home, Search, Bookmark, User, Users, Grid2X2, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@stores/auth.store';
import { Colors } from '@constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';

const TAB_ACTIVE_COLOR   = '#9810FA';
const TAB_INACTIVE_COLOR = '#6A7282';

// ── 메뉴 아이템 정의 ────────────────────────────────────────────────────────
const MENU_ITEMS = [
  { label: '커뮤니티', icon: Users, route: '/(tabs)/community', color: '#9810FA', bg: '#F3E8FF' },
];

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -7,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatAnim]);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  const handleMenuItemPress = (route: string) => {
    setMenuVisible(false);
    router.push(route as any);
  };

  // 가운데 메뉴 버튼 컴포넌트
  const MenuButton = () => (
    <TouchableOpacity
      onPress={() => setMenuVisible(true)}
      activeOpacity={0.85}
      style={styles.menuBtnOuter}
    >
      <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
        <LinearGradient
          colors={['#9810FA', '#E60076']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.menuBtnInner}
        >
          <Grid2X2 size={22} color={Colors.white} strokeWidth={2} />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );

  return (
    <>
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
        {/* 홈 */}
        <Tabs.Screen
          name="index"
          options={{
            title: '홈',
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconWrap}>
                <Home size={24} color={focused ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR} strokeWidth={focused ? 2.5 : 1.8} />
              </View>
            ),
          }}
        />

        {/* 검색 */}
        <Tabs.Screen
          name="search"
          options={{
            title: '검색',
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconWrap}>
                <Search size={24} color={focused ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR} strokeWidth={focused ? 2.5 : 1.8} />
              </View>
            ),
          }}
        />

        {/* 가운데 메뉴 버튼 (더미 스크린) */}
        <Tabs.Screen
          name="community"
          options={{
            title: '',
            tabBarButton: () => <MenuButton />,
          }}
        />

        {/* 저장 */}
        <Tabs.Screen
          name="bookmark"
          options={{
            title: '저장',
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconWrap}>
                <Bookmark size={24} color={focused ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR} strokeWidth={focused ? 2.5 : 1.8} />
              </View>
            ),
          }}
        />

        {/* 프로필 */}
        <Tabs.Screen
          name="profile"
          options={{
            title: '프로필',
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconWrap}>
                <User size={24} color={focused ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR} strokeWidth={focused ? 2.5 : 1.8} />
              </View>
            ),
          }}
        />
      </Tabs>

      {/* ── 메뉴 바텀시트 ─────────────────────────────────────────────────── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]} onPress={() => {}}>
            {/* 핸들 */}
            <View style={styles.handle} />

            {/* 헤더 */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>메뉴</Text>
              <TouchableOpacity onPress={() => setMenuVisible(false)} style={styles.closeBtn}>
                <X size={18} color={Colors.gray[500]} />
              </TouchableOpacity>
            </View>

            {/* 메뉴 아이템 */}
            <View style={styles.menuGrid}>
              {MENU_ITEMS.map(({ label, icon: Icon, route, color, bg }) => (
                <TouchableOpacity
                  key={route}
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(route)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuItemIcon, { backgroundColor: bg }]}>
                    <Icon size={26} color={color} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.menuItemLabel}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  iconStyle: { marginBottom: -4 },
  label: { fontSize: 12, marginTop: 4 },

  // 가운데 메뉴 버튼
  menuBtnOuter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  menuBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9810FA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  // 바텀시트
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[200],
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray[900],
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  menuItem: {
    alignItems: 'center',
    gap: 8,
    width: 72,
  },
  menuItemIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.gray[700],
    textAlign: 'center',
  },
});
