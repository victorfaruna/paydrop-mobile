import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="transactions"
        options={{
          title: "Transactions",
          headerStyle: { backgroundColor: "#7C3AED" },
          headerTintColor: "white",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: "Notifications",
          headerStyle: { backgroundColor: "#7C3AED" },
          headerTintColor: "white",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="topup"
        options={{
          title: "Add money",
          headerStyle: { backgroundColor: "#7C3AED" },
          headerTintColor: "white",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
