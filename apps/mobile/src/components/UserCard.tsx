import React from 'react';
import type { User } from '../services/api/users.api';
import { colors } from '../theme/colors';
import CardActions from './ui/CardActions';

interface UserCardProps {
  user: User;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

function UserCardComponent({ user, onEdit, onDelete, isDeleting }: UserCardProps) {
  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, color: colors.onSurface, margin: 0, fontSize: '14px' }}>
          {user.name}
        </p>
        <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, margin: '4px 0 0' }}>
          {user.email}
        </p>
        <span
          style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor:
              user.role === 'ADMIN' ? colors.primaryContainer : colors.surfaceContainerHigh,
            color: user.role === 'ADMIN' ? '#ffffff' : colors.onSurfaceVariant,
            marginTop: '4px',
            display: 'inline-block',
          }}
        >
          {user.role}
        </span>
      </div>
      {(onEdit || onDelete) && (
        <CardActions onEdit={onEdit} onDelete={onDelete} isDeleting={isDeleting} />
      )}
    </div>
  );
}

const UserCard = React.memo(UserCardComponent);
export default UserCard;
