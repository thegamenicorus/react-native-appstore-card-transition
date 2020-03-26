import React, { useRef } from 'react';
import { TouchableWithoutFeedback, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { useValues, useClocks, timing } from 'react-native-redash';
const { block, cond, eq, set } = Animated;

const { useCode, clockRunning, call } = Animated;

const offset = value =>
  Platform.select({
    ios: value,
    //android: add(value, StatusBar.currentHeight),
    android: value,
  });
const measure = async ref =>
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

const PressView = ({
  card,
  activeId = -1,
  onFocus,
  open,
  sharedMode = false,
  animationStyle,
  config,
  children,
  style,
}) => {
  const container = useRef(null);
  const [clock] = useClocks(1, []);
  const [toggle, animation] = useValues([0, 1], []);

  const position = useRef({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  useCode(
    () =>
      block([
        set(
          animation,
          cond(
            eq(toggle, 1),
            [
              cond(clockRunning(clock), [], [call([], setPosition)]),
              timing({ clock, from: animation, to: 0.97, duration: 100 }),
            ],
            [timing({ clock, from: animation, to: 1, duration: 100 })],
          ),
        ),
      ]),
    [toggle, animation],
  );

  const setPosition = async () => {
    position.current = await measure(container.current.getNode());
  };

  const focus = () => {
    toggle.setValue(1);
  };

  const blur = () => {
    toggle.setValue(0);
  };

  const onPressIn = async () => {
    if (sharedMode) {
      return;
    }
    focus();
    onFocus && onFocus(blur);
  };

  const onPress = async () => {
    if (sharedMode) {
      return;
    }
    blur();

    if (
      !position.current.x &&
      !position.current.y &&
      !position.current.height &&
      !position.current.width
    ) {
      await setPosition();
    }
    open(card, position.current);
  };

  return (
    <TouchableWithoutFeedback onPressIn={onPressIn} onPress={onPress}>
      <Animated.View
        ref={container}
        style={[
          style,
          {
            ...config,
            transform: [{ scale: animation }],
            opacity: cond(eq(activeId, card.id), 0, 1),
          },
          animationStyle && animationStyle.container,
        ]}>
        {/* {React.cloneElement(children, { config, animationStyle, card })} */}
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default PressView;
