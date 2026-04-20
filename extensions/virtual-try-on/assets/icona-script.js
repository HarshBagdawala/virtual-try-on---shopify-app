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
      const payload = {
        shop: state.shop,
        productId: state.productId,
        productImage: state.productImage,
        userImage: state.userImage
      };

      const resp = await fetch('/apps/icona/api/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) throw new Error('Network response was not ok');
      const result = await resp.json();

      if (result.success && result.tryOnId) {
        // Start polling for the actual result
        pollStatus(result.tryOnId);
      } else {
        alert("Failed to start try-on: " + (result.error || 'Unknown error'));
        reset();
      }
    } catch (error) {
      console.error('Error starting try-on:', error);
      alert("Failed to process image. Please try again.");
      reset();
    }
  }

  async function pollStatus(tryOnId) {
    const pollInterval = 3000; // 3 seconds
    let attempts = 0;
    const maxAttempts = 40; // Total 120 seconds

    const timer = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(timer);
        alert("Generation is taking longer than expected. Please try again later.");
        reset();
        return;
      }

      try {
        const resp = await fetch('/apps/icona/api/poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tryOnId })
        });

        if (!resp.ok) return; // Keep polling if network error
        const data = await resp.json();

        if (data.status === 'COMPLETED' && data.imageUrl) {
          clearInterval(timer);
          document.getElementById('icona-result-img').src = data.imageUrl;
          setStep('result');
        } else if (data.status === 'FAILED') {
          clearInterval(timer);
          alert("Try-on failed: " + (data.error || 'Unknown error'));
          reset();
        }
        // If still PENDING, let the interval fire again
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, pollInterval);
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
