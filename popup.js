document.addEventListener('DOMContentLoaded', () => {
  // Update status based on current page
  updateStatus();
  
  // Analyze This Page
  document.getElementById('analyzePage').addEventListener('click', () => {
    analyzeCurrentPage();
  });
  
  // Open Sidebar for text verification
  document.getElementById('openSidebar').addEventListener('click', () => {
    openSidebar();
  });
  
  // How to Use
  document.getElementById('howToUse').addEventListener('click', () => {
    showHowToUse();
  });
});

function updateStatus() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const statusElement = document.getElementById('statusText');
    if (tabs[0].url.startsWith('http')) {
      statusElement.textContent = 'Ready to analyze this page';
      statusElement.style.color = '#059669';
    } else {
      statusElement.textContent = 'Navigate to a webpage to use Credible';
      statusElement.style.color = '#dc2626';
    }
  });
}

function analyzeCurrentPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    
    if (!tab.url.startsWith('http')) {
      alert('Please navigate to a webpage to use Full Page Analysis.');
      return;
    }
    
    // Show loading state
    const statusElement = document.getElementById('statusText');
    statusElement.textContent = 'Starting page analysis...';
    statusElement.style.color = '#d97706';
    
    chrome.runtime.sendMessage({
      action: "analyzePage",
      tabId: tab.id
    });
    
    setTimeout(() => {
      window.close();
    }, 500);
  });
}

function openSidebar() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.runtime.sendMessage({
      action: "openSidebar",
      tabId: tabs[0].id
    });
    window.close();
  });
}

function showHowToUse() {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  `;
  
  modal.innerHTML = `
    <div style="
      background: white;
      padding: 24px;
      border-radius: 12px;
      max-width: 300px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    ">
      <div style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #1e40af; text-align: center;">
        How to Use Credible
      </div>
      
      <div style="font-size: 13px; line-height: 1.5; color: #4b5563; margin-bottom: 20px;">
        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <span style="color: #1e40af; margin-right: 8px;">•</span>
          <span><strong>Analyze This Page:</strong> Comprehensive analysis of the entire webpage</span>
        </div>
        
        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <span style="color: #1e40af; margin-right: 8px;">•</span>
          <span><strong>Verify Selected Text:</strong> Right-click any text and choose "Verify with Credible"</span>
        </div>
        
        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <span style="color: #1e40af; margin-right: 8px;">•</span>
          <span><strong>Manual Verification:</strong> Open sidebar to paste and verify specific text</span>
        </div>
      </div>
      
      <button id="closeModal" style="
        width: 100%;
        padding: 12px;
        background: #1e40af;
        border: none;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
      ">
        Got It
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const closeBtn = document.getElementById('closeModal');
  closeBtn.addEventListener('mouseover', () => {
    closeBtn.style.background = '#1d4ed8';
  });
  closeBtn.addEventListener('mouseout', () => {
    closeBtn.style.background = '#1e40af';
  });
  
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}