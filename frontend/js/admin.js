import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const totalUsers =
    document.getElementById("totalUsers");

const totalCompanies =
    document.getElementById("totalCompanies");

const totalRequirements =
    document.getElementById("totalRequirements");

const totalQuotations =
    document.getElementById("totalQuotations");

const logoutBtn =
    document.getElementById("logoutBtn");


// ================================
// CHECK ADMIN LOGIN
// ================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        alert("Please login first.");

        window.location.replace("login.html");

        return;

    }

    console.log("Logged in email:", user.email);
    console.log("Logged in UID:", user.uid);


    try {

        // Get current user's document
        const userRef =
            doc(db, "users", user.uid);

        const userSnapshot =
            await getDoc(userRef);


        if (!userSnapshot.exists()) {

            alert(
                "Your user profile was not found in Firestore."
            );

            await signOut(auth);
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach((c) => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
            window.location.replace("login.html");

            return;

        }


        const userData =
            userSnapshot.data();


        console.log(
            "User Firestore data:",
            userData
        );


        const role =
            String(userData.role || "")
                .trim()
                .toLowerCase();


        console.log("User role:", role);


        // ADMIN CHECK

        if (role !== "admin") {

            alert(
                "You are not authorized to access Admin Panel."
            );

            window.location.href =
                "dashboard.html";

            return;

        }


        // Admin confirmed
        console.log("Admin access granted.");

        await loadDashboardData();

    }

    catch (error) {

        console.error(
            "Admin verification error:",
            error
        );

        alert(
            "Error checking admin access: " +
            error.message
        );

    }

});



// ================================
// LOAD DASHBOARD DATA
// ================================

async function loadDashboardData() {

    try {

        // USERS

        const usersSnapshot =
            await getDocs(
                collection(db, "users")
            );


        let userCount = 0;
        let companyCount = 0;


        usersSnapshot.forEach((userDoc) => {

            const data =
                userDoc.data();


            userCount++;


            const role =
                String(data.role || "")
                    .trim()
                    .toLowerCase();


            if (
                role === "manufacturer" ||
                role === "service provider"
            ) {

                companyCount++;

            }

        });


        // REQUIREMENTS

        const requirementsSnapshot =
            await getDocs(
                collection(db, "requirements")
            );


        // QUOTATIONS

        const quotationsSnapshot =
            await getDocs(
                collection(db, "quotations")
            );


        // DISPLAY

        totalUsers.textContent =
            userCount;

        totalCompanies.textContent =
            companyCount;

        totalRequirements.textContent =
            requirementsSnapshot.size;

        totalQuotations.textContent =
            quotationsSnapshot.size;


    }

    catch (error) {

        console.error(
            "Error loading dashboard:",
            error
        );

        alert(
            "Unable to load dashboard data."
        );

    }

}



// ================================
// LOGOUT
// ================================

logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach((c) => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
            window.location.replace("login.html");

        }

        catch (error) {

            console.error(error);

            alert(
                "Logout failed."
            );

        }

    }
);

// Prevent back button from showing protected page after logout
window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        onAuthStateChanged(auth, (user) => {
            if (!user) window.location.replace("login.html");
        });
    }
});
