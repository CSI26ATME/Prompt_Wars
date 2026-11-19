
// ==========================================
// CAMPUSCARE - COMPLETE JAVASCRIPT
// ==========================================

// 1. DATA STORAGE
let users = JSON.parse(localStorage.getItem("users")) || [];
let complaints = JSON.parse(localStorage.getItem("complaints")) || [];
let currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || null;

let pieChartInstance = null;
let trendChartInstance = null;

const adminEmail = "admin@campus.edu";
const adminPassword = "Admin@123";

// ==========================================
// 2. SAVE DATA
// ==========================================

function saveData() {
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("complaints", JSON.stringify(complaints));
}

// ==========================================
// 3. SAFE TEXT
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// ==========================================
// 4. LOGIN AND REGISTER
// ==========================================

function showAuth(type) {
    document.getElementById("loginForm").classList.toggle("hidden", type !== "login");
    document.getElementById("registerForm").classList.toggle("hidden", type !== "register");
    document.getElementById("authMessage").textContent = "";
}

// REGISTER
document.getElementById("registerForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const password = document.getElementById("regPassword").value;

    if (users.some(u => u.email === email)) {
        document.getElementById("authMessage").textContent =
            "Email already registered!";
        return;
    }

    users.push({
        name,
        email,
        password,
        role: "student"
    });

    saveData();

    document.getElementById("authMessage").textContent =
        "Registration successful! Please login.";

    this.reset();
    showAuth("login");
});

// LOGIN
document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    if (email === adminEmail && password === adminPassword) {
        currentUser = {
            name: "Administrator",
            email: email,
            role: "admin"
        };

        openApp();
        return;
    }

    const user = users.find(u =>
        u.email === email && u.password === password
    );

    if (!user) {
        document.getElementById("authMessage").textContent =
            "Invalid email or password!";
        return;
    }

    currentUser = user;
    openApp();
});

// ==========================================
// 5. OPEN APPLICATION
// ==========================================

function openApp() {

    if (!currentUser) return;

    sessionStorage.setItem("currentUser", JSON.stringify(currentUser));

    document.getElementById("authScreen").classList.add("hidden");
    document.getElementById("appScreen").classList.remove("hidden");

    document.getElementById("profileName").textContent = currentUser.name;
    document.getElementById("sideUser").textContent = currentUser.name;

    const isAdmin = currentUser.role === "admin";

    document.getElementById("complaints").classList.toggle("hidden", !isAdmin);
    document.getElementById("analytics").classList.toggle("hidden", !isAdmin);

    document.querySelectorAll(".sidebar button").forEach(btn => {
        if (btn.textContent.includes("Complaints") ||
            btn.textContent.includes("Analytics")) {
            btn.classList.toggle("hidden", !isAdmin);
        }
    });

    page("dashboard");
}

// LOGOUT
function logout() {

    sessionStorage.removeItem("currentUser");
    currentUser = null;

    document.getElementById("appScreen").classList.add("hidden");
    document.getElementById("authScreen").classList.remove("hidden");

    document.getElementById("loginForm").reset();
    document.getElementById("registerForm").reset();

    showAuth("login");
}

// ==========================================
// 6. PAGE NAVIGATION
// ==========================================

function page(pageName) {

    if (!currentUser) return;

    const adminOnly = ["complaints", "analytics"];

    if (adminOnly.includes(pageName) && currentUser.role !== "admin") {
        alert("Only Admin can access this page!");
        return;
    }

    document.querySelectorAll(".page").forEach(section => {
        section.classList.add("hidden");
    });

    const selectedPage = document.getElementById(pageName);

    if (!selectedPage) return;

    selectedPage.classList.remove("hidden");

    const titles = {
        dashboard: "Dashboard",
        submit: "Submit Complaint",
        complaints: "All Complaints",
        analytics: "Analytics",
        tracking: "Complaint Tracking"
    };

    document.getElementById("pageTitle").textContent =
        titles[pageName] || "CampusCare";

    if (pageName === "dashboard") updateDashboard();
    if (pageName === "complaints") renderComplaints();
    if (pageName === "analytics") updateAnalytics();
}

// ==========================================
// 7. STUDENT SUBMIT COMPLAINT
// ==========================================

