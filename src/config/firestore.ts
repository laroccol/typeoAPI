import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import serviceAccount from "../auth/firebaseadminsdk";
initializeApp({
  credential: cert(
    //@ts-expect-error typscript not configured for firebase
    serviceAccount
  ),
});

export const db = getFirestore();
