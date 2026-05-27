import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useAuthStore } from '../stores/auth.store';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { PlusIcon, ProyectosIcon, CotizacionesIcon, ApusIcon, InsumosIcon } from './ui/Icons';
import Text from './ui/Text';

export default function FabMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  const canManage = user?.role === 'ADMIN' || user?.role === 'GERENTE_OBRA';
  const isAdmin = user?.role === 'ADMIN';

  const toggleMenu = () => setIsOpen(!isOpen);

  const actions = [
    {
      label: 'Nuevo Proyecto',
      icon: <ProyectosIcon size={20} color={colors.primary} />,
      onPress: () => {
        router.push('/proyectos/create');
        setIsOpen(false);
      },
      visible: canManage,
    },
    {
      label: 'Nueva Cotización',
      icon: <CotizacionesIcon size={20} color={colors.tertiary} />,
      onPress: () => {
        router.push('/cotizaciones/create');
        setIsOpen(false);
      },
      visible: true,
    },
    {
      label: 'Nuevo APU',
      icon: <ApusIcon size={20} color={colors.secondary} />,
      onPress: () => {
        router.push('/apus/create');
        setIsOpen(false);
      },
      visible: canManage,
    },
    {
      label: 'Nuevo Insumo',
      icon: <InsumosIcon size={20} color={colors.success} />,
      onPress: () => {
        router.push('/insumos/create');
        setIsOpen(false);
      },
      visible: isAdmin,
    },
  ].filter((a) => a.visible);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Modal Overlay when menu is open */}
      <Modal transparent visible={isOpen} animationType="fade" onRequestClose={toggleMenu}>
        <Pressable style={styles.overlay} onPress={toggleMenu}>
          <View style={styles.menuContainer}>
            {actions.map((action, index) => (
              <Pressable
                key={index}
                onPress={action.onPress}
                style={({ pressed, hovered }) => [
                  styles.menuItem,
                  (pressed || hovered) && styles.menuItemActive,
                ]}
              >
                <View style={styles.labelWrapper}>
                  <Text variant="labelMd" weight="800" color={colors.primary}>
                    {action.label}
                  </Text>
                </View>
                <View style={[styles.miniFab, { backgroundColor: '#ffffff' }]}>{action.icon}</View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Main FAB */}
      <Pressable
        onPress={toggleMenu}
        style={({ pressed, hovered }) => [
          styles.fab,
          {
            transform: [
              { scale: pressed ? 0.9 : hovered ? 1.05 : 1 },
              { rotate: isOpen ? '45deg' : '0deg' },
            ],
            backgroundColor: isOpen ? colors.primary : colors.tertiary,
          },
        ]}
      >
        <PlusIcon size={32} color="#ffffff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    bottom: 90,
    right: 24,
    zIndex: 99999,
    width: 64,
    height: 64,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 170, // Position above FAB
    paddingRight: 24,
  },
  menuContainer: {
    gap: 16,
    alignItems: 'flex-end',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemActive: {
    transform: [{ translateX: -4 }],
  },
  labelWrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    width: 150,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  miniFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
  },
});
