// tunnel.js
import ngrok from 'ngrok';
(async function () {
  try {
    const url = await ngrok.connect({
      addr: 3000, // Cổng local server của bạn (thay đổi nếu khác)
    });

    console.log('Ngrok tunnel opened at:');
    console.log(url);
  } catch (err) {
    console.error('Error starting Ngrok tunnel:', err);
  }
})();
