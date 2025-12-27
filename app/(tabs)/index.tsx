import { useRouter } from "expo-router";
import { useEffect } from "react";
import { auth } from "../../services/firebaseConfig";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => {
      // If user is signed in, open home tab, otherwise show login
      if (auth.currentUser) {
        router.replace("./home");
      } else {
        router.replace("./screens/LoginScreen");
      }
    }, 0);
    return () => clearTimeout(id);
  }, [router]);

  return null;
}
