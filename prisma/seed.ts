import { PrismaClient, DeviceType, DeviceStatus } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashed = await bcrypt.hash("Admin@1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@fd.local" },
    update: {},
    create: {
      name: "Administrator",
      email: "admin@fd.local",
      password: hashed,
      role: "admin",
    },
  });
  console.log("Admin user:", admin.email);

  // Create sample devices
  const starlink = await prisma.device.upsert({
    where: { id: "seed-starlink-1" },
    update: {},
    create: {
      id: "seed-starlink-1",
      name: "Starlink-Main",
      type: DeviceType.STARLINK,
      ipAddress: "192.168.100.1",
      manufacturer: "SpaceX",
      model: "Standard",
      location: "Main Site",
      status: DeviceStatus.ACTIVE,
      notes: "Primary internet uplink via Starlink",
    },
  });

  const router = await prisma.device.upsert({
    where: { id: "seed-router-1" },
    update: {},
    create: {
      id: "seed-router-1",
      name: "Core-Router-01",
      type: DeviceType.ROUTER,
      ipAddress: "192.168.1.1",
      macAddress: "AA:BB:CC:11:22:33",
      manufacturer: "MikroTik",
      model: "RB4011",
      location: "Main Site",
      status: DeviceStatus.ACTIVE,
      parentId: starlink.id,
      notes: "Main site core router",
    },
  });

  const sw1 = await prisma.device.upsert({
    where: { id: "seed-switch-1" },
    update: {},
    create: {
      id: "seed-switch-1",
      name: "SW-Main-01",
      type: DeviceType.SWITCH,
      ipAddress: "192.168.1.10",
      manufacturer: "Ubiquiti",
      model: "US-24-Pro",
      location: "Main Site",
      status: DeviceStatus.ACTIVE,
      parentId: router.id,
    },
  });

  await prisma.device.upsert({
    where: { id: "seed-ap-1" },
    update: {},
    create: {
      id: "seed-ap-1",
      name: "AP-Main-01",
      type: DeviceType.ACCESS_POINT,
      ipAddress: "192.168.1.20",
      manufacturer: "Ubiquiti",
      model: "U6-Pro",
      location: "Main Site",
      status: DeviceStatus.ACTIVE,
      parentId: sw1.id,
    },
  });

  await prisma.device.upsert({
    where: { id: "seed-pos-1" },
    update: {},
    create: {
      id: "seed-pos-1",
      name: "POS-Terminal-01",
      type: DeviceType.POS,
      ipAddress: "192.168.1.50",
      manufacturer: "Verifone",
      model: "VX520",
      location: "Main Site",
      status: DeviceStatus.ACTIVE,
      parentId: sw1.id,
      notes: "Front desk POS terminal",
    },
  });

  await prisma.device.upsert({
    where: { id: "seed-p2p-1" },
    update: {},
    create: {
      id: "seed-p2p-1",
      name: "P2P-Site2-TX",
      type: DeviceType.P2P,
      ipAddress: "10.0.0.1",
      manufacturer: "Ubiquiti",
      model: "LiteBeam 5AC Gen2",
      location: "Main Site",
      status: DeviceStatus.ACTIVE,
      parentId: router.id,
      notes: "Point-to-point link to Site 2",
    },
  });

  // Seed changelog entries
  for (const device of [starlink, router, sw1]) {
    await prisma.changelogEntry.upsert({
      where: { id: `seed-log-${device.id}` },
      update: {},
      create: {
        id: `seed-log-${device.id}`,
        deviceId: device.id,
        action: "CREATED",
        summary: `Device "${device.name}" created`,
        author: admin.email,
      },
    });
  }

  console.log("Seed complete — 6 devices created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
