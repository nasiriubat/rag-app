import React, {useContext} from 'react';
import { LanguageContext } from "../context/Language";


const questions = {
    EN: [
      "How can I obtain support for studying and well-being at Tampere University?",
      "How do I get started with admission?",
      "What support is offered for students with difficulties in learning?",
      "How can I benefit from internationalization during my studies at Tampere University?",
    ],
    FI: [
      "Miten voin saada tukea opiskeluun ja hyvinvointiin Tampereen yliopistossa?",
      "Miten voin aloittaa hakuprosessin?",
      "Mitä tukea on tarjolla opiskelijoille, joilla on oppimisvaikeuksia?",
      "Miten voin hyötyä kansainvälistymisestä opintojeni aikana Tampereen yliopistossa?",
    ],
  };

const FaqCard = ({ setInput, handleSendMessage }) => {
    const { language } = useContext(LanguageContext);

    const handleQuestionClick = async (event) => {
        const question = event.target.textContent;
        // await setInput(question);
        handleSendMessage(question);
        setInput('');
    };

    return (
        <div className="faq-card">
      {questions[language].map((question, index) => (
        <div key={index} onClick={handleQuestionClick} className="faq-card-item">
          <a>{question}</a>
        </div>
      ))}
    </div>
    );
};

export default FaqCard;
