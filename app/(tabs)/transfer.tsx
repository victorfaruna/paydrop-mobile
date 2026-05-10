import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/shared';

export default function TransferScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transfer Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
