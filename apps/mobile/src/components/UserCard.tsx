import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { User } from '../services/api/users.api';
import { colors } from '../theme/colors';
import Card from './ui/Card';
import CardActions from './ui/CardActions';
import Text from './ui/Text';

interface UserCardProps {
  user: User;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

function getRoleStyles(role: string): { bg: string; text: string } {
  switch (role?.toUpperCase()) {
    case 'ADMIN':
      return { bg: '#e0f2f1', text: '#004d40' }; // Teal
    case 'GERENTE_OBRA':
      return { bg: '#e8f4fd', text: '#0d47a1' }; // Blue
    case 'DIRECTOR_OBRA':
      return { bg: '#efebe9', text: '#4e342e' }; // Brown
    default:
      return { bg: '#f5f5f5', text: '#424242' }; // Grey
  }
}

function UserCardComponent({ user, onEdit, onDelete, isDeleting }: UserCardProps) {
  const badge = getRoleStyles(user.role);

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="bodyMd" weight="700" color={colors.primary} style={styles.name}>
            {user.name}
          </Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text variant="labelSm" weight="800" color={badge.text} style={styles.badgeText}>
              {user.role}
            </Text>
          </View>
        </View>
        <Text variant="labelSm" color={colors.onSurfaceVariant} style={styles.email}>
          {user.email}
        </Text>
      </View>
      {(onEdit || onDelete) && (
        <CardActions onEdit={onEdit} onDelete={onDelete} isDeleting={isDeleting} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    minHeight: 85,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  name: {
    letterSpacing: -0.2,
  },
  email: {
    opacity: 0.7,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

const UserCard = React.memo(UserCardComponent);
export default UserCard;
