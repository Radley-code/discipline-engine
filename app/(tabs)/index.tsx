import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const router = useRouter();

  // Defer navigation slightly to avoid navigating before the root
  // layout / navigator has mounted. Calling `router.replace` during
  // the same commit where the root navigator is mounting can throw
  // "Attempted to navigate before mounting the Root Layout".
  useEffect(() => {
    const id = setTimeout(() => {
      router.replace("/screens/LoginScreen");
    }, 0);
    return () => clearTimeout(id);
  }, [router]);

  return null;
}
