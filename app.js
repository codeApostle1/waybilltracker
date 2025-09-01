
// ===========================
// INITIAL DATA
// ===========================
let products = [
  "25KG", "50KG", "AQUA 2MM", "AQUA 3MM", "BPLUS", "CCP", "CFP", "CGM", "CGP", 
  "CL1C", "CSSP", "CL1M", "CROWN 3MM", "CROWN 4MM", "CROWN 6MM", "CROWN 9MM", 
  "ECO 6MM", "ECO9MM", "TFCON", "TGC", "TGP", "TSSC", "TSSCON", "UCP", 
  "UFP", "UGP", "UL1C", "UPLUS", "USSP"
];

let waitlist = JSON.parse(localStorage.getItem("waitlist")) || [];
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];

// ===========================
// HELPERS
// ===========================
function saveData() {
  localStorage.setItem("waitlist", JSON.stringify(waitlist));
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("history", JSON.stringify(history));
}

function generateId() {
  return Date.now() + Math.random().toString(36).substring(2, 9);
}

// ===========================
// PAGE: ORDERS (Wait-List)
// ===========================
function setupOrdersPage() {
  const productSelect = document.getElementById("itemName");
  const orderForm = document.getElementById("orderForm");
  const tableBody = document.querySelector("#waitlistTable tbody");
  const confirmArrivalBtn = document.getElementById("confirmArrivalBtn");
  const arrivalInput = document.getElementById("arrivalWaybill");

  if (!productSelect || !orderForm || !tableBody) return; // Not on this page

  // Populate dropdown
  productSelect.innerHTML = products.map(p => `<option value="${p}">${p}</option>`).join("");

  function renderTable() {
    tableBody.innerHTML = waitlist.map(order => `
      <tr>
        <td>${order.waybill}</td>
        <td>${order.date}</td>
        <td>${order.items.map(i => `${i.name} (${i.qty})`).join(", ")}</td>
        <td>
          <button onclick="removeWaybill('${order.id}')">❌ Remove</button>
        </td>
      </tr>
    `).join("");
  }

  // Add new order
  orderForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const waybill = document.getElementById("waybill").value.trim();
    const confirmWaybill = document.getElementById("confirmWaybill").value.trim();
    const date = document.getElementById("date").value;
    const itemName = document.getElementById("itemName").value;
    const qty = parseInt(document.getElementById("quantity").value);
    const price = parseFloat(document.getElementById("price").value) || null;

    if (waybill !== confirmWaybill) {
      alert("Waybill numbers do not match!");
      return;
    }

    let order = waitlist.find(o => o.waybill === waybill);
    if (!order) {
      order = { id: generateId(), waybill, date, items: [] };
      waitlist.push(order);
    }

    order.items.push({ name: itemName, qty, price });
    saveData();
    renderTable();
    orderForm.reset();
  });

  // Confirm arrival
  confirmArrivalBtn.addEventListener("click", () => {
    const enteredWaybill = arrivalInput.value.trim();
    if (!enteredWaybill) return alert("Please enter a waybill number.");

    const orderIndex = waitlist.findIndex(o => o.waybill === enteredWaybill);
    if (orderIndex === -1) return alert("Waybill not found!");

    const order = waitlist[orderIndex];

    order.items.forEach(item => {
      let invItem = inventory.find(i => i.name === item.name);
      if (!invItem) {
        invItem = { name: item.name, qty: 0 };
        inventory.push(invItem);
      }
      invItem.qty += item.qty;

      history.push({
        name: item.name,
        waybill: order.waybill,
        dateOrdered: order.date,
        dateReceived: new Date().toISOString().split("T")[0],
        qty: item.qty
      });
    });

    waitlist.splice(orderIndex, 1);
    saveData();
    renderTable();
    alert(`Waybill ${enteredWaybill} confirmed!`);
    arrivalInput.value = "";
  });

  renderTable();
}

// ===========================
// Remove Waybill
// ===========================
function removeWaybill(id) {
  if (!confirm("Are you sure you want to remove this entire waybill?")) return;
  waitlist = waitlist.filter(o => o.id !== id);
  saveData();
  location.reload();
}

// ===========================
// PAGE: INVENTORY
// ===========================
// ===========================
// PAGE: INVENTORY
// ===========================
function setupInventoryPage() {
  const tableBody = document.querySelector("#inventoryTable tbody");
  if (!tableBody) return;
  
  function renderInventory() {
    tableBody.innerHTML = inventory.map((item, index) => `
      <tr>
        <td><a href="#" onclick="showItemHistory('${item.name}')">${item.name}</a></td>
        <td>${item.qty}</td>
        <td>
          <button onclick="adjustQty(${index}, 1)">➕ Add</button>
          <button onclick="adjustQty(${index}, -1)">➖ Subtract</button>
        </td>
      </tr>
    `).join("");
  }
  
  window.adjustQty = function(index, change) {
    const newQty = inventory[index].qty + change;
    if (newQty < 0) return alert("Quantity cannot be negative!");
    inventory[index].qty = newQty;
    saveData();
    renderInventory();
  };
  
  renderInventory();
}

