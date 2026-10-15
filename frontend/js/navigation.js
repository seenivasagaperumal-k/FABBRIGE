import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// =====================================================
// AUTH GUARD & LOGOUT
// =====================================================

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("login.html");
        return;
    }
});

// Prevent back button from showing protected page after logout
window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        onAuthStateChanged(auth, (user) => {
            if (!user) window.location.replace("login.html");
        });
    }
});

async function handleLogout(event) {
    event.preventDefault();
    try {
        await signOut(auth);
        localStorage.clear();
        sessionStorage.clear();
        // Clear all cookies
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        window.location.replace("login.html");
    } catch (error) {
        console.error("Logout Error:", error);
    }
}

// =====================================================
// EVENT BINDING
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    // Attach Logout Event
    const logoutBtn = document.getElementById("logoutBtn");
    // Ensure we don't duplicate listener if page JS already handles it
    if (logoutBtn && !window.logoutBound) {
        logoutBtn.addEventListener("click", handleLogout);
        window.logoutBound = true;
    }
    
    // Attach mobile menu events
    setupMobileMenu();

    // Globally update user name in navigation if available
    const userNameEl = document.getElementById("userName");
    if (userNameEl) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js");
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        userNameEl.textContent = data.ownerName || data.companyName || data.name || data.username || "User";
                    }
                } catch (e) { console.error(e); }
            }
        });
    }
});

function setupMobileMenu() {
    const hamburger = document.getElementById("hamburgerMenu");
    const sidebar = document.getElementById("mainSidebar") || document.querySelector(".sidebar");
    
    if (!hamburger || !sidebar) return;

    // Toggle menu
    hamburger.addEventListener("click", (e) => {
        e.stopPropagation(); // prevent immediate close
        sidebar.classList.toggle("open");
    });

    // Close on clicking outside
    document.addEventListener("click", (e) => {
        if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && e.target !== hamburger) {
            sidebar.classList.remove("open");
        }
    });

    // Close on clicking a nav item
    const navLinks = sidebar.querySelectorAll("a");
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            if (sidebar.classList.contains("open")) {
                sidebar.classList.remove("open");
            }
        });
    });

    // Close on pressing ESC key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && sidebar.classList.contains("open")) {
            sidebar.classList.remove("open");
        }
    });
}

