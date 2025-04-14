// Spotify Configuration
const SPOTIFY_CONFIG = {
  CLIENT_ID: '42eb51d7405d4868be4d5c84f2cf7a11',
  REDIRECT_URI: window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://lucent-crepe-6000e1.netlify.app/",
  SCOPES: 'playlist-read-private',
  API_BASE: 'https://api.spotify.com/v1'
};

// DOM Elements
const elements = {
  loginBtn: document.getElementById('login-btn'),
  logoutBtn: document.getElementById('logout-btn'),
  playlistsContainer: document.getElementById('playlists-and-counts'),
  songsList: document.getElementById('songs-list'),
  playlistName: document.getElementById('current-playlist-name'),
  loading: document.getElementById('loading'),
  errorMessage: document.getElementById('error-message'),
  columnsContainer: document.querySelector('.columns-container'),
  appContainer: document.querySelector('.app-container')
};

// Token Management
const TokenManager = {
  ACCESS_TOKEN_KEY: 'spotify_access_token',
  REFRESH_TOKEN_KEY: 'spotify_refresh_token',
  EXPIRATION_KEY: 'spotify_token_expiration',

  getAccessToken() {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  },

  getRefreshToken() {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  },

  storeTokens({ access_token, refresh_token, expires_in }) {
    if (access_token) {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, access_token);
      const expiration = Date.now() + (expires_in * 1000);
      localStorage.setItem(this.EXPIRATION_KEY, expiration);
    }
    if (refresh_token) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refresh_token);
    }
  },

  clearTokens() {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.EXPIRATION_KEY);
  },

  isTokenExpired() {
    const expiration = localStorage.getItem(this.EXPIRATION_KEY);
    return expiration && Date.now() > parseInt(expiration);
  }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');

  if (error) {
    showError(`Spotify authentication failed: ${error}`);
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (code) {
    handleTokenExchange(code);
  } else {
    checkAuthStatus();
  }

  elements.loginBtn.addEventListener('click', handleLogin);
  elements.logoutBtn.addEventListener('click', handleLogout);
});

// Authentication Functions
function handleLogin() {
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('client_id', SPOTIFY_CONFIG.CLIENT_ID);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', SPOTIFY_CONFIG.REDIRECT_URI);
  authUrl.searchParams.append('scope', SPOTIFY_CONFIG.SCOPES);
  authUrl.searchParams.append('show_dialog', 'true');

  window.location.href = authUrl.toString();
}

//Logout funtionality
function handleLogout() {
  TokenManager.clearTokens();
  window.location.href = window.location.pathname;
}

async function handleTokenExchange(code) {
  showLoading(true);
  try {
    const response = await fetch('/.netlify/functions/spotify-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Token exchange failed');
    }

    const data = await response.json();
    TokenManager.storeTokens(data);
    window.history.replaceState({}, document.title, window.location.pathname);
    checkAuthStatus();
  } catch (error) {
    showError(`Login failed: ${error.message}`);
    TokenManager.clearTokens();
  } finally {
    showLoading(false);
  }
}

function checkAuthStatus() {
  if (TokenManager.getAccessToken()) {
    if (TokenManager.isTokenExpired() && TokenManager.getRefreshToken()) {
      refreshAccessToken();
    } else {
      updateUIForLoggedInState();
      elements.loginBtn.textContent = 'Refresh Playlists';
      fetchPlaylists();
    }
  } else {
    updateUIForLoggedOutState();
  }
}

async function refreshAccessToken() {
  try {
    const response = await fetch('/.netlify/functions/spotify-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token: TokenManager.getRefreshToken(),
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) throw new Error('Token refresh failed');

    const data = await response.json();
    TokenManager.storeTokens(data);
    updateUIForLoggedInState();
    fetchPlaylists();
  } catch (error) {
    showError('Session expired. Please login again.');
    TokenManager.clearTokens();
    updateUIForLoggedOutState();
    elements.loginBtn.textContent = 'Login with Spotify';
  }
}

