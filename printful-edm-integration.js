class PrintfulEDMIntegration {


    constructor(config) {
      this.containerId = config.container;
      this.container = document.getElementById(this.containerId);
      this.showProductSelector = config.showProductSelector;
      this.edmInstance = null;
      this.apiBaseUrl = 'https://customizer-app-backend.vercel.app/api/printful';
      this._pendingProductId = null;
      this.params = new URLSearchParams(window.location.search);
      this.prodID = this.params.get('id');
      
      this.loadEmbedScript();
    }
    
    /**
     * Load the Printful embed.js script
     */
    loadEmbedScript() {
      if (window.printfulEmbedScriptLoaded) {
        this.initializeEDM();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://files.cdn.printful.com/embed/embed.js';
      script.async = true;
      script.onload = () => {
        window.printfulEmbedScriptLoaded = true;
        this.initializeEDM();
      };
      document.head.appendChild(script);
    }
    
    /**
     * Initialize the EDM after script is loaded
     */
    async initializeEDM() {
      try {
        // Show loading indicator
        this.showLoading();
        
        // Get the authentication nonce from the backend
        const auth = await this.getAuthNonce();
        
        if (!auth || !auth.result.nonce) {
          throw new Error('Failed to get authentication token');
        }
        
        // Initialize the EDM with the nonce
        const options = {
          elemId: this.containerId,
          nonce: auth.result.nonce.nonce,
          external_product_id: this.prodID,
          initProduct: {
            productId: this.prodID,
          } ,
          locale: 'en_US',
          disabledPlacements: [],
          isVariantSelectionDisabled: false,
          disabledColors: [],
          disabledSizes: [],
          preselectedColors: [],
          preselectedSizes: ["S"],
          preselectedProductOptions: {},
          applyImageFromUrl: '',
          useUserConfirmationErrors: false,
          allowOnlyOneColorToBeSelected: false,
          allowOnlyOneSizeToBeSelected: false,
          useEmbroideryPreviewInDesign: false,
          featureConfig: {
              clipart_layers: true,
              file_layers: true,
              text_layers: true,
              embroidery_3d_puff: true,
              has_color_group_inside_labels: false,
              sub_technique_switcher: true,
              has_external_user_file_library: false,
              show_unavailability_info: true,
              custom_external_file_library: false,
              initial_open_view: ''
          },
          livePricingConfig: {
            useLivePricing: true,
            useAccountBasedPricing: false,
            showPricesInPlacementsTabs: true,
            livePricingCurrency: 'USD'
            },
          iframeClassName: 'edm-iframe',
          onTemplateSaved: (templateId) => {
            console.log('Design saved:', templateId);
            this.handleSavedDesign(templateId);
          }
  
        };
        
        // Create the EDM instance
        this.edmInstance = new window.PFDesignMaker(options);
        
        
        console.log('Printful EDM initialized successfully');
  
        document.getElementById('save-design-btn').style.display = "block";
        
        this.hideLoading();
      } catch (error) {
        console.error('Failed to initialize Printful EDM:', error);
        this.showError('Failed to load the design tool. Please try again later.');
        this.hideLoading();
      }
    }
    
    /**
     * Get authentication nonce from the backend
     */
    async getAuthNonce() {
      try {
        const response = await fetch(`${this.apiBaseUrl}/embedded-designer/nonces`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              external_product_id: `${this.prodID}`,
          }),
          });
  
        
        if (!response.ok) {
          throw new Error(`Failed to get nonce: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error getting auth nonce:', error);
        throw error;
      }
    }
    
  
    
    
    /**
     * Handle a saved design
     */
    handleSavedDesign(templateId) {

      console.log('Saving design to backend:', templateId);
      
      // Add to backend db
      fetch('https://customizer-app-backend.vercel.app/api/shopify/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: templateId,
          user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
          productId: this.prodID
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Added to backend:', data);
        window.location.href = `/pages/product-catalog`; // Redirect to the EDM page with templateId and productId
      })
      .catch(error => {
        console.error('Error adding to backend:', error);
        this.showError('Failed to add the design to your backend.');
      });
    }
    
    /**
     * Show loading indicator
     */
    showLoading() {
      // Check if loading element exists, create if not
      let loadingEl = document.getElementById('printful-edm-loading');
      if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'printful-edm-loading';
        loadingEl.className = 'printful-edm-loading';
        loadingEl.innerHTML = '<div class="spinner"></div><p>Loading design tool...</p>';
        
        // Insert before the container
        this.container.parentNode.insertBefore(loadingEl, this.container);
        
        // Style the loading indicator
        loadingEl.style.display = 'flex';
        loadingEl.style.flexDirection = 'column';
        loadingEl.style.alignItems = 'center';
        loadingEl.style.justifyContent = 'center';
        loadingEl.style.padding = '40px 20px';
        loadingEl.style.backgroundColor = '#f8f9fa';
        loadingEl.style.borderRadius = '4px';
        loadingEl.style.marginBottom = '20px';
        
        // Style the spinner
        const spinner = loadingEl.querySelector('.spinner');
        spinner.style.border = '4px solid #f3f3f3';
        spinner.style.borderTop = '4px solid #3498db';
        spinner.style.borderRadius = '50%';
        spinner.style.width = '40px';
        spinner.style.height = '40px';
        spinner.style.animation = 'spin 1s linear infinite';
        
        // Add the animation (if not already added)
        if (!document.getElementById('printful-animations')) {
          const style = document.createElement('style');
          style.id = 'printful-animations';
          style.textContent = `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `;
          document.head.appendChild(style);
        }
      } else {
        loadingEl.style.display = 'flex';
      }
      
      // Hide the container while loading
      this.container.style.display = 'none';
    }
  
   // Updated saveDesign method
saveDesign() {
  this.showUserModal();
}

// Create and show the user input modal
showUserModal() {
  // Create modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 8px;
    width: 400px;
    max-width: 90vw;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `;

  modalContent.innerHTML = `
    <h2 style="margin-top: 0; margin-bottom: 20px; color: #333;">Save Design</h2>
    <form id="userForm">
      <div style="margin-bottom: 15px;">
        <label for="userName" style="display: block; margin-bottom: 5px; font-weight: bold;">Name:</label>
        <input type="text" id="userName" name="name" required 
               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
      </div>
      <div style="margin-bottom: 20px;">
        <label for="userEmail" style="display: block; margin-bottom: 5px; font-weight: bold;">Email:</label>
        <input type="email" id="userEmail" name="email" required 
               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button type="button" id="cancelBtn" 
                style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">
          Cancel
        </button>
        <button type="submit" 
                style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Save Design
        </button>
      </div>
    </form>
  `;

  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  // Handle form submission
  const form = document.getElementById('userForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    
    if (name && email) {
      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.innerHTML = '<div style="display: inline-block; width: 16px; height: 16px; margin-right: 8px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>Saving...';
      submitBtn.disabled = true;
      
      try {
        // Create user object
        const user = {
          name: name,
          email: email,
          timestamp: new Date().toISOString()
        };
        
        // Save user data
        this.saveUserData(user);
        
        // Proceed with save design functionality
        this.edmInstance.sendMessage({ event: 'saveDesign' });
        
        // Wait for the save to complete (simulate API delay)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Close modal and show success message
        document.body.removeChild(modalOverlay);
        this.showSuccessMessage("Design saved successfully!");
        
      } catch (error) {
        // Reset button and show error
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        this.showError("Failed to save design. Please try again.");
      }
    }
  });

  // Handle cancel button
  document.getElementById('cancelBtn').addEventListener('click', () => {
    document.body.removeChild(modalOverlay);
  });

  // Close modal when clicking outside
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      document.body.removeChild(modalOverlay);
    }
  });

  // Focus on name input
  setTimeout(() => {
    document.getElementById('userName').focus();
  }, 100);
}

