import { ReactNode } from 'react';
import { Text, TextInput, View } from 'react-native';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="mb-3">
      <Text className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </Text>
      {children}
    </View>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
  multiline?: boolean;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
}: TextFieldProps) {
  return (
    <Field label={label}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        className={`bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm ${
          multiline ? 'h-20' : ''
        }`}
        style={multiline ? { textAlignVertical: 'top' } : undefined}
      />
    </Field>
  );
}

/** Number field that reads/writes a JS number (blank → 0). */
export function NumberField({
  label,
  value,
  onChangeNumber,
  placeholder,
}: {
  label: string;
  value: number;
  onChangeNumber: (n: number) => void;
  placeholder?: string;
}) {
  return (
    <TextField
      label={label}
      value={value === 0 ? '' : String(value)}
      onChangeText={(t) => onChangeNumber(Number(t.replace(/[^0-9.]/g, '')) || 0)}
      placeholder={placeholder ?? '0'}
      keyboardType="numeric"
    />
  );
}
