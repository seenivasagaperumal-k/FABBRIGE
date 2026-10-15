import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ==========================================
// ELEMENTS
// ==========================================

const notificationList =
    document.getElementById("notificationList");

const noNotifications =
    document.getElementById("noNotifications");

const markAllBtn =
    document.getElementById("markAllBtn");


// ==========================================
// LOGIN CHECK
// ==========================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }

        await loadNotifications(
            user.uid
        );

    }
);


// ==========================================
// LOAD NOTIFICATIONS
// ==========================================

async function loadNotifications(userId) {

    try {

        const notificationQuery =
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

            );


        const snapshot =
            await getDocs(
                notificationQuery
            );


        notificationList.innerHTML = "";


        // ==================================
        // NO NOTIFICATIONS
        // ==================================

        if (snapshot.empty) {

            notificationList.style.display =
                "none";

            noNotifications.style.display =
                "block";

            return;

        }


        notificationList.style.display =
            "block";

        noNotifications.style.display =
            "none";


        // ==================================
        // DISPLAY
        // ==================================

        snapshot.forEach(
            (notificationDoc) => {

                const data =
                    notificationDoc.data();


                const notificationId =
                    notificationDoc.id;


                const isRead =
                    data.read === true;


                // ==================================
                // ICON
                // ==================================

                let icon = "🔔";


                if (
                    data.type ===
                    "quotation_accepted"
                ) {

                    icon = "✅";

                }


                else if (
                    data.type ===
                    "quotation_rejected"
                ) {

                    icon = "❌";

                }

                else if (
                    data.type ===
                    "manufacturing_update" ||
                    data.type ===
                    "manufacturing_progress"
                ) {

                    icon = "🏭";

                }


                // ==================================
                // DATE
                // ==================================

                let dateText =
                    "Just now";


                if (
                    data.createdAt &&
                    data.createdAt.toDate
                ) {

                    dateText =
                        data.createdAt
                            .toDate()
                            .toLocaleString();

                }


                // ==================================
                // CARD
                // ==================================

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "notification-card";


                if (!isRead) {

                    card.classList.add(
                        "unread"
                    );

                }


                card.innerHTML = `

                    <div class="icon">

                        ${icon}

                    </div>


                    <div class="content">

                        <h3>

                            ${
                                data.title ||
                                "Notification"
                            }

                        </h3>


                        <p>

                            ${
                                data.message ||
                                "You have a new notification."
                            }

                        </p>


                        <span>

                            ${dateText}

                        </span>


                        <div class="notification-actions">

                            ${
                                !isRead

                                ? `

                                    <button
                                        class="read-btn"
                                        onclick="
                                            markAsRead(
                                                '${notificationId}'
                                            )
                                        "
                                    >

                                        ✓ Mark as Read

                                    </button>

                                `

                                : `

                                    <span
                                        class="read-status"
                                    >

                                        ✓ Read

                                    </span>

                                `
                            }


                            <button
                                class="delete-btn"
                                onclick="
                                    deleteNotification(
                                        '${notificationId}'
                                    )
                                "
                            >

                                🗑 Delete

                            </button>

                        </div>

                    </div>

                `;


                notificationList.appendChild(
                    card
                );

            }
        );

    }


    catch (error) {

        console.error(
            "Notification loading error:",
            error
        );


        notificationList.innerHTML = `

            <div class="notification-card">

                <div class="icon">
                    ⚠️
                </div>

                <div class="content">

                    <h3>
                        Unable to Load Notifications
                    </h3>

                    <p>
                        ${error.message}
                    </p>

                </div>

            </div>

        `;

    }

}


// ==========================================
// MARK ONE AS READ
// ==========================================

window.markAsRead =
async function (
    notificationId
) {

    try {

        const notificationRef =
            doc(
                db,
                "notifications",
                notificationId
            );


        await updateDoc(
            notificationRef,
            {

                read: true

            }
        );


        const user =
            auth.currentUser;


        if (user) {

            await loadNotifications(
                user.uid
            );

        }

    }


    catch (error) {

        console.error(
            "Mark as read error:",
            error
        );


        alert(
            "Unable to mark notification as read."
        );

    }

};


// ==========================================
// MARK ALL AS READ
// ==========================================

markAllBtn.addEventListener(
    "click",
    async () => {

        try {

            const user =
                auth.currentUser;


            if (!user) {

                return;

            }


            const notificationQuery =
                query(

                    collection(
                        db,
                        "notifications"
                    ),

                    where(
                        "userId",
                        "==",
                        user.uid
                    )

                );


            const snapshot =
                await getDocs(
                    notificationQuery
                );


            const updatePromises = [];


            snapshot.forEach(
                (notificationDoc) => {

                    const data =
                        notificationDoc.data();


                    if (
                        data.read !== true
                    ) {

                        updatePromises.push(

                            updateDoc(

                                doc(
                                    db,
                                    "notifications",
                                    notificationDoc.id
                                ),

                                {
                                    read: true
                                }

                            )

                        );

                    }

                }
            );


            await Promise.all(
                updatePromises
            );


            await loadNotifications(
                user.uid
            );


            alert(
                "All notifications marked as read."
            );

        }


        catch (error) {

            console.error(
                "Mark all as read error:",
                error
            );


            alert(
                "Unable to mark all notifications as read."
            );

        }

    }
);


// ==========================================
// DELETE NOTIFICATION
// ==========================================

window.deleteNotification =
async function (
    notificationId
) {

    try {

        const confirmDelete =
            confirm(
                "Delete this notification?"
            );


        if (!confirmDelete) {

            return;

        }


        await deleteDoc(

            doc(
                db,
                "notifications",
                notificationId
            )

        );


        const user =
            auth.currentUser;


        if (user) {

            await loadNotifications(
                user.uid
            );

        }

    }


    catch (error) {

        console.error(
            "Delete notification error:",
            error
        );


        alert(
            "Unable to delete notification."
        );

    }

};