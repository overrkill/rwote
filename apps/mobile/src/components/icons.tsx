import { View } from 'react-native';
import {
  Pin,
  Pencil,
  Trash2,
  Plus,
  Search,
  Settings,
  FileText,
  Check,
  X,
  Eye,
  Filter,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

type IconProps = LucideProps;

export function PinIcon({ size = 20, color = 'currentColor', fill, ...props }: IconProps & { fill?: string }) {
  return <Pin size={size} color={color} fill={fill && fill !== 'none' ? color : undefined} strokeWidth={fill && fill !== 'none' ? 0 : 1.75} {...props} />;
}

export function EditIcon(props: IconProps) {
  return <Pencil size={props.size || 20} color={props.color} {...props} />;
}

export function TrashIcon(props: IconProps) {
  return <Trash2 size={props.size || 20} color={props.color} {...props} />;
}

export function PlusIcon(props: IconProps) {
  return <Plus size={props.size || 20} color={props.color} {...props} />;
}

export function SearchIcon(props: IconProps) {
  return <Search size={props.size || 20} color={props.color} {...props} />;
}

export function SettingsIcon(props: IconProps) {
  return <Settings size={props.size || 20} color={props.color} {...props} />;
}

export function NotesIcon(props: IconProps) {
  return <FileText size={props.size || 20} color={props.color} {...props} />;
}

export function CheckIcon(props: IconProps) {
  return <Check size={props.size || 20} color={props.color} {...props} />;
}

export function XIcon(props: IconProps) {
  return <X size={props.size || 20} color={props.color} {...props} />;
}

export function EyeIcon(props: IconProps) {
  return <Eye size={props.size || 20} color={props.color} {...props} />;
}

export function FilterIcon(props: IconProps) {
  return <Filter size={props.size || 20} color={props.color} {...props} />;
}

export function GoogleIcon({ size = 20 }: { size?: number }) {
  const s = size;
  return (
    <View style={{ width: s, height: s }}>
      <View style={{ width: s, height: s, backgroundColor: '#4285F4', borderRadius: s / 5 }} />
    </View>
  );
}