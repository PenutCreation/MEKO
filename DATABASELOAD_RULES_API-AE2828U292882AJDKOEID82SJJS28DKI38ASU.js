// main.js
// Global variables
let currentUser = null;
let postsPerPage = 5;
let currentPage = 0;
let currentMediaType = null;
let allPosts = [];
let displayedPosts = new Set();

// DOM Elements
const elements = {
    // Auth elements
    authModal: document.getElementById('authModal'),
    loginForm: document.getElementById('loginForm'),
    signupForm: document.getElementById('signupForm'),
    authTabs: document.querySelectorAll('.auth-tab'),
    loginUsername: document.getElementById('loginUsername'),
    loginPassword: document.getElementById('loginPassword'),
    signupName: document.getElementById('signupName'),
    signupUsername: document.getElementById('signupUsername'),
    signupEmail: document.getElementById('signupEmail'),
    signupPassword: document.getElementById('signupPassword'),
    signupConfirmPassword: document.getElementById('signupConfirmPassword'),
    usernameError: document.getElementById('usernameError'),
    createNewAccount: document.getElementById('createNewAccount'),
    loginError: document.getElementById('loginError'),
    
    // Main app elements
    appContainer: document.querySelector('.app-container'),
    postsFeed: document.getElementById('postsFeed'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    searchToggle: document.getElementById('searchToggle'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    createPostBtn: document.getElementById('createPostBtn'),
    submitPostBtn: document.getElementById('submitPostBtn'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    profileModal: document.getElementById('profileModal'),
    postModal: document.getElementById('postModal'),
    closeProfileModal: document.getElementById('closeProfileModal'),
    closePostModal: document.getElementById('closePostModal'),
    searchHistory: document.getElementById('searchHistory'),
    suggestedProfiles: document.getElementById('suggestedProfiles'),
    trendingList: document.getElementById('trendingList'),
    postContent: document.getElementById('postContent'),
    mediaPreview: document.getElementById('mediaPreview'),
    imageUpload: document.getElementById('imageUpload'),
    videoUpload: document.getElementById('videoUpload'),
    linkInput: document.getElementById('linkInput'),
    postTopic: document.getElementById('postTopic'),
    postContentModal: document.getElementById('postContentModal'),
    postTopicModal: document.getElementById('postTopicModal'),
    mediaPreviewModal: document.getElementById('mediaPreviewModal'),
    submitNewPostBtn: document.getElementById('submitNewPostBtn'),
    addImageBtn: document.getElementById('addImageBtn'),
    addVideoBtn: document.getElementById('addVideoBtn'),
    addLinkBtn: document.getElementById('addLinkBtn'),
    
    // Mobile elements
    mobileMenuToggle: document.getElementById('mobileMenuToggle'),
    mobileMenu: document.getElementById('mobileMenu'),
    closeMobileMenu: document.getElementById('closeMobileMenu'),
    mobileUserName: document.getElementById('mobileUserName'),
    mobileUserUsername: document.getElementById('mobileUserUsername'),
    mobileProfileLink: document.getElementById('mobileProfileLink'),
    mobileLogoutLink: document.getElementById('mobileLogoutLink'),
    createPostMobile: document.getElementById('createPostMobile'),
    bottomSearchBtn: document.getElementById('bottomSearchBtn'),
    bottomCreatePostBtn: document.getElementById('bottomCreatePostBtn'),
    bottomProfileBtn: document.getElementById('bottomProfileBtn'),
    
    // User menu elements
    userMenu: document.getElementById('userMenu'),
    menuToggle: document.getElementById('menuToggle'),
    profileLink: document.getElementById('profileLink'),
    logoutLink: document.getElementById('logoutLink'),
    currentUserAvatar: document.getElementById('currentUserAvatar'),
    userAvatar: document.querySelector('#userAvatar img')
};

// Store all registered users in localStorage
const USERS_KEY = 'meko-registered-users';
const CURRENT_USER_KEY = 'meko-current-user';

// Initialize the app
function init() {
    // Initialize users storage if empty
    if (!localStorage.getItem(USERS_KEY)) {
        localStorage.setItem(USERS_KEY, JSON.stringify({}));
    }
    
    checkAuth();
    setupEventListeners();
    initializePosts();
    loadTrendingTopics();
    loadSuggestedProfiles();
    setupTheme();
}

// Get all registered users
function getRegisteredUsers() {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : {};
}

// Save a user
function saveUser(username, userData) {
    const users = getRegisteredUsers();
    users[username] = userData;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Check if username exists in posts database OR registered users
function isUsernameTaken(username) {
    const users = getRegisteredUsers();
    
    // Check in registered users
    if (users[username]) {
        return true;
    }
    
    // Check in posts database (as per your requirement)
    return DATABASEPOSTS.some(post => post.username === username);
}
// main.js - Update checkAuth() function around line 641
// main.js - Update checkAuth function
function checkAuth() {
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    
    if (savedUser) {
        try {
            const parsedUser = JSON.parse(savedUser);
            
            // Convert arrays back to Sets
            currentUser = {
                ...parsedUser,
                likedPosts: new Set(parsedUser.likedPosts || []),
                followedTopics: new Set(parsedUser.followedTopics || []),
                isGuest: false
            };
            
            console.log('User automatically logged in:', currentUser.username);
            
            // Initialize posts
            initializePosts();
            
            // Hide auth modal, show app
            hideAuthModal();
            
            updateUserUI();
            loadPosts();
            loadSearchHistory();
            
            return true;
        } catch (e) {
            console.error('Error parsing user data:', e);
            localStorage.removeItem(CURRENT_USER_KEY);
        }
    }
    
    // No user or error - show auth modal
    showAuthModal();
    
    // Set default guest user
    currentUser = {
        name: "Guest",
        username: "guest",
        email: "",
        likedPosts: new Set(),
        searchHistory: [],
        followedTopics: new Set(),
        isGuest: true
    };
    
    // Initialize posts for guest too
    initializePosts();
    
    return false;
}

function showAuthModal() {
    if (elements.authModal) {
        elements.authModal.classList.add('active');
    }
    if (elements.appContainer) {
        elements.appContainer.classList.add('hidden');
    }
}

function hideAuthModal() {
    if (elements.authModal) {
        elements.authModal.classList.remove('active');
    }
    if (elements.appContainer) {
        elements.appContainer.classList.remove('hidden');
    }
}

// Save current user to localStorage
// main.js - Update saveCurrentUser function
function saveCurrentUser() {
    if (currentUser && !currentUser.isGuest) {
        // Convert Sets to Arrays for localStorage
        const userToSave = {
            ...currentUser,
            likedPosts: currentUser.likedPosts ? Array.from(currentUser.likedPosts) : [],
            followedTopics: currentUser.followedTopics ? Array.from(currentUser.followedTopics) : []
        };
        
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userToSave));
        
        // Also update the user in registered users storage
        const users = getRegisteredUsers();
        if (users[currentUser.username]) {
            users[currentUser.username] = {
                ...users[currentUser.username],
                likedPosts: userToSave.likedPosts,
                searchHistory: userToSave.searchHistory,
                followedTopics: userToSave.followedTopics
            };
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
    }
}
// Setup event listeners
function setupEventListeners() {
    // Auth event listeners
    if (elements.authTabs) {
        elements.authTabs.forEach(tab => {
            tab.addEventListener('click', switchAuthTab);
        });
    }
    
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    if (elements.signupForm) {
        elements.signupForm.addEventListener('submit',handleSignup);
    }
    
    if (elements.createNewAccount) {
        elements.createNewAccount.addEventListener('click', () => {
            document.querySelector('.auth-tab[data-tab="signup"]').click();
        });
    }
    
    // Theme toggle
    if (elements.themeToggleBtn) {
        elements.themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Search functionality
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', handleSearch);
        elements.searchInput.addEventListener('focus', showSearchResults);
    }
    
    if (elements.searchToggle) {
        elements.searchToggle.addEventListener('click', toggleSearchBar);
    }
    
    if (elements.bottomSearchBtn) {
        elements.bottomSearchBtn.addEventListener('click', toggleSearchBar);
    }
    
    // Post creation
    if (elements.createPostBtn) {
        elements.createPostBtn.addEventListener('click', () => showPostModal());
    }
    
    if (elements.submitPostBtn) {
        elements.submitPostBtn.addEventListener('click', createPost);
    }
    
    if (elements.submitNewPostBtn) {
        elements.submitNewPostBtn.addEventListener('click', createNewPost);
    }
    
    if (elements.createPostMobile) {
        elements.createPostMobile.addEventListener('click', () => showPostModal());
    }
    
    if (elements.bottomCreatePostBtn) {
        elements.bottomCreatePostBtn.addEventListener('click', () => showPostModal());
    }
    
    // Modal controls
    if (elements.closeProfileModal) {
        elements.closeProfileModal.addEventListener('click', () => {
            elements.profileModal.classList.remove('active');
        });
    }
    
    if (elements.closePostModal) {
        elements.closePostModal.addEventListener('click', () => {
            elements.postModal.classList.remove('active');
            resetPostForm();
        });
    }
    
    // Load more posts
    if (elements.loadMoreBtn) {
        elements.loadMoreBtn.addEventListener('click', loadMorePosts);
    }
    
    // Media buttons
    document.querySelectorAll('.media-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            handleMediaButtonClick(type);
        });
    });
    // In setupEventListeners() function, update these parts:

// Profile links - OWN PROFILE
if (elements.profileLink) {
    elements.profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        showOwnProfile(); // Changed from showUserProfile()
    });
}

