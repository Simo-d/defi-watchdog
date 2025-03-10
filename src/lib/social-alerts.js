// lib/social-alerts.js
export async function sendDiscordAlert(vulnerabilityData) {
    try {
      const response = await fetch('/api/alerts/discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vulnerabilityData),
      });
      return response.json();
    } catch (error) {
      console.error('Failed to send Discord alert:', error);
      return { success: false };
    }
  }
  
  export async function sendTelegramAlert(vulnerabilityData) {
    // Similar implementation for Telegram
  }