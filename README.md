# Days App

This is a React Native application built with [Expo](https://expo.dev) and [NativeWind](https://nativewind.dev/) (Tailwind CSS).
It also supports SCSS modules via `react-native-sass-transformer`.

## Getting Started

1.  **Install dependencies:**

    ```bash
    pnpm install
    ```

2.  **Start the app:**

    ```bash
    pnpm start
    ```

3.  **Debug the app in web browser:**

    ```bash
    pnpm dev
    ```

4.  **Build the static web app:**

    ```bash
    pnpm build
    ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## Styling

### NativeWind (Recommended)

Use Tailwind utility classes directly in your components via `className` prop.

```tsx
<View className="flex-1 items-center justify-center bg-white">
  <Text className="text-xl font-bold">Hello NativeWind</Text>
</View>
```

### SCSS Modules

You can import SCSS files directly. They will be transformed into style objects.

```tsx
import styles from './styles.scss';

<View style={styles.container}>
  <Text style={styles.text}>Hello SCSS</Text>
</View>;
```

## Useful Commands

- `pnpm start`: Start the dev server
- `pnpm android`: Run on Android
- `pnpm ios`: Run on iOS
- `pnpm web`: Run on Web
- `pnpm lint`: Lint the project
- `pnpm format`: Format code with Prettier

## License

GNU GPL v3
