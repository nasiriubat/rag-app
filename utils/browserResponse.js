const fetchGoogleSearch = require('./fetchGoogleSearch');
const {scrapeContent} = require('./scraper.js');

module.exports = async function browserResponse(query) {
    
    try {
        // Fetch all URLs from Google search
        const allUrls = await fetchGoogleSearch(query+' at Tampere University');
        if (!allUrls || allUrls.length === 0) {
            return null; // Return null if no URLs are found
        }
        
        // Scrape the content of the first URL (or you could scrape more if needed)
        const pageContent = await scrapeContent(allUrls[0]);
        // Format the first 3 links with numbering as requested
        const blinksHtml = allUrls.slice(0, 3)  // Get only the first 3 URLs
            .map((url, index) => `${index + 1}.<a href="${url}" target="_blank">${url}</a><br>`)
            .join('');

        // Build the prompt with the content from the first URL and include the first 3 links
        const bprompt = `Based on this context: ${pageContent} \n\n Query: ${query} \n\n Answer: \n\n Instructions: Answer the query in the same language as it is asked. Be concise and relevant and start direct answer.`;
        // Return structured data
        return { bprompt, blinksHtml };
    } catch (error) {
        console.error('Error in browserResponse:', error);
        return null; // Return null to indicate an error
    }
};
