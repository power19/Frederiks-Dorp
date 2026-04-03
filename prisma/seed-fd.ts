/**
 * One-time seed: Frederiks-Dorp customer + full network topology
 * Run with:  npx tsx prisma/seed-fd.ts
 */
import { PrismaClient, DeviceType, DeviceStatus } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding Frederiks-Dorp …");

  // ── 1. Customer ─────────────────────────────────────────────────────────────
  const customer = await prisma.customer.create({
    data: {
      name:    "Frederiks Dorp",
      address: "Frederiks Dorp, Suriname",
      notes:   "Main customer site with multiple locations linked via P2P",
    },
  });
  console.log(`✔  Customer: ${customer.name} (${customer.id})`);

  // ── 2. Contacts ──────────────────────────────────────────────────────────────
  const contacts = [
    { name: "Sirano",   phone: "+597 817-8993" },
    { name: "Angelita", phone: "+597 816-1705" },
    { name: "Desire",   phone: "+597 830-8877" },
    { name: "Nawin",    phone: "+597 718-5849" },
  ];
  for (const c of contacts) {
    await prisma.customerContact.create({ data: { customerId: customer.id, ...c } });
    console.log(`✔  Contact: ${c.name}`);
  }

  // ── 3. Devices ───────────────────────────────────────────────────────────────
  // Helper — creates a device and immediately returns its id
  async function mkDevice(data: {
    name: string;
    type: DeviceType;
    status?: DeviceStatus;
    ipAddress?: string;
    manufacturer?: string;
    model?: string;
    location?: string;
    notes?: string;
    parentId?: string;
  }) {
    const d = await prisma.device.create({
      data: {
        ...data,
        status:     data.status ?? DeviceStatus.ACTIVE,
        customerId: customer.id,
      },
    });
    console.log(`✔  Device: ${d.name}`);
    return d.id;
  }

  // ── Main site ────────────────────────────────────────────────────────────────
  const starlink = await mkDevice({
    name:         "Starlink-01",
    type:         DeviceType.STARLINK,
    manufacturer: "Starlink",
    location:     "Frederiks Dorp - Main Site Roof",
    notes:        "Primary internet uplink",
  });

  const ppMain = await mkDevice({
    name:     "PP-Main",
    type:     DeviceType.PATCH_PANEL,
    location: "Frederiks Dorp - Main Site",
    notes:    "Port 1 → ER605",
    parentId: starlink,
  });

  const er605 = await mkDevice({
    name:         "ER605-Main",
    type:         DeviceType.ROUTER,
    ipAddress:    "192.168.1.1",
    manufacturer: "TP-Link",
    model:        "ER605",
    location:     "Frederiks Dorp - Main Site",
    notes:        "Main gateway router. WAN from Starlink via PP-Main port 1.",
    parentId:     ppMain,
  });

  // ── Branch 1: Keuken ────────────────────────────────────────────────────────
  const p2pKeukenTX = await mkDevice({
    name:         "P2P-Keuken-TX",
    type:         DeviceType.P2P,
    manufacturer: "Ubiquiti",
    model:        "PowerBeam M5",
    location:     "Frederiks Dorp - Main Site Roof",
    notes:        "P2P #1 transmitter → Keuken",
    parentId:     er605,
  });

  const p2pKeukenRX = await mkDevice({
    name:         "P2P-Keuken-RX",
    type:         DeviceType.P2P,
    manufacturer: "Ubiquiti",
    model:        "PowerBeam M5",
    location:     "Keuken",
    notes:        "P2P #1 receiver at Keuken",
    parentId:     p2pKeukenTX,
  });

  const swKeuken = await mkDevice({
    name:         "SW-Keuken-01",
    type:         DeviceType.SWITCH,
    ipAddress:    "192.168.2.1",
    manufacturer: "TP-Link",
    model:        "TL-SG116 (16-port)",
    location:     "Keuken",
    notes:        "16-port switch at Keuken. Feeds Bar AP and Receptie Router.",
    parentId:     p2pKeukenRX,
  });

  await mkDevice({
    name:         "AP-Bar",
    type:         DeviceType.ACCESS_POINT,
    ipAddress:    "192.168.2.10",
    manufacturer: "Ubiquiti",
    location:     "Bar",
    notes:        "Wireless AP at Bar. Cat6 uplink to SW-Keuken-01.",
    parentId:     swKeuken,
  });

  await mkDevice({
    name:         "Router-Receptie",
    type:         DeviceType.ROUTER,
    ipAddress:    "192.168.2.20",
    manufacturer: "TP-Link",
    location:     "Reception",
    notes:        "SSID: Receptie. Cat6 uplink to SW-Keuken-01.",
    parentId:     swKeuken,
  });

  // ── Branch 2: Ambassador → Verhalen Museum ──────────────────────────────────
  const p2pAmbTX = await mkDevice({
    name:         "P2P-Ambassador-TX",
    type:         DeviceType.P2P,
    manufacturer: "Ubiquiti",
    model:        "PowerBeam M5",
    location:     "Frederiks Dorp - Main Site Roof",
    notes:        "P2P #2 transmitter → Ambassador",
    parentId:     er605,
  });

  const p2pAmbRX = await mkDevice({
    name:         "P2P-Ambassador-RX",
    type:         DeviceType.P2P,
    manufacturer: "Ubiquiti",
    model:        "PowerBeam M5",
    location:     "Ambassador",
    notes:        "P2P #2 receiver at Ambassador",
    parentId:     p2pAmbTX,
  });

  const p2pVerhalenTX = await mkDevice({
    name:         "P2P-VerhalenMus-TX",
    type:         DeviceType.P2P,
    manufacturer: "Ubiquiti",
    model:        "PowerBeam M5",
    location:     "Ambassador",
    notes:        "P2P #3 transmitter at Ambassador → Verhalen Museum",
    parentId:     p2pAmbRX,
  });

  await mkDevice({
    name:         "AP-VerhalenMus",
    type:         DeviceType.ACCESS_POINT,
    manufacturer: "Ubiquiti",
    location:     "Verhalen Museum",
    notes:        "Wireless AP at Verhalen Museum. Uplink via P2P from Ambassador.",
    parentId:     p2pVerhalenTX,
  });

  // ── Branch 3: Politie Woning → Cabana 22 ───────────────────────────────────
  const p2pPolTX = await mkDevice({
    name:         "P2P-PolitieWoning-TX",
    type:         DeviceType.P2P,
    manufacturer: "Ubiquiti",
    model:        "PowerBeam M5",
    location:     "Frederiks Dorp - Main Site Roof",
    notes:        "P2P #4 transmitter → Politie Woning",
    parentId:     er605,
  });

  const p2pPolRX = await mkDevice({
    name:         "P2P-PolitieWoning-RX",
    type:         DeviceType.P2P,
    manufacturer: "Ubiquiti",
    model:        "PowerBeam M5",
    location:     "Politie Woning",
    notes:        "P2P #4 receiver at Politie Woning",
    parentId:     p2pPolTX,
  });

  await mkDevice({
    name:         "AP-PolitieWoning",
    type:         DeviceType.ACCESS_POINT,
    manufacturer: "Ubiquiti",
    location:     "Politie Woning",
    notes:        "SSID: OFFICE / GUEST. Wireless AP at Politie Woning.",
    parentId:     p2pPolRX,
  });

  const p2pCabanaTX = await mkDevice({
    name:         "P2P-Cabana22-TX",
    type:         DeviceType.P2P,
    manufacturer: "Ubiquiti",
    model:        "PowerBeam M5",
    location:     "Politie Woning",
    notes:        "P2P transmitter at Politie Woning → Cabana 22",
    parentId:     p2pPolRX,
  });

  await mkDevice({
    name:         "AP-Cabana22",
    type:         DeviceType.ACCESS_POINT,
    manufacturer: "Ubiquiti",
    location:     "Cabana 22",
    notes:        "Wireless AP at Cabana 22. Uplink via P2P from Politie Woning.",
    parentId:     p2pCabanaTX,
  });

  console.log("\n✅  Done! Frederiks Dorp fully seeded.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
