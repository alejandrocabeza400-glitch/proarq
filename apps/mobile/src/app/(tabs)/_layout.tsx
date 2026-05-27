import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import {
  ApusIcon,
  CotizacionesIcon,
  DashboardIcon,
  InsumosIcon,
  LogsIcon,
  ProyectosIcon,
  UsersIcon,
} from '../../components/ui/Icons';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';

export default function TabLayout() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarShowLabel: false, // Hide labels to prevent clutter with 6 items
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: 'rgba(226, 232, 240, 0.6)',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 0,
          position: 'relative', // Changed from absolute to prevent overlapping page content
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 8,
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'ios' ? 12 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconWrapper,
              focused && styles.iconWrapperActive
            ]}>
              <DashboardIcon color={color} size={22} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="proyectos"
        options={{
          title: 'Proyectos',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconWrapper,
              focused && styles.iconWrapperActive
            ]}>
              <ProyectosIcon color={color} size={22} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cotizaciones"
        options={{
          title: 'Cotizaciones',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconWrapper,
              focused && styles.iconWrapperActive
            ]}>
              <CotizacionesIcon color={color} size={22} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="insumos"
        options={{
          title: 'Insumos',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconWrapper,
              focused && styles.iconWrapperActive
            ]}>
              <InsumosIcon color={color} size={22} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="apus"
        options={{
          title: 'APUs',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconWrapper,
              focused && styles.iconWrapperActive
            ]}>
              <ApusIcon color={color} size={22} />
            </View>
          ),
        }}
      />
      {isAdmin && (
        <Tabs.Screen
          name="users"
          options={{
            title: 'Usuarios',
            tabBarIcon: ({ color, focused }) => (
              <View style={[
                styles.iconWrapper,
                focused && styles.iconWrapperActive
              ]}>
                <UsersIcon color={color} size={22} />
              </View>
            ),
          }}
        />
      )}
      {isAdmin && (
        <Tabs.Screen
          name="audit"
          options={{
            title: 'Auditoría',
            tabBarIcon: ({ color, focused }) => (
              <View style={[
                styles.iconWrapper,
                focused && styles.iconWrapperActive
              ]}>
                <LogsIcon color={color} size={22} />
              </View>
            ),
          }}
        />
      )}
    </Tabs>
  );
}

const styles = {
  iconWrapper: {
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
  },
} as const;
