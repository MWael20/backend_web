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
          <p><strong>Price:</strong> ${product.price} EGP</p>
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

    // ✅ Add event listener for cart button
    document.getElementById("addToCartBtn").addEventListener("click", () => {
      const msg = document.getElementById("cartMessage");
      msg.style.display = "inline";
      setTimeout(() => {
        msg.style.display = "none";
      }, 2000);
    });

  } catch (error) {
    console.error("Error loading product:", error);
    document.getElementById("product-details").innerHTML = "<p>Error loading product.</p>";
  }
});
