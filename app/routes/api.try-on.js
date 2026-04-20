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

    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return json({ success: false, error: "Fal.ai key not configured" }, { status: 500 });
    }

    // Ensure userImage has the proper data URI prefix for Fal.ai
    const formattedUserImage = userImage.startsWith('data:') ? userImage : `data:image/jpeg;base64,${userImage}`;

    // 1. Call Fal.ai API FIRST (IDM-VTON queue)
    const falResponse = await fetch("https://queue.fal.run/fal-ai/idm-vton", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        garment_image_url: productImage,
        human_image_url: formattedUserImage,
        category: "upper_body"
      })
    });

    const prediction = await falResponse.json();
    console.log("Fal.ai Prediction Start Response:", JSON.stringify(prediction));

    if (!prediction.request_id) {
      console.error("Fal.ai failed to start:", prediction);
      return json({ success: false, error: "Failed to start AI process on Fal.ai" }, { status: 500 });
    }

    // 2. NOW Create the record in Database with the Request ID
    const tryOnRecord = await prisma.tryOnAction.create({
      data: {
        shop,
        productId,
        originalImage: productImage,
        personImage: "base64_hidden",
        status: "PENDING",
        replicateId: prediction.request_id // We use the same field for request_id
      }
    });

    console.log("Database Record Created with ID:", tryOnRecord.id);

    // 3. Return to storefront
    return json({
      success: true,
      tryOnId: tryOnRecord.id,
      replicateId: prediction.request_id
    });

  } catch (error) {
    console.error("Try-on error:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
