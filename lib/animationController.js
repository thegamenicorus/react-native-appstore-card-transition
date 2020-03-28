import Animated, { Clock, Value, Easing, set } from 'react-native-reanimated';
import { timing, spring } from 'react-native-redash';
import { useMemoOne } from 'use-memo-one';

const create = () => ({
  activeId: new Animated.Value(-1),
  mainAnimationValue: new Animated.Value(0),
  scaleAnimationValue: new Animated.Value(1),
  shouldClose: new Animated.Value(0),
  close: function() {
    this.shouldClose.setValue(1);
  },
});

export const Controller = {
  _defaultParam: {
    activeId: -1,
  },
  default: create,
  create,
};

export const useController = () => useMemoOne(() => Controller.create(), []);

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

export const timingAnimation = ({
  clock,
  value,
  toValue,
  duration = 400,
  easing = Easing.linear,
}) =>
  set(
    value,
    timing({
      clock,
      from: value,
      to: toValue,
      duration,
      easing,
    }),
  );