if (elements.mobileProfileLink) {
    elements.mobileProfileLink.addEventListener('click', (e) => {
        e.preventDefault();
        showOwnProfile(); // Changed from showUserProfile()
        closeMobileMenu();
    });
}

if (elements.bottomProfileBtn) {
    elements.bottomProfileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showOwnProfile(); // Changed from showUserProfile()
    });
}

// Also update desktop sidebar profile link
const desktopProfileLink = document.getElementById('desktopProfileLink');
if (desktopProfileLink) {
    desktopProfileLink.addEventListener('click', (e) => {
        e.preventDefault();
        showOwnProfile();
    });
}
    // Media buttons in modal
    if (elements.addImageBtn) {
        elements.addImageBtn.addEventListener('click', () => addMediaToPost('image'));
    }
    
    if (elements.addVideoBtn) {
        elements.addVideoBtn.addEventListener('click', () => addMediaToPost('video'));
    }
    
    if (elements.addLinkBtn) {
        elements.addLinkBtn.addEventListener('click', () => addMediaToPost('iframe'));
    }
    
    // Mobile menu
    if (elements.mobileMenuToggle) {
        elements.mobileMenuToggle.addEventListener('click', openMobileMenu);
    }
    
    if (elements.closeMobileMenu) {
        elements.closeMobileMenu.addEventListener('click', closeMobileMenu);
    }
    
    // User menu
    if (elements.menuToggle) {
        elements.menuToggle.addEventListener('click', toggleUserMenu);
    }
    
    if (elements.logoutLink) {
        elements.logoutLink.addEventListener('click', handleLogout);
    }
    
    if (elements.mobileLogoutLink) {
        elements.mobileLogoutLink.addEventListener('click', handleLogout);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (elements.profileModal && e.target === elements.profileModal) {
            elements.profileModal.classList.remove('active');
        }
        if (elements.postModal && e.target === elements.postModal) {
            elements.postModal.classList.remove('active');
            resetPostForm();
        }
        
        // Close user menu if clicking outside
        if (elements.userMenu && !elements.userMenu.contains(e.target) && e.target !== elements.menuToggle) {
            elements.userMenu.classList.remove('active');
        }
        
        // Close search results if clicking outside
        if (elements.searchResults && !elements.searchResults.contains(e.target) && e.target !== elements.searchInput) {
            elements.searchResults.style.display = 'none';
        }
    });
    
    // Close search on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.searchResults) {
                elements.searchResults.style.display = 'none';
            }
            document.querySelector('.search-bar')?.classList.remove('active');
        }
    });
}

