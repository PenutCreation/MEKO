// COMPLETE POST-UPLOAD.JS FILE - SIMPLIFIED VERSION
// For MekoNetwork - Post creation and uploads management

// Global variables
let lastPostTime = 0;
const POST_COOLDOWN = 30000; // 30 seconds
const CHAR_LIMIT = 2000;

let currentMediaUrl = '';
let uploadsPage = 1;
const UPLOADS_PER_PAGE = 10;

// Fixed topic - only you can change this value
const FIXED_TOPIC = "MyMeko";

// Initialize everything when page loads
function initializePostSystem() {
    console.log("Initializing post system...");
    
    // Setup character counter
    const postContent = document.getElementById('postContent');
    const charCounter = document.getElementById('charCounter');
    
    if (postContent && charCounter) {
        postContent.addEventListener('input', function() {
            const length = this.value.length;
            charCounter.textContent = `${length}/${CHAR_LIMIT}`;
            
            if (length > CHAR_LIMIT) {
                charCounter.classList.add('char-warning');
                this.value = this.value.substring(0, CHAR_LIMIT);
                charCounter.textContent = `${CHAR_LIMIT}/${CHAR_LIMIT}`;
            } else {
                charCounter.classList.remove('char-warning');
            }
            
            // Auto resize textarea
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
    
    // Set fixed topic and disable it
    const postTopicInput = document.getElementById('postTopic');
    if (postTopicInput) {
        postTopicInput.value = FIXED_TOPIC;
        postTopicInput.disabled = true;
        postTopicInput.style.cursor = 'not-allowed';
    }
    
    // Setup media buttons
    const mediaButtons = document.querySelectorAll('.media-btn');
    mediaButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            toggleMediaInput(type);
        });
    });
    
    // Setup submit button
    const submitPostBtn = document.getElementById('submitPostBtn');
    if (submitPostBtn) {
        submitPostBtn.addEventListener('click', createPost);
    }
    
    // Initialize uploads tab
    initializeUploadsTab();
    
    // Check for existing cooldown
    const savedTime = localStorage.getItem('lastPostTime');
    if (savedTime) {
        lastPostTime = parseInt(savedTime);
    }
    
    console.log("Post system initialized");
}

// Show/hide media input
function toggleMediaInput(type) {
    const mediaUrlInput = document.getElementById('mediaUrlInput');
    const mediaPreview = document.getElementById('mediaPreview');
    
    if (currentMediaType === type) {
        // Hide if same button clicked
        mediaUrlInput.style.display = 'none';
        mediaUrlInput.value = '';
        mediaPreview.innerHTML = '';
        currentMediaType = null;
        currentMediaUrl = '';
    } else {
        // Show for new type
        currentMediaType = type;
        mediaUrlInput.style.display = 'block';
        
        // Set placeholder
        if (type === 'iframe') {
            mediaUrlInput.placeholder = "Enter YouTube/Facebook/Vimeo link";
        } else if (type === 'video') {
            mediaUrlInput.placeholder = "Enter video link (MP4, WebM)";
        } else {
            mediaUrlInput.placeholder = "Enter image link (JPG, PNG, GIF)";
        }
        
        mediaUrlInput.focus();
        mediaPreview.innerHTML = '';
        
        // Preview on typing
        mediaUrlInput.oninput = function() {
            showMediaPreview(this.value, type);
        };
    }
}

// Show media preview as link
function showMediaPreview(url, type) {
    const mediaPreview = document.getElementById('mediaPreview');
    currentMediaUrl = url.trim();
    
    if (!currentMediaUrl) {
        mediaPreview.innerHTML = '';
        return;
    }
    
    let previewHTML = '';
    let iconClass = 'fas fa-link';
    let mediaType = 'Link';
    
    if (type === 'image') {
        iconClass = 'fas fa-image';
        mediaType = 'Image Link';
    } else if (type === 'video') {
        iconClass = 'fas fa-video';
        mediaType = 'Video Link';
    } else if (type === 'iframe') {
        iconClass = 'fab fa-youtube';
        mediaType = 'Embed Link';
    }
    
    // Shorten URL for display
    let displayUrl = currentMediaUrl;
    if (displayUrl.length > 40) {
        displayUrl = displayUrl.substring(0, 37) + '...';
    }
    
    previewHTML = `
        <div class="media-preview-item">
            <div class="media-link-preview">
                <i class="${iconClass}"></i>
                <div>
                    <strong>${mediaType}:</strong>
                    <span class="url-preview">${displayUrl}</span>
                </div>
            </div>
            <button class="remove-media" onclick="removeMedia()">&times;</button>
        </div>
    `;
    
    mediaPreview.innerHTML = previewHTML;
}

