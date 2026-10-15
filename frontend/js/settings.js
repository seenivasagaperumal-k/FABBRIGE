import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    updatePassword,
    deleteUser
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const emailNotifications =
    document.getElementById("emailNotifications");

const smsNotifications =
    document.getElementById("smsNotifications");

const darkMode =
    document.getElementById("darkMode");

const changePasswordBtn =
    document.getElementById("changePasswordBtn");

const deleteAccountBtn =
    document.getElementById("deleteAccountBtn");


let currentUser = null;


/* =====================================
   LOGIN CHECK
===================================== */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "login.html";

        return;

    }


    currentUser = user;

    await loadSettings(user.uid);

});


/* =====================================
   LOAD SETTINGS
===================================== */

async function loadSettings(userId) {

    try {

        const settingsRef =
            doc(
                db,
                "users",
                userId
            );


        const settingsSnap =
            await getDoc(settingsRef);


        if (settingsSnap.exists()) {

            const data =
                settingsSnap.data();


            emailNotifications.checked =
                data.emailNotifications !== false;


            smsNotifications.checked =
                data.smsNotifications === true;


            darkMode.checked =
                data.darkMode === true;


            applyDarkMode(
                darkMode.checked
            );

        }

    }

    catch (error) {

        console.error(
            "Settings loading error:",
            error
        );

    }

}


/* =====================================
   SAVE EMAIL SETTING
===================================== */

emailNotifications.addEventListener(
    "change",
    async () => {

        await saveSetting(
            "emailNotifications",
            emailNotifications.checked
        );

    }
);


/* =====================================
   SAVE SMS SETTING
===================================== */

smsNotifications.addEventListener(
    "change",
    async () => {

        await saveSetting(
            "smsNotifications",
            smsNotifications.checked
        );

    }
);


/* =====================================
   DARK MODE
===================================== */

darkMode.addEventListener(
    "change",
    async () => {

        const enabled =
            darkMode.checked;


        applyDarkMode(enabled);


        await saveSetting(
            "darkMode",
            enabled
        );

    }
);


function applyDarkMode(enabled) {

    if (enabled) {

        document.body.classList.add(
            "dark-mode"
        );

    } else {

        document.body.classList.remove(
            "dark-mode"
        );

    }

}


/* =====================================
   SAVE SETTING
===================================== */

async function saveSetting(
    field,
    value
) {

    if (!currentUser) {
        return;
    }


    try {

        const userRef =
            doc(
                db,
                "users",
                currentUser.uid
            );


        await setDoc(
            userRef,
            {

                [field]: value

            },

            {
                merge: true
            }

        );


    }

    catch (error) {

        console.error(
            "Setting save error:",
            error
        );

        alert(
            "Unable to save setting."
        );

    }

}


/* =====================================
   CHANGE PASSWORD
===================================== */

changePasswordBtn.addEventListener(
    "click",
    async () => {

        if (!currentUser) {
            return;
        }


        const newPassword =
            prompt(
                "Enter your new password:"
            );


        if (
            newPassword === null
        ) {

            return;

        }


        if (
            newPassword.length < 6
        ) {

            alert(
                "Password must contain at least 6 characters."
            );

            return;

        }


        try {

            await updatePassword(
                currentUser,
                newPassword
            );


            alert(
                "Password changed successfully!"
            );


        }

        catch (error) {

            console.error(
                "Password update error:",
                error
            );


            if (
                error.code ===
                "auth/requires-recent-login"
            ) {

                alert(
                    "For security, please logout and login again before changing your password."
                );

            }

            else {

                alert(
                    "Password update failed: " +
                    error.message
                );

            }

        }

    }
);


/* =====================================
   DELETE ACCOUNT
===================================== */

deleteAccountBtn.addEventListener(
    "click",
    async () => {

        if (!currentUser) {
            return;
        }


        const firstConfirm =
            confirm(
                "Are you sure you want to delete your FabBridge account?"
            );


        if (!firstConfirm) {
            return;
        }


        const secondConfirm =
            confirm(
                "This action cannot be undone. Delete your account permanently?"
            );


        if (!secondConfirm) {
            return;
        }


        try {

            await deleteUser(
                currentUser
            );


            alert(
                "Your account has been deleted successfully."
            );


            window.location.href =
                "login.html";

        }

        catch (error) {

            console.error(
                "Account deletion error:",
                error
            );


            if (
                error.code ===
                "auth/requires-recent-login"
            ) {

                alert(
                    "For security, please logout and login again, then try deleting the account."
                );

            }

            else {

                alert(
                    "Unable to delete account: " +
                    error.message
                );

            }

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
