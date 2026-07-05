import { Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

import { Field } from './FormField';

export type Option = { value: string; label: string };

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select…',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Field label={label}>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5"
      >
        <Text className={`text-sm ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={16} color="#94a3b8" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setOpen(false)}>
          <Pressable className="bg-white rounded-t-3xl max-h-[70%] pb-6" onPress={(e) => e.stopPropagation()}>
            <View className="items-center py-3">
              <View className="w-10 h-1 rounded-full bg-slate-200" />
            </View>
            <Text className="text-base font-bold text-slate-900 px-5 pb-2">{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    className="flex-row items-center justify-between px-5 py-3.5 border-b border-slate-50"
                  >
                    <Text className={`text-sm ${active ? 'text-navy-800 font-semibold' : 'text-slate-700'}`}>
                      {item.label}
                    </Text>
                    {active && <Check size={17} color="#0D1B45" />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text className="text-slate-400 text-sm px-5 py-6 text-center">No options available.</Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </Field>
  );
}