// Auth functions
function switchAuthTab(e) {
    const tab = e.target;
    const tabName = tab.dataset.tab;
    
    // Update active tab
    elements.authTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Show corresponding form
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`${tabName}Form`).classList.add('active');
    
    // Clear errors
    if (elements.usernameError) elements.usernameError.style.display = 'none';
    if (elements.loginError) elements.loginError.style.display = 'none';
}
// main.js - Update the handleLogin function
function handleLogin(e) {
    e.preventDefault();
    
    const username = elements.loginUsername.value.trim().toLowerCase();
    const password = elements.loginPassword.value.trim();
    
    // Clear previous error
    if (elements.loginError) {
        elements.loginError.style.display = 'none';
        elements.loginError.textContent = '';
    }
    
    // Validation
    if (!username || !password) {
        if (elements.loginError) {
            elements.loginError.textContent = 'Please fill in all fields';
            elements.loginError.style.display = 'block';
        }
        return;
    }
    
    // Get registered users
    const users = getRegisteredUsers();
    
    // Check if user exists
    if (!users[username]) {
        if (elements.loginError) {
            elements.loginError.textContent = 'Account not found. Please sign up first.';
            elements.loginError.style.display = 'block';
        }
        return;
    }
    
    // Check password (in real app, this would be hashed)
    if (users[username].password !== password) {
        if (elements.loginError) {
            elements.loginError.textContent = 'Wrong password. Please try again.';
            elements.loginError.style.display = 'block';
        }
        return;
    }
    
    // Login successful - GET USER DATA FROM STORAGE
    const userData = users[username];
    
    // Convert arrays back to Sets
    const likedPosts = new Set(userData.likedPosts || []);
    const followedTopics = new Set(userData.followedTopics || []);
    
    currentUser = {
        name: userData.name,
        username: username,
        email: userData.email,
        likedPosts: likedPosts,
        searchHistory: userData.searchHistory || [],
        followedTopics: followedTopics,
        isGuest: false
    };
    
    // Save to localStorage - USER STAYS LOGGED IN!
    saveCurrentUser();
    
    // Update the registered user data with current data
    saveUser(username, {
        ...userData,
        likedPosts: Array.from(likedPosts),
        searchHistory: currentUser.searchHistory,
        followedTopics: Array.from(followedTopics)
    });
    
    // Re-initialize posts for this user (new randomization)
    initializePosts();
    
    // Hide auth modal, show app
    hideAuthModal();
    
    // Update UI
    updateUserUI();
    loadPosts(); // Load posts after login
    loadSearchHistory();
    
    // Clear form
    if (elements.loginForm) elements.loginForm.reset();
}
// main.js - Update handleSignup function
function handleSignup(e) {
    e.preventDefault();
    
    const name = elements.signupName.value.trim();
    const username = elements.signupUsername.value.trim().toLowerCase();
    const email = elements.signupEmail.value.trim();
    const password = elements.signupPassword.value.trim();
    const confirmPassword = elements.signupConfirmPassword.value.trim();
    
    // Clear previous error
    if (elements.usernameError) elements.usernameError.style.display = 'none';
    
    // Validation
    if (!name || !username || !email || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    // Check if username already exists (in posts OR registered users)
    if (isUsernameTaken(username)) {
        if (elements.usernameError) {
            elements.usernameError.textContent = 'This username is already taken.';
            elements.usernameError.style.display = 'block';
        }
        return;
    }
    
    // Create user data
    const userData = {
        name: name,
        email: email,
        password: password, // In real app, this would be hashed
        likedPosts: [],
        searchHistory: [],
        followedTopics: [],
        createdAt: new Date().toISOString()
    };
    
    // Save user to registered users
    saveUser(username, userData);
    
    // Set as current user
    currentUser = {
        name: name,
        username: username,
        email: email,
        likedPosts: new Set(),
        searchHistory: [],
        followedTopics: new Set(),
        isGuest: false
    };
    
    // Save to localStorage - USER STAYS LOGGED IN!
    saveCurrentUser();
    
    // Initialize posts (randomized)
    initializePosts();
    
    // Hide auth modal, show app
    hideAuthModal();
    
    // Update UI
    updateUserUI();
    loadPosts(); // Load posts after signup
    
    // Clear form
    if (elements.signupForm) elements.signupForm.reset();
    
    // Switch to login tab (for next time)
    const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
    if (loginTab) loginTab.click();
}
function updateUserUI() {
    if (!currentUser) return;
    
    // Update avatar
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=1e3a8a&color=fff&bold=true`;
    
    if (elements.currentUserAvatar) {
        elements.currentUserAvatar.src = avatarUrl;
    }
    
    if (elements.userAvatar) {
        elements.userAvatar.src = avatarUrl;
    }
    
    // Update mobile menu
    if (elements.mobileUserName) {
        elements.mobileUserName.textContent = currentUser.name;
    }
    
    if (elements.mobileUserUsername) {
        elements.mobileUserUsername.textContent = `@${currentUser.username}`;
    }
    
    // Update mobile menu avatar
    const mobileAvatar = elements.mobileMenu?.querySelector('.user-avatar img');
    if (mobileAvatar) mobileAvatar.src = avatarUrl;
}

function handleLogout(e) {
    if (e) e.preventDefault();
    
    // Clear current user data
    localStorage.removeItem(CURRENT_USER_KEY);
    currentUser = null;
    
    // Show auth modal, hide app
    showAuthModal();
    
    // Reset forms
    if (elements.loginForm) elements.loginForm.reset();
    if (elements.signupForm) elements.signupForm.reset();
    
    // Clear errors
    if (elements.usernameError) elements.usernameError.style.display = 'none';
    if (elements.loginError) elements.loginError.style.display = 'none';
    
    // Switch to login tab
    const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
    if (loginTab) loginTab.click();
    
    // Clear feed
    if (elements.postsFeed) elements.postsFeed.innerHTML = '';
    displayedPosts.clear();
    currentPage = 0;
    
    // Set default guest user
    currentUser = {
        name: "Guest",
        username: "guest",
        email: "",
        likedPosts: new Set(),
        searchHistory: [],
        followedTopics: new Set(),
        isGuest: true
    };
    
    // Update UI for guest
    updateUserUI();
}

// main.js - Update initializePosts() function
function initializePosts() {
    // Create a copy of all posts and reverse them (newest first)
    allPosts = [...DATABASEPOSTS].reverse();
    
    // Generate unique seed for each load - randomizes every time!
    const seed = Date.now() + Math.random();
    
    // Shuffle posts using Fisher-Yates algorithm with unique seed
    allPosts = shuffleArray(allPosts, seed);
    
    // Add IDs to posts (from bottom to top as specified)
    allPosts.forEach((post, index) => {
        post.id = allPosts.length - index; // ID from bottom to top
    });
    
    console.log(`Loaded ${allPosts.length} posts with seed: ${seed}`);
}

// main.js - Update lines 130-140
// Seeded random number generator
function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// Fisher-Yates shuffle with seed
function shuffleArray(array, seed) {
    const shuffled = [...array];
    const randomFunc = seededRandom(seed); // Renamed to avoid conflict
    
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(randomFunc * (i + 1)); // Use randomFunc
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
}
// Post loading and rendering
function loadPosts() {
    if (!elements.postsFeed) return;
    
    const startIndex = currentPage * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    
    // Get posts that haven't been displayed yet
    const postsToShow = allPosts
        .filter(post => !displayedPosts.has(post.id))
        .slice(startIndex, endIndex);
    
    if (postsToShow.length === 0) {
        if (elements.loadMoreBtn) {
            elements.loadMoreBtn.textContent = 'No more posts';
            elements.loadMoreBtn.disabled = true;
        }
        return;
    }
    
    postsToShow.forEach(post => {
        const postElement = createPostElement(post, post.id);
        elements.postsFeed.appendChild(postElement);
        displayedPosts.add(post.id);
    });
    
    currentPage++;
}

function loadMorePosts() {
    loadPosts();
}
function createPostElement(post, postId) {
    const postElement = document.createElement('div');
    postElement.className = 'post-card';
    postElement.dataset.postId = postId;
    postElement.dataset.topic = post.topic || '';
    
    // Parse and format date from "Dec 11 2025 3:02AM" format
    const postDate = parseCustomDate(post.datePost);
    const formattedDate = formatDateToCustom(postDate);
    
    // Create user profile from posts data
    const userPosts = DATABASEPOSTS.filter(p => p.username === post.username);
    const totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);
    const postsCount = userPosts.length;
    
    // Get user's first post date as joined date
    const firstPost = userPosts[userPosts.length - 1];
    const joinedDate = firstPost ? formatJoinedDate(parseCustomDate(firstPost.datePost)) : 'Recently';
    
    // Check for mentions in post content
    let mentionedUsers = [];
    let processedContent = post.content || '';
    
    if (post.content) {
        // Find all @mentions in the content
        const mentionRegex = /@(\w+)/g;
        let match;
        mentionedUsers = [];
        
        while ((match = mentionRegex.exec(post.content)) !== null) {
            mentionedUsers.push(match[1]); // Get username without @
        }
        
        // Highlight mentions in the content
        processedContent = post.content.replace(/@(\w+)/g, 
            '<span class="mention" data-username="$1">@$1</span>'
        );
    }
    
    // Check if this post mentions the logged-in user
    const mentionsCurrentUser = currentUser && !currentUser.isGuest && 
                                mentionedUsers.includes(currentUser.username);
    
    // 1. SET INNER HTML (YOUR TEMPLATE)
    postElement.innerHTML = `
        <div class="post-header">
            <div class="post-user" data-username="${post.username}">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(post.name)}&background=1e3a8a&color=fff" alt="${post.name}">
                <div class="user-info">
                    <h3>${post.name}</h3>
                    <span>@${post.username}</span>
                </div>
            </div>
            <div class="post-date">${formattedDate}</div>
        </div>
        <div class="post-content">
            ${processedContent ? `<p>${processedContent}</p>` : ''}
            ${renderMediaContent(post)}
        </div>
        <div class="post-stats">
            <span>${post.likes.toLocaleString()} likes</span>
            ${mentionedUsers.length > 0 ? `<span class="mentions-info">Mentions ${mentionedUsers.length} user${mentionedUsers.length > 1 ? 's' : ''}</span>` : ''}
            ${mentionsCurrentUser ? `<span class="mention-you">Mentions you!</span>` : ''}
        </div>
        <div class="post-actions-buttons">
            <button class="action-btn ${currentUser?.likedPosts?.has(postId) ? 'liked' : ''}" data-action="like" data-post-id="${postId}">
                <i class="fas fa-heart"></i> Like
            </button>
        </div>
    `;
    
    // 2. FIND THE VIDEO AND ATTACH OBSERVER
    // This targets the video element using the class defined in renderMediaContent
    const videoElement = postElement.querySelector('.auto-pause-video');
    
    if (videoElement) {
        // Assume 'postVideoObserver' is the global IntersectionObserver instance from the previous step.
        // Start observing this specific video element immediately.
        // The callback logic handles the play/pause when it scrolls in/out of view.
        if (typeof postVideoObserver !== 'undefined') {
            postVideoObserver.observe(videoElement);
        } else {
            console.error("postVideoObserver is not defined! Ensure the global observer setup code runs first.");
        }
    }
    
    // 3. Add other event listeners
    const likeBtn = postElement.querySelector('[data-action="like"]');
    if (likeBtn) {
        likeBtn.addEventListener('click', () => handleLike(postId, likeBtn));
    }
    
    const userInfo = postElement.querySelector('.post-user');
    if (userInfo) {
        userInfo.addEventListener('click', () => showUserProfile(post.username, post.name));
    }
    
    // Add click handlers for mentions
    postElement.querySelectorAll('.mention').forEach(mention => {
        mention.addEventListener('click', (e) => {
            e.stopPropagation();
            const username = mention.dataset.username;
            
            // Check if mentioned user exists in database
            const userExists = DATABASEPOSTS.some(p => p.username === username);
            if (userExists) {
                showUserProfile(username, username);
            } else {
                alert(`User @${username} not found`);
            }
        });
    });
    
    return postElement;
}



// Add this function to track and display mentions for a user
function getMentionsForUser(username) {
    const userMentions = [];
    
    // Go through all posts (from bottom to top)
    for (let i = 0; i < DATABASEPOSTS.length; i++) {
        const post = DATABASEPOSTS[i];
        const postId = DATABASEPOSTS.length - i; // ID from bottom to top
        
        if (post.content && post.content.includes(`@${username}`)) {
            userMentions.push({
                postId: postId,
                post: post,
                datePost: parseCustomDate(post.datePost),
                mentionedBy: post.username,
                topic: post.topic || '',
                positionInArray: i // Lower number = older post
            });
        }
    }
    
    // Sort mentions by date (newest first)
    userMentions.sort((a, b) => b.datePost - a.datePost);
    
    return userMentions;
}

function renderMediaContent(post) {
    if (post.iframe) {
        // Iframes are typically handled differently, but we can add the auto-pause logic to the video inside the iframe (if you control it)
        // or apply the class to the iframe itself if it can be paused via external API (which is rare).
        // For now, only the video tag is modified.
        return `<div class="post-media"><iframe class="post-iframe" src="${post.iframe}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    } else if (post.video) {
        return `<div class="post-media">
    <video 
        class="auto-pause-video"  
        src="${post.video}" 
         loop   controls             
        controlsList="nodownload noplaybackrate"
        oncontextmenu="return false;"
        disablePictureInPicture
        style="-webkit-touch-callout:none; -webkit-user-select:none;
        user-select:none;" > 
        Your browser does not support the video tag.
    </video>
</div>`;
    } else if (post.image) {
        return `<div class="post-media"><img src="${post.image}" alt="Post image" loading="lazy"oncontextmenu="return false;"></div>`;
    }
    return '';
}