document.getElementById("complaintForm").addEventListener("submit", function(e) {

    e.preventDefault();

    if (!currentUser || currentUser.role !== "student") {
        alert("Only students can submit complaints.");
        return;
    }

    const complaint = {

        id: "CC" + Date.now().toString().slice(-7),

        email: currentUser.email,
        name: currentUser.name,

        category: document.getElementById("category").value,
        location: document.getElementById("location").value.trim(),
        description: document.getElementById("description").value.trim(),

        status: "Pending",

        date: new Date().toLocaleDateString(),
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),

        resolvedAt: null
    };

    complaints.push(complaint);

    saveData();

    document.getElementById("complaintMessage").textContent =
        "Complaint submitted successfully! Your Complaint ID: " + complaint.id;

    this.reset();

    updateDashboard();
});

// ==========================================
// 8. DASHBOARD
// ==========================================

function updateDashboard() {

    if (!currentUser) return;

    const visibleComplaints = currentUser.role === "admin"
        ? complaints
        : complaints.filter(c => c.email === currentUser.email);

    const total = visibleComplaints.length;

    const pending = visibleComplaints.filter(c => c.status === "Pending").length;

    const progress = visibleComplaints.filter(c => c.status === "In Progress").length;

    const resolved = visibleComplaints.filter(c => c.status === "Resolved").length;

    document.getElementById("totalCount").textContent = total;
    document.getElementById("pendingCount").textContent = pending;
    document.getElementById("progressCount").textContent = progress;
    document.getElementById("resolvedCount").textContent = resolved;

    document.getElementById("recentComplaints").innerHTML =

        visibleComplaints.slice(-5).reverse().map(c => `
            <div class="recent-item">
                <b>${escapeHTML(c.id)}</b>
                <p>${escapeHTML(c.category)}</p>
                <span class="status">${escapeHTML(c.status)}</span>
            </div>
            <hr>
        `).join("") || "<p>No complaints submitted yet.</p>";
}

// ==========================================
// 9. ADMIN - VIEW ALL COMPLAINTS
// ==========================================

function renderComplaints() {

    if (!currentUser || currentUser.role !== "admin") return;

    const tbody = document.getElementById("complaintTable");

    tbody.innerHTML = complaints.map((c, index) => `

        <tr>

            <td>${escapeHTML(c.id)}</td>

            <td>${escapeHTML(c.name)}</td>

            <td>${escapeHTML(c.category)}</td>

            <td>${escapeHTML(c.location)}</td>

            <td>${escapeHTML(c.description)}</td>

            <td class="status">
                ${escapeHTML(c.status)}
            </td>

            <td>
                <button onclick="viewComplaint(${index})">
                    View
                </button>
            </td>

            <td>
                <select onchange="changeStatus(${index}, this.value)">

                    <option value="Pending"
                        ${c.status === "Pending" ? "selected" : ""}>
                        Pending
                    </option>

                    <option value="In Progress"
                        ${c.status === "In Progress" ? "selected" : ""}>
                        In Progress
                    </option>

                    <option value="Resolved"
                        ${c.status === "Resolved" ? "selected" : ""}>
                        Resolved
                    </option>

                </select>
            </td>

        </tr>

    `).join("") || `
        <tr>
            <td colspan="8">No complaints found.</td>
        </tr>
    `;
}

// ==========================================
// 10. ADMIN - VIEW COMPLAINT DETAILS
// ==========================================

function viewComplaint(index) {

    if (!currentUser || currentUser.role !== "admin") return;

    const c = complaints[index];

    alert(
        "CAMPUSCARE - COMPLAINT DETAILS\n\n" +

        "Complaint ID: " + c.id + "\n" +
        "Student Name: " + c.name + "\n" +
        "Student Email: " + c.email + "\n" +
        "Category: " + c.category + "\n" +
        "Location: " + c.location + "\n" +
        "Description: " + c.description + "\n" +
        "Submitted Date: " + c.date + "\n" +
        "Current Status: " + c.status
    );
}

// ==========================================
// 11. ADMIN - SOLVE COMPLAINT
// ==========================================

function changeStatus(index, status) {

    if (!currentUser || currentUser.role !== "admin") {
        alert("Only Admin can update complaints.");
        return;
    }

    if (!complaints[index]) return;

    complaints[index].status = status;

    if (status === "Resolved") {
        complaints[index].resolvedAt = new Date().toISOString();
    } else {
        complaints[index].resolvedAt = null;
    }

    saveData();

    renderComplaints();
    updateDashboard();
    updateAnalytics();

    alert(
        status === "Resolved"
            ? "Complaint successfully resolved!"
            : "Complaint status updated to " + status
    );
}

