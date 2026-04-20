// Icona Premium Virtual Try-On Script

const IconaVTO = (function () {
  const state = {
    productId: null,
    productImage: null,
    userImage: null,
    shop: window.Shopify ? window.Shopify.shop : '',
  };

  function init() {
    const root = document.getElementById('icona-vto-root');
    if (root) {
      state.productId = root.getAttribute('data-product-id');
      state.productImage = root.getAttribute('data-original-image');
    }

    const modal = document.getElementById('icona-vto-modal');
    if (modal) {
      // Move modal to body to bypass parent relative positioning/clipping
      document.body.appendChild(modal);
    }

    const fileInput = document.getElementById('icona-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', handleFileSelect);
    }
  }

  function openModal() {
    const modal = document.getElementById('icona-vto-modal');
    if (modal) {
      modal.classList.remove('icona-hidden');
      document.body.classList.add('icona-vto-no-scroll');
    }
  }

  function closeModal() {
    const modal = document.getElementById('icona-vto-modal');
    if (modal) {
      modal.classList.add('icona-hidden');
      document.body.classList.remove('icona-vto-no-scroll');
    }
  }

  function setStep(stepName) {
    document.querySelectorAll('.icona-vto-step').forEach(step => {
      step.classList.remove('icona-active');
    });
    document.getElementById(`icona-vto-step-${stepName}`).classList.add('icona-active');
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      state.userImage = e.target.result; // Base64
      processVirtualTryOn();
    };
    reader.readAsDataURL(file);
  }

  async function processVirtualTryOn() {
    setStep('loading');

    try {
      // Setup payload for our App Proxy
      const payload = {
        shop: state.shop,
        productId: state.productId,
        productImage: state.productImage,
        userImage: state.userImage
      };

      // In Shopify, the app proxy is usually configured at '/apps/api' or similar. 
      // We will assume '/apps/icona-api/try-on' for now.
      const proxyUrl = '/apps/icona/api/try-on';

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1' // If using ngrok
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();

      if (result.success && result.imageUrl) {
        document.getElementById('icona-result-img').src = result.imageUrl;
        setStep('result');
      } else {
        alert("Sorry, we couldn't generate the try-on. " + (result.error || ''));
        reset();
      }

    } catch (error) {
      console.error('Error processing try-on:', error);
      alert("Failed to process image. Please try again.");
      reset();
    }
  }

  function reset() {
    const fileInput = document.getElementById('icona-file-input');
    if (fileInput) fileInput.value = '';
    state.userImage = null;
    setStep('upload');
  }

  function downloadResult() {
    const imgUrl = document.getElementById('icona-result-img').src;
    if (!imgUrl) return;

    // Create a temporary link to download
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = 'virtual-try-on.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Initialize on load
  document.addEventListener('DOMContentLoaded', init);

  return {
    openModal,
    closeModal,
    reset,
    downloadResult
  };
})();
