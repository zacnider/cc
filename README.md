# 🐔 Chog Cross Gambling Game

A web-based gambling game where players control a character jumping across platforms with cryptocurrency betting mechanics.

## 🎮 Game Overview

Chog Cross is a skill-based gambling game where players:
- Jump across 7 platforms with increasing multipliers
- Cash out at any time to secure winnings
- Bet using MON tokens on Monad testnet
- Choose between Easy (25% risk) or Hard (40% risk) modes
- Betting range: 1.0 - 5.0 MON tokens

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- Modern web browser
- Monad testnet MON tokens for betting

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd chog-cross-gambling
   ```

2. **Install dependencies**
   ```bash
   cd wallet
   npm install
   ```

3. **Build the wallet bundle**
   ```bash
   npm run build
   ```

4. **Start a local server**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Or using Node.js
   npx http-server
   
   # Or using PHP
   php -S localhost:8000
   ```

5. **Open the game**
   Navigate to `http://localhost:8000/game.html` in your browser

## 🎯 How to Play

1. **Connect Wallet**: Click "WALLET" to connect your Privy embedded wallet
2. **Set Bet**: Choose your bet amount (1.0 - 5.0 MON)
3. **Choose Mode**: Select Easy (25% risk) or Hard (40% risk)
4. **Start Game**: Click "START GAME" to begin
5. **Jump**: Press spacebar or click to make your character jump
6. **Cash Out**: Click "CASHOUT" at any time to secure winnings

### Game Mechanics
- **Platforms**: 7 platforms with increasing multipliers
- **Multipliers**: 
  - Easy mode: 1.28x, 1.71x, 2.28x, 3.04x, 4.05x, 5.39x, 7.19x
  - Hard mode: 1.60x, 2.67x, 4.44x, 7.41x, 12.35x, 20.58x, 34.30x
- **Risk**: Each platform has a chance of failure based on difficulty
- **Jumps**: Limited number of jumps per game (8 maximum)

## 🚀 Deployment

### Production Build
1. **Build wallet bundle**:
   ```bash
   cd wallet
   npm run build
   ```

2. **Start server**:
   ```bash
   python -m http.server 8000
   ```

3. **Open game**:
   Navigate to `http://localhost:8000/game.html`

## 🆘 Troubleshooting

### Common Issues
1. **Wallet Connection**: Ensure Privy is properly initialized
2. **Network Issues**: Check Monad testnet connectivity
3. **Build Issues**: Make sure to run `npm run build` in wallet folder
4. **Server Issues**: Try different port if 8000 is busy

### Getting Help
- Check browser console for error messages
- Verify wallet connection and network status
- Clear browser cache and reload

---

**Happy Gaming! 🐔🎮**

*Remember: This is a gambling game. Play responsibly and only bet what you can afford to lose.*