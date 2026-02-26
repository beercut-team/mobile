import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function OfflineIndicator() {
  const { isOnline, isSyncing, pendingCount, syncQueue } = useOfflineSync();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: isOnline ? colors.warning : colors.destructive }]}>
      <View style={styles.content}>
        <Text style={[styles.text, { color: '#FFFFFF' }]}>
          {isOnline
            ? `${pendingCount} изменений ожидают синхронизации`
            : 'Нет подключения к интернету'}
        </Text>
        {isOnline && pendingCount > 0 && (
          <TouchableOpacity
            onPress={syncQueue}
            disabled={isSyncing}
            style={[styles.button, { opacity: isSyncing ? 0.6 : 1 }]}
          >
            <Text style={styles.buttonText}>
              {isSyncing ? 'Синхронизация...' : 'Синхронизировать'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    minWidth: 0,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    flexShrink: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