// Remove media
function removeMedia() {
    const mediaUrlInput = document.getElementById('mediaUrlInput');
    const mediaPreview = document.getElementById('mediaPreview');
    
    mediaUrlInput.value = '';
    mediaUrlInput.style.display = 'none';
    mediaPreview.innerHTML = '';
    currentMediaType = null;
    currentMediaUrl = '';
}

// Convert URLs to embed format
function convertToEmbedUrl(url) {
    if (!url) return '';
    
    const cleanUrl = url.trim();
    
    // YouTube regular video
    if (cleanUrl.includes('youtube.com/watch?v=')) {
        const videoId = cleanUrl.split('v=')[1].split('&')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // YouTube Shorts
    if (cleanUrl.includes('youtube.com/shorts/')) {
        const videoId = cleanUrl.split('shorts/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // YouTube mobile link
    if (cleanUrl.includes('youtu.be/')) {
        const videoId = cleanUrl.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Facebook video
    if (cleanUrl.includes('facebook.com/') && cleanUrl.includes('/video')) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanUrl)}`;
    }
    
    // Facebook watch
    if (cleanUrl.includes('facebook.com/watch/')) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanUrl)}`;
    }
    
    // Vimeo
    if (cleanUrl.includes('vimeo.com/')) {
        const videoId = cleanUrl.split('vimeo.com/')[1].split('/')[0];
        return `https://player.vimeo.com/video/${videoId}`;
    }
    
    return cleanUrl;
}

// Create post with exact JSON structure
async function createPost() {
    const postContent = document.getElementById('postContent');
    const submitBtn = document.getElementById('submitPostBtn');
    
    if (!postContent || !submitBtn) return;
    
    const content = postContent.value.trim();
    
    // Check if empty
    if (!content && !currentMediaUrl) {
        showError('Please enter content or add media');
        return;
    }
    
    // Check character limit
    if (content.length > CHAR_LIMIT) {
        showError(`Content too long (max ${CHAR_LIMIT} characters)`);
        return;
    }
    
    // Check cooldown - ENFORCE 30s
    const now = Date.now();
    const timeSinceLastPost = now - lastPostTime;
    
    if (timeSinceLastPost < POST_COOLDOWN && lastPostTime !== 0) {
        const secondsLeft = Math.ceil((POST_COOLDOWN - timeSinceLastPost) / 1000);
        showError(`Please wait ${secondsLeft} seconds before posting again`);
        return;
    }
    
    // Disable button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
    
    // Create post data EXACTLY like your example
    const postData = {
        name: currentUser.name || "Guest",
        username: currentUser.username || "guest",
        datePost: formatDate(new Date()),
        content: content,
        iframe: currentMediaType === 'iframe' ? convertToEmbedUrl(currentMediaUrl) : "",
        video: currentMediaType === 'video' ? currentMediaUrl : "",
        image: currentMediaType === 'image' ? currentMediaUrl : "",
        likes: 0, // You set this later
        liked: false,
        topic: FIXED_TOPIC
    };
    
    // Save locally
    savePostToLocalStorage(postData);
    
    // Show warning about potential delays
    showWarning('Post uploaded! Note: Posts may take time to appear in feeds due to processing.');
    
    // Send to FormSubmit
    try {
        await submitToFormSubmit(postData);
        
        // Update cooldown
        lastPostTime = Date.now();
        localStorage.setItem('lastPostTime', lastPostTime.toString());
        
        // Clear form
        postContent.value = '';
        removeMedia();
        
        // Reset counter
        const charCounter = document.getElementById('charCounter');
        if (charCounter) {
            charCounter.textContent = `0/${CHAR_LIMIT}`;
            charCounter.classList.remove('char-warning');
        }
        
        // Refresh uploads if open
        if (document.getElementById('uploadsModal')?.classList.contains('active')) {
            loadUserUploads();
        }
        
    } catch (error) {
        console.error('Post error:', error);
        showError('Failed to post. Try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Post';
    }
}
// Submit to FormSubmit - KEEP JSON PURE, add user info as separate text
async function submitToFormSubmit(data) {
    return new Promise(async (resolve, reject) => {
        const form = document.getElementById('postForm');
        const jsonField = document.getElementById('postJsonField');
        const previewField = document.getElementById('postPreview');
        const subjectField = document.getElementById('emailSubject');
        
        if (!form || !jsonField) {
            reject('Form not found');
            return;
        }
        
        try {
            // Get user's IP address (for text only, not in JSON)
            const ipAddress = await getUserIP();
            
            // Create PURE JSON string exactly like your example - NO extra fields
            const jsonString = JSON.stringify(data, null, 2) + ",";
            jsonField.value = jsonString;
            
            // Create human-readable preview with JSON + user info as separate text
            const previewText = `
=== USER SUBMISSION DETAILS ===
Username: @${data.username}
Name: ${data.name}
User Email: ${currentUser.email || "No email provided"}
IP Address: ${ipAddress}
Device/Platform: ${detectPlatform()}
Browser: ${navigator.userAgent}
Submission Time: ${new Date().toLocaleString()}

=== POST JSON DATA (EXACT FORMAT) ===
${jsonString}

=== END OF SUBMISSION ===
            `.trim();
            
            previewField.value = previewText;
            
            // Set subject
            subjectField.value = `New Post from ${data.username}`;
            
            // Add user email for FormSubmit reply-to (hidden field)
            let emailField = form.querySelector('input[name="_replyto"]');
            if (!emailField) {
                emailField = document.createElement('input');
                emailField.type = 'hidden';
                emailField.name = '_replyto';
                form.appendChild(emailField);
            }
            emailField.value = currentUser.email || "";
            
            // Submit
            form.submit();
            
            // Wait a bit
            setTimeout(resolve, 800);
            
        } catch (error) {
            console.error('Error in form submission:', error);
            reject(error);
        }
    });
}

// Get user's IP address (for text display only)
async function getUserIP() {
    try {
        // Try to get IP from multiple sources
        const ipPromises = [
            fetch('https://api.ipify.org?format=json').then(r => r.json()),
            fetch('https://api64.ipify.org?format=json').then(r => r.json())
        ];
        
        // Use the first successful response
        const response = await Promise.any(ipPromises);
        
        if (response.ip) {
            return response.ip;
        }
        
        return "IP Not Available";
        
    } catch (error) {
        console.log('Could not fetch IP');
        return "IP Not Available";
    }
}

// Detect user platform/device (for text display only)
function detectPlatform() {
    const userAgent = navigator.userAgent;
    let platform = "Desktop";
    
    if (/Android/.test(userAgent)) {
        platform = "Android";
    } else if (/iPhone|iPad|iPod/.test(userAgent)) {
        platform = "iOS";
    } else if (/Windows/.test(userAgent)) {
        platform = "Windows";
    } else if (/Mac/.test(userAgent)) {
        platform = "Mac";
    } else if (/Linux/.test(userAgent)) {
        platform = "Linux";
    } else if (/Mobile/.test(userAgent)) {
        platform = "Mobile";
    }
    
    return platform;
}

// Alternative: Simple IP fetch without Promise.any (for older browsers)
async function getSimpleIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || "IP Not Available";
    } catch (error) {
        return "IP Not Available";
    }
}
// Save post locally
function savePostToLocalStorage(postData) {
    try {
        // Add post info
        postData.id = Date.now().toString();
        postData.userId = currentUser.username;
        postData.status = 'uploaded'; // Simple status
        postData.uploadedAt = new Date().toISOString();
        postData.createdAt = Date.now();
        
        // Get existing uploads
        let allUploads = JSON.parse(localStorage.getItem('MekoNetwork_uploads') || '{}');
        
        // Create user array if needed
        if (!allUploads[currentUser.username]) {
            allUploads[currentUser.username] = [];
        }
        
        // Add new post
        allUploads[currentUser.username].unshift(postData);
        
        // Save
        localStorage.setItem('MekoNetwork_uploads', JSON.stringify(allUploads));
        
        return true;
    } catch (error) {
        console.error('Save error:', error);
        return false;
    }
}

