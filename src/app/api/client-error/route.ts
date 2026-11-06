export async function POST(req: Request) {
  const text = (await req.text()).slice(0, 600);
  console.error(`Erreur navigateur : ${text}`);
  return new Response(null, { status: 204 });
}
