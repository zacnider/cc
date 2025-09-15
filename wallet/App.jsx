import React, { useEffect, useState } from "react";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";

function WalletUI() {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const [balance, setBalance] = useState(0);
  const [profit, setProfit] = useState(0);

  // Update MON balance periodically
  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      const updateBalance = async () => {
        try {
          // Ensure we're on Monad testnet
          await window.walletManager?._switchToMonadNetwork?.();
          
          // Get MON balance from Monad testnet
          const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [user.wallet.address, 'latest']
          });
          
          const balanceInMon = parseInt(balance, 16) / Math.pow(10, 18);
          setBalance(balanceInMon);
          
          console.log("💰 MON Balance updated:", balanceInMon.toFixed(4), "MON");
          
          // Always dispatch wallet connected event for embedded wallets
          if (user?.wallet?.address) {
            console.log("🎉 Wallet connection event dispatched");
            window.dispatchEvent(new CustomEvent("walletConnected", {
              detail: { 
                address: user.wallet.address,
                balance: balanceInMon,
                authenticated: true
              }
            }));
          }
        } catch (error) {
          console.error("Failed to get MON balance:", error);
          // Fallback to 0 balance if network error
          setBalance(0);
        }
      };

      updateBalance();
      const interval = setInterval(updateBalance, 30000); // Update every 30 seconds
      
      return () => clearInterval(interval);
    } else {
      // Don't dispatch wallet disconnected event automatically
      // This prevents wallet from being disconnected when authenticated state changes
      console.log("🔄 User not authenticated, but not dispatching disconnect event");
    }
  }, [authenticated, user]);

  // Listen for profit updates from the game
  useEffect(() => {
    const handleProfitUpdate = (event) => {
      setProfit(event.detail.profit);
    };

    window.addEventListener("profitUpdate", handleProfitUpdate);
    return () => window.removeEventListener("profitUpdate", handleProfitUpdate);
  }, []);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setBalance(0);
      setProfit(0);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleAddressClick = async () => {
    if (user?.wallet?.address) {
      try {
        await navigator.clipboard.writeText(user.wallet.address);
        console.log("📋 Address copied to clipboard:", user.wallet.address);
        
        // Show temporary feedback
        const addressElement = document.querySelector('.address-value');
        if (addressElement) {
          const originalText = addressElement.textContent;
          addressElement.textContent = 'Copied!';
          addressElement.style.color = '#00FF00';
          
          setTimeout(() => {
            addressElement.textContent = originalText;
            addressElement.style.color = '#FFD700';
          }, 1500);
        }
      } catch (error) {
        console.error("❌ Failed to copy address:", error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = user.wallet.address;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log("📋 Address copied using fallback method");
      }
    }
  };

  if (!ready) {
    return (
      <div className="wallet-loading">
        <div className="loading-spinner"></div>
        <span>Loading wallet...</span>
      </div>
    );
  }

  return (
    <div className="privy-wallet-container">
      <div className="wallet-content">
        <div className="wallet-info">
          <div className="wallet-status">
            <span className={`status-indicator ${authenticated ? 'connected' : 'disconnected'}`}>
              ●
            </span>
            <span className="status-text">
              {authenticated ? 'Connected' : 'Not Connected'}
            </span>
            {authenticated && user?.wallet && (
              <span 
                className="address-value clickable-address" 
                onClick={handleAddressClick}
                title="Click to copy full address"
              >
                {user.wallet.address ? 
                  `${user.wallet.address.substring(0, 6)}...${user.wallet.address.substring(user.wallet.address.length - 4)}` : 
                  'N/A'
                }
              </span>
            )}
          </div>
        </div>
        
        {authenticated && user?.wallet && (
          <div className="wallet-balance">
            <div className="balance-item">
              <span className="balance-label">MON Balance:</span>
              <span className="balance-value">{balance.toFixed(4)} MON</span>
            </div>
            <div className="balance-item">
              <span className="balance-label">Profit:</span>
              <span id="profit-display" className={`balance-value ${profit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                {profit >= 0 ? '+' : ''}{profit.toFixed(4)} MON
              </span>
            </div>
          </div>
        )}
        
        <div className="wallet-actions">
          {authenticated ? (
            <button className="wallet-btn disconnect-btn" onClick={handleLogout}>
              Disconnect
            </button>
          ) : (
            <button className="wallet-btn connect-btn" onClick={handleLogin}>
              Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  console.log("🚀 React App component rendering...");
  
  try {
    return (
      <PrivyProvider 
        appId="cmfhaf46w000wjm0bzdc69uu4"
        config={{
          appearance: {
            theme: 'dark',
            accentColor: '#676FFF',
            showWalletLoginFirst: false
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
            noPromptOnSignature: false
          },
          loginMethods: ['email']
        }}
      >
        <WalletUI />
      </PrivyProvider>
    );
  } catch (error) {
    console.error("❌ Error in App component:", error);
    return (
      <div style={{ padding: '20px', color: 'red', background: 'white' }}>
        <h3>Wallet Error</h3>
        <p>Failed to initialize wallet component</p>
        <p>Error: {error.message}</p>
      </div>
    );
  }
}
