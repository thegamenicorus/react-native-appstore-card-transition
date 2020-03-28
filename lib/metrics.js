import { Platform } from 'react-native';
const offset = value =>
  Platform.select({
    ios: value,
    //android: add(value, StatusBar.currentHeight),
    android: value,
  });

export const measure = async ref =>
  new Promise(resolve =>
    ref.measureInWindow((x, y, width, height) =>
      resolve({
        x,
        y: offset(y),
        width,
        height,
      }),
    ),
  );