// Format date like "Dec 15 2025 9:35PM"
function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${month} ${day} ${year} ${hours}:${minutes}${ampm}`;
}

// Show warning about delays
function showWarning(text) {
    const warning = document.createElement('div');
    warning.className = 'notification warning';
    warning.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <h4>Note</h4>
                <p>${text}</p>
            </div>
            <button class="close-notification" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    document.body.appendChild(warning);
    
    setTimeout(() => {
        if (warning.parentNode) warning.remove();
    }, 5000);
}

// Show error
function showError(text) {
    const error = document.createElement('div');
    error.className = 'notification error';
    error.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-exclamation-circle"></i>
            <div>
                <h4>Error</h4>
                <p>${text}</p>
            </div>
            <button class="close-notification" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    document.body.appendChild(error);
    
    setTimeout(() => {
        if (error.parentNode) error.remove();
    }, 5000);
}

// Initialize uploads tab
function initializeUploadsTab() {
    // Get buttons
    const desktopUploads = document.getElementById('desktopUploadsLink');
    const mobileUploads = document.getElementById('mobileUploadsLink');
    const bottomUploads = document.getElementById('bottomUploadsBtn');
    const closeUploads = document.getElementById('closeUploadsModal');
    
    // Open function
    function openUploads() {
        document.getElementById('uploadsModal').classList.add('active');
        loadUserUploads();
    }
    
    // Close function
    function closeUploadsFunc() {
        document.getElementById('uploadsModal').classList.remove('active');
    }
    
    // Add click events
    if (desktopUploads) desktopUploads.addEventListener('click', openUploads);
    if (mobileUploads) mobileUploads.addEventListener('click', openUploads);
    if (bottomUploads) bottomUploads.addEventListener('click', openUploads);
    if (closeUploads) closeUploads.addEventListener('click', closeUploadsFunc);
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loadUserUploads(this.getAttribute('data-filter'));
        });
    });
    
    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreUploadsBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreUploads);
    }
}

// Load user uploads
function loadUserUploads(filter = 'all') {
    const uploadsList = document.getElementById('uploadsList');
    const loadMoreDiv = document.getElementById('uploadsLoadMore');
    
    if (!uploadsList) return;
    
    uploadsList.innerHTML = '<div class="upload-loading"><i class="fas fa-spinner fa-spin"></i><p>Loading...</p></div>';
    
    setTimeout(() => {
        try {
            // Get uploads from storage
            const allUploads = JSON.parse(localStorage.getItem('MekoNetwork_uploads') || '{}');
            const userUploads = allUploads[currentUser.username] || [];
            
            // Simple status check - check if in DATABASEPOSTS
            const updatedUploads = userUploads.map(upload => {
                // Check if this post is in DATABASEPOSTS
                const isPublished = isPostInDatabase(upload);
                
                if (isPublished) {
                    return {
                        ...upload,
                        status: 'published'
                    };
                }
                return upload;
            });
            
            // Save updates if any
            if (JSON.stringify(userUploads) !== JSON.stringify(updatedUploads)) {
                allUploads[currentUser.username] = updatedUploads;
                localStorage.setItem('MekoNetwork_uploads', JSON.stringify(allUploads));
            }
            
            // Filter
            let filtered = updatedUploads;
            if (filter !== 'all') {
                filtered = updatedUploads.filter(u => u.status === filter);
            }
            
            // Show if empty
            if (filtered.length === 0) {
                uploadsList.innerHTML = `
                    <div class="upload-empty">
                        <i class="fas fa-upload"></i>
                        <h3>No Uploads</h3>
                        <p>You haven't uploaded anything yet.</p>
                    </div>
                `;
                if (loadMoreDiv) loadMoreDiv.style.display = 'none';
                return;
            }
            
            // Reset page
            uploadsPage = 1;
            
            // Show first page
            renderUploads(filtered.slice(0, UPLOADS_PER_PAGE));
            
            // Show load more if needed
            if (filtered.length > UPLOADS_PER_PAGE && loadMoreDiv) {
                loadMoreDiv.style.display = 'block';
            } else if (loadMoreDiv) {
                loadMoreDiv.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Load error:', error);
            uploadsList.innerHTML = '<div class="upload-empty"><p>Error loading uploads</p></div>';
        }
    }, 500);
}

// Load more uploads
function loadMoreUploads() {
    const uploadsList = document.getElementById('uploadsList');
    const loadMoreBtn = document.getElementById('loadMoreUploadsBtn');
    
    if (!uploadsList || !loadMoreBtn) return;
    
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    setTimeout(() => {
        try {
            // Get uploads
            const allUploads = JSON.parse(localStorage.getItem('MekoNetwork_uploads') || '{}');
            const userUploads = allUploads[currentUser.username] || [];
            
            // Get filter
            const activeBtn = document.querySelector('.filter-btn.active');
            const filter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
            
            // Filter
            let filtered = userUploads;
            if (filter !== 'all') {
                filtered = userUploads.filter(u => u.status === filter);
            }
            
            // Load next page
            uploadsPage++;
            const start = 0;
            const end = uploadsPage * UPLOADS_PER_PAGE;
            const pageData = filtered.slice(start, Math.min(end, filtered.length));
            
            renderUploads(pageData);
            
            // Hide button if done
            if (end >= filtered.length && loadMoreBtn) {
                loadMoreBtn.parentElement.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Load more error:', error);
        } finally {
            if (loadMoreBtn) {
                loadMoreBtn.disabled = false;
                loadMoreBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Load More';
            }
        }
    }, 800);
}

// Render uploads to list
function renderUploads(uploads) {
    const uploadsList = document.getElementById('uploadsList');
    if (!uploadsList || !Array.isArray(uploads)) return;
    
    if (uploads.length === 0) {
        uploadsList.innerHTML = '<div class="upload-empty"><p>No uploads found</p></div>';
        return;
    }
    
    let html = '';
    
    uploads.forEach(upload => {
        // Create avatar URL
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(upload.name)}&background=1e3a8a&color=fff`;
        
        // Simple status - no complex labels
        let statusBadge = '';
        if (upload.status === 'published') {
            statusBadge = `<span class="status-label status-published"><i class="fas fa-check"></i> Live</span>`;
        } else {
            statusBadge = `<span class="status-label status-published"><i
            class="fas fa-check"></i> Uploaded</span>`;
        }
        
        // Media info
        let mediaInfo = '';
        if (upload.image) {
            mediaInfo = `<small><i class="fas fa-image"></i> Image</small>`;
        } else if (upload.video) {
            mediaInfo = `<small><i class="fas fa-video"></i> Video</small>`;
        } else if (upload.iframe) {
            mediaInfo = `<small><i class="fab fa-youtube"></i> Embed</small>`;
        }
        
        // Add delay warning for recent posts
        const postAge = Date.now() - (upload.createdAt || new Date(upload.uploadedAt).getTime());
        const fiveMinutesMs = 5 * 60 * 1000;
        const delayWarning = postAge < fiveMinutesMs ? 
            `<small class="delay-warning"><i class="fas fa-info-circle"></i> May take time to appear in feeds</small>` : '';
        
        html += `
            <div class="upload-item" data-id="${upload.id}">
                <div class="upload-item-header">
                    <div class="upload-avatar">
                        <img src="${avatarUrl}" alt="${upload.name}">
                    </div>
                    <div class="upload-user-info">
                        <h4>${upload.name}</h4>
                        <span>@${upload.username} • ${upload.datePost}</span>
                    </div>
                </div>
                
                ${upload.content ? `<div class="upload-content">${upload.content}</div>` : ''}
                
                ${mediaInfo}
                ${delayWarning}
                
                <div class="upload-footer">
                    <div class="upload-topic">${upload.topic}</div>
                    <div class="upload-status">
                        ${statusBadge}
                    </div>
                </div>
            </div>
        `;
    });
    
    uploadsList.innerHTML = html;
}

