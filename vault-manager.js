// ============================================
// VAULT MANAGER - Auto-Scans for omega1.json, omega2.json...
// ============================================

let availableVaults = [];
let currentVault = null;

/**
 * Scans ./OMEGA/ folder for omega1.json, omega2.json, etc.
 */
async function scanVaultFolder(folderPath = './OMEGA/') {
  availableVaults = [];
  let fileIndex = 1;
  let consecutiveErrors = 0;

  console.log(`🔍 Scanning vault folder: ${folderPath}`);
  
  while (fileIndex <= 50 && consecutiveErrors < 2) {
    const fileName = `omega${fileIndex}.json`;
    const fullPath = folderPath + fileName;

    try {
      // Use GET instead of HEAD (more compatible)
      const response = await fetch(fullPath, { method: 'GET' });
      
      if (response.ok) {
        availableVaults.push({
          id: `OMEGA_${fileIndex}`,
          name: `OMEGA Set ${fileIndex}`,
          path: fullPath,
          fileIndex: fileIndex
        });
        console.log(`✅ Found: ${fileName}`);
        consecutiveErrors = 0; 
        fileIndex++;
      } else {
        consecutiveErrors++;
        console.log(`⚠️ Not found: ${fileName} (${response.status})`);
      }
    } catch (error) {
      consecutiveErrors++;
      console.log(`❌ Error checking ${fileName}:`, error.message);
    }
  }

  console.log(`🛑 Scan complete. Found ${availableVaults.length} vault(s).`);
  return availableVaults;
}

/**
 * Loads the selected vault
 */
async function loadVault(vaultId) {
  console.log('📂 loadVault called with:', vaultId);
  console.log('availableVaults:', availableVaults);
  
  if (!vaultId) {
    console.error('❌ No vault ID provided');
    if (availableVaults.length > 0) {
      vaultId = availableVaults.id;
      console.log('Using first vault:', vaultId);
    } else {
      console.error('❌ No vaults available');
      return false;
    }
  }
  
  const vault = availableVaults.find(v => v.id === vaultId);
  
  if (!vault) {
    console.error('❌ Vault not found:', vaultId);
    showToast('❌ Vault not found', 'error', 2000);
    return false;
  }

  try {
    console.log(`📥 Loading vault: ${vault.name} from ${vault.path}`);
    
    const response = await fetch(vault.path);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    // Update Global Variables
    QUESTIONS = data;
    TOTAL_Q = QUESTIONS.length;
    TOTAL_TIME = TOTAL_Q * (CONFIG.TIME_PER_Q || 60);
    
    currentVault = vaultId;
    localStorage.setItem('currentVault', currentVault);
    
    console.log(`✅ Loaded ${TOTAL_Q} questions from ${vault.name}`);
    
    if (typeof updateLoginMeta === 'function') {
        updateLoginMeta();
    }
    
    showToast(`✅ Loaded ${vault.name}`, 'success', 1500);
    return true;
  } catch (error) {
    console.error('❌ Failed to load vault:', error);
    showToast('❌ Failed to load vault', 'error', 2000);
    return false;
  }
}

/**
 * Generates HTML buttons for vault selector
 */
function buildVaultSelector() {
  if (availableVaults.length === 0) {
    return '<p style="color:var(--red);font-size:12px;">⚠️ No vaults found</p>';
  }

  let html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;width:100%;max-width:500px;">';
  
  availableVaults.forEach(vault => {
    const isActive = currentVault === vault.id;
    const bgColor = isActive ? 'var(--accent)' : 'var(--surface)';
    const borderColor = isActive ? 'var(--accent2)' : 'var(--border)';
    const textColor = isActive ? '#fff' : 'var(--text)';
    
    html += `
      <button 
        class="vault-btn" 
        onclick="selectVaultAndLogin('${vault.id}')"
        style="
          padding:16px;
          border:2px solid ${borderColor};
          background:${bgColor};
          color:${textColor};
          border-radius:8px;
          cursor:pointer;
          font-weight:700;
          font-size:14px;
          transition:all 0.2s ease;
          text-align:center;
        "
      >
        🗂️ ${vault.name}
      </button>
    `;
  });
  
  html += '</div>';
  return html;
}

/**
 * User clicked a vault button
 */
async function selectVault(vaultId) {
  console.log(`📂 Selecting vault: ${vaultId}`);
  const success = await loadVault(vaultId);
  
  if (success) {
    const selectorContainer = document.getElementById('vaultList');
    if (selectorContainer) {
      selectorContainer.innerHTML = buildVaultSelector();
    }
  }
}

/**
 * Main initialization function
 */
async function initVaultSystem() {
  console.log('🚀 Initializing vault system...');
  
  // Scan for vaults
  await scanVaultFolder('./OMEGA/');
  
  // Render selector
  const selectorContainer = document.getElementById('vaultList');
  if (selectorContainer) {
    selectorContainer.innerHTML = buildVaultSelector();
  }
  
  // Load a vault
  if (availableVaults.length > 0) {
    // Check if there's a saved vault in localStorage
    const savedVault = localStorage.getItem('currentVault');
    const vaultExists = savedVault && availableVaults.find(v => v.id === savedVault);
    
    if (vaultExists) {
      currentVault = savedVault;
    } else {
      // Use first vault
      currentVault = availableVaults.id;
    }
    
    console.log('📂 Using vault:', currentVault);
    await loadVault(currentVault);
  } else {
    console.warn('⚠️ No vaults found!');
    if (selectorContainer) {
        selectorContainer.innerHTML = '<p style="color:var(--red);font-size:12px;">⚠️ No vaults found in ./OMEGA/ folder</p>';
    }
    const startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.disabled = true;
  }
}

// Auto-run when DOM is ready
document.addEventListener('DOMContentLoaded', initVaultSystem);