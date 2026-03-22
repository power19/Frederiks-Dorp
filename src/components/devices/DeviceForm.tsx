"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeviceStatus, DeviceType } from "@/generated/prisma";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(DeviceType),
  ipAddress: z.string().optional(),
  macAddress: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  status: z.nativeEnum(DeviceStatus),
  notes: z.string().optional(),
  parentId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Device {
  id: string;
  name: string;
}

interface Props {
  defaultValues?: Partial<FormData>;
  deviceId?: string;
  devices?: Device[];
}

const deviceTypeLabels: Record<DeviceType, string> = {
  SWITCH: "Switch",
  ROUTER: "Router",
  ACCESS_POINT: "Access Point",
  P2P: "Point-to-Point",
  POS: "POS System",
  STARLINK: "Starlink",
  PATCH_PANEL: "Patch Panel",
};

export function DeviceForm({ defaultValues, deviceId, devices = [] }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "ACTIVE",
      type: "SWITCH",
      ...defaultValues,
    },
  });

  async function onSubmit(data: FormData) {
    setError("");
    const url = deviceId ? `/api/devices/${deviceId}` : "/api/devices";
    const method = deviceId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error?.message ?? "Something went wrong");
      return;
    }

    const saved = await res.json();
    router.push(`/devices/${deviceId ?? saved.id}`);
    router.refresh();
  }

  const field = "border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
          <input {...register("name")} className={field} placeholder="e.g. Core-Router-01" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
          <select {...register("type")} className={field}>
            {Object.entries(deviceTypeLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">IP Address</label>
          <input {...register("ipAddress")} className={field} placeholder="192.168.1.1" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">MAC Address</label>
          <input {...register("macAddress")} className={field} placeholder="AA:BB:CC:DD:EE:FF" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturer</label>
          <input {...register("manufacturer")} className={field} placeholder="e.g. Ubiquiti" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
          <input {...register("model")} className={field} placeholder="e.g. US-24-Pro" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
          <input {...register("serialNumber")} className={field} placeholder="SN-XXXXXXXX" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Location / Site</label>
          <input {...register("location")} className={field} placeholder="e.g. Main Site" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select {...register("status")} className={field}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Connected To (Parent)</label>
          <select {...register("parentId")} className={field}>
            <option value="">— None —</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea {...register("notes")} rows={3} className={field} placeholder="Any additional notes…" />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
        >
          {isSubmitting ? "Saving…" : deviceId ? "Save Changes" : "Create Device"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-5 py-2 rounded-lg text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
