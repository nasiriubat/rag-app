const express = require('express');
const fs = require('fs');
const path = require('path');
const UploadedDocument = require('../models/DocumentUpload.js');
const Question = require('../models/Question.js');
const { createEmbedding } = require('../utils/createEmbedding.js');
const { connectToMongoDB } = require('../config/MongoDB.js');
const { runWebScraper } = require('../utils/runWebScraper.js');
const { hitOpenAiApi } = require('../utils/hitOpenAiApi.js');
const { processUrlAndSaveDocument } = require('../utils/processUrl.js');
const { getUrlsFromSitemap } = require('../utils/getUrlsFromSitemap.js');
const { embedResponse } = require('../utils/embedResponse.js');
const browserResponse = require('../utils/browserResponse.js');

const router = express.Router();

// Query response
router.post('/query-embedding', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  try {
    const { prompt, linksHtml } = await embedResponse(query);
    if (!prompt) {
      throw new Error('No prompt generated.');
    }

    // Generate the answer using the OpenAI API
    let answer = await hitOpenAiApi(prompt);

    if (answer === 'No results found for this query.') {
      // Check for existing question with the same query
      const matchingQuestion = await Question.findOne({ question: query });

      if (matchingQuestion && matchingQuestion.answer !== 'empty') {
        // Increment count and return the stored answer
        matchingQuestion.count += 1;
        await matchingQuestion.save();
        return res.send(matchingQuestion.answer);
      }

      // Default response when no results are found
      answer = `No specific details found. Maybe this will help: 
                <a style='word-wrap: break-word;' href="https://www.google.com/search?q=${query} at Tampere University" target="_blank">Link</a>`;
      
      // Save the unanswered question
      await saveOrUpdateQuestion(query, 'empty', true);
      return res.send(answer);
    }

    // Append links to the generated answer
    answer = `${answer}<br><br>For more details, visit:<br>${linksHtml}`;

    // Save or update the question with the new answer
    await saveOrUpdateQuestion(query, answer, true);

    return res.send(answer);

  } catch (err) {
    console.error('Error occurred:', err.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message,
    });
  }
});


//questions
router.get('/faqs/top', async (req, res) => {
  try {
    const topQuestions = await Question.find()
      .sort({ count: -1 }) // Sort by count in descending order
      .limit(20); // Limit to top 20
    res.json(topQuestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

router.get('/download', async (req, res) => {
  try {
    // Fetch all questions
    const questions = await Question.find().sort({ count: -1 });

    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions found to download' });
    }

    // Create the content for the text file
    const fileContent = questions
      .map((q, index) => `${index + 1}. Question: ${q.question}\n   Answer: ${q.answer}\n   Count: ${q.count}\n`)
      .join('\n');

    // Path to the temporary file
    const tempFilePath = path.join(__dirname, 'questions.txt');

    // Write content to a temporary file
    fs.writeFileSync(tempFilePath, fileContent);

    // Send the file as a response for download
    res.download(tempFilePath, 'questions.txt', (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ error: 'Failed to download the file' });
      }

      // Delete the file after sending it
      fs.unlink(tempFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting temp file:', unlinkErr);
        }
      });
    });
  } catch (error) {
    console.error('Error generating questions file:', error);
    res.status(500).json({ error: 'Failed to generate questions file' });
  }
});

// Utility function to save or update a Question
const saveOrUpdateQuestion = async (query, answer, incrementCount = false) => {
  const existingQuestion = await Question.findOne({ question: query });

  if (existingQuestion) {
    existingQuestion.answer = answer;
    if (incrementCount) {
      existingQuestion.count += 1;
    }
    return await existingQuestion.save();
  }

  const newQuestion = new Question({ question: query, answer: answer, count: 1 });
  return await newQuestion.save();
};

// //feed urls from text
// router.get('/feed-url-list', async (req, res) => {

//   try {
//     const data = await fs.readFileSync('allUnique.txt', 'utf8');
//     const urls = data.split('\n').filter(Boolean);
//     const urlCount = urls.length;

//     if (urlCount === 0) {
//       return res.status(404).json({ error: 'No URLs found in the file.' });
//     }
//     const successUrls = [];
//     const failedUrls = [];
//     let i = 1;
//     for (const url of urls) {
//       const result = await processUrlAndSaveDocument(url);
//       console.log(i + '----- ' + url);
//       if (result.completed) {
//         successUrls.push(url);
//       } else {
//         failedUrls.push(url);
//       }
//       i++;
//     }

//     const dirPath = path.join(__dirname, '../txtFileAll');
//     if (!fs.existsSync(dirPath)) {
//       fs.mkdirSync(dirPath);
//     }

//     const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]; // Format: YYYY-MM-DDTHH-MM-SS


//     const successContent = `Success URLs:\n${successUrls.join('\n')}`;
//     const failedContent = `Failed URLs:\n${failedUrls.join('\n')}`;

//     fs.writeFileSync(path.join(dirPath, `success_${timestamp}.txt`), successContent);
//     fs.writeFileSync(path.join(dirPath, `failed_${timestamp}.txt`), failedContent);

//     res.status(200).json({
//       message: `Processed ${urlCount} URLs.`,
//       successCount: successUrls.length,
//       failedCount: failedUrls.length,
//     });
//   } catch (error) {
//     console.error('Error processing XML:', error.message);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: error.message,
//     });
//   }
// });


// //single url feeding
// router.post('/document', async (req, res) => {
//   try {
//     const { url } = req.body;

//     const result = await processUrlAndSaveDocument(url);
//     if (!result.completed) {
//       res.status(500).json({ error: result.message });
//       return;
//     } else {
//       res.status(201).json({
//         message: result.message,
//         document: result.data,
//       });
//     }
//   } catch (err) {
//     console.log('err: ', err);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: err,
//     });
//   }
// });


// //sitemap urls
// router.post('/xml', async (req, res) => {
//   const { url } = req.body;

//   try {
//     const urls = await getUrlsFromSitemap(url);
//     const urlCount = urls.length;

//     if (urlCount === 0) {
//       return res.status(404).json({ error: 'No URLs found in the sitemap.' });
//     }
//     const successUrls = [];
//     const failedUrls = [];

//     for (const url of urls) {
//       const result = await processUrlAndSaveDocument(url);
//       if (result.completed) {
//         successUrls.push(url);
//       } else {
//         failedUrls.push(url);
//       }
//     }

//     const dirPath = path.join(__dirname, '../xmlInfo');
//     if (!fs.existsSync(dirPath)) {
//       fs.mkdirSync(dirPath);
//     }

//     const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]; // Format: YYYY-MM-DDTHH-MM-SS
//     const mainUrl = url;

//     const successContent = `Main URL: ${mainUrl}\n\nSuccess URLs:\n${successUrls.join('\n')}`;
//     const failedContent = `Main URL: ${mainUrl}\n\nFailed URLs:\n${failedUrls.join('\n')}`;

//     fs.writeFileSync(path.join(dirPath, `success_${timestamp}.txt`), successContent);
//     fs.writeFileSync(path.join(dirPath, `failed_${timestamp}.txt`), failedContent);

//     res.status(200).json({
//       message: `Processed ${urlCount} URLs.`,
//       successCount: successUrls.length,
//       failedCount: failedUrls.length,
//     });
//   } catch (error) {
//     console.error('Error processing XML:', error.message);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: error.message,
//     });
//   }
// });

module.exports = router;