// Check if post exists in DATABASEPOSTS
function isPostInDatabase(upload) {
    if (!window.DATABASEPOSTS || !Array.isArray(window.DATABASEPOSTS)) {
        return false;
    }
    
    return window.DATABASEPOSTS.some(dbPost => {
        // Match by content
        if (dbPost.content && upload.content && dbPost.content === upload.content) {
            return true;
        }
        
        // Match by username and similar timestamp
        if (dbPost.username === upload.username) {
            const uploadTime = new Date(upload.datePost);
            const dbTime = new Date(dbPost.datePost);
            const timeDiff = Math.abs(uploadTime - dbTime);
            
            // If same user and within 2 hours
            if (timeDiff < 2 * 60 * 60 * 1000) {
                return true;
            }
        }
        
        return false;
    });
}

// Start everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for main.js
    setTimeout(() => {
        if (typeof currentUser !== 'undefined') {
            initializePostSystem();
        } else {
            // Try again if not ready
            setTimeout(initializePostSystem, 2000);
        }
    }, 1500);
});

// Make functions available globally
window.initializePostSystem = initializePostSystem;
window.loadUserUploads = loadUserUploads;
window.openUploadsModal = function() {
    const modal = document.getElementById('uploadsModal');
    if (modal) {
        modal.classList.add('active');
        loadUserUploads();
    }
};