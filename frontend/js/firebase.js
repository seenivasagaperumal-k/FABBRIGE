import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";


import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";


const firebaseConfig = {

    apiKey:
        "AIzaSyDrbUFuwyTBlYwvRaAw8fQZdBoIuBxKIcQ",

    authDomain:
        "fabbridge-26216.firebaseapp.com",

    projectId:
        "fabbridge-26216",

    storageBucket:
        "fabbridge-26216.firebasestorage.app",

    messagingSenderId:
        "581944175420",

    appId:
        "1:581944175420:web:41a62e8ea0da4f9933cc39"

};


const app =
    initializeApp(
        firebaseConfig
    );


const auth =
    getAuth(app);


const db =
    getFirestore(app);


const storage =
    getStorage(app);


export {
    auth,
    db,
    storage
};