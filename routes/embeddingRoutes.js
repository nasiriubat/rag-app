const express = require("express");
const fs = require("fs");
const path = require("path");
const { scrapeContent } = require("../utils/scraper");
const { generateEmbedding } = require("../utils/embedding");
const { findSimilarDocuments, generateResponseFromContext } = require("../utils/responseManager");
const { queryDatabase, runDatabase } = require("../models/database");
const openaiResponse = require("../utils/openaiResponse");
const browserResponse = require("../utils/browserResponse");

const router = express.Router();

// Query Endpoint
router.post("/query", async (req, res) => {
  const { query, language } = req.body;
  const lang = language == 'EN' ? 'English' : 'Finnish';
  if (!query) {
    return res.status(400).json({ error: "Query is required." });
  }

  try {
    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding) throw new Error("Failed to generate query embedding.");

    const similarDocuments = await findSimilarDocuments(queryEmbedding);
    const context = similarDocuments.map((doc) => doc.content).join("\n");
    // const prompt = `Context: ${context}  \n\n Query: ${query} \n\n' \n\n Answer:`;
    // const prompt = `Context: ${context} \n\n Query: ${query} \n\n Answer: \n\n Instructions: Language should be ${lang}. Be concise and relevant and start direct answer. If no answer found based on given context then return 'No results found for this query.'.`;
    const prompt = `Context: ${context} \n\n Query: ${query} \n\n Answer: \n\n Instructions: Language should be ${lang}. Be concise and relevant and start direct answer.`;

    let answer = await openaiResponse(prompt);
    // if (answer == "No results found for this query.") {
    //   const existingAnswer = await queryDatabase(
    //     "SELECT answer FROM questions WHERE question = ?",
    //     [query]
    //   );

    //   if (existingAnswer.length > 0) {
    //     if (existingAnswer[0].answer.includes('provided text') || existingAnswer[0].answer.includes('hyvä olla') || existingAnswer[0].answer.includes('There is no information')) {
    //       const { bprompt, blinksHtml } = await browserResponse(query);
    //       answer = await openaiResponse(bprompt);
    //       answer = `${answer}<br><br>For more details, visit:<br>${blinksHtml}`;
    //       // answer = `No specific details found. May be this will help: <a style='word-wrap: break-word;' href="https://www.google.com/search?q=${query} at Tampere University" target="_blank">Link</a>`;
    //     } else {
    //       console.log('existing answer has solid answer');
    //       answer = existingAnswer[0].answer;
    //     }
    //   } else {
    //     // answer = `No specific details found. May be this will help: <a style='word-wrap: break-word;' href="https://www.google.com/search?q=${query} at Tampere University" target="_blank">Link</a>`;
    //     console.log('existing answer not found');
    //     const { bprompt, blinksHtml } = await browserResponse(query);
    //     answer = await openaiResponse(bprompt);
    //     answer = `${answer}<br><br>For more details, visit:<br>${blinksHtml}`;

    //   }

    // } else {
    // Concatenate URLs of matched documents with the answer
    const links = similarDocuments
      .map((doc) => `<a href="${doc.url}" target="_blank">- ${doc.url}</a>`)
      .join("<br>");
    answer = `${answer}<br><br>For more details, visit:<br>${links}`;

    // }
    // Save or update the answer in the database
    await saveOrUpdateAnswer(query, answer);

    res.json({ answer });
  } catch (error) {
    console.error("Error querying:", error.message);
    res.status(500).json({ error: "Failed to process query." });
  }
});

async function saveOrUpdateAnswer(query, answer) {
  try {
    const existingQuestion = await queryDatabase(
      "SELECT id FROM questions WHERE question = ?",
      [query]
    );

    if (existingQuestion.length > 0) {
      // Update existing record
      await runDatabase(
        "UPDATE questions SET answer = ?, count = count + 1 WHERE id = ?",
        [answer, existingQuestion[0].id]
      );
    } else {
      // Insert new record
      await runDatabase(
        "INSERT INTO questions (question, answer, count) VALUES (?, ?, ?)",
        [query, answer, 1]
      );
    }
  } catch (error) {
    console.error("Error saving or updating answer:", error.message);
    throw error;
  }
}


// Feed Multiple URLs Endpoint

// router.get("/feed-url-list", async (req, res) => {
//   // const filePath = path.join(__dirname, "../allUnique.txt");
//   const filePath = path.join(__dirname, "../peopleUrls.txt");

//   // Check if the file exists
//   if (!fs.existsSync(filePath)) {
//     return res.status(404).json({ error: "txt file not found." });
//   }

//   try {
//     // Read URLs from the file
//     const urls = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean);

