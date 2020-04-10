// import { Platform, StatusBar } from 'react-native';
import { add } from 'react-native-reanimated';

// const offset = value =>
//   Platform.select({
//     ios: value,
//     android: add(value, StatusBar.currentHeight),
//     //android: value,
//   });

export const measure = async (ref, { offsetX = 0, offsetY = 0 }) =>
  new Promise((resolve) =>
    ref.measureInWindow((x, y, width, height) =>
      resolve({
        x: add(x, offsetX),
        y: add(y, offsetY),
        width,
        height,
      }),
    ),
  );
