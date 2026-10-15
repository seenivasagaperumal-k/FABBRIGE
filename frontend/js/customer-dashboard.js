// ======================================================
// FABBRIDGE - CUSTOMER DASHBOARD
// ======================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ======================================================
// HTML ELEMENTS
// ======================================================

const userNameElement =
    document.getElementById("userName");

const welcomeNameElement =
    document.getElementById("welcomeName");

const totalRequirementsElement =
    document.getElementById("totalRequirements");

const receivedQuotationsElement =
    document.getElementById("receivedQuotations");

const acceptedQuotationsElement =
    document.getElementById("acceptedQuotations");

const pendingQuotationsElement =
    document.getElementById("pendingQuotations");

const notificationCountElement =
    document.getElementById("notificationCount");

const recentActivityElement =
    document.getElementById("recentActivity");

const logoutBtn =
    document.getElementById("logoutBtn");

const dashboardSearch =
    document.getElementById("dashboardSearch");


// ======================================================
// AUTH
// ======================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.replace("login.html");

        return;
    }

    console.log(
        "Customer logged in:",
        user.uid
    );

    try {

        await loadUserProfile(user.uid);

        await loadDashboardData(user.uid);

        await loadNotificationCount(user.uid);

        await loadRecentActivity(user.uid);

        
    }

    catch (error) {

        console.error(
            "Customer dashboard error:",
            error
        );

    }

});


// ======================================================
// LOAD USER PROFILE
// ======================================================

async function loadUserProfile(userId) {

    try {

        const userRef =
            doc(
                db,
                "users",
                userId
            );

        const snapshot =
            await getDoc(userRef);

        if (!snapshot.exists()) {

            console.warn(
                "Customer profile not found."
            );

            return;
        }

        const data =
            snapshot.data();

        const name =
            data.ownerName ||
            data.name ||
            data.fullName ||
            "Customer";

        if (userNameElement) {

            userNameElement.textContent =
                name;

        }

        if (welcomeNameElement) {

            welcomeNameElement.textContent =
                name;

        }

    }

    catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

    }

}


// ======================================================
// LOAD DASHBOARD DATA
// ======================================================

async function loadDashboardData(userId) {

    try {

        // -----------------------------------------------
        // REQUIREMENTS
        // -----------------------------------------------

        const requirementsSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "requirements"
                    ),
                    where(
                        "userId",
                        "==",
                        userId
                    )
                )
            );


        if (totalRequirementsElement) {

            totalRequirementsElement.textContent =
                requirementsSnapshot.size;

        }


        // -----------------------------------------------
        // QUOTATIONS
        // -----------------------------------------------

        const quotationsSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "quotations"
                    ),
                    where(
                        "customerId",
                        "==",
                        userId
                    )
                )
            );


        let accepted = 0;

        let pending = 0;


        quotationsSnapshot.forEach(
            (quotationDoc) => {

                const data =
                    quotationDoc.data();

                const status =
                    (
                        data.status ||
                        "waiting"
                    )
                    .toString()
                    .trim()
                    .toLowerCase();


                if (
                    status === "accepted"
                ) {

                    accepted++;

                }

                else if (
                    status === "waiting" ||
                    status === "pending"
                ) {

                    pending++;

                }

            }
        );


        if (receivedQuotationsElement) {

            receivedQuotationsElement.textContent =
                quotationsSnapshot.size;

        }


        if (acceptedQuotationsElement) {

            acceptedQuotationsElement.textContent =
                accepted;

        }


        if (pendingQuotationsElement) {

            pendingQuotationsElement.textContent =
                pending;

        }

    }

    catch (error) {

        console.error(
            "Dashboard data error:",
            error
        );

    }

}


// ======================================================
// NOTIFICATIONS
// ======================================================

async function loadNotificationCount(userId) {

    try {

        const snapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "notifications"
                    ),
                    where(
                        "userId",
                        "==",
                        userId
                    )
                )
            );


        let unread = 0;


        snapshot.forEach(
            (notificationDoc) => {

                const data =
                    notificationDoc.data();


                if (
                    data.read === false ||
                    data.read === undefined
                ) {

                    unread++;

                }

            }
        );


        if (notificationCountElement) {

            notificationCountElement.textContent =
                unread;

        }

    }

    catch (error) {

        console.error(
            "Notification error:",
            error
        );

    }

}


// ======================================================
// RECENT ACTIVITY
// ======================================================

async function loadRecentActivity(userId) {

    if (!recentActivityElement) {

        return;

    }


    try {

        const activities = [];


        // -----------------------------------------------
        // REQUIREMENTS
        // -----------------------------------------------

        const requirementsSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "requirements"
                    ),
                    where(
                        "userId",
                        "==",
                        userId
                    )
                )
            );


        requirementsSnapshot.forEach(
            (requirementDoc) => {

                const data =
                    requirementDoc.data();


                activities.push({

                    text:
                        `Requirement "${
                            data.title ||
                            data.requirementTitle ||
                            "Untitled"
                        }" posted`

                });

            }
        );


        // -----------------------------------------------
        // QUOTATIONS
        // -----------------------------------------------

        const quotationsSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "quotations"
                    ),
                    where(
                        "customerId",
                        "==",
                        userId
                    )
                )
            );


        quotationsSnapshot.forEach(
            (quotationDoc) => {

                const data =
                    quotationDoc.data();


                activities.push({

                    text:
                        `Quotation received from ${
                            data.companyName ||
                            "Company"
                        } - ${
                            data.status ||
                            "Waiting"
                        }`

                });

            }
        );


        // -----------------------------------------------
        // DISPLAY
        // -----------------------------------------------

        recentActivityElement.innerHTML = "";


        if (
            activities.length === 0
        ) {

            recentActivityElement.innerHTML = `
                <li>
                    No recent activity.
                </li>
            `;

            return;

        }


        activities
            .slice(-5)
            .reverse()
            .forEach(
                (activity) => {

                    const li =
                        document.createElement(
                            "li"
                        );

                    li.textContent =
                        activity.text;

                    recentActivityElement
                        .appendChild(li);

                }
            );

    }

    catch (error) {

        console.error(
            "Recent activity error:",
            error
        );


        recentActivityElement.innerHTML = `
            <li>
                Unable to load recent activity.
            </li>
        `;

    }

}


// ======================================================
// DASHBOARD SEARCH
// ======================================================

if (dashboardSearch) {

    dashboardSearch.addEventListener(
        "input",
        () => {

            const text =
                dashboardSearch.value
                    .trim()
                    .toLowerCase();


            if (!text) {

                return;

            }


            console.log(
                "Dashboard search:",
                text
            );

        }
    );

}


// ======================================================
// LOGOUT
// ======================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();

            try {

                await signOut(auth);
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach((c) => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
            window.location.replace("login.html");

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                alert(
                    "Unable to logout."
                );

            }

        }
    );

}

// ==================================================
// MOBILE SIDEBAR TOGGLE
// ==================================================
document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById("hamburgerMenu");
    const sidebar = document.querySelector(".sidebar");
    
    if (hamburger && sidebar) {
        hamburger.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
        
        // Close sidebar when a link is clicked
        const links = sidebar.querySelectorAll("a");
        links.forEach(link => {
            link.addEventListener("click", () => {
                sidebar.classList.remove("open");
            });
        });
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
