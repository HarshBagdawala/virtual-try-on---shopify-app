import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// Sleep helper for polling
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

    // 1. Create a Pending TryOnAction in Database
    const tryOnRecord = await prisma.tryOnAction.create({
      data: {
        shop,
        productId,
        originalImage: productImage,
        personImage: "base64_hidden_for_size", // don't store full base64 in DB to save space, normally upload to Supabase storage first
        status: "PENDING"
      }
    });

    // 2. Call Replicate API (using IDM-VTON model)
    const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${replicateApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4", // specific model version
        input: {
          garm_img: productImage,
          human_img: userImage,
          category: "upper_body", // Could be dynamic based on product tags
          steps: 30
        }
      })
    });

    const prediction = await replicateResponse.json();

    if (prediction.error) {
      await prisma.tryOnAction.update({
        where: { id: tryOnRecord.id },
        data: { status: "FAILED" }
      });
      return json({ success: false, error: prediction.error });
    }

    let predictionId = prediction.id;
    let resultUrl = null;
    let attempts = 0;

    // 3. Poll Replicate for the result (App proxies have a 30s timeout, so we cap polling around 25s)
    // In a truly production app with long generation times, we'd use Webhooks or a background queue (BullMQ),
    // and let the frontend poll our backend separately.
    while (attempts < 10) {
      await sleep(2500);
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          "Authorization": `Token ${replicateApiToken}`
        }
      });
      
      const pollData = await pollResponse.json();
      
      if (pollData.status === 'succeeded') {
        resultUrl = pollData.output;
        break;
      } else if (pollData.status === 'failed' || pollData.status === 'canceled') {
        break;
      }
      
      attempts++;
    }

    if (!resultUrl) {
      // It timed out or failed
      await prisma.tryOnAction.update({
        where: { id: tryOnRecord.id },
        data: { status: "FAILED", replicateId: predictionId }
      });
      // Fallback for demo purposes if Replicate is not actually firing
      return json({ 
        success: false, 
        error: "Generation timed out. Replicate might be booting or cold starting." 
      });
    }

    // 4. Update Database with Success
    await prisma.tryOnAction.update({
      where: { id: tryOnRecord.id },
      data: { 
        status: "COMPLETED", 
        resultImage: resultUrl,
        replicateId: predictionId
      }
    });

    // 5. Return the image to the storefront!
    // App proxy requires returning JSON or specific Content-Type
    return json({
      success: true,
      imageUrl: resultUrl
    });

  } catch (error) {
    console.error("Try-on error:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
