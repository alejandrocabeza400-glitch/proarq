import { useRouter } from 'expo-router';
import type React from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { useAuthStore } from '../stores/auth.store';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import FabMenu from './FabMenu';
import { BackIcon } from './ui/Icons';
import Text from './ui/Text';

interface HeaderAction {
  icon: React.ReactNode;
  onPress: () => void;
  label?: string;
}

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  scrollable?: boolean;
  headerAction?: HeaderAction;
}

export default function PageLayout({
  title,
  children,
  onBack,
  showBack = false,
  scrollable = true,
  headerAction,
}: PageLayoutProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const ContentWrapper = scrollable ? ScrollView : View;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {showBack && (
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                accessibilityLabel="Volver"
              >
                <BackIcon size={20} color={colors.primary} />
              </Pressable>
            )}
            <Text variant="titleMd" color={colors.primary} style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>

          <View style={styles.headerRight}>
            {headerAction && (
              <Pressable
                onPress={headerAction.onPress}
                style={({ pressed, hovered }) => [
                  styles.actionButton,
                  (pressed || hovered) && styles.pressed
                ]}
                accessibilityLabel={headerAction.label}
              >
                {headerAction.icon}
              </Pressable>
            )}
            
            {isAuthenticated && user && (
              <Pressable
                onPress={() => router.push('/profile')}
                style={({ pressed, hovered }) => [
                  styles.avatar,
                  {
                    transform: [{ scale: pressed ? 0.95 : hovered ? 1.05 : 1 }],
                  },
                ]}
              >
                <Text variant="labelMd" weight="800" color="#ffffff">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Main Content Area */}
        <ContentWrapper 
          style={styles.content} 
          contentContainerStyle={scrollable ? styles.scrollContent : { flex: 1 }}
        >
          <View style={[styles.innerContent, !scrollable && { flex: 1 }]}>
            {children}
          </View>
        </ContentWrapper>
      </View>

      {/* Global Quick Action Menu - Rendered at safe area root */}
      {isAuthenticated && <FabMenu />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  header: {
    height: 72,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 90,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
    marginRight: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  actionButton: {
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  pressed: {
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
  },
  title: {
    letterSpacing: -0.5,
    fontSize: 18,
    fontWeight: '800',
    flexShrink: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Extra space for FAB
  },
  innerContent: {
    padding: spacing.lg,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
});
