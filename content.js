let sidebarVisible = false;

// Listen for messages from background script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  switch (request.action) {
    case "verifySelectedText":
      showSidebar();
      verifyText(request.selectedText);
      sendResponse({ success: true });
      break;
    case "toggleSidebar":
      toggleSidebar();
      sendResponse({ success: true });
      break;
    case "analyzePage":
      showSidebar();
      analyzePage();
      sendResponse({ success: true });
      break;
    case "ping":
      sendResponse({ success: true, loaded: true });
      break;
  }
  
  return true;
});

// Toggle sidebar visibility
function toggleSidebar() {
  if (sidebarVisible) {
    hideSidebar();
  } else {
    showSidebar();
  }
}

// Show sidebar
function showSidebar() {
  if (sidebarVisible) return;

  hideSidebar();

  const sidebar = document.createElement('div');
  sidebar.id = 'credible-sidebar';
  sidebar.innerHTML = `
    <iframe src="${chrome.runtime.getURL('sidebar.html')}" style="width: 100%; height: 100%; border: none;"></iframe>
  `;
  
  document.body.appendChild(sidebar);
  sidebarVisible = true;
  document.body.style.marginRight = '400px';
  
  // Listen for messages from sidebar
  window.addEventListener('message', handleSidebarMessage);
}

// Hide sidebar
function hideSidebar() {
  const sidebar = document.getElementById('credible-sidebar');
  if (sidebar) {
    sidebar.remove();
  }
  sidebarVisible = false;
  document.body.style.marginRight = '0';
  window.removeEventListener('message', handleSidebarMessage);
}

// Handle messages from sidebar
function handleSidebarMessage(event) {
  if (event.data.type === 'GET_PAGE_CONTENT') {
    const pageContent = extractPageContent();
    const sidebar = document.getElementById('credible-sidebar');
    if (sidebar) {
      const iframe = sidebar.querySelector('iframe');
      iframe.contentWindow.postMessage({
        type: 'PAGE_CONTENT',
        ...pageContent
      }, '*');
    }
  }
}

// Extract page content for analysis
function extractPageContent() {
  try {
    // Get main content from the page
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '.article',
      '.post',
      '.story',
      '#content',
      '#main'
    ];
    
    let mainContent = '';
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        mainContent = element.innerText || element.textContent;
        if (mainContent.length > 500) break;
      }
    }
    
    // Fallback to body if no main content found
    if (!mainContent || mainContent.length < 500) {
      mainContent = document.body.innerText || document.body.textContent || '';
    }
    
    // Clean and limit content
    const cleanContent = mainContent
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:()-]/g, '')
      .substring(0, 10000) // Limit content size
      .trim();
    
    return {
      url: window.location.href,
      content: cleanContent,
      title: document.title,
      description: getMetaDescription()
    };
    
  } catch (error) {
    console.error('Error extracting page content:', error);
    return {
      url: window.location.href,
      content: 'Unable to extract content from this page.',
      title: document.title,
      description: 'Content extraction failed'
    };
  }
}

function getMetaDescription() {
  const metaDescription = document.querySelector('meta[name="description"]');
  return metaDescription ? metaDescription.getAttribute('content') : '';
}

// Verify selected text
async function verifyText(text) {
  try {
    const sidebar = document.getElementById('credible-sidebar');
    if (sidebar) {
      const iframe = sidebar.querySelector('iframe');
      
      iframe.onload = () => {
        iframe.contentWindow.postMessage({
          type: 'VERIFY_TEXT',
          text: text
        }, '*');
      };
      
      if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
        iframe.contentWindow.postMessage({
          type: 'VERIFY_TEXT',
          text: text
        }, '*');
      }
    }
  } catch (error) {
    console.error('Error verifying text:', error);
  }
}

// Analyze page
function analyzePage() {
  const sidebar = document.getElementById('credible-sidebar');
  if (sidebar) {
    const iframe = sidebar.querySelector('iframe');
    iframe.contentWindow.postMessage({
      type: 'ANALYZE_PAGE'
    }, '*');
  }
}

console.log('Credible content script loaded successfully');

// Add this to your existing content.js
function analyzePage() {
  const sidebar = document.getElementById('credible-sidebar');
  if (sidebar) {
    const iframe = sidebar.querySelector('iframe');
    iframe.contentWindow.postMessage({
      type: 'ANALYZE_PAGE'
    }, '*');
  }
}

// And make sure the message listener includes analyzePage:
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  switch (request.action) {
    case "verifySelectedText":
      showSidebar();
      verifyText(request.selectedText);
      sendResponse({ success: true });
      break;
    case "toggleSidebar":
      toggleSidebar();
      sendResponse({ success: true });
      break;
    case "analyzePage":
      showSidebar();
      analyzePage();
      sendResponse({ success: true });
      break;
    case "ping":
      sendResponse({ success: true, loaded: true });
      break;
  }
  
  return true;
});

// Add this to your content.js message listener
window.addEventListener('message', function(event) {
  if (event.data.type === 'CLOSE_SIDEBAR') {
    hideSidebar();
  }
});