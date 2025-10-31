export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!process.env.PAYMONGO_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Payment configuration error" }),
        { status: 500 }
      );
    }

    const response = await fetch("https://api.paymongo.com/v1/sources", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: body.amount,
            currency: "PHP",
            type: "gcash",
            redirect: {
              success: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/payment/success`,
              failed: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/payment/failed`,
            },
          },
        },
      }),
    });

    const data = await response.json();
    console.log("PayMongo response:", JSON.stringify(data, null, 2));

    if (data.errors) {
      return new Response(JSON.stringify({ error: data.errors }), { status: 400 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    console.error("Server error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}