// ===========================
// SHOW ITEM HISTORY
// ===========================
window.showItemHistory = function(itemName) {
  const itemHistory = history.filter(h => h.name === itemName);
  
  if (itemHistory.length === 0) {
    alert(`No history found for ${itemName}`);
    return;
  }
  
  // Create modal dynamically
  const modal = document.createElement("div");
  modal.classList.add("modal");
  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>History for ${itemName}</h2>
      <table>
        <thead>
          <tr>
            <th>Waybill</th>
            <th>Date Ordered</th>
            <th>Date Received</th>
            <th>Qty</th>
          </tr>
        </thead>
        <tbody>
          ${itemHistory.map(h => `
            <tr>
              <td>${h.waybill}</td>
              <td>${h.dateOrdered}</td>
              <td>${h.dateReceived}</td>
              <td>${h.qty}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Close modal
  modal.querySelector(".close").onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
};
// ===========================
// PAGE: HISTORY
// ===========================
function setupHistoryPage() {
  const tableBody = document.querySelector("#historyTable tbody");
  if (!tableBody) return;

  tableBody.innerHTML = history.map(h => `
    <tr>
      <td>${h.waybill}</td>
      <td>${h.dateOrdered}</td>
      <td>${h.dateReceived}</td>
      <td>${h.qty}</td>
    </tr>
  `).join("");
}



// ===========================
// PAGE INIT
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  setupOrdersPage();
  setupInventoryPage();
  setupHistoryPage();
});


// // ===========================
// // INITIAL DATA
// // ===========================
// let products = [
//   "25KG", "50KG", "AQUA 2MM", "AQUA 3MM", "BPLUS", "CCP", "CFP", "CGM", "CGP", 
//   "CL1C", "CSSP", "CL1M", "CROWN 3MM", "CROWN 4MM", "CROWN 6MM", "CROWN 9MM", 
//   "ECO 6MM", "ECO9MM", "TFCON", "TGC", "TGP", "TSSC", "TSSCON", "UCP", 
//   "UFP", "UGP", "UL1C", "UPLUS", "USSP"
// ];

// let waitlist = JSON.parse(localStorage.getItem("waitlist")) || [];
// let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
// let history = JSON.parse(localStorage.getItem("history")) || [];

// // ===========================
// // HELPERS
// // ===========================
// function saveData() {
//   localStorage.setItem("waitlist", JSON.stringify(waitlist));
//   localStorage.setItem("inventory", JSON.stringify(inventory));
//   localStorage.setItem("history", JSON.stringify(history));
// }

// function generateId() {
//   return Date.now() + Math.random().toString(36).substring(2, 9);
// }

// // ===========================
// // PAGE: ORDERS (Wait-List)
// // ===========================
// function setupOrdersPage() {
//   const productSelect = document.getElementById("itemName");
//   const orderForm = document.getElementById("orderForm");
//   const tableBody = document.querySelector("#waitlistTable tbody");
//   const confirmArrivalBtn = document.getElementById("confirmArrivalBtn");
//   const arrivalInput = document.getElementById("arrivalWaybill");

//   if (!productSelect || !orderForm || !tableBody) return; // Not on this page

//   // Populate dropdown
//   productSelect.innerHTML = products.map(p => `<option value="${p}">${p}</option>`).join("");

//   // Render Waitlist Table
//   function renderTable() {
//     tableBody.innerHTML = waitlist.map(order => `
//       <tr>
//         <td>${order.waybill}</td>
//         <td>${order.date}</td>
//         <td>${order.items.map(i => `${i.name} (${i.qty})`).join(", ")}</td>
//         <td>
//           <button onclick="removeWaybill('${order.id}')">❌ Remove</button>
//         </td>
//       </tr>
//     `).join("");
//   }

//   // Add new order
//   orderForm.addEventListener("submit", (e) => {
//     e.preventDefault();

//     const waybill = document.getElementById("waybill").value.trim();
//     const confirmWaybill = document.getElementById("confirmWaybill").value.trim();
//     const date = document.getElementById("date").value;
//     const itemName = document.getElementById("itemName").value;
//     const qty = parseInt(document.getElementById("quantity").value);
//     const price = parseFloat(document.getElementById("price").value) || null;

//     if (waybill !== confirmWaybill) {
//       alert("Waybill numbers do not match!");
//       return;
//     }

//     // Find or create this waybill entry
//     let order = waitlist.find(o => o.waybill === waybill);
//     if (!order) {
//       order = {
//         id: generateId(),
//         waybill,
//         date,
//         items: []
//       };
//       waitlist.push(order);
//     }

//     order.items.push({ name: itemName, qty, price });
//     saveData();
//     renderTable();
//     orderForm.reset();
//   });

//   // Confirm arrival
//   confirmArrivalBtn.addEventListener("click", () => {
//     const enteredWaybill = arrivalInput.value.trim();
//     if (!enteredWaybill) {
//       alert("Please enter a waybill number.");
//       return;
//     }

//     const orderIndex = waitlist.findIndex(o => o.waybill === enteredWaybill);
//     if (orderIndex === -1) {
//       alert("Waybill not found!");
//       return;
//     }

//     const order = waitlist[orderIndex];

//     // Move items to inventory
//     order.items.forEach(item => {
//       let invItem = inventory.find(i => i.name === item.name);
//       if (!invItem) {
//         invItem = { name: item.name, qty: 0 };
//         inventory.push(invItem);
//       }
//       invItem.qty += item.qty;

//       // Add history
//       history.push({
//         name: item.name,
//         waybill: order.waybill,
//         dateOrdered: order.date,
//         dateReceived: new Date().toISOString().split("T")[0],
//         qty: item.qty
//       });
//     });

//     // Remove waybill from waitlist
//     waitlist.splice(orderIndex, 1);
//     saveData();
//     renderTable();
//     alert(`Waybill ${enteredWaybill} confirmed and moved to inventory!`);
//     arrivalInput.value = "";
//   });

//   // Initial render
//   renderTable();
// }

// // ===========================
// // Remove Waybill
// // ===========================
// function removeWaybill(id) {
//   if (!confirm("Are you sure you want to remove this entire waybill?")) return;
//   waitlist = waitlist.filter(o => o.id !== id);
//   saveData();
//   location.reload();
// }

// // ===========================
// // PAGE INIT
// // ===========================
// document.addEventListener("DOMContentLoaded", () => {
//   setupOrdersPage();
// });



// // ===========================
// // INITIAL DATA
// // ===========================
// let products = [
//   "25KG", "50KG", "AQUA 2MM", "AQUA 3MM", "BPLUS", "CCP", "CFP", "CGM", "CGP", 
//   "CL1C", "CSSP", "CL1M", "CROWN 3MM", "CROWN 4MM", "CROWN 6MM", "CROWN 9MM", 
//   "ECO 6MM", "ECO9MM", "TFCON", "TGC", "TGP", "TSSC", "TSSCON", "UCP", 
//   "UFP", "UGP", "UL1C", "U myPLUS", "USSP"
// ];

// // Load saved data
// let waitlist = JSON.parse(localStorage.getItem("waitlist")) || [];

// // ===========================
// // HELPERS
// // ===========================
// function saveWaitlist() {
//   localStorage.setItem("waitlist", JSON.stringify(waitlist));
// }

// function generateId() {
//   return Date.now() + Math.random().toString(36).substring(2, 9);
// }

// // ===========================
// // PAGE: ORDERS (Wait-List)
// // ===========================
// function setupOrdersPage() {
//   const productSelect = document.getElementById("itemName");
//   const orderForm = document.getElementById("orderForm");
//   const tableBody = document.querySelector("#waitlistTable tbody");

//   if (!productSelect || !orderForm || !tableBody) return; // Exit if not on orders.html

//   // Populate dropdown
//   productSelect.innerHTML = products.map(p => `<option value="${p}">${p}</option>`).join("");

//   // Render Waitlist Table
//   function renderTable() {
//     tableBody.innerHTML = waitlist.map(order => `
//       <tr>
//         <td>${order.waybill}</td>
//         <td>${order.date}</td>
//         <td>${order.items.map(i => `${i.name} (${i.qty})`).join(", ")}</td>
//         <td>
//           <button onclick="removeWaybill('${order.id}')">❌ Remove</button>
//         </td>
//       </tr>
//     `).join("");
//   }

//   // Add new order
//   orderForm.addEventListener("submit", (e) => {
//     e.preventDefault();

//     const waybill = document.getElementById("waybill").value.trim();
//     const confirmWaybill = document.getElementById("confirmWaybill").value.trim();
//     const date = document.getElementById("date").value;
//     const itemName = document.getElementById("itemName").value;
//     const qty = parseInt(document.getElementById("quantity").value);
//     const price = parseFloat(document.getElementById("price").value) || null;

//     if (waybill !== confirmWaybill) {
//       alert("Waybill numbers do not match!");
//       return;
//     }

//     // Check if this waybill already exists
//     let order = waitlist.find(o => o.waybill === waybill);
//     if (!order) {
//       order = {
//         id: generateId(),
//         waybill,
//         date,
//         items: []
//       };
//       waitlist.push(order);
//     }

//     order.items.push({ name: itemName, qty, price });
//     saveWaitlist();
//     renderTable();
//     orderForm.reset();
//   });

//   // Render initial table
//   renderTable();
// }

// // Remove Waybill
// function removeWaybill(id) {
//   if (!confirm("Are you sure you want to remove this entire waybill?")) return;
//   waitlist = waitlist.filter(o => o.id !== id);
//   saveWaitlist();
//   location.reload();
// }

// // ===========================
// // PAGE INIT
// // ===========================
// document.addEventListener("DOMContentLoaded", () => {
//   setupOrdersPage();
// });&& 