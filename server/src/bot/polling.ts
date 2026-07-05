import '../loadEnv';
import { setupBot } from './index';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN no configurado');
  console.error('   Configuralo en el archivo .env');
  process.exit(1);
}

const bot = setupBot();

// Capturar Ctrl+C para apagar el bot correctamente
process.once('SIGINT', () => {
  console.log('\n🛑 Bot detenido');
  bot.stop();
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('\n🛑 Bot detenido');
  bot.stop();
  process.exit(0);
});

bot.start();
console.log('🤖 Bot de Telegram activo (modo polling)');
console.log('   Presioná Ctrl+C para detenerlo');