//     if (urls.length === 0) {
//       return res.status(400).json({ error: "No URLs found in txt file." });
//     }

//     const successUrls = [];
//     const failedUrls = [];
//     let i = 1;
//     for (const url of urls) {
//       console.log(i);
//       i++;
//       try {
//         const content = await scrapeContent(url);

//         if (!content) {
//           failedUrls.push(url);
//           continue;
//         }

//         const embedding = await generateEmbedding(content);

//         if (!embedding) {
//           failedUrls.push(url);
//           continue;
//         }

//         // Check if the URL already exists
//         const existingDocument = await queryDatabase(
//           "SELECT id FROM documents WHERE url = ?",
//           [url]
//         );

//         if (existingDocument.length > 0) {
//           // Update the existing document
//           await runDatabase(
//             "UPDATE documents SET content = ?, embedding = ? WHERE url = ?",
//             [content, JSON.stringify(embedding), url]
//           );
//         } else {
//           // Insert a new document
//           await runDatabase(
//             "INSERT INTO documents (url, content, embedding) VALUES (?, ?, ?)",
//             [url, content, JSON.stringify(embedding)]
//           );
//         }

//         successUrls.push(url);
//       } catch (error) {
//         console.error(`Error processing URL (${url}):`, error.message);
//         failedUrls.push(url);
//       }
//     }

//     // Write the successful URLs to a file
//     const todayDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
//     const successFilePath = path.join(__dirname, `../success-people-${todayDate}.txt`);
//     const failedFilePath = path.join(__dirname, `../failed-people-${todayDate}.txt`);


//     fs.writeFileSync(successFilePath, successUrls.join("\n"), "utf8");
//     fs.writeFileSync(failedFilePath, failedUrls.join("\n"), "utf8");

//     res.json({
//       message: "URLs processed.",
//       total: urls.length,
//       successCount: successUrls.length,
//       failedCount: failedUrls.length
//     });
//   } catch (error) {
//     console.error("Error processing URL list:", error.message);
//     res.status(500).json({ error: "Failed to process URL list." });
//   }
// });


// // Feed Single URL Endpoint
// router.post("/feed-single-url", async (req, res) => {
//   const { url } = req.body;

//   if (!url) {
//     return res.status(400).json({ error: "URL is required." });
//   }

//   try {
//     const content = await scrapeContent(url);

//     if (!content) {
//       return res.status(400).json({ error: "Failed to scrape content from the URL." });
//     }

//     const embedding = await generateEmbedding(content);

//     if (!embedding) {
//       return res.status(500).json({ error: "Failed to generate embedding for the content." });
//     }

//     // Check if the URL already exists
//     const existingDocument = await queryDatabase(
//       "SELECT id FROM documents WHERE url = ?",
//       [url]
//     );

//     if (existingDocument.length > 0) {
//       // Update the existing document
//       await runDatabase(
//         "UPDATE documents SET content = ?, embedding = ? WHERE url = ?",
//         [content, JSON.stringify(embedding), url]
//       );

//       res.json({ message: "URL content and embedding updated successfully." });
//     } else {
//       // Insert a new document
//       await runDatabase(
//         "INSERT INTO documents (url, content, embedding) VALUES (?, ?, ?)",
//         [url, content, JSON.stringify(embedding)]
//       );

//       res.json({ message: "URL processed and saved successfully." });
//     }
//   } catch (error) {
//     console.error("Error processing single URL:", error.message);
//     res.status(500).json({ error: "Failed to process URL." });
//   }
// });


// Top Questions Endpoint
router.get("/top-questions", async (req, res) => {
  try {
    const questions = await queryDatabase(
      "SELECT question, answer, count FROM questions ORDER BY count DESC LIMIT 30"
    );

    res.json(questions);
  } catch (error) {
    console.error("Error fetching top questions:", error.message);
    res.status(500).json({ error: "Failed to fetch top questions." });
  }
});

// /report Endpoint
router.get("/report", async (req, res) => {
  try {
    // Fetch all questions and answers from the database
    const data = await queryDatabase("SELECT question, answer FROM questions");

    // Format the data into a string for the .txt file
    const reportContent = data
      .map((row, index) => `Q${index + 1}: ${row.question}\nA${index + 1}: ${row.answer}\n\n`)
      .join("");

    // Set headers for file download
    res.setHeader("Content-Disposition", "attachment; filename=questions_report.txt");
    res.setHeader("Content-Type", "text/plain");

    // Send the file content directly to the client
    res.send(reportContent);
  } catch (error) {
    console.error("Error generating report:", error.message);
    res.status(500).json({ error: "Failed to generate report." });
  }
});

module.exports = router;
