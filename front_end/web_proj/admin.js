
 document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const productsTable = document.getElementById('products-table').getElementsByTagName('tbody')[0];
    const productForm = document.getElementById('product-data');
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    
    
    // Form fields
    const productIdField = document.getElementById('product-id');
    const productNameField = document.getElementById('product-name');
    const productCategoryField = document.getElementById('product-category');
    const productBrandField = document.getElementById('product-brand');
    const productIsFeaturedField = document.getElementById('product-featured');
    const productImageField = document.getElementById('product-image');
    const productPriceField = document.getElementById('product-price');
    const productStockField = document.getElementById('product-stock');
    const productDescriptionField = document.getElementById('product-description');
    
    // API Base URL
    const API_BASE_URL = 'http://localhost:3000/api/v1/product';
    
    // Current state
    let isEditing = false;
    let currentProductId = null;
    
    // Initialize the page
    init();
    
    function init() {
        loadProducts();
        loadCategories();
        loadBrands();
        setupEventListeners();
    }
    
    function setupEventListeners() {
        submitBtn.addEventListener('click', handleSubmit);
        cancelBtn.addEventListener('click', resetForm);
    }

    productImageField.addEventListener('change', function () {
  const preview = document.getElementById('image-preview');
  if (this.files && this.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(this.files[0]);
  } else {
    preview.src = '';
    preview.style.display = 'none';
  }
});
    
    // Load all products from the API
    async function loadProducts() {
        try {
            const response = await fetch(API_BASE_URL);
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            
            const products = await response.json();
            renderProducts(products);
        } catch (error) {
            showStatusMessage(`Error loading products: ${error.message}`, 'error');
            console.error('Error loading products:', error);
        }
    }
    
    // Render products in the table
function renderProducts(products) {
  productsTable.innerHTML = '';

  if (!products || products.length === 0) {
    const row = productsTable.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 8; // updated column count
    cell.textContent = 'No products found';
    cell.style.textAlign = 'center';
    return;
  }

  products.forEach(product => {
    const row = productsTable.insertRow();

    // ID
    const idCell = row.insertCell();
    idCell.textContent = product._id ? product._id.substring(0, 8) + '...' : 'N/A';

    // Name
    const nameCell = row.insertCell();
    nameCell.textContent = product.name || 'N/A';

    // Category
    const categoryCell = row.insertCell();
    categoryCell.textContent = product.category ? product.category.name : 'N/A';

    //  Brand
    const brandCell = row.insertCell();
    brandCell.textContent = product.brand ? product.brand.name : 'N/A';

    //  Featured
    const featuredCell = row.insertCell();
    featuredCell.textContent = product.isFeatured ? '✅' : '❌';

    // Price
    const priceCell = row.insertCell();
    priceCell.textContent = product.price ? `EGP ${product.price.toFixed(2)}` : 'N/A';
    // Image
    const imageCell = row.insertCell();
    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    img.style.width = '60px';
    img.style.height = 'auto';
    img.onerror = () => {
  img.onerror = null;
  img.src = '/placeholder.png';
};
    imageCell.appendChild(img);


    // Stock
    const stockCell = row.insertCell();
    stockCell.textContent = product.quantity || 0;

    // Actions
    const actionsCell = row.insertCell();

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'edit-btn';
    editBtn.addEventListener('click', async () => {
  await loadCategories();
  await loadBrands();
  editProduct(product);
   
});
actionsCell.appendChild(editBtn);
   

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.addEventListener('click', () => deleteProduct(product._id));
    actionsCell.appendChild(deleteBtn);
  });
}

    
 async function handleSubmit() {
  // Validate form inputs
  if (!validateForm()) return;

  // Prepare form data
  const formData = new FormData();
  formData.append('name', productNameField.value.trim());
  formData.append('category', productCategoryField.value);
  formData.append('price', productPriceField.value);
  formData.append('quantity', productStockField.value);
  formData.append('description', productDescriptionField.value.trim());
  formData.append('brand', productBrandField.value);
  formData.append('isFeatured', productIsFeaturedField.checked);

  // Only include image if a new file is selected
  if (productImageField.files.length > 0) {
    formData.append('image', productImageField.files[0]);
  }

  // Auth token
  const token = localStorage.getItem('token');

  // Determine request method and endpoint
    const isUpdate = isEditing && currentProductId;
  const method = 'POST';
  const url = isUpdate ? `${API_BASE_URL}/${currentProductId}?_method=PUT` : API_BASE_URL;


  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to save product');
    }

    // Show success and refresh list
    showStatusMessage(isUpdate ? 'Product updated successfully!' : 'Product created successfully!', 'success');
    loadProducts();
    resetForm();
  } catch (error) {
    showStatusMessage(`Error: ${error.message}`, 'error');
    console.error('Error submitting product:', error);
  }
}



