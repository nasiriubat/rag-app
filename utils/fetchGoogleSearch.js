const axios = require('axios');
require('dotenv').config();

module.exports = async function fetchGoogleSearch(query) {
  try {
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.SEARCH_API_KEY}&cx=${process.env.CX}&q=${encodeURIComponent(query)}`;
    const searchResponse = await axios.get(searchUrl);

    const searchData = searchResponse.data;

    if (searchData.items && searchData.items.length > 0) {
      // Extract all links from the search results
      const links = searchData.items.map((item) => item.link);

      return links; // Return an array of links
    } else {
      return []; // Return an empty array if no items found
    }
  } catch (error) {
    console.error('Error fetching Google Search results:', error.message);
    throw error; // Propagate the error to the caller
  }
};
