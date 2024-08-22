import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDfo-MWpFF8p7C8UDBK9bKyO5_K23LwZaM",
  authDomain: "proj-63688.firebaseapp.com",
  projectId: "proj-63688",
  storageBucket: "proj-63688.appspot.com",
  messagingSenderId: "260022963566",
  appId: "1:260022963566:web:39e93a51060cfda67e057f",
  measurementId: "G-2EBDHQ33JG"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
export { firestore };