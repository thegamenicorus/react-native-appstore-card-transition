import React, { useRef } from 'react';
import { TouchableWithoutFeedback, Platform } from 'react-native';
import Animated, { or, and, Easing } from 'react-native-reanimated';
import { useValues, useClocks, timing } from 'react-native-redash';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import { timingAnimation } from '../animationController';

const { block, cond, eq, set, event, useCode, clockRunning, call } = Animated;

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
  onOpen,
  sharedMode = false,
  animationStyle,
  config,
  children,
  style,
}) => {
  const container = useRef(null);
  const [clock] = useClocks(1, []);
  const [toggle, animation, tapGestureState, isSharedMode] = useValues(
    [0, 1, State.UNDETERMINED, sharedMode ? 1 : 0],
    [],
  );

  const position = useRef({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const setPosition = async () => {
    position.current = await measure(container.current.getNode());
  };

  // const focus = () => {
  //   toggle.setValue(1);
  // };

  // const blur = () => {
  //   toggle.setValue(0);
  // };

  // const onPressIn = async () => {
  //   if (sharedMode) {
  //     return;
  //   }
  //   console.log('onPressIn');
  //   focus();
  //   onFocus && onFocus(blur);
  // };

  const onPress = async () => {
    if (sharedMode) {
      return;
    }
    // blur();

    if (
      !position.current.x &&
      !position.current.y &&
      !position.current.height &&
      !position.current.width
    ) {
      await setPosition();
    }
    // console.log('onPress', position.current);
    onOpen && onOpen(card, position.current);
  };

  const onHandlerStateChange = event([
    { nativeEvent: { state: tapGestureState } },
  ]);

  useCode(
    () =>
      block([
        cond(eq(isSharedMode, 0), [
          cond(
            and(
              eq(tapGestureState, State.BEGAN),
              eq(clockRunning(clock), 0),
              eq(toggle, 0),
            ),
            [
              cond(clockRunning(clock), [], [call([], setPosition)]),
              set(toggle, 1),
            ],
            [
              cond(
                and(
                  eq(toggle, 1),
                  or(
                    eq(tapGestureState, State.CANCELLED),
                    eq(tapGestureState, State.FAILED),
                    eq(tapGestureState, State.END),
                    eq(tapGestureState, State.ACTIVE),
                  ),
                ),
                [
                  cond(
                    or(
                      eq(tapGestureState, State.END),
                      eq(tapGestureState, State.ACTIVE),
                    ),
                    [call([], onPress)],
                  ),
                  set(toggle, 0),
                ],
              ),
            ],
          ),
        ]),

        set(
          animation,
          cond(
            eq(toggle, 1),
            [
              timingAnimation({
                clock,
                value: animation,
                toValue: 0.97,
                duration: 200,
              }),
            ],
            [
              timingAnimation({
                clock,
                value: animation,
                toValue: 1,
                duration: 200,
              }),
            ],
          ),
        ),
      ]),
    [toggle, animation, tapGestureState],
  );

  return (
    // <TouchableWithoutFeedback onPressIn={onPressIn} onPress={onPress}>
    <TapGestureHandler
      numberOfTaps={1}
      maxDurationMs={20000}
      // onGestureEvent={onHandlerStateChange}
      onHandlerStateChange={onHandlerStateChange}>
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
    </TapGestureHandler>
    // </TouchableWithoutFeedback>
  );
};

export default PressView;
