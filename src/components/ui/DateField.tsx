import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarDays, Clock } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native';

import { Field } from './FormField';

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function parse(value: string, mode: 'date' | 'time'): Date {
  if (mode === 'time') {
    const [h, m] = (value || '').split(':').map(Number);
    const d = new Date();
    if (!Number.isNaN(h)) d.setHours(h, m || 0, 0, 0);
    return d;
  }
  const d = value ? new Date(`${value}T00:00:00`) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function DateField({
  label,
  value,
  onChange,
  mode = 'date',
  placeholder,
  minimumDate,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mode?: 'date' | 'time';
  placeholder?: string;
  minimumDate?: Date;
  optional?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(() => parse(value, mode));
  const Icon = mode === 'time' ? Clock : CalendarDays;

  const openPicker = () => {
    setTemp(parse(value, mode));
    setOpen(true);
  };

  const commit = (d: Date) => onChange(mode === 'time' ? toTimeStr(d) : toDateStr(d));

  // Android shows its own dialog; commit immediately on the change event.
  const onAndroidChange = (e: DateTimePickerEvent, d?: Date) => {
    setOpen(false);
    if (e.type === 'set' && d) commit(d);
  };

  return (
    <Field label={label}>
      <TouchableOpacity
        onPress={openPicker}
        className="flex-row items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5"
      >
        <Text className={`text-sm ${value ? 'text-slate-900' : 'text-slate-400'}`}>
          {value || placeholder || (mode === 'time' ? 'Select time' : 'Select date')}
        </Text>
        <Icon size={16} color="#94a3b8" />
      </TouchableOpacity>

      {optional && value ? (
        <TouchableOpacity onPress={() => onChange('')} hitSlop={8} className="self-start mt-1">
          <Text className="text-xs text-slate-400">Clear</Text>
        </TouchableOpacity>
      ) : null}

      {open && Platform.OS === 'android' && (
        <DateTimePicker value={temp} mode={mode} minimumDate={minimumDate} onChange={onAndroidChange} />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setOpen(false)}>
            <Pressable className="bg-white rounded-t-3xl pb-6" onPress={(e) => e.stopPropagation()}>
              <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100">
                <Text className="text-base font-bold text-slate-900">{label}</Text>
                <TouchableOpacity
                  onPress={() => {
                    commit(temp);
                    setOpen(false);
                  }}
                >
                  <Text className="text-navy-800 font-semibold">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={temp}
                mode={mode}
                display="spinner"
                minimumDate={minimumDate}
                onChange={(_e, d) => d && setTemp(d)}
                style={{ alignSelf: 'center' }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </Field>
  );
}
