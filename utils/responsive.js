/**
 * Responsive Design Utilities
 * Makes your app look perfect on all devices (Android, iOS, tablets)
 */

import { Dimensions, Platform, PixelRatio } from 'react-native';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device type detection
export const isSmallDevice = SCREEN_WIDTH < 375;
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 768;
export const isTablet = SCREEN_WIDTH >= 768;
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

/**
 * Normalize font size for different screen sizes
 * Usage: fontSize: normalize(16)
 */
export const normalize = (size) => {
  const scale = SCREEN_WIDTH / 375; // Base width (iPhone X)
  const newSize = size * scale;
  
  if (isIOS) {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

/**
 * Width percentage
 * Usage: width: wp(50) // 50% of screen width
 */
export const wp = (percentage) => {
  return (SCREEN_WIDTH * percentage) / 100;
};

/**
 * Height percentage
 * Usage: height: hp(20) // 20% of screen height
 */
export const hp = (percentage) => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

/**
 * Platform-specific shadow styles
 * Usage: ...shadow(2)
 */
export const shadow = (elevation = 2) => {
  if (isIOS) {
    return {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: elevation,
      },
      shadowOpacity: 0.25,
      shadowRadius: elevation * 1.5,
    };
  }
  
  return {
    elevation: elevation,
  };
};

/**
 * Responsive spacing
 */
export const spacing = {
  xs: normalize(4),
  sm: normalize(8),
  md: normalize(16),
  lg: normalize(24),
  xl: normalize(32),
  xxl: normalize(48),
};

/**
 * Responsive font sizes
 */
export const fontSize = {
  xs: normalize(10),
  sm: normalize(12),
  md: normalize(14),
  lg: normalize(16),
  xl: normalize(20),
  xxl: normalize(24),
  xxxl: normalize(32),
};

/**
 * Get responsive value based on device type
 * Usage: getResponsiveValue({ phone: 16, tablet: 20 })
 */
export const getResponsiveValue = ({ phone, tablet }) => {
  return isTablet ? tablet : phone;
};

export default {
  isSmallDevice,
  isMediumDevice,
  isTablet,
  isIOS,
  isAndroid,
  normalize,
  wp,
  hp,
  shadow,
  spacing,
  fontSize,
  getResponsiveValue,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
};
