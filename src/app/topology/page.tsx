import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { buildTopologyGraph } from "@/lib/topology";
import { TopologyGraph } from "@/components/topology/TopologyGraph";

export default async function TopologyPage() {
  await requireAuth();

  const devices = await prisma.device.findMany({
    select: { id: true, name: true, type: true, status: true, ipAddress: true, parentId: true },
  });

  const { nodes, edges } = buildTopologyGraph(devices);

  return (
    <div>
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Network Topology</h2>
          <p className="text-slate-500 text-sm">{devices.length} devices · Click a node to view details</p>
        </div>
      </div>
      <TopologyGraph nodes={nodes} edges={edges} />
    </div>
  );
}
