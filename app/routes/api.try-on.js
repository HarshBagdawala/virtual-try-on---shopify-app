import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// No longer need sleep here as we move polling to the frontend

export async function action({ request }) {
  try {
    // Authenticate the request comes from Shopify App Proxy
    const { session, liquid } = await authenticate.public.appProxy(request);
    
    // In dev mode or without proper app proxy setup this might fail.
    // If you're testing locally outside of App Proxy, you might bypass this check temporarily.
    
    // Parse the JSON payload sent from our storefront JS
    const body = await request.json();
    const { shop, productId, productImage, userImage } = body;

    if (!userImage || !productImage) {
      return json({ success: false, error: "Missing images" }, { status: 400 });
    }

    const replicateApiToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateApiToken) {
      return json({ success: false, error: "Replicate token not configured" }, { status: 500 });
    }

    // 1. Call Replicate API FIRST (using IDM-VTON model)
    const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${replicateApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
        input: {
          garm_img: productImage,
          human_img: userImage,
          category: "upper_body",
          steps: 30
        }
      })
    });

    const prediction = await replicateResponse.json();
    console.log("Replicate Prediction Start Response:", JSON.stringify(prediction));

    if (!prediction.id || prediction.error) {
      console.error("Replicate failed to start:", prediction.error || "No ID returned");
      return json({ success: false, error: prediction.error || "Failed to start AI process" }, { status: 500 });
    }

    // 2. NOW Create the record in Database with the ID already present
    const tryOnRecord = await prisma.tryOnAction.create({
      data: {
        shop,
        productId,
        originalImage: productImage,
        personImage: "base64_hidden",
        status: "PENDING",
        replicateId: prediction.id
      }
    });

    console.log("Database Record Created with ID:", tryOnRecord.id);

    // 3. Return to storefront
    return json({
      success: true,
      tryOnId: tryOnRecord.id,
      replicateId: prediction.id
    });

  } catch (error) {
    console.error("Try-on error:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
