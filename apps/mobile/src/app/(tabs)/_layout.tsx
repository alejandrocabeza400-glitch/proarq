import { Tabs } from 'expo-router';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  dashboard: { active: '📊', inactive: '📊' },
  insumos: { active: '📦', inactive: '📦' },
  apus: { active: '🏗️', inactive: '🏗️' },
  cotizaciones: { active: '💰', inactive: '💰' },
  proyectos: { active: '📋', inactive: '📋' },
  users: { active: '👥', inactive: '👥' },
};

export default function TabLayout() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tertiaryContainer,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.outlineVariant,
          borderTopWidth: 1,
          paddingTop: 4,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontSize: 11,
          fontWeight: 600,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <span style={{ fontSize: 22 }}>
              {TAB_ICONS.dashboard[focused ? 'active' : 'inactive']}
            </span>
          ),
        }}
      />
      <Tabs.Screen
        name="insumos"
        options={{
          title: 'Insumos',
          tabBarIcon: ({ focused }) => (
            <span style={{ fontSize: 22 }}>
              {TAB_ICONS.insumos[focused ? 'active' : 'inactive']}
            </span>
          ),
        }}
      />
      <Tabs.Screen
        name="apus"
        options={{
          title: 'APUs',
          tabBarIcon: ({ focused }) => (
            <span style={{ fontSize: 22 }}>{TAB_ICONS.apus[focused ? 'active' : 'inactive']}</span>
          ),
        }}
      />
      <Tabs.Screen
        name="cotizaciones"
        options={{
          title: 'Cotizaciones',
          tabBarIcon: ({ focused }) => (
            <span style={{ fontSize: 22 }}>
              {TAB_ICONS.cotizaciones[focused ? 'active' : 'inactive']}
            </span>
          ),
        }}
      />
      <Tabs.Screen
        name="proyectos"
        options={{
          title: 'Proyectos',
          tabBarIcon: ({ focused }) => (
            <span style={{ fontSize: 22 }}>
              {TAB_ICONS.proyectos[focused ? 'active' : 'inactive']}
            </span>
          ),
        }}
      />
      {isAdmin && (
        <Tabs.Screen
          name="users"
          options={{
            title: 'Usuarios',
            tabBarIcon: ({ focused }) => (
              <span style={{ fontSize: 22 }}>
                {TAB_ICONS.users[focused ? 'active' : 'inactive']}
              </span>
            ),
          }}
        />
      )}
    </Tabs>
  );
}
