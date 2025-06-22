import { supabase } from "../hooks/supabase";

export const fetchPlans = async () => {
  const { data, error } = await supabase.from("subscription").select("*");
  if (error) {
    console.error("Failed to fetch plans:", error.message);
    return null;
  }
  return data;
};

export const fetchIntegration = async () => {
  const { data, error } = await supabase.from("integrations").select("*");
  if (error) {
    console.error("Failed to fetch plans:", error.message);
    return null;
  }
  return data;
};