// Save user data as JSON
saveUserData(user) {
  // Option 1: Save to localStorage
  localStorage.setItem('user', JSON.stringify(user));
  
}
    
    /**
     * Hide loading indicator
     */
    hideLoading() {
      const loadingEl = document.getElementById('printful-edm-loading');
      if (loadingEl) {
        loadingEl.style.display = 'none';
      }
      
      // Show the container
      this.container.style.display = 'block';
    }
    
    /**
     * Show an error message to the user
     */
    showError(message) {
      this.showMessage(message, 'error');
    }
    
    /**
     * Show a success message to the user
     */
    showSuccessMessage(message) {
      this.showMessage(message, 'success');
    }
    
    /**
     * Show a message to the user with specified type
     */
    showMessage(message, type = 'info') {
      // Create a message element
      const messageEl = document.createElement('div');
      messageEl.className = `printful-edm-message printful-edm-${type}`;
      messageEl.textContent = message;
      
      // Insert before the container
      this.container.parentNode.insertBefore(messageEl, this.container);
      
      // Style the message based on type
      const styles = {
        error: { backgroundColor: '#f8d7da', color: '#721c24' },
        success: { backgroundColor: '#d4edda', color: '#155724' },
        info: { backgroundColor: '#d1ecf1', color: '#0c5460' }
      };
      
      const style = styles[type] || styles.info;
      messageEl.style.backgroundColor = style.backgroundColor;
      messageEl.style.color = style.color;
      messageEl.style.padding = '12px 16px';
      messageEl.style.borderRadius = '4px';
      messageEl.style.marginBottom = '10px';
      messageEl.style.border = `1px solid ${type === 'error' ? '#f5c6cb' : type === 'success' ? '#c3e6cb' : '#bee5eb'}`;
      
      // Remove after 5 seconds
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.remove();
        }
      }, 5000);
    }
  }