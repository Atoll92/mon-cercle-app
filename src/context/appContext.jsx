// src/context/appContext.jsx
import React, { createContext, useContext } from 'react';

// Create the context
const AppContext = createContext(null);

// Custom hook for using the app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Provider component
export const AppProvider = ({ children, userNetworkId, fetchingNetwork }) => {
  const value = {
    userNetworkId,
    fetchingNetwork
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};