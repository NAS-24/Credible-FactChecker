const API_BASE_URL = 'https://credible-factchecker.onrender.com';

let currentText = '';
let currentUrl = '';

document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
});

function initializeEventListeners() {
  // Close sidebar - FIXED: Proper event listener
  document.getElementById('closeSidebar').addEventListener('click', closeSidebar);
  
  // Tab switching
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', (e) => {
      switchTab(e.target.dataset.tab);
    });
  });
  
  // Text verification
  document.getElementById('verifyManualText').addEventListener('click', verifyManualText);
  document.getElementById('manualTextInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      verifyManualText();
    }
  });
  document.getElementById('textRetryButton').addEventListener('click', () => {
    if (currentText) {
      verifyText(currentText);
    }
  });
  
  // Page analysis
  document.getElementById('analyzePage').addEventListener('click', analyzeCurrentPage);
  document.getElementById('pageRetryButton').addEventListener('click', analyzeCurrentPage);
}

// FIXED: Proper close sidebar function
function closeSidebar() {
  console.log('Closing sidebar...');
  // Send message to parent to close the sidebar
  if (window.parent && typeof window.parent.postMessage === 'function') {
    window.parent.postMessage({ type: 'CLOSE_SIDEBAR' }, '*');
  } else {
    console.error('Cannot communicate with parent window');
  }
}

function switchTab(tabId) {
  // Update tab buttons
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(tabId).classList.add('active');
}

// Text Verification Functions
function verifyManualText() {
  const textInput = document.getElementById('manualTextInput');
  const text = textInput.value.trim();
  
  if (!text) {
    alert('Please enter some text to verify.');
    return;
  }
  
  verifyText(text);
}

async function verifyText(text) {
  currentText = text;
  
  showTextLoading();
  hideTextResults();
  hideTextError();
  
  try {
    console.log('🔍 Starting verification for text:', text.substring(0, 100) + '...');
    
    const data = await makeAPICall('/api/check-agentic-claim', { claim: text });
    
    console.log('✅ Verification successful:', data);
    displayTextResults(data, text);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    showTextError(error.message);
  }
}

function displayTextResults(data, originalText) {
  hideTextLoading();
  
  document.getElementById('textClaim').textContent = 
    originalText.length > 150 ? originalText.substring(0, 150) + '...' : originalText;
  
  const verdict = data.claim_verdict || data.verdict || data.credibility || 'unverified';
  const statusElement = document.getElementById('textStatus');
  statusElement.textContent = verdict;
  statusElement.className = `status ${verdict.toLowerCase()}`;
  
  document.getElementById('textExplanation').textContent = 
    data.explanation || data.reasoning || 'No explanation provided.';
  
  // Display raw citations from API
  displayRawCitations(data);
  
  const tierElement = document.getElementById('textTier');
  const tierInfo = document.getElementById('textTierInfo');
  
  if (data.tier_used) {
    tierElement.textContent = data.tier_used;
    tierInfo.classList.remove('hidden');
  } else {
    tierInfo.classList.add('hidden');
  }
  
  showTextResults();
}

// Display raw API output for citations
function displayRawCitations(data) {
  const citationsContainer = document.getElementById('textCitations');
  const citationSection = document.getElementById('citationSection');
  
  // Extract citation data from response
  const citationData = {
    citation: data.citation || null,
    sources: data.sources || null,
    references: data.references || null
  };
  
  // Remove empty fields
  Object.keys(citationData).forEach(key => {
    if (!citationData[key]) {
      delete citationData[key];
    }
  });
  
  if (Object.keys(citationData).length === 0) {
    citationsContainer.textContent = 'No citation data available in API response';
    return;
  }
  
  // Show raw JSON output
  citationsContainer.textContent = JSON.stringify(citationData, null, 2);
}

