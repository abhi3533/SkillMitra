import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { email } = await req.json();
  if (!email) {
    return new Response(JSON.stringify({ error: "email required" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Find user by email
  const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers();
  if (listErr) {
    return new Response(JSON.stringify({ error: listErr.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const user = users?.find((u: any) => u.email === email);
  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Cleanup
  await adminClient.from("trainers").delete().eq("user_id", user.id);
  await adminClient.from("students").delete().eq("user_id", user.id);
  await adminClient.from("user_roles").delete().eq("user_id", user.id);
  await adminClient.from("profiles").delete().eq("id", user.id);
  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, deleted_user_id: user.id }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