// Search functionality
function toggleSearchBar() {
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
        searchBar.classList.toggle('active');
        if (searchBar.classList.contains('active')) {
            if (elements.searchInput) elements.searchInput.focus();
        }
    }
}

function handleSearch() {
    const query = elements.searchInput.value.trim().toLowerCase();
    
    if (query.length === 0) {
        if (elements.searchResults) {
            elements.searchResults.style.display = 'none';
        }
        return;
    }
    
    const searchResults = {
        profiles: searchProfiles(query),
        topics: searchTopics(query),
        posts: searchPosts(query)
    };
    
    displayEnhancedSearchResults(searchResults, query);
}

function searchProfiles(query) {
    const uniqueUsers = new Map();
    
    DATABASEPOSTS.forEach(post => {
        if (!uniqueUsers.has(post.username)) {
            const userPosts = DATABASEPOSTS.filter(p => p.username === post.username);
            const totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);
            
            uniqueUsers.set(post.username, {
                name: post.name,
                username: post.username,
                postsCount: userPosts.length,
                totalLikes: totalLikes,
                type: 'profile'
            });
        }
    });
    
    return Array.from(uniqueUsers.values()).filter(user => 
        user.name.toLowerCase().includes(query) || 
        user.username.toLowerCase().includes(query)
    );
}

