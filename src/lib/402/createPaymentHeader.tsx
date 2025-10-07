import { PaymentRequirements, type Signer } from 'x402/types';
import { createPaymentHeader as x402CreatePaymentHeader } from 'x402/client';

export async function createPaymentHeader(
  signer: Signer,
  responseBody: string
): Promise<string> {
  const paymentDetails = JSON.parse(responseBody);

  const acceptSpec = paymentDetails.accepts[0];
  
  const paymentRequirement: PaymentRequirements = {
    scheme: acceptSpec.scheme,
    description: acceptSpec.description,
    network: acceptSpec.network,
    maxAmountRequired: acceptSpec.maxAmountRequired,
    resource: acceptSpec.resource,
    mimeType: acceptSpec.mimeType,
    payTo: acceptSpec.payTo,
    maxTimeoutSeconds: acceptSpec.maxTimeoutSeconds,
    asset: acceptSpec.asset,
    outputSchema: acceptSpec.outputSchema,
    extra: acceptSpec.extra,
  };
  
  const paymentHeader = await x402CreatePaymentHeader(
    signer,
    paymentDetails.x402Version,
    paymentRequirement
  );
  return paymentHeader;
}
