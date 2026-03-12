import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeShopId, setActiveShopId] = useState(null);
  const [activeShopName, setActiveShopName] = useState('');

  // Auto-set constraints based on role
  useEffect(() => {
    if (user) {
      if (user.role === 'staff' && user.shopId) {
        // Staff are fixed to their assigned shop
        setActiveShopId(user.shopId);
        setActiveShopName('Staff Assigned Shop'); // Optionally fetch name if needed
      } else if (user.role === 'owner' || user.role === 'admin') {
        // Recover from local storage
        const storedShopId = localStorage.getItem('activeShopId');
        const storedShopName = localStorage.getItem('activeShopName');
        if (storedShopId) {
          setActiveShopId(storedShopId);
          setActiveShopName(storedShopName || '');
        }
      }
    } else {
      // Logged out
      setActiveShopId(null);
      setActiveShopName('');
    }
  }, [user]);

  const switchShop = (shopId, shopName) => {
    setActiveShopId(shopId);
    setActiveShopName(shopName);
    localStorage.setItem('activeShopId', shopId);
    if (shopName) {
      localStorage.setItem('activeShopName', shopName);
    }
  };

  return (
    <ShopContext.Provider value={{ activeShopId, activeShopName, switchShop }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);