function searchTopics(query) {
    const topics = {};
    
    DATABASEPOSTS.forEach(post => {
        if (post.topic && post.topic.toLowerCase().includes(query)) {
            topics[post.topic] = (topics[post.topic] || 0) + 1;
        }
    });
    
    return Object.entries(topics)
        .map(([topic, count]) => ({
            name: `#${topic}`,
            topic: topic,
            postsCount: count,
            type: 'topic'
        }))
        .sort((a, b) => b.postsCount - a.postsCount);
}

function searchPosts(query) {
    return allPosts
        .filter(post => 
            (post.content && post.content.toLowerCase().includes(query)) ||
            (post.topic && post.topic.toLowerCase().includes(query))
        )
        .map(post => ({
            name: post.name,
            username: post.username,
            content: post.content ? post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '') : '',
            datePost: post.datePost,
            likes: post.likes,
            type: 'post',
            postId: post.id
        }))
        .slice(0, 5);
}

function displayEnhancedSearchResults(results, query) {
    if (!elements.searchResults) return;
    
    const { profiles, topics, posts } = results;
    
    elements.searchResults.innerHTML = '';
    
    let hasResults = false;
    
    // Show profiles section
    if (profiles.length > 0) {
        hasResults = true;
        const profileSection = createSearchSection('Profiles', 'user');
        profiles.slice(0, 5).forEach(profile => {
            profileSection.appendChild(createProfileResultItem(profile));
        });
        elements.searchResults.appendChild(profileSection);
    }
    
    // Show topics section
    if (topics.length > 0) {
        hasResults = true;
        const topicSection = createSearchSection('Topics', 'hashtag');
        topics.slice(0, 5).forEach(topic => {
            topicSection.appendChild(createTopicResultItem(topic));
        });
        elements.searchResults.appendChild(topicSection);
    }
    
    // Show posts section
    if (posts.length > 0) {
        hasResults = true;
        const postSection = createSearchSection('Posts', 'file-alt');
        posts.forEach(post => {
            postSection.appendChild(createPostResultItem(post));
        });
        elements.searchResults.appendChild(postSection);
    }
    
    // Show no results message
    if (!hasResults) {
        const noResults = document.createElement('div');
        noResults.className = 'search-result-item';
        noResults.innerHTML = `
            <div style="text-align: center; padding: 1rem; color: var(--text-muted);">
                <i class="fas fa-search" style="font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
                <div>No results found for "${query}"</div>
            </div>
        `;
        elements.searchResults.appendChild(noResults);
    }
    
    elements.searchResults.style.display = 'block';
}

function createSearchSection(title, icon) {
    const section = document.createElement('div');
    section.className = 'search-section';
    section.innerHTML = `
        <div class="search-section-header">
            <i class="fas fa-${icon}"></i>
            <span>${title}</span>
        </div>
    `;
    return section;
}

function createProfileResultItem(profile) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.innerHTML = `
        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1e3a8a&color=fff" alt="${profile.name}">
        <div class="search-result-info">
            <h4>${profile.name}</h4>
            <span>@${profile.username}</span>
            <div class="search-result-meta">
                <span>${profile.postsCount} posts • ${profile.totalLikes.toLocaleString()} likes</span>
            </div>
        </div>
    `;
    
    item.addEventListener('click', () => {
        showUserProfile(profile.username, profile.name);
        addToSearchHistory(profile.username, profile.name, 'profile');
        if (elements.searchInput) elements.searchInput.value = '';
        if (elements.searchResults) elements.searchResults.style.display = 'none';
        document.querySelector('.search-bar')?.classList.remove('active');
    });
    
    return item;
}

function createTopicResultItem(topic) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.innerHTML = `
        <div class="topic-icon">
            <i class="fas fa-hashtag"></i>
        </div>
        <div class="search-result-info">
            <h4>${topic.name}</h4>
            <div class="search-result-meta">
                <span>${topic.postsCount} posts</span>
            </div>
        </div>
    `;
    
    item.addEventListener('click', () => {
        filterPostsByTopic(topic.topic);
        addToSearchHistory(topic.topic, topic.name, 'topic');
        if (elements.searchInput) elements.searchInput.value = '';
        if (elements.searchResults) elements.searchResults.style.display = 'none';
        document.querySelector('.search-bar')?.classList.remove('active');
    });
    
    return item;
}
function parseCustomDate(dateString) {
    try {
        // Parse "Dec 11 2025 3:02AM" format
        const months = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        // Split by space: ["Dec", "11", "2025", "3:02AM"]
        const parts = dateString.split(' ');
        
        if (parts.length < 4) {
            console.warn('Invalid date format:', dateString);
            return new Date(); // Return current date as fallback
        }
        
        const monthAbbr = parts[0];
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        const timePart = parts[3];
        
        // Get month index
        const month = months[monthAbbr];
        if (month === undefined) {
            console.warn('Invalid month:', monthAbbr);
            return new Date();
        }
        
        // Parse time with AM/PM
        const timeMatch = timePart.match(/(\d+):(\d+)(AM|PM)/i);
        if (!timeMatch) {
            console.warn('Invalid time format:', timePart);
            return new Date(year, month, day);
        }
        
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const ampm = timeMatch[3].toUpperCase();
        
        // Convert to 24-hour format
        if (ampm === 'PM' && hours < 12) {
            hours += 12;
        }
        if (ampm === 'AM' && hours === 12) {
            hours = 0;
        }
        
        return new Date(year, month, day, hours, minutes);
    } catch (error) {
        console.error('Error parsing date:', dateString, error);
        return new Date(); // Return current date as fallback
    }
}

function formatDateToCustom(date) {
    try {
        // Format: "Dec 11 2025 3:02AM"
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        
        // Format time to 12-hour format with AM/PM
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        // Convert to 12-hour format
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12
        
        return `${month} ${day} ${year} ${hours}:${minutes}${ampm}`;
    } catch (error) {
        console.error('Error formatting date:', date, error);
        return 'Invalid Date';
    }
}

function formatJoinedDate(date) {
    try {
        // Format: "December 2025"
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        
        return `${month} ${year}`;
    } catch (error) {
        console.error('Error formatting joined date:', date, error);
        return 'Recently';
    }
}


// Also update the search result date formatting:
function createPostResultItem(post) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    const postDate = parseCustomDate(post.datePost); // Use parser
    const formattedDate = formatDateToCustom(postDate); // Use the new format
    
    item.innerHTML = `
        <div class="post-icon">
            <i class="fas fa-file-alt"></i>
        </div>
        <div class="search-result-info">
            <h4>${post.name}</h4>
            <span>@${post.username} • ${formattedDate}</span>
            <div class="search-result-content">${post.content}</div>
            <div class="search-result-meta">
                <span><i class="fas fa-heart"></i> ${post.likes}</span>
            </div>
        </div>
    `;
    
    item.addEventListener('click', () => {
        scrollToPost(post.postId);
        addToSearchHistory(post.username, `Post by ${post.name}`, 'post');
        if (elements.searchInput) elements.searchInput.value = '';
        if (elements.searchResults) elements.searchResults.style.display = 'none';
        document.querySelector('.search-bar')?.classList.remove('active');
    });
    
    return item;
}

