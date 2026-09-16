import { createContext, useContext, useState, type ReactNode } from 'react';

type NavigationActiveContextType = {
  isNavigationActive: boolean;
  setNavigationActive: (active: boolean) => void;
};

const NavigationActiveContext = createContext<NavigationActiveContextType>({
  isNavigationActive: false,
  setNavigationActive: () => undefined,
});

export function NavigationActiveProvider({ children }: { children: ReactNode }) {
  const [isNavigationActive, setNavigationActive] = useState(false);

  return (
    <NavigationActiveContext.Provider value={{ isNavigationActive, setNavigationActive }}>
      {children}
    </NavigationActiveContext.Provider>
  );
}

export function useNavigationActive() {
  return useContext(NavigationActiveContext);
}
