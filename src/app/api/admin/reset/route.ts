import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Require confirmation token in body
  const body = await req.json().catch(() => ({}));
  if (body.confirm !== "WIPE") {
    return NextResponse.json({ error: "Missing confirmation" }, { status: 400 });
  }

  // Delete in dependency order (children before parents)
  // Cascades handle: PatchPanelPort, ChangelogEntry, CustomerContact, Location
  await prisma.$transaction([
    prisma.changelogEntry.deleteMany(),
    prisma.patchPanelPort.deleteMany(),
    prisma.device.deleteMany(),
    prisma.customerContact.deleteMany(),
    prisma.location.deleteMany(),
    prisma.customer.deleteMany(),
  ]);

  return NextResponse.json({ success: true });
}
