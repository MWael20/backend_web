document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    document.getElementById("product-details").innerHTML = "<p>Product not found</p>";
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/v1/product/${productId}`);
    const data = await response.json();

    if (!data || !data.name) {
      document.getElementById("product-details").innerHTML = "<p>Product not found</p>";
      return;
    }

    const product = data;

    let brandName = "Unknown Brand";
    if (product.brand) {
      brandName = typeof product.brand === 'object' && product.brand.name
        ? product.brand.name
        : product.brand;
    }

    const html = `
      <div class="product-detail-card">
        <img src="${product.image}" alt="${product.name}" class="product-details-image">
        <div class="product-info">
          <h2>${product.name}</h2>
          <p><strong>Category:</strong> ${product.category?.name || "N/A"}</p>
          <p><strong>Brand:</strong> ${brandName}</p>
          <p class="price"><strong>Price:</strong> ${product.price} EGP</p>
          <p><strong>Quantity:</strong> ${product.quantity}</p>
          ${product.isFeatured ? '<p class="featured-badge">🌟 Featured</p>' : ""}
          <div class="product-description">
            <strong>Description:</strong>
            <p>${product.description}</p>
          </div>
          <button id="addToCartBtn" class="add-to-cart">Add to Cart</button>
          <span id="cartMessage" class="cart-message" style="display:none; color: green;">✔ Added to Cart!</span>
        </div>
      </div>
    `;

    document.getElementById("product-details").innerHTML = html;

    // Add to cart functionality
    document.getElementById("addToCartBtn").addEventListener("click", async () => {
      try {
        const token = localStorage.getItem('token');
        const newItem = {
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1
        };

        if (token) {
          // Add to server cart if logged in
          const response = await fetch('http://localhost:3000/api/v1/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId: product._id, quantity: 1 })
          });

          if (response.ok) {
            // Successfully added to server cart
            const data = await response.json();
            // Update local cart from server data
            if (data && Array.isArray(data.items)) {
              const cartItems = data.items.map(item => ({
                productId: item.product._id,
                name: item.product.name,
                price: item.product.price,
                image: item.product.image,
                quantity: item.quantity
              }));
              localStorage.setItem('cart', JSON.stringify(cartItems));
            }
          } else if (response.status === 401) {
            // Token expired or invalid, fall back to localStorage
            localStorage.removeItem('token');
            addToLocalCart(newItem);
          } else {
            throw new Error('Failed to add item to cart');
          }
        } else {
          // Add to localStorage if not logged in
          addToLocalCart(newItem);
        }

        // Show success message
        const msg = document.getElementById("cartMessage");
        msg.style.display = "inline";
        setTimeout(() => {
          msg.style.display = "none";
        }, 2000);

        // Update cart badge
        updateCartBadge();
        
        showNotification('Item added to cart!');
      } catch (error) {
        console.error("Error adding to cart:", error);
        showNotification('Failed to add item to cart', 'error');
      }
    });

  } catch (error) {
    console.error("Error loading product:", error);
    document.getElementById("product-details").innerHTML = "<p>Error loading product.</p>";
  }
});

// Helper function to add item to local cart
function addToLocalCart(newItem) {
  let cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
  const existingItemIndex = cartItems.findIndex(item => item.productId === newItem.productId);
  
  if (existingItemIndex !== -1) {
    cartItems[existingItemIndex].quantity = Math.min(cartItems[existingItemIndex].quantity + 1, 10);
  } else {
    cartItems.push(newItem);
  }
  
  localStorage.setItem('cart', JSON.stringify(cartItems));
}

// Update cart badge
function updateCartBadge() {
  const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.querySelector('.cart-badge');
  if (badge) {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'block' : 'none';
  }
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}