// Full Page Analysis Functions
async function analyzeCurrentPage() {
  showPageLoading();
  hidePageResults();
  hidePageError();
  
  try {
    // Get current page content and URL
    const pageData = await getCurrentPageContent();
    currentUrl = pageData.url;
    
    console.log('🌐 Starting page analysis for:', currentUrl);
    
    // Try multiple approaches
    let data;
    
    // First try: Send URL directly
    try {
      data = await makeAPICall('/api/verify-article-full', { url: currentUrl });
    } catch (urlError) {
      console.log('URL method failed, trying with content...', urlError);
      
      // Second try: Send extracted content
      data = await makeAPICall('/api/verify-article-full', { 
        url: currentUrl,
        content: pageData.content
      });
    }
    
    console.log('✅ Page analysis successful:', data);
    displayPageResults(data);
    
  } catch (error) {
    console.error('❌ Page analysis failed:', error);
    
    let errorMessage = error.message;
    if (error.message.includes('424') || error.message.includes('anti-bot')) {
      errorMessage = 'This website has anti-bot protection. The extension cannot access its content directly. Try using the text verification feature instead.';
    } else if (error.message.includes('Failed to retrieve article content')) {
      errorMessage = 'Unable to access the webpage content due to restrictions. Try using the text verification feature with selected text.';
    }
    
    showPageError(errorMessage);
  }
}

async function getCurrentPageContent() {
  return new Promise((resolve) => {
    window.parent.postMessage({ type: 'GET_PAGE_CONTENT' }, '*');
    
    const handleMessage = (event) => {
      if (event.data.type === 'PAGE_CONTENT') {
        window.removeEventListener('message', handleMessage);
        resolve(event.data);
      }
    };
    window.addEventListener('message', handleMessage);
    
    setTimeout(() => {
      try {
        if (window.parent && window.parent.location.href) {
          resolve({
            url: window.parent.location.href,
            content: 'Content extraction not available on this page.',
            title: window.parent.document.title
          });
        }
      } catch (e) {
        resolve({
          url: 'unknown-url',
          content: 'Unable to extract content from this page.',
          title: 'Unknown Page'
        });
      }
    }, 1000);
  });
}

function displayPageResults(data) {
  hidePageLoading();
  
  document.getElementById('pageClaimsCount').textContent = 
    data.total_claims_analyzed || '0';
  
  const verdict = data.composite_verdict || data.overall_verdict || 'unverified';
  const verdictElement = document.getElementById('pageVerdict');
  verdictElement.textContent = verdict;
  verdictElement.className = `status large ${mapVerdictToStatus(verdict)}`;
  
  displayClaimsBreakdown(data.claims_breakdown);
  
  document.getElementById('pageAnalysis').textContent = 
    generatePageAnalysisSummary(data);
  
  displayIndividualClaims(data.individual_results);
  
  showPageResults();
}

function displayClaimsBreakdown(breakdown) {
  const breakdownContainer = document.getElementById('claimsBreakdown');
  breakdownContainer.innerHTML = '';
  
  if (!breakdown || Object.keys(breakdown).length === 0) {
    breakdownContainer.innerHTML = '<div class="breakdown-item">No breakdown available</div>';
    return;
  }
  
  for (const [category, count] of Object.entries(breakdown)) {
    const item = document.createElement('div');
    item.className = 'breakdown-item';
    item.innerHTML = `<span class="count">${count}</span>${formatCategoryName(category)}`;
    breakdownContainer.appendChild(item);
  }
}

