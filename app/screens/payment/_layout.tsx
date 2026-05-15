import { Stack } from "expo-router";

export default function PaymentScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="transfer" />
      <Stack.Screen name="recipient-preview" />
      <Stack.Screen name="enter-amount" />
      <Stack.Screen name="payment-confirm" />
      <Stack.Screen name="flag-warning" />
      <Stack.Screen name="payment-result" />
    </Stack>
  );
}
