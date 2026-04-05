import { Theme } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background.light,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text.inverse,
  },
});