// API Functions
async function fetchWithTokenRefresh(url, options = {}) {
  try {
    if (TokenManager.isTokenExpired() && TokenManager.getRefreshToken()) {
      await refreshAccessToken();
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TokenManager.getAccessToken()}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Playlist Functions
async function fetchPlaylists() {
  showLoading(true);
  try {
    let allPlaylists = [];
    let url = `${SPOTIFY_CONFIG.API_BASE}/me/playlists?limit=50`;

    while (url) {
      const response = await fetchWithTokenRefresh(url);
      const data = await response.json();
      allPlaylists = [...allPlaylists, ...data.items];
      url = data.next;
    }

    displayPlaylists(allPlaylists);
    elements.columnsContainer.style.display = 'flex';
  } catch (error) {
    showError(`Failed to load playlists: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

function displayPlaylists(playlists) {
  elements.playlistsContainer.innerHTML = '';

  if (playlists.length === 0) {
    elements.playlistsContainer.innerHTML = '<div class="empty">No playlists found</div>';
    return;
  }

  playlists.forEach((playlist, index) => {
    const row = document.createElement('div');
    row.className = 'playlist-row';
    row.tabIndex = 0;
    row.innerHTML = `
      <div class="playlist-name">
        <span class="playlist-number">${index + 1}.</span>
        ${playlist.name}
      </div>
      <div class="track-count">${playlist.tracks.total}</div>
    `;
    row.addEventListener('click', () => loadPlaylistTracks(playlist));
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        loadPlaylistTracks(playlist);
      }
    });
    elements.playlistsContainer.appendChild(row);
  });
}

async function loadPlaylistTracks(playlist) {
  showLoading(true);
  try {
    // Update the playlist name header
    elements.playlistName.innerHTML = `<i class="fas fa-play-circle" aria-hidden="true"></i> ${playlist.name}`;

    // Fetch tracks with offset handling for large playlists
    let allTracks = [];
    let url = `${SPOTIFY_CONFIG.API_BASE}/playlists/${playlist.id}/tracks?limit=50`;

    while (url) {
      const response = await fetchWithTokenRefresh(url);
      if (!response.ok) throw new Error('Failed to load tracks');
      const data = await response.json();
      allTracks = [...allTracks, ...data.items];
      url = data.next;
    }
    displayTracks(allTracks);
  } catch (error) {
    showError('Failed to load tracks. Please try again!')
    elements.songsList.innerHTML = '<div class="error">Failed to load tracks.</div>';
    console.error('Track load error:', error);
  } finally {
    showLoading(false);
  }
}

function displayTracks(tracks) {
  elements.songsList.innerHTML = '';

  if (allTracks.length > 0) {
    elements.songsList.innerHTML = '';
    allTracks.forEach((item, index) => {
      if (item.track) {
        const trackElement = document.createElement('div');
        trackElement.className = 'track-item';
        trackElement.innerHTML = `
          <span class="track-number">${index + 1}.</span>
          <span class="track-name">${item.track.name}</span>
          <span class="track-artist">${item.track.artists.map(a => a.name).join(', ')}</span>
          <span class="track-duration">${formatDuration(item.track.duration_ms)}</span>
        `;
        elements.songsList.appendChild(trackElement);
      }
    });
  } else {
    elements.songsList.innerHTML = '<div class="empty-message">No tracks found in this playlist</div>';
  }
//  } catch (error) {
//   console.error('Error loading tracks:', error);
//   elements.songsList.innerHTML = '<div class="error">Failed to load tracks. Please try again.</div>';
//   showError(error.message);
// } finally {
//   showLoading(false); }
 }



// Utility Functions
function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function showLoading(show) {
  if (show) {
    elements.loading.style.display = 'flex';
    elements.columnsContainer.style.display = 'none';
  } else {
    elements.loading.style.display = 'none';
    if (TokenManager.getAccessToken()) {
      elements.columnsContainer.style.display = 'flex';
    }
  }
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.style.display = 'block';
  setTimeout(() => {
    elements.errorMessage.style.display = 'none';
  }, 5000);
}

//  UI status update functions
function updateUIForLoggedInState() {
  elements.loginBtn.textContent = 'Refresh Playlists';
  elements.loginBtn.classList.remove('centered');
  elements.logoutBtn.style.display = 'flex';
  elements.playlistName.textContent = 'Select a Playlist';
  elements.appContainer.classList.remove('logged-out');
}


function updateUIForLoggedOutState() {
  elements.loginBtn.textContent = 'Login with Spotify';
  elements.loginBtn.classList.add('centered');
  elements.logoutBtn.style.display = 'none';
  elements.columnsContainer.style.display = 'none';
  elements.playlistsContainer.innerHTML = '';
  elements.songsList.innerHTML = '';
  elements.playlistName.textContent = 'Select a Playlist';
  elements.loading.style.display = 'none';
  elements.appContainer.classList.add('logged-out');
}