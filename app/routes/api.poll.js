import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function action({ request }) {
  try {
    // Authenticate the request comes from Shopify App Proxy
    const { session } = await authenticate.public.appProxy(request);
    
    // Parse the JSON payload sent from our storefront JS
    const body = await request.json();
    const { tryOnId } = body;

    if (!tryOnId) {
      return json({ success: false, error: "Missing tryOnId" }, { status: 400 });
    }

    // 1. Get the record from DB
    const tryOnRecord = await prisma.tryOnAction.findUnique({
      where: { id: tryOnId }
    });

    console.log(`Polling for ID: ${tryOnId}, ReplicateID: ${tryOnRecord?.replicateId}, Current DB Status: ${tryOnRecord?.status}`);

    if (!tryOnRecord) {
      return json({ success: false, error: "Record not found" }, { status: 404 });
    }

    // 2. If already completed or failed, return that
    if (tryOnRecord.status === "COMPLETED") {
      return json({ success: true, status: "COMPLETED", imageUrl: tryOnRecord.resultImage });
    }
    if (tryOnRecord.status === "FAILED") {
      return json({ success: false, status: "FAILED", error: "Generation failed" });
    }

    // 3. Otherwise, check Replicate status
    const replicateApiToken = process.env.REPLICATE_API_TOKEN;
    const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${tryOnRecord.replicateId}`, {
      headers: {
        "Authorization": `Token ${replicateApiToken}`
      }
    });
    
    const pollData = await pollResponse.json();
    console.log(`Replicate Status for ${tryOnId}:`, pollData.status);
    
    if (pollData.status === 'succeeded') {
      const resultUrl = pollData.output;
      
      // Update DB
      await prisma.tryOnAction.update({
        where: { id: tryOnId },
        data: { 
          status: "COMPLETED", 
          resultImage: Array.isArray(resultUrl) ? resultUrl[0] : resultUrl 
        }
      });

      return json({ success: true, status: "COMPLETED", imageUrl: Array.isArray(resultUrl) ? resultUrl[0] : resultUrl });
    } else if (pollData.status === 'failed' || pollData.status === 'canceled') {
      await prisma.tryOnAction.update({
        where: { id: tryOnId },
        data: { status: "FAILED" }
      });
      return json({ success: false, status: "FAILED", error: pollData.error || "Generation failed" });
    }

    // Still pending
    return json({ success: true, status: "PENDING" });

  } catch (error) {
    console.error("Polling error:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