function showSearchResults() {
    if (elements.searchInput && elements.searchInput.value.trim().length > 0) {
        if (elements.searchResults) elements.searchResults.style.display = 'block';
    }
}

// Search history
function addToSearchHistory(identifier, name, type) {
    if (!currentUser) return;
    
    if (!currentUser.searchHistory) currentUser.searchHistory = [];
    
    const searchItem = { 
        identifier, 
        name, 
        type, 
        timestamp: new Date() 
    };
    
    // Remove if already exists
    currentUser.searchHistory = currentUser.searchHistory.filter(item => 
        !(item.identifier === identifier && item.type === type)
    );
    
    // Add to beginning
    currentUser.searchHistory.unshift(searchItem);
    
    // Keep only last 5 items
    currentUser.searchHistory = currentUser.searchHistory.slice(0, 5);
    
    saveCurrentUser();
    loadSearchHistory();
}

function loadSearchHistory() {
    if (!currentUser || !currentUser.searchHistory || !elements.searchHistory) return;
    
    elements.searchHistory.innerHTML = '';
    
    currentUser.searchHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        let icon = 'history';
        if (item.type === 'profile') icon = 'user';
        if (item.type === 'topic') icon = 'hashtag';
        if (item.type === 'post') icon = 'file-alt';
        
        historyItem.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-${icon}" style="color: var(--text-muted);"></i>
                <div style="flex: 1; min-width: 0;">
                    <div style="color: var(--text-primary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; text-transform: capitalize;">${item.type}</div>
                </div>
            </div>
        `;
        
        historyItem.addEventListener('click', () => {
            if (item.type === 'profile') {
                showUserProfile(item.identifier, item.name);
            } else if (item.type === 'topic') {
                filterPostsByTopic(item.identifier);
            } else if (item.type === 'post') {
                scrollToPost(item.identifier);
            }
        });
        
        elements.searchHistory.appendChild(historyItem);
    });
}

function showUserProfile(username, name) {
    // Get user's posts
    const userPosts = DATABASEPOSTS.filter(post => post.username === username);
    
    if (userPosts.length === 0) return;
    
    // Calculate stats
    const totalLikes = userPosts.reduce((sum, post) => sum + post.likes, 0);
    const postsCount = userPosts.length;
    
    // Get followers count (simulated)
    const followers = Math.floor(totalLikes / 10) + 100;
    
    // Get following count (simulated)
    const following = Math.floor(postsCount * 2) + 50;
    
    // Get first post date
    const firstPost = userPosts[userPosts.length - 1];
    const joinedDate = firstPost ? formatJoinedDate(parseCustomDate(firstPost.datePost)) : 'Recently'; // Use parser
    
    // Update profile header
    const profileHeader = document.getElementById('profileHeader');
    if (profileHeader) {
        profileHeader.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a8a&color=fff" alt="${name}">
                </div>
                <h2 id="profileName">${name}</h2>
                <div class="profile-username">@${username}</div>
                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-value">${postsCount}</span>
                        <span class="stat-label">Posts</span>
                    </div>

                    <div class="stat-item">
                        <span class="stat-value">${totalLikes.toLocaleString()}</span>
                        <span class="stat-label">Total Likes</span>
                    </div>
                </div>
                <div class="joined-date">Joined ${joinedDate}</div>
            </div>
        `;
    }
    
    // Update profile name in modal header
    const profileNameElement = document.getElementById('profileName');
    if (profileNameElement) profileNameElement.textContent = name;
    
    // Load user's posts
    const profilePosts = document.getElementById('profilePosts');
    if (profilePosts) {
        profilePosts.innerHTML = '';
        
        // Show user's posts (newest first)
        const userPostsReversed = [...userPosts].reverse();
        userPostsReversed.forEach((post) => {
            // Find the post in allPosts to get correct ID
            const foundPost = allPosts.find(p => 
                p.username === post.username && 
                p.datePost === post.datePost
            );
            
            if (foundPost) {
                const postElement = createPostElement(foundPost, foundPost.id);
                profilePosts.appendChild(postElement);
            }
        });
    }
    
    // Show modal
    if (elements.profileModal) {
        elements.profileModal.classList.add('active');
    }
}
// Trending topics
function loadTrendingTopics() {
    const topics = {};
    
    // Count posts by topic
    DATABASEPOSTS.forEach(post => {
        if (post.topic) {
            topics[post.topic] = (topics[post.topic] || 0) + 1;
        }
    });
    
    // Sort topics by count
    const sortedTopics = Object.entries(topics)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    if (elements.trendingList) {
        elements.trendingList.innerHTML = '';
        
        sortedTopics.forEach(([topic, count]) => {
            const topicItem = document.createElement('div');
            topicItem.className = 'trending-item';
            topicItem.innerHTML = `
                <div style="font-weight: 500; color: var(--text-primary);">#${topic}</div>
                <span>${count} posts</span>
            `;
            
            topicItem.addEventListener('click', () => {
                filterPostsByTopic(topic);
            });
            
            elements.trendingList.appendChild(topicItem);
        });
    }
}

function filterPostsByTopic(topic) {
    if (!elements.postsFeed) return;
    
    elements.postsFeed.innerHTML = '';
    currentPage = 0;
    displayedPosts.clear();
    
    // Filter and shuffle posts for this topic
    const filteredPosts = allPosts.filter(post => post.topic === topic);
    const shuffledPosts = shuffleArray([...filteredPosts], new Date().getTime());
    
    // Display filtered posts
    shuffledPosts.slice(0, postsPerPage).forEach(post => {
        const postElement = createPostElement(post, post.id);
        elements.postsFeed.appendChild(postElement);
        displayedPosts.add(post.id);
    });
    
    if (elements.loadMoreBtn) {
        elements.loadMoreBtn.style.display = 'none';
    }
}

// Suggested profiles
function loadSuggestedProfiles() {
    const uniqueUsers = new Map();
    
    DATABASEPOSTS.forEach(post => {
        if (!uniqueUsers.has(post.username)) {
            const userPosts = DATABASEPOSTS.filter(p => p.username === post.username);
            const totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);
            
            uniqueUsers.set(post.username, {
                name: post.name,
                username: post.username,
                postsCount: userPosts.length,
                totalLikes: totalLikes
            });
        }
    });
    
    // Convert to array and sort by total likes
    const suggestedProfiles = Array.from(uniqueUsers.values())
        .sort((a, b) => b.totalLikes - a.totalLikes)
        .slice(0, 5);
    
    if (elements.suggestedProfiles) {
        elements.suggestedProfiles.innerHTML = '';
        
        suggestedProfiles.forEach(user => {
            const profileItem = document.createElement('div');
            profileItem.className = 'profile-item';
            profileItem.innerHTML = `
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1e3a8a&color=fff" alt="${user.name}">
                <div class="profile-info">
                    <h4>${user.name}</h4>
                    <span>${user.postsCount} posts • ${user.totalLikes.toLocaleString()} likes</span>
                </div>
            `;
            
            profileItem.addEventListener('click', () => {
                showUserProfile(user.username, user.name);
            });
            
            elements.suggestedProfiles.appendChild(profileItem);
        });
    }
}

