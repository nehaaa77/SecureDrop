class Block {
    constructor(timestamp, data, previousHash = '') {
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
        return CryptoJS.SHA256(
            this.previousHash + 
            this.timestamp + 
            JSON.stringify(this.data) + 
            this.nonce
        ).toString();
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingDocuments = [];
    }

    createGenesisBlock() {
        return new Block(Date.now(), "Genesis Block", "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addDocument(document) {
        this.pendingDocuments.push(document);
    }

    minePendingDocuments() {
        if (this.pendingDocuments.length === 0) return;

        const block = new Block(
            Date.now(),
            this.pendingDocuments,
            this.getLatestBlock().hash
        );

        block.mineBlock(this.difficulty);
        this.chain.push(block);
        this.pendingDocuments = [];
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    verifyDocument(documentHash) {
        for (let block of this.chain) {
            for (let doc of block.data) {
                if (doc.hash === documentHash) {
                    return {
                        verified: true,
                        timestamp: block.timestamp,
                        blockHash: block.hash
                    };
                }
            }
        }
        return { verified: false };
    }
}

// Initialize blockchain
const blockchain = new Blockchain();

// Document handling functions
function createDocumentHash(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const hash = CryptoJS.SHA256(e.target.result).toString();
            resolve(hash);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function addDocumentToBlockchain(file) {
    return new Promise(async (resolve, reject) => {
        try {
            const hash = await createDocumentHash(file);
            const document = {
                name: file.name,
                size: file.size,
                type: file.type,
                hash: hash,
                timestamp: Date.now()
            };

            blockchain.addDocument(document);
            blockchain.minePendingDocuments();

            resolve({
                success: true,
                document: document,
                blockHash: blockchain.getLatestBlock().hash
            });
        } catch (error) {
            reject(error);
        }
    });
}

// Export functions for use in other files
window.blockchain = blockchain;
window.addDocumentToBlockchain = addDocumentToBlockchain;
window.verifyDocument = (hash) => blockchain.verifyDocument(hash); 