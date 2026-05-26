import type React from 'react';
import { colors } from '../../theme/colors';

interface InputProps {
  placeholder?: string;
  label?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'tel';
  maxLength?: number;
  'aria-label'?: string;
  editable?: boolean;
  disabled?: boolean;
  type?: string;
  style?: React.CSSProperties;
  name?: string;
}

export default function Input({
  placeholder,
  label,
  value,
  onChangeText,
  onChange,
  error,
  secureTextEntry,
  keyboardType,
  maxLength,
  editable = true,
  disabled,
  type: typeProp,
  style,
  name,
  ...rest
}: InputProps) {
  const getInputType = () => {
    if (typeProp) return typeProp;
    if (secureTextEntry) return 'password';
    if (keyboardType === 'email-address') return 'email';
    return 'text';
  };

  const inputType = getInputType();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e);
    }
    if (onChangeText) {
      onChangeText(e.target.value);
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '16px',
    ...style,
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter',
    fontSize: '14px',
    fontWeight: 500,
    color: colors.onSurface,
    lineHeight: '1.4',
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: 'Inter',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '1.5',
    padding: '12px 16px',
    border: error ? `1px solid ${colors.error}` : `1px solid ${colors.outlineVariant}15`,
    borderRadius: '6px',
    backgroundColor: editable ? colors.surface : colors.surfaceContainerLow,
    color: colors.onSurface,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    opacity: !editable ? 0.6 : 1,
  };

  const focusStyle = `
    .input-field:focus {
      border-color: ${colors.primaryContainer} !important;
      border-bottom-width: 2px !important;
    }
  `;

  const errorTextStyle: React.CSSProperties = {
    fontFamily: 'Inter',
    fontSize: '12px',
    color: colors.error,
    fontWeight: 500,
    lineHeight: '1.4',
  };

  return (
    <div style={containerStyle}>
      <style>{focusStyle}</style>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        maxLength={maxLength}
        disabled={disabled !== undefined ? disabled : !editable}
        className={`input-field${error ? ' error' : ''}`}
        aria-label={rest['aria-label']}
        style={inputStyle}
        name={name}
      />
      {error && <span style={errorTextStyle}>{error}</span>}
      {maxLength && (
        <span
          style={{
            fontFamily: 'Inter',
            fontSize: '12px',
            color: colors.onSurfaceVariant,
            textAlign: 'right',
          }}
        >
          {value?.length || 0}/{maxLength}
        </span>
      )}
    </div>
  );
}
