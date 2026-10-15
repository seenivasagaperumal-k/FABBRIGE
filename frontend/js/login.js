// ==================================================
// FABBRIDGE - LOGIN.JS
// ==================================================

import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ==================================================
// LOGIN FORM
// ==================================================

const loginForm =
    document.getElementById("loginForm");


// ==================================================
// ADMIN EMAIL
// ==================================================

const ADMIN_EMAIL =
    "ganesh12@gmail.com";


// ==================================================
// LOGIN
// ==================================================

loginForm.addEventListener(
    "submit",
    async (e) => {

        e.preventDefault();


        // ==================================================
        // INPUT
        // ==================================================

        const email =
            document
                .getElementById("email")
                .value
                .trim();

        const password =
            document
                .getElementById("password")
                .value;


        // ==================================================
        // VALIDATION
        // ==================================================

        if (
            email === "" ||
            password === ""
        ) {

            alert(
                "Please enter your email and password."
            );

            return;

        }


        try {

            // ==================================================
            // FIREBASE LOGIN
            // ==================================================

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            console.log(
                "Logged in UID:",
                user.uid
            );


            // ==================================================
            // ADMIN LOGIN
            // ==================================================

            if (
                email.toLowerCase() ===
                ADMIN_EMAIL.toLowerCase()
            ) {

                alert(
                    "Admin Login Successful!"
                );


                window.location.replace(
                    "admin.html"
                );


                return;

            }


            // ==================================================
            // GET USER PROFILE
            // ==================================================

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnap =
                await getDoc(
                    userRef
                );


            // ==================================================
            // PROFILE NOT FOUND
            // ==================================================

            if (
                !userSnap.exists()
            ) {

                await signOut(auth);


                alert(
                    "User profile not found. Please contact admin."
                );


                return;

            }


            const userData =
                userSnap.data();


            console.log(
                "User Firestore Data:",
                userData
            );


            // ==================================================
            // STATUS
            // ==================================================

            const status =
                String(
                    userData.status ||
                    "pending"
                )
                .trim()
                .toLowerCase();


            // ==================================================
            // VERIFIED
            // ==================================================

            const verified =
                userData.verified === true;


            console.log(
                "Account Status:",
                status
            );


            console.log(
                "Verified:",
                verified
            );


            // ==================================================
            // REJECTED
            // ==================================================

            if (
                status === "rejected"
            ) {

                await signOut(auth);


                alert(
                    "❌ Your account has been rejected by Admin.\n\n" +
                    "Please contact Admin for more information."
                );


                return;

            }


            // ==================================================
            // PENDING
            // ==================================================

            if (
                status === "pending"
            ) {

                await signOut(auth);


                alert(
                    "⏳ Your account is waiting for Admin Verification.\n\n" +
                    "You can login after the Admin approves your account."
                );


                return;

            }


            // ==================================================
            // ACTIVE / APPROVED
            // ==================================================

            if (
                status === "active"
            ) {

                // Old approved accounts
                // are allowed.

            }


            else if (
                status === "approved"
            ) {

                // Approved accounts continue.

            }


            else {

                await signOut(auth);


                alert(
                    "⚠️ Your account is not approved yet.\n\n" +
                    "Please contact Admin."
                );


                return;

            }


            // ==================================================
            // VERIFIED CHECK
            // ==================================================

            if (
                status === "approved" &&
                verified !== true
            ) {

                await signOut(auth);


                alert(
                    "⚠️ Your account approval is incomplete.\n\n" +
                    "Please contact Admin."
                );


                return;

            }


            // ==================================================
            // USER TYPE
            // ==================================================

            let userType =
                String(
                    userData.userType ||
                    ""
                )
                .trim()
                .toLowerCase();


            // ==================================================
            // OLD ROLE COMPATIBILITY
            // ==================================================

            if (
                userType === ""
            ) {

                const oldRole =
                    String(
                        userData.role ||
                        ""
                    )
                    .trim()
                    .toLowerCase();


                // ==================================================
                // COMPANY / MANUFACTURER
                // ==================================================

                if (
                    oldRole === "company" ||
                    oldRole === "manufacturer" ||
                    oldRole === "service provider"
                ) {

                    userType =
                        "company";

                }


                // ==================================================
                // CUSTOMER
                // ==================================================

                else if (
                    oldRole === "customer" ||
                    oldRole === "customer / business"
                ) {

                    userType =
                        "customer";

                }

            }


            // ==================================================
            // COMPANY LOGIN
            // ==================================================

            if (
                userType === "company" ||
                userType === "manufacturer"
            ) {

                alert(
                    "Company Login Successful!"
                );


                window.location.replace(
                    "dashboard.html"
                );


                return;

            }


            // ==================================================
            // CUSTOMER LOGIN
            // ==================================================

            if (
                userType === "customer"
            ) {

                alert(
                    "Customer Login Successful!"
                );


                window.location.replace(
                    "customer-dashboard.html"
                );


                return;

            }


            // ==================================================
            // UNKNOWN ACCOUNT TYPE
            // ==================================================

            await signOut(auth);


            alert(
                "⚠️ Account type not recognized.\n\n" +
                "Please contact Admin."
            );

        }


        // ==================================================
        // LOGIN ERROR
        // ==================================================

        catch (error) {

            console.error(
                "Login Error:",
                error
            );


            // ==================================================
            // INVALID CREDENTIAL
            // ==================================================

            if (
                error.code ===
                "auth/invalid-credential"
            ) {

                alert(
                    "Invalid email or password."
                );

            }


            // ==================================================
            // USER NOT FOUND
            // ==================================================

            else if (
                error.code ===
                "auth/user-not-found"
            ) {

                alert(
                    "No account found with this email."
                );

            }


            // ==================================================
            // WRONG PASSWORD
            // ==================================================

            else if (
                error.code ===
                "auth/wrong-password"
            ) {

                alert(
                    "Incorrect password."
                );

            }


            // ==================================================
            // TOO MANY REQUESTS
            // ==================================================

            else if (
                error.code ===
                "auth/too-many-requests"
            ) {

                alert(
                    "Too many login attempts. Please try again later."
                );

            }


            // ==================================================
            // OTHER ERRORS
            // ==================================================

            else {

                alert(
                    "Login failed:\n" +
                    error.message
                );

            }

        }

    }
);