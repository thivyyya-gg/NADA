import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCK_uhUp77257837isvbkzsgnW5Zpvswbw",
  authDomain: "nada-301ef.firebaseapp.com",
  projectId: "nada-301ef",
  storageBucket: "nada-301ef.firebasestorage.app",
  messagingSenderId: "478024897077",
  appId: "1:478024897077:web:4f87e87d0ab143c8acd77c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
