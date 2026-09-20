import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonItem: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width: width as any,
          height,
          borderRadius,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

export const HeroRevenueSkeleton: React.FC = () => {
  return (
    <View style={styles.heroSkeletonCard}>
      <View style={styles.rowBetween}>
        <SkeletonItem width={110} height={14} borderRadius={6} />
        <SkeletonItem width={90} height={22} borderRadius={12} />
      </View>
      <View style={{ marginTop: 14 }}>
        <SkeletonItem width={180} height={36} borderRadius={10} />
        <SkeletonItem width={120} height={14} borderRadius={6} style={{ marginTop: 8 }} />
      </View>
      <View style={{ marginTop: 20 }}>
        <SkeletonItem width="100%" height={32} borderRadius={8} />
      </View>
    </View>
  );
};

export const ClientRowSkeleton: React.FC = () => {
  return (
    <View style={styles.rowSkeletonCard}>
      <View style={styles.leftRow}>
        <SkeletonItem width={40} height={40} borderRadius={20} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <SkeletonItem width="60%" height={16} borderRadius={6} />
          <SkeletonItem width="40%" height={12} borderRadius={6} style={{ marginTop: 6 }} />
        </View>
      </View>
      <SkeletonItem width={70} height={14} borderRadius={6} />
    </View>
  );
};

export const RenewalCardSkeleton: React.FC = () => {
  return (
    <View style={styles.renewalSkeletonCard}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <SkeletonItem width="70%" height={16} borderRadius={6} />
          <SkeletonItem width="50%" height={12} borderRadius={6} style={{ marginTop: 6 }} />
        </View>
        <SkeletonItem width={70} height={22} borderRadius={8} />
      </View>
      <View style={styles.detailsBox}>
        <SkeletonItem width={80} height={14} borderRadius={6} />
        <SkeletonItem width={90} height={18} borderRadius={6} />
      </View>
      <View style={styles.rowBetween}>
        <SkeletonItem width={90} height={28} borderRadius={8} />
        <SkeletonItem width={80} height={28} borderRadius={8} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: '#E7E9EE',
  },
  heroSkeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E7E9EE',
    marginBottom: 20,
  },
  rowSkeletonCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E7E9EE',
  },
  renewalSkeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E7E9EE',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailsBox: {
    backgroundColor: '#F7F8FA',
    padding: 12,
    borderRadius: 14,
    marginVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
