import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface UseIsBloggerResult {
  isBlogger: boolean;
  isLoading: boolean;
}

export const useIsBlogger = (): UseIsBloggerResult => {
  const { user } = useAuth();
  const [isBlogger, setIsBlogger] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsBlogger(false);
      setIsLoading(false);
      return;
    }

    const checkBloggerRole = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "blogger")
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Failed to check blogger role:", error);
          setIsBlogger(false);
        } else {
          setIsBlogger(!!data);
        }
      } catch (err) {
        console.error("Error checking blogger role:", err);
        setIsBlogger(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkBloggerRole();
  }, [user]);

  return { isBlogger, isLoading };
};
