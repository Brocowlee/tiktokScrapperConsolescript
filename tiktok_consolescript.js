(async function() {
    // Initialize a global variable to control the stopping of the script
    // To stop the script, set 'window.stopTikTokScraper = "stop"';
    window.stopTikTokScraper = "";

    // Delay function to wait between actions
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // Function to convert data to JSON format and trigger download
    function downloadJSON(data) {
        const jsonContent = JSON.stringify(data, null, 2); // format with indentation
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.setAttribute("hidden", "");
        a.setAttribute("href", url);
        a.setAttribute("download", "TikTok_Video_Metadata.json");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Function to parse the date from TikTok format to YYYY-MM-DD
    function convertToDate(dateText) {
        const today = new Date();
        let targetDate;
    
        // Handle "il y a X min" format
        if (dateText.includes("min")) {
            const minutes = parseInt(dateText.match(/\d+/)[0]);
            targetDate = new Date(today.getTime() - minutes * 60 * 1000);
        }
        // Handle "il y a X h" format
        else if (dateText.includes("h")) {
            const hours = parseInt(dateText.match(/\d+/)[0]);
            targetDate = new Date(today.getTime() - hours * 60 * 60 * 1000);
        }
        // Handle "il y a X j" format
        else if (dateText.includes("j")) {
            const days = parseInt(dateText.match(/\d+/)[0]);
            targetDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
        }
        // Handle "il y a X sem" format
        else if (dateText.includes("sem")) {
            const weeks = parseInt(dateText.match(/\d+/)[0]);
            targetDate = new Date(today.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
        }
        // Handle "il y a X mois" format
        else if (dateText.includes("mois")) {
            const months = parseInt(dateText.match(/\d+/)[0]);
            targetDate = new Date(today.getFullYear(), today.getMonth() - months, today.getDate());
        }
        // Handle YYYY-MM-DD format
        else if ((dateText.match(/-/g) || []).length === 2) { 
            const [year, month, day] = dateText.split("-");
            targetDate = new Date(year, month - 1, day);
        }
        // Handle MM-DD format
        else if ((dateText.match(/-/g) || []).length === 1) { 
            const [month, day] = dateText.split("-");
            targetDate = new Date(today.getFullYear(), month - 1, day);
        }
        else {
            return "Invalid date format"; // Handle unexpected formats
        }
    
        // Format the date as YYYY-MM-DD
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(targetDate.getDate()).padStart(2, '0');
    
        return `${year}-${month}-${day}`;
    }

    // Function to extract text content from description container
    function extractDescription() {
        // Target the new description container
        const descContainer = document.querySelector('.css-g0nwbi-DivDescriptionContentContainer');
        
        if (!descContainer) {
            return "No description";
        }
        
        // Extract all text spans within the container
        const textElements = descContainer.querySelectorAll('.css-j2a19r-SpanText');
        
        if (!textElements || textElements.length === 0) {
            // Try another selector if the first one doesn't work
            const altTextElements = descContainer.querySelectorAll('span');
            if (!altTextElements || altTextElements.length === 0) {
                return descContainer.innerText.trim();
            }
            return Array.from(altTextElements).map(el => el.innerText).join(' ').trim();
        }
        
        // Combine all span texts
        return Array.from(textElements).map(el => el.innerText).join(' ').trim();
    }

    // Function to extract hashtags
    function extractTags() {
        const tags = [];
        
        // Look for hashtag links in the description
        const tagLinks = document.querySelectorAll('a[data-e2e="search-common-link"]');
        
        if (!tagLinks || tagLinks.length === 0) {
            return tags;
        }
        
        tagLinks.forEach(link => {
            try {
                // Extract the hashtag text
                const tagElement = link.querySelector('strong');
                if (tagElement) {
                    const tagText = tagElement.innerText.trim();
                    // Remove the # symbol and any trailing spaces
                    const cleanTag = tagText.startsWith('#') ? tagText.substring(1).trim() : tagText.trim();
                    
                    // Get the tag URL
                    const tagUrl = link.getAttribute('href');
                    
                    if (cleanTag) {
                        tags.push({
                            tag: cleanTag,
                            url: tagUrl
                        });
                    }
                }
            } catch (error) {
                console.error('Error extracting hashtag:', error);
            }
        });
        
        return tags;
    }

    // Function to extract comments
    function extractComments() {
        const comments = [];
        const commentContainers = document.querySelectorAll('.css-1i7ohvi-DivCommentItemContainer');
        
        if (!commentContainers || commentContainers.length === 0) {
            return comments;
        }
        
        commentContainers.forEach((container, index) => {
            try {
                // Extract username
                const usernameElement = container.querySelector('.css-1665s4c-SpanUserNameText');
                const username = usernameElement ? usernameElement.innerText.trim() : `Unknown User ${index}`;
                
                // Extract comment text
                const commentElement = container.querySelector('.css-xm2h10-PCommentText');
                const comment = commentElement ? commentElement.innerText.trim() : "No comment text";
                
                // Extract timestamp
                const timeElement = container.querySelector('.css-4tru0g-SpanCreatedTime');
                const timeText = timeElement ? timeElement.innerText.trim() : "Unknown time";
                
                // Convert the comment time to the same format as video dates
                const formattedDate = convertToDate(timeText);
                
                // Extract likes
                const likeElement = container.querySelector('.css-gb2mrc-SpanCount');
                const likes = likeElement ? likeElement.innerText.trim() : "0";
                
                // Extract comment ID if available
                const commentId = container.querySelector('.css-ulyotp-DivCommentContentContainer')?.id || `comment_${index}`;
                
                comments.push({
                    id: commentId,
                    username,
                    comment,
                    rawTime: timeText,
                    formattedDate: formattedDate,
                    likes
                });
            } catch (error) {
                console.error(`Error extracting comment ${index}:`, error);
            }
        });
        
        return comments;
    }

    // Function to extract music information
    function extractMusic() {
        // Try multiple possible selectors for music info
        const musicSelectors = [
            '.css-pvx3oa-DivMusicText',
            '[data-e2e="browse-music"]',
            '.music-info',
            '.tiktok-music'
        ];
        
        for (const selector of musicSelectors) {
            const musicElement = document.querySelector(selector);
            if (musicElement) {
                return musicElement.innerText.trim();
            }
        }
        
        return "No music information";
    }

    // Main function to get video metadata
    async function getVideoMetadata() {
        let videoData = [];

        while (true) {
            // Check if the script should stop
            if (window.stopTikTokScraper === "stop") {
                console.log("Stopping script and downloading JSON...");
                break;
            }

            // Get the description using the new method
            const description = extractDescription();

            // Get hashtags
            const tags = extractTags();

            // Get music information
            const music = extractMusic();

            // Get comments
            const comments = extractComments();

            // Get the date
            const dateElem = document.querySelector('span[data-e2e="browser-nickname"] span:nth-child(3)');
            const dateText = dateElem ? dateElem.innerText.trim() : "No date";

            // Convert the date to YYYY-MM-DD format
            const formattedDate = convertToDate(dateText);

            // Get the current page URL
            const videoUrl = window.location.href;

            // Get the likes, comments, and saves
            const likesElem = document.querySelector('strong[data-e2e="browse-like-count"]');
            const likes = likesElem ? likesElem.innerText.trim() : "0";
            const commentsElem = document.querySelector('strong[data-e2e="browse-comment-count"]');
            const commentsCount = commentsElem ? commentsElem.innerText.trim() : "0";
            const savesElem = document.querySelector('strong[data-e2e="undefined-count"]');
            const saves = savesElem ? savesElem.innerText.trim() : "0";

            // Get username of video poster
            const usernameElem = document.querySelector('span[data-e2e="browser-nickname"] span:nth-child(1)');
            const username = usernameElem ? usernameElem.innerText.trim() : "Unknown user";

            // Add to data array
            const videoMetadata = { 
                username,
                description, 
                date: {
                    raw: dateText,
                    formatted: formattedDate
                }, 
                url: videoUrl, 
                music,
                tags: tags,
                stats: {
                    likes, 
                    comments: commentsCount, 
                    saves
                },
                comments 
            };
            
            console.log("Collected video metadata:", videoMetadata);
            videoData.push(videoMetadata);

            // Click the next button
            const nextButton = document.querySelector('button[data-e2e="arrow-right"]');
            if (nextButton && !nextButton.disabled) {
                nextButton.click();
                await delay(2000); // Wait 2 seconds for the next video to load
            } else {
                console.log("No more videos found.");
                break;
            }
        }

        // Export filtered data to JSON if data was collected
        if (videoData.length > 0) {
            downloadJSON(videoData);
        } else {
            console.log("No data to export.");
        }
    }

    // Run the function
    await getVideoMetadata();
})();
