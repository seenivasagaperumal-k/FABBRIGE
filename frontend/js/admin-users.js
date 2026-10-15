// ==================================================
// FABBRIDGE - ADMIN USERS
// ==================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ==================================================
// ELEMENTS
// ==================================================

const usersTable =
    document.getElementById("usersTable");

const searchInput =
    document.getElementById("searchInput");

const logoutBtn =
    document.getElementById("logoutBtn");


let users = [];


// ==================================================
// LOGIN CHECK
// ==================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        alert("Please login first.");

        window.location.href =
            "login.html";

        return;

    }

    await loadUsers();

});


// ==================================================
// LOAD USERS
// ==================================================

async function loadUsers() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "users")
            );


        users = [];


        snapshot.forEach((userDoc) => {

            const data =
                userDoc.data();


            // ==========================================
            // NEW ACCOUNT TYPE LOGIC
            // ==========================================

           let accountType =
    String(
        data.userType || data.role || ""
    )
    .trim()
    .toLowerCase();


let displayRole = "Unknown";


if (
    accountType === "company" ||
    accountType === "manufacturer" ||
    accountType === "service provider"
) {

    displayRole = "Company";

}

else if (
    accountType === "customer" ||
    accountType === "customer / business"
) {

    displayRole = "Customer";

}

            users.push({

                id:
                    userDoc.id,

                companyName:
                    data.companyName || "-",

                ownerName:
                    data.ownerName || "-",

                email:
                    data.email || "-",

                phone:
                    data.phone || "-",

                role:
                    displayRole

            });

        });


        displayUsers(users);


    }

    catch (error) {

        console.error(
            "Error loading users:",
            error
        );


        usersTable.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="loading">

                    Error loading users.

                </td>

            </tr>

        `;

    }

}


// ==================================================
// DISPLAY USERS
// ==================================================

function displayUsers(list) {

    usersTable.innerHTML = "";


    if (list.length === 0) {

        usersTable.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="loading">

                    No users found.

                </td>

            </tr>

        `;

        return;

    }


    list.forEach((user) => {

        const row =
            document.createElement("tr");


        // ==========================================
        // ROLE CSS CLASS
        // ==========================================

        let roleClass =
            user.role
                .toLowerCase()
                .replace(/\s+/g, "-");


        // ==========================================
        // ROW
        // ==========================================

        row.innerHTML = `

            <td>
                ${user.companyName}
            </td>

            <td>
                ${user.ownerName}
            </td>

            <td>
                ${user.email}
            </td>

            <td>
                ${user.phone}
            </td>

            <td>

                <span
                    class="role ${roleClass}">

                    ${user.role}

                </span>

            </td>

        `;


        usersTable.appendChild(row);

    });

}


// ==================================================
// SEARCH USERS
// ==================================================

searchInput.addEventListener(
    "input",
    () => {

        const searchText =
            searchInput.value
                .toLowerCase()
                .trim();


        if (searchText === "") {

            displayUsers(users);

            return;

        }


        const filteredUsers =
            users.filter((user) => {

                return (

                    user.companyName
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    user.ownerName
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    user.email
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    user.phone
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    user.role
                        .toLowerCase()
                        .includes(searchText)

                );

            });


        displayUsers(filteredUsers);

    }
);


// ==================================================
// LOGOUT
// ==================================================

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
