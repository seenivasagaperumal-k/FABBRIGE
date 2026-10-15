// ==================================================
// FABBRIDGE - ADMIN USER VERIFICATION
// ==================================================

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
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ==================================================
// HTML ELEMENTS
// ==================================================

const companiesTable =
    document.getElementById("companiesTable");

const searchInput =
    document.getElementById("searchInput");

const logoutBtn =
    document.getElementById("logoutBtn");


// ==================================================
// VARIABLES
// ==================================================

let companies = [];


// ==================================================
// ADMIN EMAIL
// ==================================================

const ADMIN_EMAIL =
    "ganesh12@gmail.com";


// ==================================================
// ADMIN LOGIN CHECK
// ==================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        // ------------------------------------------
        // EMAIL CHECK
        // ------------------------------------------

        if (
            user.email.toLowerCase() !==
            ADMIN_EMAIL.toLowerCase()
        ) {

            alert(
                "You are not authorized to access Admin Verification."
            );

            await signOut(auth);
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach((c) => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
            window.location.replace("login.html");

            return;

        }


        // ------------------------------------------
        // FIRESTORE ADMIN CHECK
        // ------------------------------------------

        try {

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnapshot =
                await getDoc(
                    userRef
                );


            if (
                !userSnapshot.exists()
            ) {

                alert(
                    "Admin profile not found."
                );

                await signOut(auth);
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach((c) => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
            window.location.replace("login.html");

                return;

            }


            const adminData =
                userSnapshot.data();


            const adminRole =
                (
                    adminData.role ||
                    ""
                )
                .toString()
                .trim()
                .toLowerCase();


            if (
                adminRole !== "admin"
            ) {

                alert(
                    "You are not authorized to access Admin Verification."
                );

                await signOut(auth);
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach((c) => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
            window.location.replace("login.html");

                return;

            }


            // ------------------------------------------
            // LOAD USERS
            // ------------------------------------------

            await loadCompanies();

        }

        catch (error) {

            console.error(
                "Admin verification error:",
                error
            );

            alert(
                "Unable to verify admin access."
            );

        }

    }
);


// ==================================================
// LOAD USERS
// ==================================================

async function loadCompanies() {

    if (!companiesTable) {

        return;

    }


    companiesTable.innerHTML = `

        <tr>

            <td
                colspan="7"
                class="loading">

                Loading users...

            </td>

        </tr>

    `;


    try {

        const usersSnapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );


        companies = [];


        usersSnapshot.forEach(
            (userDoc) => {

                const data =
                    userDoc.data();


                // --------------------------------------
                // NEVER SHOW ADMIN
                // --------------------------------------

                const role =
                    (
                        data.role ||
                        ""
                    )
                    .toString()
                    .trim()
                    .toLowerCase();


                if (
                    role === "admin"
                ) {

                    return;

                }


                // --------------------------------------
                // USER TYPE
                // --------------------------------------

                let userType =
                    (
                        data.userType ||
                        ""
                    )
                    .toString()
                    .trim()
                    .toLowerCase();


                // --------------------------------------
                // OLD DATA
                // --------------------------------------

                if (
                    userType === "company"
                ) {

                    userType =
                        "manufacturer";

                }


                if (
                    userType === ""
                ) {

                    if (
                        role === "manufacturer" ||
                        role === "company" ||
                        role === "service provider"
                    ) {

                        userType =
                            "manufacturer";

                    }

                    else if (
                        role === "customer"
                    ) {

                        userType =
                            "customer";

                    }

                }


                // --------------------------------------
                // DISPLAY ROLE
                // --------------------------------------

                let displayRole =
                    "Customer";


                if (
                    userType === "manufacturer"
                ) {

                    displayRole =
                        "Manufacturer";

                }


                // --------------------------------------
                // STATUS
                // --------------------------------------

                const status =
                    (
                        data.status ||
                        "pending"
                    )
                    .toString()
                    .trim()
                    .toLowerCase();


                companies.push({

                    id:
                        userDoc.id,

                    companyName:
                        data.companyName ||
                        data.businessName ||
                        "No Company Name",

                    ownerName:
                        data.ownerName ||
                        data.name ||
                        "No Owner",

                    email:
                        data.email ||
                        "-",

                    phone:
                        data.phone ||
                        "-",

                    role:
                        displayRole,

                    userType:
                        userType,

                    status:
                        status,

                    verified:
                        data.verified === true

                });

            }
        );


        displayCompanies(
            companies
        );

    }

    catch (error) {

        console.error(
            "Firebase Error:",
            error
        );


        companiesTable.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="loading">

                    Unable to load users.

                </td>

            </tr>

        `;

    }

}


// ==================================================
// DISPLAY USERS
// ==================================================

function displayCompanies(list) {

    companiesTable.innerHTML =
        "";


    if (
        list.length === 0
    ) {

        companiesTable.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="loading">

                    No users found.

                </td>

            </tr>

        `;

        return;

    }


    list.forEach(
        (company) => {

            const row =
                document.createElement(
                    "tr"
                );


            // ==========================================
            // STATUS
            // ==========================================

            let statusHTML =
                "";


            if (
                company.status ===
                "approved"
            ) {

                statusHTML = `

                    <span
                        class="status approved">

                        Approved

                    </span>

                `;

            }

            else if (
                company.status ===
                "rejected"
            ) {

                statusHTML = `

                    <span
                        class="status rejected">

                        Rejected

                    </span>

                `;

            }

            else {

                statusHTML = `

                    <span
                        class="status pending">

                        Pending

                    </span>

                `;

            }


            // ==========================================
            // ACTION
            // ==========================================

            let actionHTML =
                "";


            if (
                company.status ===
                "pending"
            ) {

                actionHTML = `

                    <button
                        class="approve-btn"
                        data-id="${company.id}">

                        ✓ Verify

                    </button>


                    <button
                        class="reject-btn"
                        data-id="${company.id}">

                        ✕ Reject

                    </button>

                `;

            }

            else if (
                company.status ===
                "approved"
            ) {

                actionHTML = `

                    <button
                        class="reject-btn"
                        data-id="${company.id}">

                        Reject

                    </button>

                `;

            }

            else if (
                company.status ===
                "rejected"
            ) {

                actionHTML = `

                    <button
                        class="approve-btn"
                        data-id="${company.id}">

                        ✓ Approve

                    </button>

                `;

            }


            // ==========================================
            // ROW
            // ==========================================

            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        company.companyName
                    )}
                </td>


                <td>
                    ${escapeHTML(
                        company.ownerName
                    )}
                </td>


                <td>
                    ${escapeHTML(
                        company.email
                    )}
                </td>


                <td>
                    ${escapeHTML(
                        company.phone
                    )}
                </td>


                <td>

                    <span class="role">

                        ${escapeHTML(
                            company.role
                        )}

                    </span>

                </td>


                <td>

                    ${statusHTML}

                </td>


                <td>

                    ${actionHTML}

                </td>

            `;


            companiesTable.appendChild(
                row
            );

        }
    );


    // ==================================================
    // APPROVE BUTTONS
    // ==================================================

    document
        .querySelectorAll(
            ".approve-btn"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    async () => {

                        await verifyCompany(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    // ==================================================
    // REJECT BUTTONS
    // ==================================================

    document
        .querySelectorAll(
            ".reject-btn"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    async () => {

                        await rejectCompany(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


// ==================================================
// APPROVE USER
// ==================================================

async function verifyCompany(id) {

    const confirmAction =
        confirm(
            "Approve this account?"
        );


    if (!confirmAction) {

        return;

    }


    try {

        await updateDoc(

            doc(
                db,
                "users",
                id
            ),

            {

                status:
                    "approved",

                verified:
                    true

            }

        );


        alert(
            "Account approved successfully!"
        );


        await loadCompanies();

    }

    catch (error) {

        console.error(
            "Approval Error:",
            error
        );


        alert(
            "Unable to approve account."
        );

    }

}


// ==================================================
// REJECT USER
// ==================================================

async function rejectCompany(id) {

    const confirmAction =
        confirm(
            "Reject this account?"
        );


    if (!confirmAction) {

        return;

    }


    try {

        await updateDoc(

            doc(
                db,
                "users",
                id
            ),

            {

                status:
                    "rejected",

                verified:
                    false

            }

        );


        alert(
            "Account rejected."
        );


        await loadCompanies();

    }

    catch (error) {

        console.error(
            "Rejection Error:",
            error
        );


        alert(
            "Unable to reject account."
        );

    }

}


// ==================================================
// SEARCH
// ==================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            const text =
                searchInput.value
                    .toLowerCase()
                    .trim();


            if (!text) {

                displayCompanies(
                    companies
                );

                return;

            }


            const filtered =
                companies.filter(
                    (company) => {

                        return (

                            company.companyName
                                .toLowerCase()
                                .includes(text)

                            ||

                            company.ownerName
                                .toLowerCase()
                                .includes(text)

                            ||

                            company.email
                                .toLowerCase()
                                .includes(text)

                            ||

                            company.phone
                                .toLowerCase()
                                .includes(text)

                            ||

                            company.role
                                .toLowerCase()
                                .includes(text)

                            ||

                            company.status
                                .toLowerCase()
                                .includes(text)

                        );

                    }
                );


            displayCompanies(
                filtered
            );

        }
    );

}


// ==================================================
// LOGOUT
// ==================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(
                    auth
                );


                window.location.href =
                    "login.html";

            }

            catch (error) {

                console.error(
                    "Logout Error:",
                    error
                );


                alert(
                    "Logout failed."
                );

            }

        }
    );

}


// ==================================================
// SECURITY HELPER
// ==================================================

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}