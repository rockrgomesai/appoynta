import { useEffect, useState } from "react";

type Session = {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Replace this with your actual session fetching logic
    const fetchSession = async () => {
      setIsLoading(true);
      try {
        // Example: fetch session from localStorage or API
        const stored = localStorage.getItem("session");
        if (stored) {
          setSession(JSON.parse(stored));
        } else {
          setSession(null);
        }
      } catch {
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, []);

  return { session, isLoading };
}