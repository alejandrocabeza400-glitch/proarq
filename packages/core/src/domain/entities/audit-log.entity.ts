/** Pure domain entity for AuditLog. */
export interface AuditLog {
  id: string;
  tableName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  userId: string;
  dataHistory: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  createdAt: Date;
}
