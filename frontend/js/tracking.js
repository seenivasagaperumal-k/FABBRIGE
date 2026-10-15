// =====================================================
// FABBRIDGE - DEDICATED MANUFACTURING TRACKING.JS
// =====================================================

import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
    loadCustomerManufacturingOrders,
    loadCompanyManufacturingOrders
} from "./manufacturing-tracking.js";

// DOM Elements
const userNameEl = document.getElementById("userName");
const roleBadge = document.getElementById("roleBadge");
const trackingContainer = document.getElementById("trackingOrdersContainer");
const dashboardNavLink = document.getElementById("dashboardNavLink");
const navSubmittedQuotations = document.getElementById("navSubmittedQuotations");
const navProducts = document.getElementById("navProducts");
const notificationCountEl = document.getElementById("notificationCount");
const searchInput = document.getElementById("dashboardSearch");

let currentUser = null;
let isCompanyUser = false;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("login.html");
        return;
    }

    currentUser = user;

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        let userType = "customer";

        if (userDoc.exists()) {
            const data = userDoc.data();
            const rawType = (data.userType || data.role || "").toString().trim().toLowerCase();
            if (rawType === "company" || rawType === "manufacturer" || rawType === "service provider") {
                userType = "company";
            }

            const displayName = data.ownerName || data.companyName || data.name || data.fullName || "User";
            if (userNameEl) {
                userNameEl.textContent = displayName;
            }
        }

        isCompanyUser = userType === "company";

        // Update UI based on Role
        if (isCompanyUser) {
            if (roleBadge) {
                roleBadge.textContent = "🏢 Company View (Production)";
                roleBadge.style.background = "#eff6ff";
                roleBadge.style.color = "#1e40af";
                roleBadge.style.borderColor = "#bfdbfe";
            }
            if (dashboardNavLink) {
                dashboardNavLink.href = "dashboard.html";
            }
            if (navSubmittedQuotations) {
                navSubmittedQuotations.style.display = "block";
            }
            if (navProducts) {
                navProducts.style.display = "block";
            }

            // Load company confirmed orders
            await loadCompanyManufacturingOrders(user.uid, trackingContainer);
        } else {
            if (roleBadge) {
                roleBadge.textContent = "👤 Customer View (Order Tracking)";
                roleBadge.style.background = "#f0fdf4";
                roleBadge.style.color = "#166534";
                roleBadge.style.borderColor = "#bbf7d0";
            }
            if (dashboardNavLink) {
                dashboardNavLink.href = "customer-dashboard.html";
            }

            // Load customer confirmed orders (real-time listener)
            loadCustomerManufacturingOrders(user.uid, trackingContainer);
        }

        // Load notifications count
        await loadNotificationCount(user.uid);

        // Setup Search Filter
        setupSearchFilter();

    } catch (error) {
        console.error("Error initializing tracking page:", error);
        if (trackingContainer) {
            trackingContainer.innerHTML = `
                <div class="tracking-empty">
                    <p>Unable to load manufacturing tracking at this time. Please try refreshing.</p>
                </div>
            `;
        }
    }
});

async function loadNotificationCount(userId) {
    try {
        const snapshot = await getDocs(
            query(collection(db, "notifications"), where("userId", "==", userId))
        );
        let unread = 0;
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.read === false || data.read === undefined) {
                unread++;
            }
        });
        if (notificationCountEl) {
            notificationCountEl.textContent = unread;
        }
    } catch (e) {
        console.error("Notification count error:", e);
    }
}

function setupSearchFilter() {
    if (!searchInput || !trackingContainer) return;

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase().trim();
        const cards = trackingContainer.querySelectorAll(".tracking-card");

        cards.forEach((card) => {
            const text = card.textContent.toLowerCase();
            if (text.includes(query)) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }
        });
    });
}

// Global hook to refresh company tracking after stage update
window.refreshDashboardManufacturing = async function () {
    if (currentUser && isCompanyUser && trackingContainer) {
        await loadCompanyManufacturingOrders(currentUser.uid, trackingContainer);
    }
};
