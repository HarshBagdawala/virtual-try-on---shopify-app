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

    // 3. Otherwise, check Fal.ai status
    const falKey = process.env.FAL_KEY;
    const pollResponse = await fetch(`https://queue.fal.run/fal-ai/idm-vton/requests/${tryOnRecord.replicateId}`, {
      headers: {
        "Authorization": `Key ${falKey}`
      }
    });
    
    const pollData = await pollResponse.json();
    console.log(`Fal.ai Status for ${tryOnId}:`, pollData.status);
    
    if (pollData.status === 'COMPLETED' && pollData.response?.image?.url) {
      const resultUrl = pollData.response.image.url;
      
      // Update DB
      await prisma.tryOnAction.update({
        where: { id: tryOnId },
        data: { 
          status: "COMPLETED", 
          resultImage: resultUrl 
        }
      });

      return json({ success: true, status: "COMPLETED", imageUrl: resultUrl });
    } else if (pollData.status === 'ERROR') {
      await prisma.tryOnAction.update({
        where: { id: tryOnId },
        data: { status: "FAILED" }
      });
      return json({ success: false, status: "FAILED", error: pollData.error || "Generation failed on Fal.ai" });
    }

    // Still pending (IN_QUEUE or IN_PROGRESS)
    return json({ success: true, status: "PENDING" });

  } catch (error) {
    console.error("Polling error:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
