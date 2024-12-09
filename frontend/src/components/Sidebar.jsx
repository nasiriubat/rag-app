import React, {useContext} from 'react';
import { FaTimes } from 'react-icons/fa';
import { LanguageContext } from "../context/Language";


function Sidebar({ faqs, setInput, handleQuestionClick, isOpen, toggleSidebar }) {
  // Preset questions to display if there are no FAQs from the database
  const presetQuestionsEnglish  = [
    "How can I obtain support for studying and well-being at Tampere University?",
    "What resources are available for distance learning study skills?",
    "How can I access additional resources for communication and language studies?",
    "What support is offered for students with difficulties in learning?",
    "How can I prepare for exams effectively at Tampere University?",
    "What services and regulations are in place for students at Tampere University?",
    "How can I benefit from internationalization during my studies at Tampere University?",
    "What options are available for internships and work-life experiences at Tampere University?",
    "How can I find information about scholarships and financial aid at Tampere University?",
    "What are the options for student housing and accommodation at Tampere University?",
    "What services are available for students with disabilities at Tampere University?",
    "How can I access student health services at Tampere University?",
    "What are the options for sports and recreational activities at Tampere University?",
    "How can I access the library services at Tampere University?",
    "What are the options for student organizations and activities at Tampere University?",
    "How can I access IT services and support at Tampere University?",
    "What services are available for international students at Tampere University?",
    "How can I access career services and guidance at Tampere University?",
    "What are the options for entrepreneurship and innovation support at Tampere University?",
    "How can I access information about the campuses and facilities at Tampere University?",
    "What are the options for dining and catering services at Tampere University?",
    "How can I access information about public transportation and parking at Tampere University?",
    "What are the options for cultural and social activities at Tampere University?",
    "How can I access information about events and services at Tampere University?",
    "What are the options for student discounts and benefits at Tampere University?",
  ];
  const presetQuestionsFinnish = [
    "Miten voin saada tukea opiskeluun ja hyvinvointiin Tampereen yliopistossa?",
    "Mitä resursseja on saatavilla etäopiskelutaitojen kehittämiseen?",
    "Miten pääsen käsiksi lisäresursseihin viestintä- ja kieliopinnoissa?",
    "Mitä tukea on tarjolla opiskelijoille, joilla on oppimisvaikeuksia?",
    "Miten voin valmistautua tentteihin tehokkaasti Tampereen yliopistossa?",
    "Mitkä palvelut ja säännöt ovat voimassa opiskelijoille Tampereen yliopistossa?",
    "Miten voin hyötyä kansainvälistymisestä opintojeni aikana Tampereen yliopistossa?",
    "Mitä vaihtoehtoja on tarjolla harjoitteluun ja työelämäkokemuksiin Tampereen yliopistossa?",
    "Miten löydän tietoa apurahoista ja taloudellisesta tuesta Tampereen yliopistossa?",
    "Mitkä ovat vaihtoehdot opiskelija-asumiselle ja majoitukselle Tampereen yliopistossa?",
    "Mitä palveluita on saatavilla opiskelijoille, joilla on vammoja Tampereen yliopistossa?",
    "Miten pääsen käsiksi opiskelijoiden terveyspalveluihin Tampereen yliopistossa?",
    "Mitkä ovat vaihtoehdot urheilu- ja vapaa-ajan aktiviteetteihin Tampereen yliopistossa?",
    "Miten voin käyttää kirjastopalveluita Tampereen yliopistossa?",
    "Mitkä ovat vaihtoehdot opiskelijajärjestöille ja aktiviteeteille Tampereen yliopistossa?",
    "Miten voin käyttää IT-palveluita ja tukea Tampereen yliopistossa?",
    "Mitä palveluita on saatavilla kansainvälisille opiskelijoille Tampereen yliopistossa?",
    "Miten pääsen käsiksi uraohjaus- ja neuvontapalveluihin Tampereen yliopistossa?",
    "Mitkä ovat vaihtoehdot yrittäjyyden ja innovoinnin tukemiseen Tampereen yliopistossa?",
    "Miten voin saada tietoa kampuksista ja tiloista Tampereen yliopistossa?",
    "Mitkä ovat vaihtoehdot ruokailu- ja catering-palveluihin Tampereen yliopistossa?",
    "Miten pääsen käsiksi tietoon julkisesta liikenteestä ja pysäköinnistä Tampereen yliopistossa?",
    "Mitkä ovat vaihtoehdot kulttuuri- ja sosiaalisiin aktiviteetteihin Tampereen yliopistossa?",
    "Miten voin saada tietoa tapahtumista ja palveluista Tampereen yliopistossa?",
    "Mitkä ovat opiskelija-alennusten ja -etujen vaihtoehdot Tampereen yliopistossa?"
  ];
  

  // const questionsToShow = faqs.length > 5 ? faqs : presetQuestions;
  const { language } = useContext(LanguageContext);

  const questionsToShow = language === "FI" ? presetQuestionsFinnish : presetQuestionsEnglish;

  return (
    <nav id="sidebar" className={isOpen ? 'open' : ''}>
      <div className="top-content">
        <div className="logo">
          <h2>Guide GPT</h2>
          <button onClick={toggleSidebar}>
            <FaTimes />
          </button>
        </div>
        <h3>FAQ</h3>
        <hr />
        <ul>
          {questionsToShow.map((faq, index) => (
            <li
              key={index}
              onClick={() => handleQuestionClick(typeof faq === 'string' ? faq : faq.question)}
            >
              {typeof faq === 'string' ? faq : faq.question}
            </li>
          ))}
        </ul>
      </div>
      <div className="footer">
        <p>Tampere University</p>
      </div>
    </nav>
  );
}

export default Sidebar;
