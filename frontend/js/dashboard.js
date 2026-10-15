// ======================================================
// FABBRIDGE - DASHBOARD.JS
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

const submittedQuotationsElement =
    document.getElementById("submittedQuotations");

const totalServicesElement =
    document.getElementById("totalServices");

const recentActivityElement =
    document.getElementById("recentActivity");

const notificationCountElement =
    document.getElementById("notificationCount");

const logoutBtn =
    document.getElementById("logoutBtn");


// ======================================================
// COMPANY SEARCH
// ======================================================

const companySearchInput =
    document.getElementById("companySearchInput");

const companyList =
    document.getElementById("companyList");


// ======================================================
// AUTH
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        console.log(
            "Logged in:",
            user.uid
        );


        try {

            await loadUserProfile(user.uid);

            await loadDashboardCounts(user.uid);

            await loadNotificationCount(user.uid);

            await loadRecentActivity(user.uid);

            
            setupCompanySearch();

        }

        catch (error) {

            console.error(
                "Dashboard error:",
                error
            );

        }

    }
);


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

            return;

        }


        const data =
            snapshot.data();


        const displayName =
            data.ownerName ||
            data.name ||
            data.companyName ||
            data.company ||
            data.businessName ||
            "User";


        if (userNameElement) {

            userNameElement.textContent =
                displayName;

        }


        if (welcomeNameElement) {

            welcomeNameElement.textContent =
                displayName;

        }

    }

    catch (error) {

        console.error(
            "Profile error:",
            error
        );

    }

}


// ======================================================
// DASHBOARD COUNTS
// ======================================================

async function loadDashboardCounts(userId) {

    try {

        // REQUIREMENTS

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


        // RECEIVED QUOTATIONS

        const receivedSnapshot =
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


        if (receivedQuotationsElement) {

            receivedQuotationsElement.textContent =
                receivedSnapshot.size;

        }


        // SUBMITTED QUOTATIONS

        const submittedSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "quotations"
                    ),
                    where(
                        "manufacturerId",
                        "==",
                        userId
                    )
                )
            );


        if (submittedQuotationsElement) {

            submittedQuotationsElement.textContent =
                submittedSnapshot.size;

        }


        // PRODUCTS

        const productsSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "products"
                    ),
                    where(
                        "userId",
                        "==",
                        userId
                    )
                )
            );


        // SERVICES

        const servicesSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "services"
                    ),
                    where(
                        "userId",
                        "==",
                        userId
                    )
                )
            );


        const total =
            productsSnapshot.size +
            servicesSnapshot.size;


        if (totalServicesElement) {

            totalServicesElement.textContent =
                total;

        }

    }

    catch (error) {

        console.error(
            "Dashboard count error:",
            error
        );

    }

}


// ======================================================
// NOTIFICATION COUNT
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


        // REQUIREMENTS

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
                        `Requirement "${data.title || "Untitled"}" posted`,

                    type:
                        "requirement"

                });

            }
        );


        // QUOTATIONS

        const quotationsSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "quotations"
                    ),
                    where(
                        "manufacturerId",
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
                        `Quotation submitted for "${data.requirementTitle || "Requirement"}"`,

                    type:
                        "quotation"

                });

            }
        );


        recentActivityElement.innerHTML =
            "";


        if (!activities.length) {

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
                        document.createElement("li");


                    li.textContent =
                        activity.text;


                    recentActivityElement
                        .appendChild(li);

                }
            );

    }

    catch (error) {

        console.error(
            "Activity error:",
            error
        );

    }

}


// ======================================================
// COMPANY SEARCH SETUP
// ======================================================

function setupCompanySearch() {

    if (
        !companySearchInput ||
        !companyList
    ) {

        console.error(
            "Company search HTML elements missing."
        );

        return;

    }


    // IMPORTANT:
    // Initially NO companies shown.

    companyList.innerHTML = "";


    // SEARCH ONLY WHEN USER TYPES

    companySearchInput.addEventListener(
        "input",
        async () => {

            const text =
                companySearchInput.value
                    .trim()
                    .toLowerCase();


            // ------------------------------------------
            // EMPTY SEARCH
            // ------------------------------------------

            if (!text) {

                companyList.innerHTML =
                    "";

                return;

            }


            await searchCompanies(text);

        }
    );

}


// ======================================================
// SEARCH COMPANIES
// ======================================================

async function searchCompanies(searchText) {

    if (!companyList) {

        return;

    }


    try {

        companyList.innerHTML = `
            <div style="
                padding:15px;
                color:#64748b;
            ">
                Searching...
            </div>
        `;


        // GET USERS

        const usersSnapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );


        companyList.innerHTML =
            "";


        let found = 0;


        usersSnapshot.forEach(
            (userDoc) => {

                const data =
                    userDoc.data();


                // ----------------------------------
                // COMPANY NAME
                // ----------------------------------

                const companyName =
                    data.companyName ||
                    data.company ||
                    data.businessName ||
                    data.business_name ||
                    data.organizationName ||
                    data.organization ||
                    "";


                // ----------------------------------
                // OWNER NAME
                // ----------------------------------

                const ownerName =
                    data.ownerName ||
                    data.name ||
                    data.fullName ||
                    data.username ||
                    "";


                const email =
                    data.email ||
                    "";


                // ----------------------------------
                // IGNORE NON-COMPANY USERS
                // ----------------------------------

                if (!companyName) {

                    return;

                }


                // ----------------------------------
                // SEARCH
                // ----------------------------------

                if (
                    !companyName
                        .toLowerCase()
                        .includes(searchText)
                ) {

                    return;

                }


                found++;


                // ----------------------------------
                // CREATE CARD
                // ----------------------------------

                const card =
                    document.createElement("div");


                card.className =
                    "company-card";


                card.innerHTML = `

                    <div class="company-card-info">

                        <div class="company-icon">
                            🏭
                        </div>


                        <div>

                            <h3>
                                ${escapeHTML(
                                    companyName
                                )}
                            </h3>


                            ${
                                ownerName
                                ? `
                                    <p>
                                        👤
                                        ${escapeHTML(
                                            ownerName
                                        )}
                                    </p>
                                  `
                                : ""
                            }


                            ${
                                email
                                ? `
                                    <p>
                                        📧
                                        ${escapeHTML(
                                            email
                                        )}
                                    </p>
                                  `
                                : ""
                            }

                        </div>

                    </div>


                    <button
                        class="view-profile-btn"
                        data-user-id="${userDoc.id}"
                    >
                        View Profile
                    </button>

                `;


                companyList.appendChild(
                    card
                );

            }
        );


        // ----------------------------------
        // NO RESULT
        // ----------------------------------

        if (found === 0) {

            companyList.innerHTML = `

                <div style="
                    padding:25px;
                    text-align:center;
                    color:#64748b;
                ">

                    <h3>
                        No companies found
                    </h3>

                    <p>
                        Try another company name.
                    </p>

                </div>

            `;

            return;

        }


        // ----------------------------------
        // VIEW PROFILE BUTTONS
        // ----------------------------------

        const buttons =
            companyList.querySelectorAll(
                ".view-profile-btn"
            );


        buttons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const companyId =
                            button.dataset.userId;


                        window.location.href =
                            `company-profile.html?userId=${encodeURIComponent(companyId)}`;

                    }
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Company search error:",
            error
        );


        companyList.innerHTML = `

            <div style="
                padding:20px;
                color:#dc2626;
            ">

                Unable to search companies.

            </div>

        `;

    }

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

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