// ==========================================
// 12. STUDENT - TRACK COMPLAINT
// ==========================================

function trackComplaint() {

    if (!currentUser) return;

    const id = document.getElementById("trackId").value.trim();

    const complaint = complaints.find(c =>
        c.id.toLowerCase() === id.toLowerCase() &&
        (currentUser.role === "admin" || c.email === currentUser.email)
    );

    const result = document.getElementById("trackResult");

    if (!complaint) {

        result.innerHTML = `
            <p style="color:red">
                Complaint not found. Please check your Complaint ID.
            </p>
        `;

        return;
    }

    let message = "";

    if (complaint.status === "Pending") {
        message = "⏳ Your complaint is waiting for review.";
    } else if (complaint.status === "In Progress") {
        message = "🔄 Your complaint is being worked on.";
    } else {
        message = "✅ Your complaint has been successfully resolved!";
    }

    result.innerHTML = `

        <div class="panel">

            <h2>Complaint Details</h2>

            <p><b>ID:</b> ${escapeHTML(complaint.id)}</p>

            <p><b>Category:</b> ${escapeHTML(complaint.category)}</p>

            <p><b>Location:</b> ${escapeHTML(complaint.location)}</p>

            <p><b>Description:</b> ${escapeHTML(complaint.description)}</p>

            <p><b>Date:</b> ${escapeHTML(complaint.date)}</p>

            <p><b>Status:</b> ${escapeHTML(complaint.status)}</p>

            <h3>${message}</h3>

        </div>
    `;
}

// ==========================================
// 13. ANALYTICS DASHBOARD
// ==========================================

function updateAnalytics() {

    if (!currentUser || currentUser.role !== "admin") return;

    const total = complaints.length;

    const pending = complaints.filter(c => c.status === "Pending").length;

    const progress = complaints.filter(c => c.status === "In Progress").length;

    const resolved = complaints.filter(c => c.status === "Resolved").length;

    document.getElementById("anTotal").textContent = total;
    document.getElementById("anPending").textContent = pending;
    document.getElementById("anProgress").textContent = progress;
    document.getElementById("anResolved").textContent = resolved;

    const percentage = total
        ? Math.round((resolved / total) * 100)
        : 0;

    document.getElementById("resolutionText").textContent =
        percentage + "%";

    document.getElementById("resolutionBar").value = percentage;

    // CHECK CHART LIBRARY
    if (typeof Chart === "undefined") {
        console.error("Chart.js library is not loaded.");
        return;
    }

    // PIE CHART
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }

    pieChartInstance = new Chart(
        document.getElementById("pieChart"),
        {
            type: "pie",

            data: {

                labels: [
                    "Pending",
                    "In Progress",
                    "Resolved"
                ],

                datasets: [{
                    data: [
                        pending,
                        progress,
                        resolved
                    ],

                    backgroundColor: [
                        "#f4a62a",
                        "#3989dc",
                        "#18aa78"
                    ]
                }]
            },

            options: {
                responsive: true
            }
        }
    );

    // WEEKLY TREND CHART

    const days = [];
    const reported = [];
    const completed = [];

    for (let i = 6; i >= 0; i--) {

        const date = new Date();

        date.setHours(0, 0, 0, 0);

        date.setDate(date.getDate() - i);

        const next = new Date(date);

        next.setDate(next.getDate() + 1);

        const dayData = complaints.filter(c => {

            const d = new Date(
                c.createdAt || c.timestamp || 0
            );

            return d >= date && d < next;

        });

        days.push(
            date.toLocaleDateString("en", {
                weekday: "short"
            })
        );

        reported.push(dayData.length);

        completed.push(
            dayData.filter(c => c.status === "Resolved").length
        );
    }

    if (trendChartInstance) {
        trendChartInstance.destroy();
    }

    trendChartInstance = new Chart(
        document.getElementById("trendChart"),
        {
            type: "line",

            data: {

                labels: days,

                datasets: [

                    {
                        label: "Reported Complaints",
                        data: reported,
                        borderColor: "#3989dc",
                        tension: 0.4
                    },

                    {
                        label: "Resolved Complaints",
                        data: completed,
                        borderColor: "#18aa78",
                        tension: 0.4
                    }

                ]
            },

            options: {
                responsive: true,

                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        }
    );
}

// ==========================================
// 14. RESTORE LOGIN SESSION
// ==========================================

if (currentUser) {
    openApp();
}
