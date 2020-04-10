import React, { useRef } from 'react';
import Animated, { or, and } from 'react-native-reanimated';
import { useValues, useClocks } from 'react-native-redash';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import { useMemoOne } from 'use-memo-one';
import { timingAnimation, Controller } from '../animationController';
import { measure } from '../metrics';

const { block, cond, eq, set, event, useCode, clockRunning, call } = Animated;

const PressView = ({
  card,
  onSelect,
  animationStyle,
  config,
  children,
  style,
  sharedMode = false,
  controller = Controller._defaultParam,
  pressScale = 0.97,
  xOffset = 0,
  yOffset = 0,
}) => {
  const container = useRef(null);
  const [clock] = useClocks(1, []);
  const [toggle, animation, tapGestureState, isSharedMode] = useValues(
    [0, 1, State.UNDETERMINED, sharedMode ? 1 : 0],
    [],
  );

  const position = useMemoOne(
    () => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }),
    [],
  );

  const setPosition = async () => {
    const { x, y, width, height } = await measure(container.current.getNode(), {
      xOffset,
      yOffset,
    });

    position.x = x;
    position.y = y;
    position.width = width;
    position.height = height;
  };

  const onTap = async () => {
    if (sharedMode) {
      return;
    }

    if (!position.x && !position.y && !position.height && !position.width) {
      await setPosition();
    }

    onSelect && onSelect({ card, position });
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
                    [call([], onTap)],
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
                toValue: pressScale,
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
    <TapGestureHandler
      numberOfTaps={1}
      maxDurationMs={20000}
      onHandlerStateChange={onHandlerStateChange}>
      <Animated.View
        ref={container}
        style={[
          style,
          {
            ...config,
            transform: [{ scale: animation }],
            opacity: cond(eq(controller.activeId, card.shareId), 0, 1),
          },
          animationStyle && animationStyle.container,
        ]}>
        {children}
      </Animated.View>
    </TapGestureHandler>
  );
};

export default PressView;
