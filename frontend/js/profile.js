// ==================================================
// FABBRIDGE - USER PROFILE
// ==================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ==================================================
// HTML ELEMENTS
// ==================================================

const profileName =
    document.getElementById("profileName");

const accountType =
    document.getElementById("accountType");

const fullName =
    document.getElementById("fullName");

const email =
    document.getElementById("email");

const phone =
    document.getElementById("phone");

const address =
    document.getElementById("address");

const about =
    document.getElementById("about");

const role =
    document.getElementById("role");

const profileForm =
    document.getElementById("profileForm");

const updateProfile =
    document.getElementById("updateProfile");


// ==================================================
// CHECK LOGIN
// ==================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }

        await loadProfile(user);

    }
);


// ==================================================
// GET DISPLAY ACCOUNT TYPE
// ==================================================

function getDisplayAccountType(data) {

    // ------------------------------------------
    // NEW FIELD
    // ------------------------------------------

    const userType =
        String(
            data.userType || ""
        )
        .trim()
        .toLowerCase();


    // ------------------------------------------
    // NEW USER TYPE
    // ------------------------------------------

    if (userType === "company") {

        return "Company";

    }


    if (userType === "customer") {

        return "Customer";

    }


    // ------------------------------------------
    // OLD ROLE FIELD
    // ------------------------------------------

    const oldRole =
        String(
            data.role || ""
        )
        .trim()
        .toLowerCase();


    if (
        oldRole === "manufacturer" ||
        oldRole === "service provider" ||
        oldRole === "company"
    ) {

        return "Company";

    }


    if (
        oldRole === "customer" ||
        oldRole === "customer / business"
    ) {

        return "Customer";

    }


    // ------------------------------------------
    // FALLBACK
    // ------------------------------------------

    return "Customer";

}


// ==================================================
// LOAD PROFILE
// ==================================================

async function loadProfile(user) {

    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        const userSnap =
            await getDoc(userRef);


        if (!userSnap.exists()) {

            alert(
                "User profile not found."
            );

            return;

        }


        const data =
            userSnap.data();


        console.log(
            "Profile Firestore data:",
            data
        );


        // ==================================================
        // ACCOUNT TYPE
        // ==================================================

        const displayAccountType =
            getDisplayAccountType(data);


        // ==================================================
        // NAME
        // ==================================================

        const customerName =
            data.ownerName ||
            data.name ||
            data.fullName ||
            "User";


        fullName.value =
            customerName;


        profileName.textContent =
            customerName;


        // ==================================================
        // EMAIL
        // ==================================================

        email.value =
            data.email ||
            user.email ||
            "";


        // ==================================================
        // PHONE
        // ==================================================

        phone.value =
            data.phone ||
            data.phoneNumber ||
            "";


        // ==================================================
        // ADDRESS
        // ==================================================

        address.value =
            data.address ||
            data.location ||
            "";


        // ==================================================
        // ABOUT
        // ==================================================

        about.value =
            data.about ||
            data.description ||
            "";


        // ==================================================
        // ROLE / ACCOUNT TYPE
        // ==================================================

        role.value =
            displayAccountType;


        accountType.textContent =
            displayAccountType;


        console.log(
            "Detected Account Type:",
            displayAccountType
        );

    }

    catch (error) {

        console.error(
            "Profile loading error:",
            error
        );


        alert(
            "Unable to load profile:\n" +
            error.message
        );

    }

}


// ==================================================
// UPDATE PROFILE
// ==================================================

profileForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const user =
            auth.currentUser;


        if (!user) {

            alert(
                "Please login first."
            );

            return;

        }


        // ==================================================
        // GET VALUES
        // ==================================================

        const name =
            fullName.value.trim();

        const phoneNumber =
            phone.value.trim();

        const userAddress =
            address.value.trim();

        const userAbout =
            about.value.trim();


        // ==================================================
        // VALIDATION
        // ==================================================

        if (
            name === "" ||
            phoneNumber === "" ||
            userAddress === "" ||
            userAbout === ""
        ) {

            alert(
                "Please fill all fields."
            );

            return;

        }


        try {

            updateProfile.disabled =
                true;

            updateProfile.textContent =
                "Updating...";


            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            // ==================================================
            // GET CURRENT USER DATA
            // ==================================================

            const userSnap =
                await getDoc(userRef);


            if (!userSnap.exists()) {

                alert(
                    "User profile not found."
                );

                return;

            }


            const currentData =
                userSnap.data();


            // ==================================================
            // DETECT CURRENT ACCOUNT TYPE
            // ==================================================

            const displayAccountType =
                getDisplayAccountType(
                    currentData
                );


            // ==================================================
            // PRESERVE ROLE
            // ==================================================

            let existingRole =
                currentData.role;


            let existingUserType =
                currentData.userType;


            // --------------------------------------------------
            // If new userType exists
            // --------------------------------------------------

            if (
                existingUserType === "company"
            ) {

                existingRole =
                    "Company";

            }

            else if (
                existingUserType === "customer"
            ) {

                existingRole =
                    "Customer";

            }


            // --------------------------------------------------
            // If old account has Manufacturer / Service Provider
            // keep it as Company
            // --------------------------------------------------

            if (
                String(
                    currentData.role || ""
                )
                .trim()
                .toLowerCase() ===
                    "manufacturer"
            ) {

                existingRole =
                    "Manufacturer";

            }


            else if (
                String(
                    currentData.role || ""
                )
                .trim()
                .toLowerCase() ===
                    "service provider"
            ) {

                existingRole =
                    "Service Provider";

            }


            // ==================================================
            // UPDATE FIRESTORE
            // ==================================================

            const updateData = {

                ownerName:
                    name,

                phone:
                    phoneNumber,

                address:
                    userAddress,

                about:
                    userAbout

            };


            // --------------------------------------------------
            // IMPORTANT:
            // Don't overwrite account type
            // --------------------------------------------------

            if (
                currentData.userType
            ) {

                updateData.userType =
                    currentData.userType;

            }


            // --------------------------------------------------
            // Preserve existing role
            // --------------------------------------------------

            if (
                existingRole
            ) {

                updateData.role =
                    existingRole;

            }


            await updateDoc(
                userRef,
                updateData
            );


            // ==================================================
            // UPDATE SCREEN
            // ==================================================

            profileName.textContent =
                name;


            role.value =
                displayAccountType;


            accountType.textContent =
                displayAccountType;


            alert(
                "Profile updated successfully!"
            );

        }

        catch (error) {

            console.error(
                "Profile update error:",
                error
            );


            alert(
                "Profile update failed:\n" +
                error.message
            );

        }

        finally {

            updateProfile.disabled =
                false;

            updateProfile.textContent =
                "Update Profile";

        }

    }
);