// Post creation functions
function showPostModal() {
    if (elements.postModal) {
        elements.postModal.classList.add('active');
    }
}

function handleMediaButtonClick(type) {
    currentMediaType = type;
    if (!elements.mediaPreview) return;
    
    elements.mediaPreview.innerHTML = '';
    elements.mediaPreview.classList.add('active');
    
    if (type === 'image') {
        if (elements.imageUpload) {
            elements.imageUpload.click();
            elements.imageUpload.onchange = handleImageUpload;
        }
    } else if (type === 'video') {
        if (elements.videoUpload) {
            elements.videoUpload.click();
            elements.videoUpload.onchange = handleVideoUpload;
        }
    } else if (type === 'iframe') {
        elements.mediaPreview.innerHTML = `
            <input type="text" id="linkInputInline" placeholder="Paste YouTube/Facebook link" 
                   style="width: 100%; padding: 0.5rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 0.5rem; color: var(--text-primary);">
            <button id="processLinkBtn" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: var(--accent); color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                Add Link
            </button>
        `;
        
        const processBtn = document.getElementById('processLinkBtn');
        if (processBtn) {
            processBtn.addEventListener('click', processLink);
        }
    }
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file && elements.mediaPreview) {
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.mediaPreview.innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="max-width: 100%; border-radius: 0.5rem;">
                <div style="margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">
                    Image ready to post
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
}

function handleVideoUpload(e) {
    const file = e.target.files[0];
    if (file && elements.mediaPreview) {
        elements.mediaPreview.innerHTML = `
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                Video file selected: ${file.name}
            </div>
        `;
    }
}

function processLink() {
    const linkInput = document.getElementById('linkInputInline');
    if (!linkInput || !elements.mediaPreview) return;
    
    const link = linkInput.value.trim();
    
    if (!link) return;
    
    // Convert YouTube shorts links to embed links
    let embedLink = link;
    
    // Handle YouTube shorts
    if (link.includes('youtube.com/shorts/')) {
        const videoId = link.match(/shorts\/([^?]+)/)[1];
        embedLink = `https://www.youtube.com/embed/${videoId}`;
    }
    // Handle youtu.be links
    else if (link.includes('youtu.be/')) {
        const videoId = link.match(/youtu\.be\/([^?]+)/)[1];
        embedLink = `https://www.youtube.com/embed/${videoId}`;
    }
    // Handle regular YouTube links
    else if (link.includes('youtube.com/watch')) {
        const videoId = new URL(link).searchParams.get('v');
        if (videoId) {
            embedLink = `https://www.youtube.com/embed/${videoId}`;
        }
    }
    
    elements.mediaPreview.innerHTML = `
        <div style="color: var(--text-secondary); font-size: 0.9rem;">
            Link processed: ${embedLink.includes('youtube.com/embed') ? 'YouTube' : 'External'} link
        </div>
    `;
}

function createPost() {
    if (!elements.postContent) return;
    
    const content = elements.postContent.value.trim();
    const topic = elements.postTopic ? elements.postTopic.value.trim() : '';
    
    // Check if there's at least one content type
    const hasMedia = elements.mediaPreview && 
                     elements.mediaPreview.classList.contains('active') && 
                     elements.mediaPreview.innerHTML.trim() !== '';
    
    if (!content && !hasMedia) {
        alert('Please add some content to your post!');
        return;
    }
    
    // In a real app, this would send to a server
    alert('Post functionality requires backend integration. In a real app, this would save to database.');
    
    // Reset form
    if (elements.postContent) elements.postContent.value = '';
    if (elements.postTopic) elements.postTopic.value = '';
    if (elements.mediaPreview) {
        elements.mediaPreview.classList.remove('active');
        elements.mediaPreview.innerHTML = '';
    }
    currentMediaType = null;
}

function addMediaToPost(type) {
    if (!elements.mediaPreviewModal) return;
    
    elements.mediaPreviewModal.innerHTML = '';
    
    if (type === 'image') {
        elements.mediaPreviewModal.innerHTML = `
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                Image upload would be implemented here
            </div>
        `;
    } else if (type === 'video') {
        elements.mediaPreviewModal.innerHTML = `
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                Video upload would be implemented here
            </div>
        `;
    } else if (type === 'iframe') {
        elements.mediaPreviewModal.innerHTML = `
            <input type="text" id="linkInputModal" placeholder="Paste YouTube/Facebook link" 
                   style="width: 100%; padding: 0.5rem; margin-bottom: 0.5rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 0.5rem; color: var(--text-primary);">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                Supports: youtube.com, youtu.be, youtube.com/shorts
            </div>
        `;
    }
}

function createNewPost() {
    if (!elements.postContentModal) return;
    
    const content = elements.postContentModal.value.trim();
    const topic = elements.postTopicModal ? elements.postTopicModal.value.trim() : '';
    
    if (!content) {
        alert('Please add some content to your post!');
        return;
    }
    
    // In a real app, this would be sent to a server
    alert(`Post created successfully!\n\nNote: In a real app, this would be saved to the database.`);
    
    // Reset form and close modal
    resetPostForm();
    if (elements.postModal) {
        elements.postModal.classList.remove('active');
    }
}

function resetPostForm() {
    if (elements.postContentModal) elements.postContentModal.value = '';
    if (elements.postTopicModal) elements.postTopicModal.value = '';
    if (elements.mediaPreviewModal) elements.mediaPreviewModal.innerHTML = '';
}
// Add sound functions at the top of your main.js (after global variables)
function playLikeSound() {
    try {
        // Create a simple beep sound for like
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 523.25; // C5 note (pleasant sound)
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Audio context not supported, using fallback sound');
        // Fallback: Use HTML5 audio if available
        playFallbackSound('like');
    }
}

function playUnlikeSound() {
    try {
        // Create a different sound for unlike
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 392.00; // G4 note (lower, softer sound)
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.log('Audio context not supported, using fallback sound');
        // Fallback: Use HTML5 audio if available
        playFallbackSound('unlike');
    }
}

