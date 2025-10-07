import { VideoModelOption } from '@/lib/types';
import { checkGeminiOperationStatus } from '../generate-video/vertex';
import { checkSoraStatus } from '../generate-video/openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const operationData: string | undefined = body?.operationData;
    const operationName: string | undefined = body?.operationName;
    const model: VideoModelOption | undefined = body?.model;
    if (!operationData && !operationName) {
      return Response.json(
        { error: 'operationData or operationName is required' },
        { status: 400 }
      );
    }
    if (model === 'sora-2') {
      return checkSoraStatus(operationName || operationData!);
    } else {
      return checkGeminiOperationStatus(operationName || operationData!);
    }
  } catch (error) {
    console.error('Error checking video status:', error);
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
