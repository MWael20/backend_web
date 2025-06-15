document.addEventListener('DOMContentLoaded', async function () {
  const token = localStorage.getItem("token");
  console.log("✅ Token from localStorage:", token);

  if (!token) {
    alert("You are not logged in.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/v1/user", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("✅ Response status:", res.status);

    if (res.status === 401) {
      throw new Error("Unauthorized. Token may be invalid or expired.");
    }

    const users = await res.json();
    console.log("✅ Users received:", users);

    if (!Array.isArray(users)) {
      throw new Error("Invalid user data received from server.");
    }

    // ✅ Count and display
    document.getElementById('total-users').textContent = users.length;
    document.getElementById('admin-count').textContent = users.filter(u => u.is_admin).length;
    document.getElementById('regular-count').textContent = users.filter(u => !u.is_admin).length;

    // ✅ Render user table
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';

    users.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user._id}</td>
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td class="${user.is_admin ? 'admin-role' : 'user-role'}">
          ${user.is_admin ? 'Admin' : 'User'}
        </td>
        <td>${new Date(user.createdAt || user.joinDate).toLocaleDateString()}</td>
        <td>
          <button class="action-btn edit-btn" onclick="editUser('${user._id}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="action-btn delete-btn" onclick="deleteUser('${user._id}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </td>
      `;
      usersList.appendChild(row);
    });

  } catch (err) {
    console.error("❌ Error fetching users:", err.message);
    alert("❌ Failed to fetch users: " + err.message);
    // Optional: Clear token and redirect to login
    localStorage.removeItem("token");
    setTimeout(() => window.location.href = "login.html", 2000);
  }
});
async function deleteUser(userId) {
  const token = localStorage.getItem("token");
  if (!confirm("Are you sure you want to delete this user?")) return;

  try {
    const res = await fetch(`http://localhost:3000/api/v1/user/${userId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Failed to delete user");

    alert(" User deleted successfully!");
    location.reload(); // Refresh the user list
  } catch (err) {
    console.error(" Error deleting user:", err.message);
    alert(" Failed to delete user.");
  }
}
function editUser(userId) {
  const row = document.querySelector(`button[onclick="editUser('${userId}')"]`).closest("tr");
  const nameCell = row.children[1];
  const emailCell = row.children[2];
  const roleCell = row.children[3]; // Admin/User role cell

  const currentName = nameCell.textContent;
  const currentEmail = emailCell.textContent;
  const isAdmin = roleCell.textContent === "Admin";

  row.setAttribute("data-original-name", currentName);
  row.setAttribute("data-original-email", currentEmail);
  row.setAttribute("data-original-role", isAdmin ? "Admin" : "User");

  nameCell.innerHTML = `<input type="text" value="${currentName}" id="edit-name-${userId}">`;
  emailCell.innerHTML = `<input type="email" value="${currentEmail}" id="edit-email-${userId}">`;

  roleCell.innerHTML = `
    <label>
      <input type="checkbox" id="edit-admin-${userId}" ${isAdmin ? "checked" : ""}>
      Is Admin
    </label>
  `;

  const actionsCell = row.children[5];
  actionsCell.innerHTML = `
    <button class="action-btn save-btn" onclick="saveUser('${userId}')">
      <i class="fas fa-save"></i> Save
    </button>
    <button class="action-btn cancel-btn" onclick="cancelEdit('${userId}')">
      <i class="fas fa-times"></i> Cancel
    </button>
  `;
}



async function saveUser(userId) {
  const token = localStorage.getItem("token");
  const newName = document.getElementById(`edit-name-${userId}`).value;
  const newEmail = document.getElementById(`edit-email-${userId}`).value;
  const isAdmin = document.getElementById(`edit-admin-${userId}`).checked;

  try {
    const res = await fetch(`http://localhost:3000/api/v1/user/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ username: newName, email: newEmail, is_admin: isAdmin })
    });

    if (!res.ok) throw new Error("Failed to update user");

    alert("User updated successfully!");
    location.reload();
  } catch (err) {
    console.error("Error updating user:", err.message);
    alert("Failed to update user.");
  }
}

function cancelEdit(userId) {
  const row = document.querySelector(`button[onclick="saveUser('${userId}')"]`).closest("tr");

  const originalName = row.getAttribute("data-original-name");
  const originalEmail = row.getAttribute("data-original-email");
  const originalRole = row.getAttribute("data-original-role");

  row.children[1].textContent = originalName;
  row.children[2].textContent = originalEmail;
  row.children[3].textContent = originalRole;

  row.children[5].innerHTML = `
    <button class="action-btn edit-btn" onclick="editUser('${userId}')">
      <i class="fas fa-edit"></i> Edit
    </button>
    <button class="action-btn delete-btn" onclick="deleteUser('${userId}')">
      <i class="fas fa-trash"></i> Delete
    </button>
  `;
}


