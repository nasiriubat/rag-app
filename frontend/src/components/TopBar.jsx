import React, { useContext } from "react";
import { FaInfoCircle, FaBars } from "react-icons/fa";
import { LanguageContext } from "../context/Language";

function TopBar({ openModal, toggleSidebar }) {
  const { language, toggleLanguage } = useContext(LanguageContext);

  return (
    <div className="top-bar mb-2">
      <button id="menu-toggle" onClick={toggleSidebar} className="hamburger">
        <FaBars />
      </button>
      <a href="https://www.tuni.fi/" target="blank">
        Tampere University
      </a>
      <div className="">
      <button id="infoButton" className="btn info-button" onClick={openModal}>
        <FaInfoCircle className="info-icon" />
      </button>
      <button id="lang-toggle" className="btn lang-toggle" onClick={toggleLanguage}>
        {language}
      </button>
      </div>
    </div>
  );
}

export default TopBar;
