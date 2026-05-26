export const GLOBAL_KEYFRAMES = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes ripple {
  from { transform: scale(0); opacity: 1; }
  to { transform: scale(4); opacity: 0; }
}
`;

export const fadeIn = {
  animation: 'fadeIn 0.3s ease-out',
} as const;

export const slideUp = {
  animation: 'slideUp 0.4s ease-out',
} as const;

export const pulse = {
  animation: 'pulse 1.5s ease-in-out infinite',
} as const;
