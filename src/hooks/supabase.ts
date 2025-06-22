import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qyefqpftdcssakdntfqs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZWZxcGZ0ZGNzc2FrZG50ZnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzIwMzgsImV4cCI6MjA2NTc0ODAzOH0.PcKOQLwdFb7ZCtnNbAxSNt2FjItOhTo6RTW1gluqdsk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
