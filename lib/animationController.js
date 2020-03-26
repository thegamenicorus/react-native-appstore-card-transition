import Animated, { Clock, Value, Easing } from 'react-native-reanimated';
import { timing, spring } from 'react-native-redash';

const { set } = Animated;
export const createAnimationConfig = value => ({
  value: new Value(value),
  clock: new Clock(),
});

const springConfig = () => ({
  damping: 12,
  mass: 0.6,
  stiffness: 100,
  overshootClamping: false,
  restSpeedThreshold: 0.001,
  restDisplacementThreshold: 0.001,
});

export const springCardAnimation = ({ clock, value, toValue }) =>
  set(
    value,
    spring({
      clock,
      from: value,
      to: toValue,
      config: springConfig(),
    }),
  );

export const timingCardAnimation = ({
  clock,
  value,
  toValue,
  duration = 400,
}) =>
  set(
    value,
    timing({
      clock,
      from: value,
      to: toValue,
      duration,
      easing: Easing.out(Easing.back(0.1)),
    }),
  );
