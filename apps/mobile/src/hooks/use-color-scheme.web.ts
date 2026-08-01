import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

const subscribe = (callback: () => void) => {
  const subscription = Appearance.addChangeListener(callback);
  return () => subscription.remove();
};

const getSnapshot = () => {
  return Appearance.getColorScheme() ?? 'light';
};

const getServerSnapshot = () => {
  return 'light';
};

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

