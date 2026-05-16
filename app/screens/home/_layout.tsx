import { Stack } from "expo-router";

export default function HomeScreensLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="transactions"
        options={{
          title: "Transactions",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: "Notifications",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="topup"
        options={{
          title: "Add money",
          headerShown: false,
        }}
      />
      <Stack.Screen name="nearby" options={{ headerShown: false }} />
      <Stack.Screen name="receive" options={{ headerShown: false }} />
      <Stack.Screen name="qr-scanner" options={{ headerShown: false }} />

    </Stack>
  );
}
