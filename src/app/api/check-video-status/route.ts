import { VideoModelOption } from "@/lib/types";
import { checkSoraStatus } from "../generate-video/openai";
import { checkGeminiOperationStatus } from "../generate-video/vertex";

export async function POST(request: Request) {
  const useX402 = request.headers.get("use-x402") === "true";
  const paymentHeader = request.headers.get("x-payment");

  try {
    const body = await request.json();
    const operationData: string | undefined = body?.operationData;
    const operationName: string | undefined = body?.operationName;
    const model: VideoModelOption | undefined = body?.model;
    if (!operationData && !operationName) {
      return Response.json(
        { error: "operationData or operationName is required" },
        { status: 400 },
      );
    }
    if (model === "sora-2") {
      return checkSoraStatus(
        operationName || operationData!,
        useX402,
        paymentHeader || undefined,
      );
    } else {
      return checkGeminiOperationStatus(
        operationName || operationData!,
        useX402,
      );
    }
  } catch (error) {
    console.error("Error checking video status:", error);
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
