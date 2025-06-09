// Add CryptoJS library
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
document.head.appendChild(script);

// Wait for CryptoJS to load
script.onload = () => {
    initializeApp();
};

function initializeApp() {
    const dropZone = document.getElementById('dropZone');
    const documentInput = document.getElementById('documentInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const howItWorksBtn = document.getElementById('howItWorksBtn');
    const howItWorksModal = document.getElementById('howItWorksModal');
    const shareModal = document.getElementById('shareModal');
    const shareLink = document.getElementById('shareLink');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const expiryTime = document.getElementById('expiryTime');

    // File upload handling
    selectFileBtn.addEventListener('click', () => {
        documentInput.click();
    });

    documentInput.addEventListener('change', handleFileSelect);

    // Drag and drop handling
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary-color)';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'var(--border-color)';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border-color)';
        const file = e.dataTransfer.files[0];
        handleFile(file);
    });

    // Modal handling
    howItWorksBtn.addEventListener('click', () => {
        howItWorksModal.style.display = 'block';
    });

    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            howItWorksModal.style.display = 'none';
            shareModal.style.display = 'none';
        });
    });

    // Copy link functionality
    copyLinkBtn.addEventListener('click', () => {
        shareLink.select();
        document.execCommand('copy');
        copyLinkBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            copyLinkBtn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === howItWorksModal) {
            howItWorksModal.style.display = 'none';
        }
        if (e.target === shareModal) {
            shareModal.style.display = 'none';
        }
    });
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    handleFile(file);
}

async function handleFile(file) {
    if (!file) return;

    // Check file size
    if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit');
        return;
    }

    try {
        // Show loading state
        const dropZone = document.getElementById('dropZone');
        const originalContent = dropZone.innerHTML;
        dropZone.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Processing file...</p>';

        // Generate encryption key
        const encryptionKey = generateEncryptionKey();
        
        // Encrypt file content to string
        const encryptedFileString = await encryptFileToString(file, encryptionKey);
        
        // Simulate adding document to blockchain with encrypted hash
        // In a real scenario, you'd send encryptedFileString and get a hash from the blockchain
        const documentHash = CryptoJS.SHA256(encryptedFileString).toString();

        // Generate share link with encryption key
        const shareId = generateShareId();
        const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareId}&key=${encryptionKey}`;
        
        // Store document data in localStorage
        const documentData = {
            id: shareId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            encryptedContent: encryptedFileString, // Store encrypted content as string
            hash: documentHash, // Store the hash for verification
            timestamp: Date.now(),
            expiryTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            encryptionKey: encryptionKey // Store key with document for retrieval
        };
        
        localStorage.setItem(`share_${shareId}`, JSON.stringify(documentData));
        console.log(`Stored share_${shareId}:`, documentData);
        
        // Show share modal
        document.getElementById('shareLink').value = shareUrl;
        document.getElementById('shareModal').style.display = 'block';
        
        // Start expiry countdown
        startExpiryCountdown(documentData.expiryTime);

        // Reset dropzone
        dropZone.innerHTML = originalContent;
        
        // Update documents list
        updateDocumentsList();
    } catch (error) {
        alert('Error processing file: ' + error.message);
        dropZone.innerHTML = originalContent;
    }
}

function generateShareId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

function startExpiryCountdown(expiryTime) {
    const expiryElement = document.getElementById('expiryTime');
    
    function updateCountdown() {
        const now = Date.now();
        const timeLeft = expiryTime - now;
        
        if (timeLeft <= 0) {
            expiryElement.textContent = 'Expired';
            return;
        }
        
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        expiryElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

function updateDocumentsList() {
    const documentsList = document.getElementById('documentsList');
    const documentsSection = document.getElementById('documentsSection');
    const documents = [];
    
    // Get all shares from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('share_')) {
            const data = JSON.parse(localStorage.getItem(key));
            if (data.expiryTime > Date.now()) {
                documents.push(data);
            } else {
                // Remove expired documents
                localStorage.removeItem(key);
            }
        }
    }
    
    if (documents.length > 0) {
        documentsSection.style.display = 'block';
        documentsList.innerHTML = documents.map(doc => `
            <div class="document-item">
                <div class="document-info">
                    <h3>${doc.fileName}</h3>
                    <p>Size: ${formatFileSize(doc.fileSize)}</p>
                    <p>Expires: ${new Date(doc.expiryTime).toLocaleString()}</p>
                </div>
                <div class="document-actions">
                    <button onclick="copyShareLink('${doc.id}', '${doc.encryptionKey}')" class="action-btn">
                        <i class="fas fa-copy"></i> Copy Link
                    </button>
                    <button onclick="deleteShare('${doc.id}')" class="action-btn delete">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        documentsSection.style.display = 'none';
    }
}

