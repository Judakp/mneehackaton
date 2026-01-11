import { ethers } from 'ethers';
import { MNEE_CONTRACT_ADDRESS, MNEE_DECIMALS, ERC20_ABI } from '../constants';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class MNEEService {
  // En v6, on utilise BrowserProvider au lieu de Web3Provider
  private provider: ethers.BrowserProvider | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
  }

  async connectWallet(): Promise<string | null> {
    if (!this.provider) throw new Error("Metamask not found");
    // La méthode send reste similaire
    const accounts = await this.provider.send("eth_requestAccounts", []);
    return accounts[0] || null;
  }

  async getBalance(address: string): Promise<string> {
    if (!this.provider) return "0.00";
    const contract = new ethers.Contract(MNEE_CONTRACT_ADDRESS, ERC20_ABI, this.provider);
    const balance = await contract.balanceOf(address);
    // En v6, formatUnits est directement dans ethers
    return ethers.formatUnits(balance, MNEE_DECIMALS);
  }

  async transferMNEE(to: string, amount: number): Promise<string> {
    if (!this.provider) throw new Error("Provider not available");
    
    // Obtenir le signer en v6 est asynchrone
    const signer = await this.provider.getSigner();
    const contract = new ethers.Contract(MNEE_CONTRACT_ADDRESS, ERC20_ABI, signer);
    
    // En v6, parseUnits est directement dans ethers
    const parsedAmount = ethers.parseUnits(amount.toString(), MNEE_DECIMALS);
    
    const tx = await contract.transfer(to, parsedAmount);
    // On attend la confirmation
    const receipt = await tx.wait();
    return receipt.hash;
  }

  static simulateBalance(): string {
    return (Math.random() * 5000 + 1000).toFixed(2);
  }

  static generateMockTx(): string {
    return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}