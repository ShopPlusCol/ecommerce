import { getAuth } from "@/modules/auth/auth";

async function handler(request: Request) {
  if (new URL(request.url).pathname.endsWith("/sign-in/email")) {
    return Response.json({ error: "Usa el acceso administrativo." }, { status: 404 });
  }
  return (await getAuth()).handler(request);
}

export const GET = handler;
export const POST = handler;