function copyShareLink(shareId, encryptionKey) {
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareId}&key=${encryptionKey}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Share link copied to clipboard!');
    });
}

function deleteShare(shareId) {
    if (confirm('Are you sure you want to delete this share?')) {
        localStorage.removeItem(`share_${shareId}`);
        updateDocumentsList();
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Enhanced encryption functions
function generateEncryptionKey() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function encryptFileToString(file, key) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const content = e.target.result;
                const encryptedContent = CryptoJS.AES.encrypt(content, key).toString();
                resolve(encryptedContent);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function decryptFile(encryptedContent, key) {
    try {
        console.log("Attempting to decrypt with content:", encryptedContent, "and key:", key);
        const decrypted = CryptoJS.AES.decrypt(encryptedContent, key);
        if (decrypted.sigBytes < 0) { // Check for invalid decryption
            throw new Error('Decryption failed: Invalid key or corrupted data (sigBytes issue)');
        }
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error("Decryption error:", error);
        throw new Error('Decryption failed: Invalid key or corrupted data. ' + error.message);
    }
}

// Simulate blockchain verification
// In a real application, this would involve actual blockchain interaction
async function verifyDocumentOnBlockchain(documentHash) {
    return new Promise(resolve => {
        // Simulate a delay for blockchain verification
        setTimeout(() => {
            // For now, we'll assume any hash is "verified" by the blockchain for demo purposes
            // In a real system, you'd check if the hash exists on the blockchain
            resolve({
                verified: true,
                timestamp: Date.now(), // Simulate a timestamp from the blockchain
                blockHash: '0x' + CryptoJS.SHA256(documentHash + 'blockchain_salt').toString() // Simulate a block hash
            });
        }, 500);
    });
}

// Function to show download modal
function showDownloadModal(fileName, fileType, decryptedContent) {
    const downloadModal = document.getElementById('downloadModal');
    const downloadFileName = document.getElementById('downloadFileName');
    const downloadFileType = document.getElementById('downloadFileType');
    const downloadFileBtn = document.getElementById('downloadFileBtn');

    downloadFileName.textContent = fileName;
    downloadFileType.textContent = fileType;
    downloadModal.style.display = 'block';

    downloadFileBtn.onclick = () => {
        const link = document.createElement('a');
        link.href = decryptedContent; // The content is a data URL
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        downloadModal.style.display = 'none';
    };
}

// Enhanced share link handling
window.addEventListener('load', async () => {
    initializeApp(); // Initialize the app elements and event listeners
    
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('share');
    const encryptionKey = urlParams.get('key');
    
    console.log(`URL Params - shareId: ${shareId}, encryptionKey: ${encryptionKey}`);
    
    if (shareId && encryptionKey) {
        const localStorageKey = `share_${shareId}`;
        const shareData = localStorage.getItem(localStorageKey);
        console.log(`Retrieved from localStorage (${localStorageKey}):`, shareData);

        if (shareData) {
            const data = JSON.parse(shareData);
            
            // Check expiry time
            if (data.expiryTime > Date.now()) {
                try {
                    // Verify document hash on blockchain (simulated)
                    const blockchainVerification = await verifyDocumentOnBlockchain(data.hash);

                    if (blockchainVerification.verified) {
                        // Decrypt the content
                        const decryptedContent = await decryptFile(data.encryptedContent, encryptionKey);
                        
                        // Show download modal
                        showDownloadModal(data.fileName, data.fileType, decryptedContent);
                        
                        alert(`Document Verified!\nFile: ${data.fileName}\nTimestamp: ${new Date(blockchainVerification.timestamp).toLocaleString()}\nBlock Hash: ${blockchainVerification.blockHash}`);
                    } else {
                        alert('Document verification failed on the blockchain.');
                    }
                } catch (error) {
                    alert('Error decrypting or verifying document: ' + error.message);
                }
            } else {
                alert('This share has expired.');
                localStorage.removeItem(localStorageKey); // Clean up expired share
            }
        } else {
            alert('Share not found. It might have expired or been deleted.');
        }
    } else if (shareId || encryptionKey) { // Handle cases where one is missing but the other is present
        alert("Invalid share link. Both share ID and encryption key are required.");
    }
    
    // Update documents list on load
    updateDocumentsList();
    
    // Start cleanup interval
    setInterval(() => {
        updateDocumentsList();
    }, 60000); // Check every minute
});

// For policy links (if still present in index.html, though now handled by policy.html)
function showPrivacyPolicy() {
    window.location.href = 'policy.html#privacy';
}

function showTerms() {
    window.location.href = 'policy.html#terms';
} 