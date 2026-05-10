# PayDrop Mobile

**PayDrop** is a modern, state-of-the-art fintech mobile application designed to simplify peer-to-peer money transfers. Built with a focus on trust and user experience, PayDrop prioritizes intuitive interactions and a premium aesthetic.

*"Trust the Person. Not the Number."*

## 🚀 Key Features

- **Immersive Onboarding**: A high-end, multi-stage onboarding flow designed to wow users from the first launch.
- **Secure Authentication**: Robust phone number verification with a 6-digit OTP system.
- **Modern Fintech Dashboard**: A comprehensive home screen featuring real-time balance tracking, quick actions, and detailed transaction history.
- **Seamless UX**: Smooth transitions and micro-animations powered by React Native Reanimated.
- **Custom Design System**: Utilizing **Clash Display** typography and a tailored color palette for a premium brand feel.

## 🛠 Tech Stack

- **Framework**: [Expo](https://expo.dev/) / [React Native](https://reactnative.dev/)
- **Styling**: [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (with Persistence)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Icons**: [Ionicons](https://ionicons.com/) via Expo Vector Icons

## 📁 Project Structure

```text
app/
├── (auth)/         # Authentication flow (Onboarding, Phone, OTP, Display Name)
├── (tabs)/         # Main application tabs (Home, Transfer, Cards, Profile)
├── _layout.tsx     # Root layout with conditional routing
└── index.tsx       # Smart splash screen & entry point
components/
└── shared/         # Reusable design system components
config/
├── colors.ts       # Global brand color palette
└── fonts.ts        # Typography configuration
store/
├── appState.ts     # Persistent app-level state (onboarding status)
└── userStore.ts    # User authentication & profile state
```

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Expo Go](https://expo.dev/go) app on your mobile device or an emulator (iOS/Android)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/victorfaruna/paydrop-mobile.git
   cd paydrop-mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Running the App

Start the development server with a clean cache:

```bash
npx expo start -c
```

Open the app on your device by scanning the QR code with Expo Go, or press `i` for iOS simulator / `a` for Android emulator.

## 🎨 Design Principles

- **No Unnecessary Shadows**: Utilizing flat design with thin borders and color variations for depth.
- **Premium Typography**: Extensive use of **Clash Display** for a sophisticated fintech look.
- **Responsive Layouts**: Flexible designs that adapt across various screen sizes.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
