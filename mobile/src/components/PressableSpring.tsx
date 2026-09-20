import React, { useRef } from 'react';
import { Pressable, Animated, StyleProp, ViewStyle, GestureResponderEvent } from 'react-native';

interface PressableSpringProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  activeOpacity?: number;
  disabled?: boolean;
}

export const PressableSpring: React.FC<PressableSpringProps> = ({
  children,
  onPress,
  style,
  scaleTo = 0.96,
  activeOpacity = 0.92,
  disabled = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: scaleTo,
        speed: 30,
        bounciness: 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: activeOpacity,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default PressableSpring;
