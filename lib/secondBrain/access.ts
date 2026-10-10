import { accessForCustomer } from "@/lib/commerce/materialAccess";
import { secondBrainAccess } from "./course";
export async function getSecondBrainAccess(customerId: number | null) {
  return secondBrainAccess(await accessForCustomer(customerId));
}