function formatCategoryName(category) {
  return category
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

function generatePageAnalysisSummary(data) {
  const totalClaims = data.total_claims_analyzed || 0;
  const verdict = data.composite_verdict || data.overall_verdict || 'unverified';
  
  if (totalClaims === 0) {
    return "No specific claims were identified on this page for analysis.";
  }
  
  let summary = `This page contains ${totalClaims} claim${totalClaims !== 1 ? 's' : ''} that were analyzed. `;
  
  switch (verdict.toLowerCase()) {
    case 'verified':
    case 'true':
    case 'high':
      summary += "The overall content appears to be credible and well-supported.";
      break;
    case 'unverified':
    case 'false':
    case 'low':
      summary += "The content contains unverified or potentially misleading information.";
      break;
    case 'mixed':
    case 'medium':
      summary += "The content contains a mix of verified and unverified claims.";
      break;
    default:
      summary += "The credibility assessment is inconclusive based on the available analysis.";
  }
  
  if (data.explanation) {
    summary += ` ${data.explanation}`;
  }
  
  return summary;
}

function displayIndividualClaims(individualResults) {
  const claimsContainer = document.getElementById('individualClaims');
  claimsContainer.innerHTML = '';
  
  if (!individualResults || !Array.isArray(individualResults) || individualResults.length === 0) {
    claimsContainer.innerHTML = '<div class="claim-item">No individual claim details available</div>';
    return;
  }
  
  const displayResults = individualResults.slice(0, 5);
  
  displayResults.forEach((result, index) => {
    const claimItem = document.createElement('div');
    claimItem.className = 'claim-item';
    
    const claimText = result.claim || result.text || `Claim ${index + 1}`;
    const claimVerdict = result.claim_verdict || result.verdict || 'unverified';
    const explanation = result.explanation || '';
    
    claimItem.innerHTML = `
      <div class="claim-text">${claimText.substring(0, 100)}${claimText.length > 100 ? '...' : ''}</div>
      <div class="claim-verdict status ${mapVerdictToStatus(claimVerdict)}">${claimVerdict}</div>
      ${explanation ? `<div class="claim-explanation">${explanation.substring(0, 80)}${explanation.length > 80 ? '...' : ''}</div>` : ''}
    `;
    
    claimsContainer.appendChild(claimItem);
  });
  
  if (individualResults.length > 5) {
    const moreItem = document.createElement('div');
    moreItem.className = 'claim-item';
    moreItem.innerHTML = `<div class="claim-text" style="text-align: center; color: #6b7280; font-style: italic;">... and ${individualResults.length - 5} more claims</div>`;
    claimsContainer.appendChild(moreItem);
  }
}

function mapVerdictToStatus(verdict) {
  if (!verdict) return 'pending';
  
  const verdictLower = verdict.toLowerCase();
  
  if (verdictLower.includes('true') || verdictLower.includes('verified') || verdictLower.includes('high')) {
    return 'verified';
  } else if (verdictLower.includes('false') || verdictLower.includes('unverified') || verdictLower.includes('low')) {
    return 'unverified';
  } else if (verdictLower.includes('mixed') || verdictLower.includes('medium')) {
    return 'mixed';
  } else {
    return 'pending';
  }
}

// API Call function
async function makeAPICall(endpoint, data) {
  console.log(`📤 Making API call to: ${endpoint}`, data);
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  console.log(`📡 Response status: ${response.status}`);
  
  if (!response.ok) {
    let errorMessage = `API error: ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage += ` - ${JSON.stringify(errorData)}`;
    } catch (e) {
      const errorText = await response.text();
      errorMessage += ` - ${errorText}`;
    }
    
    throw new Error(errorMessage);
  }

  const responseData = await response.json();
  console.log('📄 Response data:', responseData);
  return responseData;
}

// UI Functions
function showTextLoading() {
  document.getElementById('textLoading').classList.remove('hidden');
  document.getElementById('verifyManualText').disabled = true;
}

function hideTextLoading() {
  document.getElementById('textLoading').classList.add('hidden');
  document.getElementById('verifyManualText').disabled = false;
}

function showTextResults() {
  document.getElementById('textResults').classList.remove('hidden');
}

function hideTextResults() {
  document.getElementById('textResults').classList.add('hidden');
}

function showTextError(message) {
  const errorElement = document.getElementById('textErrorMessage');
  errorElement.querySelector('p').textContent = message || 'An error occurred while verifying the text. Please try again.';
  errorElement.classList.remove('hidden');
  hideTextLoading();
}

function hideTextError() {
  document.getElementById('textErrorMessage').classList.add('hidden');
}

function showPageLoading() {
  document.getElementById('pageLoading').classList.remove('hidden');
  document.getElementById('analyzePage').disabled = true;
}

function hidePageLoading() {
  document.getElementById('pageLoading').classList.add('hidden');
  document.getElementById('analyzePage').disabled = false;
}

function showPageResults() {
  document.getElementById('pageResults').classList.remove('hidden');
}

function hidePageResults() {
  document.getElementById('pageResults').classList.add('hidden');
}

function showPageError(message) {
  const errorElement = document.getElementById('pageErrorMessage');
  errorElement.querySelector('p').textContent = message || 'An error occurred while analyzing the page. Please try again.';
  errorElement.classList.remove('hidden');
  hidePageLoading();
}

function hidePageError() {
  document.getElementById('pageErrorMessage').classList.add('hidden');
}

// Message listener
window.addEventListener('message', async (event) => {
  if (event.source !== window.parent) return;

  console.log('📨 Received message:', event.data);

  if (event.data.type === 'VERIFY_TEXT') {
    const selectedText = event.data.text;
    document.getElementById('manualTextInput').value = selectedText;
    verifyText(selectedText);
    switchTab('textVerificationTab');
  }
  
  if (event.data.type === 'ANALYZE_PAGE') {
    switchTab('pageAnalysisTab');
    analyzeCurrentPage();
  }
});