// Edit a product
async function editProduct(product) {
    isEditing = true;
    currentProductId = product._id;

    // Update form title and submit button
    formTitle.textContent = 'Edit Product';
    submitBtn.textContent = 'Update Product';
    cancelBtn.style.display = 'inline-block'; // Show cancel button
    cancelBtn.onclick = () => cancelEditProduct(product._id); // Set cancel action

    // Ensure categories and brands are loaded before setting values
    await loadCategories();
    await loadBrands();

    // Populate form fields
    productNameField.value = product.name || '';
    productIdField.value = product._id;

    productCategoryField.value = product.category?._id || '';
    setBrandValue(product.brand?._id || '');
    productPriceField.value = product.price || '';
    productStockField.value = product.quantity || '';
    productDescriptionField.value = product.description || '';
    productIsFeaturedField.checked = product.isFeatured || false;

    // Show image preview
    const preview = document.getElementById('image-preview');
    preview.src = product.image || '';
    preview.style.display = product.image ? 'block' : 'none';

    // Optional: scroll to the form
    productForm.scrollIntoView({ behavior: 'smooth' });
}



function cancelEditProduct() {
  isEditing = false;
  currentProductId = null;
  formTitle.textContent = 'Add New Product';
  submitBtn.textContent = 'Add Product';
  cancelBtn.style.display = 'none';
  productForm.reset();
  const preview = document.getElementById('image-preview');
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
}

/**
 * Ensure the brand dropdown is correctly set when editing a product.
 * If the brand options are loaded asynchronously, sometimes the value
 * may not be set if the options are not present yet.
 * 
 * This helper can be called after loadBrands() in editProduct.
 */
function setBrandValue(brandId) {
    const productBrandField = document.getElementById('product-brand');
    // Try to set the value, fallback if not found
    if (brandId) {
        productBrandField.value = brandId;
        // If not set (option not loaded yet), try again after a short delay
        if (productBrandField.value !== brandId) {
            setTimeout(() => {
                productBrandField.value = brandId;
            }, 100);
        }
    }
}


   // Delete a product
  async function deleteProduct(productId) {
  const confirmed = confirm("Are you sure you want to delete this product?");
  if (!confirmed) return;

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`http://localhost:3000/api/v1/product/${productId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to delete product");
    }

    alert("✅ Product deleted successfully.");
    location.reload(); // ⬅️ Refresh the page to reflect the change

  } catch (err) {
    console.error("❌ Error deleting product:", err.message);
    alert("❌ Could not delete product: " + err.message);
  }
}



    // Reset the form to its initial state
    function resetForm() {
        isEditing = false;
        currentProductId = null;
        
        // Reset form title
        formTitle.textContent = 'Add New Product';
        
        // Reset submit button text
        submitBtn.textContent = 'Add Product';
        
        // Clear form fields
        productForm.reset();
    }
    
    // Validate the form
    function validateForm() {
  if (!productNameField.value.trim()) {
    showStatusMessage('Product name is required', 'error');
    return false;
  }

  if (!productCategoryField.value) {
    showStatusMessage('Category is required', 'error');
    return false;
  }

  // ✅ Validate Brand
  
  if (!productBrandField.value) {
    showStatusMessage('Brand is required', 'error');
    return false;
  }

  if (!productPriceField.value || parseFloat(productPriceField.value) <= 0) {
    showStatusMessage('Price must be greater than 0', 'error');
    return false;
  }

  if (!productStockField.value || parseInt(productStockField.value) < 0) {
    showStatusMessage('Stock quantity must be 0 or more', 'error');
    return false;
  }

  return true;
}

    
    // Show status message
    const statusMessage = document.getElementById('status-message');

function showStatusMessage(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message${type ? ' ' + type : ''}`;
  statusMessage.style.display = 'block';

  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 5000);
}


