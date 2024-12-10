import React, { createContext, useState, useEffect } from "react";

// Create the context
export const LanguageContext = createContext();

// Language Provider component
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("EN");

  // Load language from localStorage on mount
  useEffect(() => {
    // const storedLanguage = localStorage.getItem("language") || "EN";
    const storedLanguage =  "EN";
    setLanguage(storedLanguage);
  }, []);

  // Update language and store in localStorage
  const toggleLanguage = () => {
    const newLanguage = language === "EN" ? "FI" : "EN";
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
