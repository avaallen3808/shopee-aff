import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { getCurrentUser } from "@/lib/auth";
import type { ShopeeCredential } from "@/lib/shopee/client";

/**
 * Retrieve and decrypt the current user's Shopee API credentials.
 * Returns null if no credential is stored or no user is logged in.
 */
export async function getShopeeCredential(): Promise<ShopeeCredential | null> {
  const session = await getCurrentUser();
  if (!session) return null;

  const cred = await prisma.shopeeCredential.findUnique({
    where: { userId: session.userId },
  });

  if (!cred) return null;

  try {
    const secret = decrypt(cred.secret);
    return { appId: cred.appId, secret };
  } catch {
    return null;
  }
}