//  Fetch categories from API and populate the dropdown
async function loadCategories() {
  try {
    const response = await fetch("http://localhost:3000/api/v1/category");
    const categories = await response.json();

    const select = document.getElementById("product-category");
      select.innerHTML = '<option value="">Select a category</option>'; // Clear existing options
    const productCategoryField = document.getElementById("product-category");

    categories.forEach(category => {
      const option = document.createElement("option");
      option.value = category._id;           //  backend expects ID, not name
      option.textContent = category.name;    //  show readable name
      productCategoryField.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    showStatusMessage("Failed to load categories", "error");
  }
}
async function loadBrands() {
  try {
    const response = await fetch("http://localhost:3000/api/v1/brand");
    const brands = await response.json();

    const select = document.getElementById("product-brand");
    select.innerHTML = '<option value="">Select a brand</option>'; // Clear existing options
    const productBrandField = document.getElementById("product-brand");

    brands.forEach(brand => {
      const option = document.createElement("option");
      option.value = brand._id;
      option.textContent = brand.name;
      productBrandField.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching brands:", error);
    showStatusMessage("Failed to load brands", "error");
  }
}





document.getElementById('add-category-btn').addEventListener('click', async () => {
  const nameField = document.getElementById('category-name');
  const imageField = document.getElementById('category-image');

  if (!nameField.value.trim()) {
    showStatusMessage('❌ Category name is required.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('name', nameField.value.trim());
  if (imageField.files.length > 0) {
    formData.append('image', imageField.files[0]);
  }

  const token = localStorage.getItem('token');

  try {
    const res = await fetch('http://localhost:3000/api/v1/category', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Request failed');
    }

    const data = await res.json();

    showStatusMessage(`✅ Category "${data.name}" added successfully!`, 'success');

    // Reset form fields
    nameField.value = '';
    // No imageField for brand, so nothing else to reset here

    // Scroll back to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Reload page after 1 second to show fresh categories or changes
    setTimeout(() => {
      location.reload();
    }, 1000);

  } catch (err) {
    showStatusMessage(`❌ Error: ${err.message}`, 'error');
    console.error('Add category error:', err);
  }
});






document.getElementById('add-brand-btn').addEventListener('click', async () => {
  const nameField = document.getElementById('brand-name');

  if (!nameField.value.trim()) {
    showStatusMessage('❌ Brand name is required.', 'error');
    return;
  }

  const token = localStorage.getItem('token');

  try {
    const res = await fetch('http://localhost:3000/api/v1/brand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name: nameField.value.trim() })
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Request failed');
    }

    const data = await res.json();

    showStatusMessage(`✅ brand "${data.name}" added successfully!`, 'success');

    // Reset form fields
    nameField.value = '';

    // Scroll back to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Reload page after 1 second to show fresh categories or changes
    setTimeout(() => {
      location.reload();
    }, 1000);

  } catch (err) {
    showStatusMessage(`❌ Error: ${err.message}`, 'error');
    console.error('Add brand error:', err);
  }
});

});

