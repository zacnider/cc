/**
 * WalletManager.js - Privy Embedded Wallet Entegrasyonu
 * Chog Cross Gambling Game için React Privy cüzdan yönetimi
 */

function WalletManager() {
    var _bConnected = false;
    var _sWalletAddress = null;
    var _fBalance = 0;
    var _fProfit = 0;
    var _oProvider = null;
    var _iChainId = null;
    
    // Monad Test Ağı Konfigürasyonu
    var MONAD_CONFIG = {
        chainId: '0x279f', // 10143 in hex (corrected)
        chainName: 'Monad Testnet',
        rpcUrls: ['https://testnet-rpc.monad.xyz'],
        nativeCurrency: {
            name: 'MON',
            symbol: 'MON',
            decimals: 18
        },
        blockExplorerUrls: ['https://testnet.monadexplorer.com']
    };
    
    this._init = function() {
        console.log("🔗 WalletManager initializing with Privy integration...");
        
        // Event listeners ekle
        this._addEventListeners();
        
        // Privy wallet events dinle
        this._addPrivyEventListeners();
        
        console.log("✅ WalletManager initialized successfully");
    };
    
    this._addEventListeners = function() {
        var self = this;
        
        // Window focus event - cüzdan durumunu kontrol et
        window.addEventListener('focus', function() {
            self._checkWalletConnection();
        });
        
        // Account change event
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', function(accounts) {
                console.log("🔄 Account changed:", accounts);
                if (accounts.length === 0) {
                    self.disconnectWallet();
                } else {
                    self._updateWalletInfo(accounts[0]);
                }
            });
            
            // Chain change event
            window.ethereum.on('chainChanged', function(chainId) {
                console.log("🔄 Chain changed:", chainId);
                self._checkChainId();
            });
        }
    };
    
    this._addPrivyEventListeners = function() {
        var self = this;
        
        // Privy wallet connected event
        window.addEventListener('walletConnected', function(event) {
            console.log("🎉 Privy wallet connected:", event.detail);
            console.log("🔍 Event details:", {
                address: event.detail.address,
                authenticated: event.detail.authenticated,
                balance: event.detail.balance,
                hasAddress: !!event.detail.address,
                isAuthenticated: !!event.detail.authenticated
            });
            
            // Check if this is a real embedded wallet (not external)
            if (event.detail.address && event.detail.authenticated) {
                // Prevent duplicate connections
                if (_bConnected && _sWalletAddress === event.detail.address) {
                    console.log("🔄 Wallet already connected, updating balance only");
                    _fBalance = event.detail.balance;
                    return;
                }
                
                console.log("✅ Valid embedded wallet detected:", event.detail.address);
                console.log("💰 Balance from event:", event.detail.balance, "MON");
                console.log("🔍 Event balance details:", {
                    balance: event.detail.balance,
                    balanceType: typeof event.detail.balance,
                    balanceValue: event.detail.balance
                });
                self._updateWalletInfo(event.detail.address, event.detail.balance);
                
                // Automatically switch to Monad testnet
                setTimeout(() => {
                    self._switchToMonadNetwork().catch(error => {
                        console.warn("⚠️ Auto Monad network switch failed:", error);
                    });
                }, 1000);
            } else {
                console.log("⚠️ Invalid wallet connection - skipping:", {
                    reason: !event.detail.address ? "No address" : "Not authenticated"
                });
            }
        });
        
        // Privy wallet disconnected event - TEMPORARILY DISABLED
        // Bu event yanlış tetikleniyor ve bakiyeyi sıfırlıyor
        /*
        window.addEventListener('walletDisconnected', function(event) {
            console.log("🔌 Privy wallet disconnected event received:", event.detail);
            
            // Only disconnect if we have a valid wallet connection
            if (_bConnected && _sWalletAddress) {
                console.log("🔌 Disconnecting wallet:", _sWalletAddress);
                self.disconnectWallet();
            } else {
                console.log("🔌 Wallet already disconnected, ignoring event");
            }
        });
        */
        
        // Profit update event from game
        window.addEventListener('profitUpdate', function(event) {
            console.log("📈 Profit update received:", event.detail.profit);
            _fProfit = event.detail.profit;
            
            // React component'inde profit state'i güncelleniyor
            // DOM manipülasyonu gereksiz, sadece log
            console.log("📈 Profit updated:", _fProfit.toFixed(4), "MON");
        });
    };
    
    this.connectWallet = async function() {
        // Bu fonksiyon artık React Privy tarafından handle ediliyor
        console.log("🔗 Wallet connection is handled by React Privy component");
    };
    
    this._switchToMonadNetwork = async function() {
        try {
            // Mevcut chain ID'yi kontrol et
            var currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
            console.log("🔍 Current chain ID:", currentChainId, "Target:", MONAD_CONFIG.chainId);
            
            if (currentChainId !== MONAD_CONFIG.chainId) {
                console.log("🔄 Switching to Monad Testnet...");
                
                try {
                    // Monad Test Ağına geç
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: MONAD_CONFIG.chainId }]
                    });
                    console.log("✅ Successfully switched to Monad Testnet");
                } catch (switchError) {
                    console.log("⚠️ Switch failed, trying to add network:", switchError);
                    // Eğer ağ bulunamazsa ekle
                    if (switchError.code === 4902) {
                        console.log("➕ Adding Monad Testnet to wallet...");
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [MONAD_CONFIG]
                        });
                        console.log("✅ Monad Testnet added to wallet");
                    } else {
                        console.error("❌ Network switch error:", switchError);
                        throw switchError;
                    }
                }
            } else {
                console.log("✅ Already on Monad Testnet");
            }
            
        } catch (error) {
            console.error("❌ Network switch failed:", error);
            throw error;
        }
    };
    
    this._updateWalletInfo = function(address, balance) {
        console.log("📊 _updateWalletInfo called:", {
            address: address,
            balance: balance,
            previousConnected: _bConnected,
            previousAddress: _sWalletAddress
        });
        
        _sWalletAddress = address;
        _bConnected = true;
        
        if (balance !== undefined) {
            _fBalance = balance;
            console.log("💰 Balance set from parameter:", _fBalance, "MON");
            console.log("🔍 Balance details:", {
                balance: balance,
                _fBalance: _fBalance,
                balanceType: typeof balance,
                _fBalanceType: typeof _fBalance
            });
        } else {
            console.log("⚠️ Balance parameter undefined, will fetch from network");
        }
        
        console.log("📊 Wallet info updated:", {
            _bConnected: _bConnected,
            _sWalletAddress: _sWalletAddress,
            _fBalance: _fBalance
        });
        
        // Monad testnet'e geç
        this._switchToMonadNetwork().catch(error => {
            console.warn("⚠️ Monad network switch failed:", error);
        });
        
        // UI'yi güncelle
        this._updateUI();
        
        // Balance'ı güncelle (eğer balance parametresi verilmemişse)
        if (balance === undefined) {
            this._updateBalance();
        }
        
        console.log("📊 Wallet info updated:", address, "MON Balance:", _fBalance);
    };
    
    this._updateUI = function() {
        // UI artık React Privy component tarafından handle ediliyor
        // Bu fonksiyon sadece game logic için gerekli
        console.log("📱 UI is handled by React Privy component");
    };
    
    this._shortenAddress = function(address) {
        if (!address) return '0x0000...0000';
        return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    };
    
    this._updateBalance = async function() {
        if (!_bConnected || !_sWalletAddress) return;
        
        try {
            // Ensure we're on Monad testnet
            await this._switchToMonadNetwork();
            
            // MON balance'ı al
            var balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [_sWalletAddress, 'latest']
            });
            
            // Wei'den MON'a çevir
            _fBalance = parseInt(balance, 16) / Math.pow(10, 18);
            
            // UI'yi güncelle
            var balanceElement = document.getElementById('mon-balance');
            if (balanceElement) {
                balanceElement.textContent = _fBalance.toFixed(4) + ' MON';
            }
            
            console.log("💰 MON Balance updated:", _fBalance.toFixed(4), "MON");
            
        } catch (error) {
            console.error("❌ MON Balance update failed:", error);
        }
    };
    
    this._startBalanceUpdate = function() {
        // Balance güncelleme artık React component tarafından handle ediliyor
        console.log("💰 Balance updates are handled by React Privy component");
    };
    
    this._checkWalletConnection = function() {
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_accounts' })
                .then(accounts => {
                    if (accounts.length > 0) {
                        this._updateWalletInfo(accounts[0]);
                    } else {
                        this.disconnectWallet();
                    }
                })
                .catch(error => {
                    console.error("❌ Wallet check failed:", error);
                });
        }
    };
    
    this._checkChainId = function() {
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_chainId' })
                .then(chainId => {
                    console.log("🔍 Current chain ID:", chainId, "Expected:", MONAD_CONFIG.chainId);
                    if (chainId !== MONAD_CONFIG.chainId) {
                        console.log("⚠️ Wrong network detected. Please switch to Monad Testnet.");
                        this._showError("Please switch to Monad Testnet in your wallet.");
                    } else {
                        console.log("✅ Correct network (Monad Testnet) detected");
                    }
                })
                .catch(error => {
                    console.error("❌ Chain ID check failed:", error);
                });
        }
    };
    
    this.disconnectWallet = function() {
        _bConnected = false;
        _sWalletAddress = null;
        _fBalance = 0;
        
        // Profit'ı sıfırla
        this.updateProfit(0);
        
        console.log("🔌 Wallet disconnected");
    };
    
    this.updateProfit = function(profit) {
        _fProfit = profit;
        
        // React component'ine profit güncellemesi gönder
        window.dispatchEvent(new CustomEvent("profitUpdate", {
            detail: { profit: _fProfit }
        }));
        
        console.log("📈 Profit updated:", _fProfit.toFixed(4), "MON");
    };
    
    this._showError = function(message) {
        console.error("❌ Wallet Error:", message);
        
        // Basit alert göster (gelecekte daha güzel bir modal yapılabilir)
        if (window.errorLogger) {
            window.errorLogger.showErrorToUser(message);
        } else {
            alert("Wallet Error: " + message);
        }
    };
    
    // Public getter methods
    this.isConnected = function() {
        return _bConnected;
    };
    
    this.getAddress = function() {
        return _sWalletAddress;
    };
    
    this.getBalance = function() {
        return _fBalance;
    };
    
    this.isConnected = function() {
        return _bConnected && _sWalletAddress !== null;
    };
    
    this.hasEmbeddedWallet = function() {
        // Check if we have an embedded wallet (not external)
        var hasWallet = _bConnected && _sWalletAddress !== null && _sWalletAddress.length > 0;
        console.log("🔍 hasEmbeddedWallet check:", {
            _bConnected: _bConnected,
            _sWalletAddress: _sWalletAddress,
            addressLength: _sWalletAddress ? _sWalletAddress.length : 0,
            result: hasWallet
        });
        return hasWallet;
    };
    
    this.getProfit = function() {
        return _fProfit;
    };
    
    this.getChainId = function() {
        return _iChainId;
    };
    
    // Game integration methods
    this.canPlaceBet = function(betAmount) {
        console.log("🔍 canPlaceBet called:", {
            _fBalance: _fBalance,
            betAmount: betAmount,
            _bConnected: _bConnected,
            _sWalletAddress: _sWalletAddress,
            balanceType: typeof _fBalance,
            balanceValue: _fBalance
        });
        
        // Sadece bakiye kontrolü yap (minimum 1 MON)
        if (_fBalance < betAmount) {
            console.log("❌ Insufficient balance:", _fBalance, "MON, needed:", betAmount, "MON");
            console.log("🔍 Balance check details:", {
                balance: _fBalance,
                betAmount: betAmount,
                comparison: _fBalance + " < " + betAmount + " = " + (_fBalance < betAmount)
            });
            return false;
        }
        
        console.log("✅ Sufficient balance:", _fBalance, "MON, bet amount:", betAmount, "MON");
        return true;
    };
    
    this.processWin = function(amount) {
        this.updateProfit(_fProfit + amount);
        console.log("🎉 Win processed:", amount.toFixed(4), "MON");
    };
    
    this.processLoss = function(amount) {
        this.updateProfit(_fProfit - amount);
        console.log("💸 Loss processed:", amount.toFixed(4), "MON");
    };
    
    // Initialize
    this._init();
}

// Global wallet manager instance
var walletManager = null;

// Initialize wallet manager when page loads
window.addEventListener('load', function() {
    try {
        walletManager = new WalletManager();
        console.log("🌟 Wallet system ready!");
    } catch (error) {
        console.error("❌ Wallet system initialization failed:", error);
    }
});
