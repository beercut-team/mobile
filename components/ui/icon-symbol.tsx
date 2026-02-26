// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  'house.fill': 'home',
  'person.fill': 'person',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'bell.fill': 'notifications',
  'list.bullet.clipboard': 'assignment',
  'calendar': 'event',
  'plus.circle.fill': 'add-circle',
  'magnifyingglass': 'search',
  'xmark': 'close',
  'xmark.circle.fill': 'cancel',
  'ellipsis.circle.fill': 'more-horiz',
  'checkmark': 'check',
  'checkmark.circle.fill': 'check-circle',
  'checkmark.seal.fill': 'verified',
  'arrow.uturn.backward.circle.fill': 'undo',
  'exclamationmark.triangle.fill': 'warning',
  'exclamationmark.triangle': 'warning',
  'eye.fill': 'visibility',
  'doc.text.fill': 'description',
  'paperclip': 'attach-file',
  'checklist': 'checklist',
  'trash': 'delete',
  // Notification icons
  'arrow.triangle.2.circlepath': 'sync',
  'person.badge.plus': 'person-add',
  'stethoscope': 'medical-services',
  'calendar.badge.clock': 'schedule',
  'doc.text.magnifyingglass': 'pageview',
  'cross.case': 'local-hospital',
  'bubble.left.and.bubble.right': 'chat',
  'function': 'functions',
  'doc.badge.arrow.up': 'upload-file',
  'doc.fill': 'description',
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
