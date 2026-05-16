import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AppState {
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;
  hasSeenIntro: boolean;
  setHasSeenIntro: (seen: boolean) => void;
}

export const useAppState = create<AppState>()(
  persist(
    (set) => ({
      onboardingCompleted: false,
      setOnboardingCompleted: (completed: boolean) =>
        set({ onboardingCompleted: completed }),
      hasSeenIntro: false,
      setHasSeenIntro: (seen: boolean) => set({ hasSeenIntro: seen }),
    }),
    {
      name: "app-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