function playFallbackSound(type) {
    try {
        // Create simple beep using Web Audio API fallback
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        
        oscillator.connect(audioContext.destination);
        oscillator.frequency.value = type === 'like' ? 600 : 400;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        // Last resort: Use a div click sound simulation
        console.log('Playing simulated sound');
    }
}
// Update the handleLike function
function handleLike(postId, button) {
    if (!currentUser || currentUser.isGuest) {
        alert('Please login to like posts!');
        return;
    }
    
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;
    
    if (!currentUser.likedPosts) currentUser.likedPosts = new Set();
    
    // Get the post element first to get current displayed likes
    const postElement = button.closest('.post-card');
    const likesSpan = postElement.querySelector('.post-stats span:first-child');
    
    // Parse current likes from the DOM (this is the actual displayed value)
    let currentLikes = post.likes;
    if (likesSpan) {
        const likesText = likesSpan.textContent;
        currentLikes = parseInt(likesText.replace(/[^0-9]/g, ''));
    }
    
    if (currentUser.likedPosts.has(postId)) {
        // Unlike
        currentUser.likedPosts.delete(postId);
        currentLikes--;
        button.classList.remove('liked');
        button.innerHTML = '<i class="fas fa-heart"></i> Like';
        
        // Play unlike sound
        playUnlikeSound();
        
    } else {
        // Like
        currentUser.likedPosts.add(postId);
        currentLikes++;
        button.classList.add('liked');
        button.innerHTML = '<i class="fas fa-heart"></i> Liked';
        
        // Play like sound
        playLikeSound();
        
        // Add a subtle animation
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);
    }
    
    // Update the post object
    post.likes = currentLikes;
    
    // Update likes count in post stats
    if (likesSpan) {
        likesSpan.textContent = `${currentLikes.toLocaleString()} likes`;
        
        // Add animation to likes count
        likesSpan.style.color = 'var(--accent)';
        setTimeout(() => {
            likesSpan.style.color = '';
        }, 300);
    }
    
    // Save user data if logged in
    saveCurrentUser();
}
// Scroll to post
function scrollToPost(postId) {
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    if (postElement) {
        // Highlight the post temporarily
        postElement.style.boxShadow = '0 0 0 3px var(--accent)';
        postElement.style.transition = 'box-shadow 0.3s';
        setTimeout(() => {
            postElement.style.boxShadow = '';
        }, 2000);
        
        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Mobile menu functions
function openMobileMenu() {
    if (elements.mobileMenu) {
        elements.mobileMenu.classList.add('active');
    }
}

function closeMobileMenu() {
    if (elements.mobileMenu) {
        elements.mobileMenu.classList.remove('active');
    }
}

function toggleUserMenu() {
    if (elements.userMenu) {
        elements.userMenu.classList.toggle('active');
    }
}

// Theme handling
function setupTheme() {
    const savedTheme = localStorage.getItem('meko-theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        if (elements.themeIcon) {
            elements.themeIcon.className = 'fas fa-sun';
        }
    }
}
// main.js - Add this function
function showOwnProfile() {
    if (!currentUser || currentUser.isGuest) {
        alert('Please login to view your profile!');
        return;
    }
    
    // Get logged-in user's posts from DATABASEPOSTS
    const userPosts = DATABASEPOSTS.filter(post => post.username === currentUser.username);
    
    if (userPosts.length === 0) {
        // User has no posts yet, but still show profile
        showUserProfile(currentUser.username, currentUser.name);
        return;
    }
    
    // Show the user's profile
    showUserProfile(currentUser.username, currentUser.name);
}

// Update showUserProfile to show mentions section
function showUserProfile(username, name) {
    const userPosts = DATABASEPOSTS.filter(post => post.username === username);
    const totalLikes = userPosts.reduce((sum, post) => sum + post.likes, 0);
    const postsCount = userPosts.length;
    
    // Get mentions for this user
    const userMentions = getMentionsForUser(username);
    const firstPost = userPosts[userPosts.length - 1];
    const joinedDate = firstPost ? formatJoinedDate(parseCustomDate(firstPost.datePost)) : 'Recently';
    
    const profileHeader = document.getElementById('profileHeader');
    if (profileHeader) {
        profileHeader.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a8a&color=fff" alt="${name}">
                </div>
                <h2 id="profileName">${name}</h2>
                <div class="profile-username">@${username}</div>
                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-value">${postsCount}</span>
                        <span class="stat-label">Posts</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${totalLikes.toLocaleString()}</span>
                        <span class="stat-label">Total Likes</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${userMentions.length}</span>
                        <span class="stat-label">Mentions</span>
                    </div>
                </div>
                <div class="joined-date">Joined ${joinedDate}</div>
            </div>
        `;
    }
    
    const profileNameElement = document.getElementById('profileName');
    if (profileNameElement) profileNameElement.textContent = name;
    
    const profilePosts = document.getElementById('profilePosts');
    if (profilePosts) {
        profilePosts.innerHTML = '';
        
        // Create tabs for posts and mentions
        profilePosts.innerHTML = `
            <div class="profile-tabs">
                <button class="profile-tab active" data-tab="posts">Posts (${postsCount})</button>
                <button class="profile-tab" data-tab="mentions">Mentions (${userMentions.length})</button>
            </div>
            <div class="profile-content">
                <div class="tab-content active" id="postsTab">
                    <!-- Posts will be loaded here -->
                </div>
                <div class="tab-content" id="mentionsTab">
                    <!-- Mentions will be loaded here -->
                </div>
            </div>
        `;
        
        // Load posts
        const postsTab = document.getElementById('postsTab');
        if (userPosts.length > 0) {
            const userPostsReversed = [...userPosts].reverse();
            userPostsReversed.forEach((post) => {
                const foundPost = allPosts.find(p => 
                    p.username === post.username && 
                    p.datePost === post.datePost
                );
                
                if (foundPost) {
                    const postElement = createPostElement(foundPost, foundPost.id);
                    postsTab.appendChild(postElement);
                }
            });
        } else {
            postsTab.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <h3>No posts yet</h3>
                    <p>This user hasn't posted anything yet.</p>
                </div>
            `;
        }
        
        // Load mentions
        const mentionsTab = document.getElementById('mentionsTab');
        if (userMentions.length > 0) {
            userMentions.forEach(mention => {
                const foundPost = allPosts.find(p => p.id === mention.postId);
                if (foundPost) {
                    const postElement = createPostElement(foundPost, mention.postId);
                    mentionsTab.appendChild(postElement);
                }
            });
        } else {
            mentionsTab.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-at"></i>
                    <h3>No mentions yet</h3>
                    <p>This user hasn't been mentioned yet.</p>
                </div>
            `;
        }
        
        // Add tab switching
        document.querySelectorAll('.profile-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Update active tab
                document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show corresponding content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${tabName}Tab`).classList.add('active');
            });
        });
    }
    
    if (elements.profileModal) {
        elements.profileModal.classList.add('active');
    }
}
function toggleTheme() {
    if (document.body.classList.contains('dark-mode')) {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        if (elements.themeIcon) {
            elements.themeIcon.className = 'fas fa-sun';
        }
        localStorage.setItem('meko-theme', 'light');
    } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        if (elements.themeIcon) {
            elements.themeIcon.className = 'fas fa-moon';
        }
        localStorage.setItem('meko-theme', 'dark');
    }
}

// Initialize the app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM is already loaded
    init();
}
