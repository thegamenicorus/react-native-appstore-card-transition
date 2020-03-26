import React, { useEffect, useState, useRef } from 'react';
import {
  Dimensions,
  StatusBar,
  Platform,
  Image,
  StyleSheet,
} from 'react-native';
import Animated from 'react-native-reanimated';
import {
  PanGestureHandler,
  NativeViewGestureHandler,
  TapGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { useValues, useClocks, round } from 'react-native-redash';
import { springCardAnimation } from '../animationController';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { useBackHandler } from '@react-native-community/hooks';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const {
  block,
  cond,
  eq,
  set,
  clockRunning,
  sub,
  useCode,
  greaterOrEq,
  Extrapolate,
  call,
  and,
  lessOrEq,
  event,
  greaterThan,
  neq,
  multiply,
  divide,
  Clock,
  max,
  min,
} = Animated;

const SharedTransition = ({
  sharedCard,
  onClose,
  defaultStateConfig,
  openStateConfig,
  activeId,
  children,
  style,
  closeButton,
}) => {
  const { card, position } = sharedCard;
  let isReadyToCloseFromJS = false;
  const scrollView = useRef(null);
  const panGesture = useRef(null);
  const nativeGesture = useRef(null);

  const [
    animation,
    translationY,
    topMostTranslationY,
    shouldClose,
    scrollContentOffsetY,
    scrollBounceEnabled,
    scale,
    gestureState,
    closeButtonState,
  ] = useValues(
    [0, 1, 0, 0, 0, 1, 1, State.UNDETERMINED, State.UNDETERMINED],
    [],
  );

  const willCloseTranslationY = sub(translationY, topMostTranslationY);

  const [clock] = useClocks(1, []);

  const createInterpolate = (outputRange, inputRange) =>
    animation.interpolate({
      inputRange: inputRange || [0, 1],
      outputRange,
      // extrapolate: Extrapolate.CLAMP,
    });

  const width = createInterpolate([position.width, windowWidth]);
  const height = createInterpolate([position.height, windowHeight]);
  const thumbnailHeight = createInterpolate([
    position.height,
    openStateConfig.thumbnailHeight,
  ]);
  const left = createInterpolate([position.x, 0]);
  const top = createInterpolate([position.y, 0]);
  const borderRadius = createInterpolate([defaultStateConfig.borderRadius, 0]);
  const closeButtonOpacity = createInterpolate([0, 1], [0.7, 1]);
  const shadowOpacity = createInterpolate([0.25, 0], [0, 1]);
  const contentOpacity = createInterpolate([0, 1], [0, 0.8]);
  const scaleOnClose = createInterpolate([1, scale]);
  const willCloseRadius = scale.interpolate({
    inputRange: [0.8, 1],
    outputRange: [defaultStateConfig.borderRadius, 0],
    extrapolate: Extrapolate.CLAMP,
  });
  const closeButtonOpacityFromScale = scale.interpolate({
    inputRange: [0.9, 1],
    outputRange: [0, 1],
    extrapolate: Extrapolate.CLAMP,
  });

  const [scrollEnabled, setScrollEnabled] = useState(true);

  const disableScroll = () => {
    if (Platform.OS === 'android') {
      setScrollEnabled(false);
    }
  };

  const closeSharedTransition = () => {
    if (Platform.OS === 'ios') {
      StatusBar.setHidden(false, 'slide');
    }
    scrollView.current.getNode().scrollTo({ y: 0, animated: true });
    disableScroll();
  };

  const readyToCloseFromJS = () => {
    isReadyToCloseFromJS = true;
  };

  const onScroll = event(
    [
      {
        nativeEvent: {
          contentOffset: { y: scrollContentOffsetY },
        },
      },
    ],
    { useNativeEvent: true },
  );

  const onGestureEvent = event([{ nativeEvent: { translationY } }]);
  const onHandlerStateChange = event([
    { nativeEvent: { state: gestureState } },
  ]);
  const closeButtonOnHandlerStateChange = event([
    { nativeEvent: { state: closeButtonState } },
  ]);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      StatusBar.setHidden(true, 'slide');
    }
    activeId.setValue(sharedCard.card.id);
    shouldClose.setValue(0);
  }, [position, shouldClose, animation, activeId, sharedCard]);

  useCode(
    () =>
      block([
        // Close Card animation
        cond(eq(shouldClose, 1), [
          springCardAnimation({
            clock,
            value: animation,
            toValue: 0,
          }),
          cond(
            eq(clockRunning(clock), 0),
            [
              // after animation finish
              set(scrollBounceEnabled, 1),
              call([], onClose),
            ],
            [],
          ),
        ]),

        // Open Card animation
        cond(eq(shouldClose, 0), [
          springCardAnimation({
            clock,
            value: animation,
            toValue: 1,
          }),
          cond(
            eq(clockRunning(clock), 0),
            [
              // after animation finish
              call([], readyToCloseFromJS),
            ],
            [],
          ),
        ]),

        // release finger -> clear topMostTranslationY
        cond(and(eq(gestureState, State.END), neq(topMostTranslationY, 0)), [
          // clear topMostTranslationY
          set(topMostTranslationY, 0),
        ]),

        // release finger -> set scale back to 1
        cond(and(eq(gestureState, State.END), eq(shouldClose, 0)), [
          springCardAnimation({
            clock: new Clock(),
            value: scale,
            toValue: 1,
          }),
        ]),

        // scroll
        // set top most
        cond(
          and(
            eq(scrollContentOffsetY, 0),
            eq(topMostTranslationY, 0),
            eq(gestureState, State.ACTIVE),
            eq(clockRunning(clock), 0),
          ),
          [
            // reach top most
            set(topMostTranslationY, translationY),
          ],
        ),

        // Set bounce
        cond(
          and(
            lessOrEq(scrollContentOffsetY, windowHeight / 3),
            eq(scrollBounceEnabled, 1),
          ),
          // set bounce to false
          [set(scrollBounceEnabled, 0)],
        ),
        cond(
          and(
            greaterThan(scrollContentOffsetY, windowHeight / 3),
            eq(scrollBounceEnabled, 0),
          ),
          // set bounce to true
          [set(scrollBounceEnabled, 1)],
        ),

        // should close decision
        cond(
          and(
            neq(topMostTranslationY, 0),
            greaterOrEq(willCloseTranslationY, 70),
            eq(shouldClose, 0),
          ),
          [set(shouldClose, 1), call([], closeSharedTransition)],
        ),

        // if willCloseTranslationY > 0 or drag to close
        cond(
          and(
            greaterOrEq(willCloseTranslationY, 0),
            neq(topMostTranslationY, 0),
          ),
          [
            set(
              scale,
              max(
                round(
                  sub(1, divide(multiply(willCloseTranslationY, 0.2), 70)),
                  3,
                ),
                0.8,
              ),
            ),
            cond(greaterOrEq(scale, 0.98), [set(scale, 1)]),
          ],
        ),

        // close button pressed and wait for clock running
        cond(
          and(eq(closeButtonState, State.BEGAN), eq(clockRunning(clock), 0)),
          [set(shouldClose, 1), call([], closeSharedTransition)],
        ),
      ]),
    [animation, closeButtonState],
  );

  useBackHandler(() => {
    // ANDROID:: handler Hardware Back Press
    if (isReadyToCloseFromJS) {
      shouldClose.setValue(1);
      closeSharedTransition();
    }

    return true;
  });

  const containerAnimationStyle = {
    ...openStateConfig,
    width,
    borderRadius,
    shadowOpacity,
    height: openStateConfig.thumbnailHeight,
  };
  const thumbnailAnimationStyle = {
    height: thumbnailHeight,
    borderRadius,
    borderTopLeftRadius: cond(
      eq(shouldClose, 0),
      willCloseRadius,
      max(willCloseRadius, borderRadius),
    ),
    borderTopRightRadius: cond(
      eq(shouldClose, 0),
      willCloseRadius,
      max(willCloseRadius, borderRadius),
    ),
  };
  const contentAnimationStyle = {
    opacity: contentOpacity,
  };
  const closeButtonAnimationStyle = {
    opacity: min(closeButtonOpacity, closeButtonOpacityFromScale),
  };

  const animationStyle = {
    container: containerAnimationStyle,
    thumbnail: thumbnailAnimationStyle,
    content: contentAnimationStyle,
  };

  return (
    <PanGestureHandler
      ref={panGesture}
      maxPointers={1}
      simultaneousHandlers={nativeGesture}
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ scale: scaleOnClose }],
            opacity: neq(activeId, -1),
          },
        ]}>
        <Animated.View
          style={[
            styles.container,
            style,
            {
              width,
              height,
              left,
              top,
              borderRadius: max(borderRadius, willCloseRadius),
            },
          ]}>
          <NativeViewGestureHandler
            ref={nativeGesture}
            simultaneousHandlers={panGesture}>
            <Animated.ScrollView
              ref={scrollView}
              style={{ borderRadius: max(borderRadius, willCloseRadius) }}
              scrollEnabled={Platform.select({
                ios: eq(shouldClose, 0),
                android: scrollEnabled,
              })}
              bounces={scrollBounceEnabled}
              onScroll={onScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}>
              {children({ animationStyle, activeCard: card })}
            </Animated.ScrollView>
          </NativeViewGestureHandler>
        </Animated.View>

        {/* Close button */}
        {closeButton && (
          <Animated.View
            style={[
              styles.closeButton,
              {
                top: getStatusBarHeight(),
              },
              closeButtonAnimationStyle,
            ]}>
            <TapGestureHandler
              hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
              onHandlerStateChange={closeButtonOnHandlerStateChange}>
              <Animated.View>{closeButton}</Animated.View>
            </TapGestureHandler>
          </Animated.View>
        )}
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'white',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
  },
});

export default SharedTransition;
