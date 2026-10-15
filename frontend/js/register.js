// ==================================================
// FABBRIDGE - REGISTER.JS
// ==================================================

import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ==================================================
// FORM
// ==================================================

const form =
    document.getElementById("registerForm");


// ==================================================
// REGISTER
// ==================================================

form.addEventListener(
    "submit",
    async (e) => {

        e.preventDefault();


        // ==================================================
        // GET VALUES
        // ==================================================

        const companyName =
            document.getElementById("companyName").value.trim();

        const ownerName =
            document.getElementById("ownerName").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const phone =
            document.getElementById("phone").value.trim();

        const userType =
            document.getElementById("userType").value;

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;


        // ==================================================
        // VALIDATION
        // ==================================================

        if (
            companyName === "" ||
            ownerName === "" ||
            email === "" ||
            phone === "" ||
            userType === "" ||
            password === "" ||
            confirmPassword === ""
        ) {

            alert("Please fill all fields.");

            return;

        }


        // ==================================================
        // VALID USER TYPE
        // ==================================================

        if (
            userType !== "manufacturer" &&
            userType !== "customer" &&
            userType !== "company"
        ) {

            alert(
                "Please select Customer or Manufacturer."
            );

            return;

        }


        // ==================================================
        // PASSWORD CHECK
        // ==================================================

        if (
            password !== confirmPassword
        ) {

            alert(
                "Passwords do not match."
            );

            return;

        }


        if (
            password.length < 6
        ) {

            alert(
                "Password should be at least 6 characters."
            );

            return;

        }


        try {

            // ==================================================
            // CREATE AUTH ACCOUNT
            // ==================================================

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            // ==================================================
            // NORMALIZE ROLE
            // ==================================================

            let normalizedType =
                userType
                    .toString()
                    .trim()
                    .toLowerCase();


            // Old "company" value = manufacturer
            if (
                normalizedType === "company"
            ) {

                normalizedType =
                    "manufacturer";

            }


            // ==================================================
            // SAVE USER
            // ==================================================

            await setDoc(

                doc(
                    db,
                    "users",
                    user.uid
                ),

                {

                    // ------------------------------------------
                    // BASIC DETAILS
                    // ------------------------------------------

                    companyName:
                        companyName,

                    ownerName:
                        ownerName,

                    email:
                        email,

                    phone:
                        phone,


                    // ------------------------------------------
                    // USER TYPE
                    // ------------------------------------------

                    userType:
                        normalizedType,


                    // ------------------------------------------
                    // NEW ROLE
                    // ------------------------------------------

                    role:
                        normalizedType === "manufacturer"
                            ? "Manufacturer"
                            : "Customer",


                    // ------------------------------------------
                    // ADMIN VERIFICATION
                    // ------------------------------------------

                    status:
                        "pending",

                    verified:
                        false,


                    // ------------------------------------------
                    // PROFILE
                    // ------------------------------------------

                    address:
                        "",

                    about:
                        "",


                    // ------------------------------------------
                    // CREATED TIME
                    // ------------------------------------------

                    createdAt:
                        new Date().toISOString()

                }

            );


            // ==================================================
            // SUCCESS
            // ==================================================

            alert(
                "Registration successful!\n\n" +
                "Your account is waiting for admin verification."
            );


            // ==================================================
            // LOGIN PAGE
            // ==================================================

            window.location.href =
                "login.html";

        }


        catch (error) {

            console.error(
                "Registration Error:",
                error
            );


            if (
                error.code ===
                "auth/email-already-in-use"
            ) {

                alert(
                    "This email is already registered."
                );

            }

            else if (
                error.code ===
                "auth/weak-password"
            ) {

                alert(
                    "Password should be at least 6 characters."
                );

            }

            else if (
                error.code ===
                "auth/invalid-email"
            ) {

                alert(
                    "Please enter a valid email address."
                );

            }

            else {

                alert(
                    "Registration failed:\n" +
                    error.message
                );

            }

        }

    }
);