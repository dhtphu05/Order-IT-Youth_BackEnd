// tunnel.ts
import ngrok from 'ngrok';
import dotenv from 'dotenv';

dotenv.config();

(async function () {
  try {
    const url = await ngrok.connect({
      addr: 3000,
      authtoken: process.env.NGROK_AUTH_TOKEN,
      region: process.env.NGROK_REGION as any,
      // 🔧 Fix: Use hostname for static domain
      hostname: process.env.NGROK_DOMAIN + '.ngrok-free.app', // frankly-liberal-gopher.ngrok-free.app
      onStatusChange: status => console.log(`🔄 Ngrok status: ${status}`),
      onLogEvent: event => console.log(`📋 Ngrok log: ${event}`),
    });

    console.log('🚀 Ngrok tunnel opened at:');
    console.log(`📡 Public URL: ${url}`);
    console.log(`🔗 Webhook URL: ${url}/api/messenger/webhook`);
    console.log('🎯 Copy this URL to Facebook Developer Console');
    console.log('═══════════════════════════════════════════════');
    console.log('\n📋 Facebook Developer Console Setup:');
    console.log(`   Callback URL: ${url}/api/messenger/webhook`);
    console.log(`   Verify Token: ${process.env.FACEBOOK_VERIFY_TOKEN}`);
    console.log('\n🛑 Press Ctrl+C to stop tunnel');

  } catch (err) {
    console.error('❌ Error starting Ngrok tunnel with static domain:', err);
    
  }
})();

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down tunnel...');
  await ngrok.disconnect();
  await ngrok.kill();
  process.exit();
});