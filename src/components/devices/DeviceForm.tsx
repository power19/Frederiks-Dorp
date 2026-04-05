"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { DeviceStatus, DeviceType } from "@/generated/prisma";
import { MapPin, Loader2 } from "lucide-react";

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
  wirelessMode: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  parentId: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  customerId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface Device {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Props {
  defaultValues?: Partial<FormData>;
  deviceId?: string;
  devices?: Device[];
  customers?: Customer[];
  lockedCustomerId?: string;
}

const deviceTypeLabels: Record<DeviceType, string> = {
  SWITCH: "Switch",
  ROUTER: "Router",
  ACCESS_POINT: "Access Point",
  P2P: "Point-to-Point",
  POS: "POS System",
  STARLINK: "Starlink",
  PATCH_PANEL: "Patch Panel",
  CAMERA: "IP Camera",
  NVR: "NVR",
  DVR: "DVR",
  MOTION_SENSOR: "Motion Sensor",
};

export function DeviceForm({ defaultValues, deviceId, devices = [], customers = [], lockedCustomerId = "" }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "ACTIVE",
      type: "SWITCH",
      ...defaultValues,
    },
  });

  const isPatchPanel = watch("type") === "PATCH_PANEL";
  const isWireless   = ["P2P", "ACCESS_POINT"].includes(watch("type") ?? "");
  const selectedCustomerId = watch("customerId");

  useEffect(() => {
    const cid = selectedCustomerId;
    if (!cid) { setLocations([]); return; }
    fetch(`/api/customers/${cid}/locations`)
      .then(r => r.json())
      .then(setLocations)
      .catch(() => setLocations([]));
  }, [selectedCustomerId]);

  function getGpsLocation() {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by this browser.");
      return;
    }
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("latitude", parseFloat(pos.coords.latitude.toFixed(6)));
        setValue("longitude", parseFloat(pos.coords.longitude.toFixed(6)));
        setGpsLoading(false);
      },
      (err) => {
        setGpsError("Could not get location: " + err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

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
      try {
        const err = await res.json();
        const raw = err.error;
        if (typeof raw === "string") {
          setError(raw);
        } else if (raw?.fieldErrors) {
          // Zod flatten error — pick the first field error message
          const first = Object.values(raw.fieldErrors as Record<string, string[]>)[0]?.[0];
          setError(first ?? "Validation error");
        } else {
          setError(raw?.message ?? "Something went wrong");
        }
      } catch {
        setError(`Server error (${res.status}) — please try again`);
      }
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

        {isWireless && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Wireless Mode</label>
              <select {...register("wirelessMode")} className={field}>
                <option value="">— Select —</option>
                <option value="ST">ST (Station)</option>
                <option value="AP">AP (Access Point)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
              <select {...register("frequency")} className={field}>
                <option value="">— Select —</option>
                <option value="900 MHz">900 MHz</option>
                <option value="2.4 GHz">2.4 GHz</option>
                <option value="5 GHz">5 GHz</option>
                <option value="5.8 GHz">5.8 GHz</option>
                <option value="6 GHz">6 GHz</option>
                <option value="11 GHz">11 GHz</option>
                <option value="24 GHz">24 GHz</option>
                <option value="60 GHz">60 GHz</option>
              </select>
            </div>
          </>
        )}

        {!isPatchPanel && (
          <>
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
          </>
        )}

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

        {lockedCustomerId ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
            <div className={`${field} bg-slate-50 text-slate-600`}>
              {customers.find(c => c.id === lockedCustomerId)?.name ?? lockedCustomerId}
            </div>
            <input type="hidden" {...register("customerId")} value={lockedCustomerId} />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
            <select {...register("customerId")} className={field}>
              <option value="">— None —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {(selectedCustomerId && locations.length > 0) && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <select {...register("locationId")} className={field}>
              <option value="">— Select Location —</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">GPS Coordinates</label>
            <button
              type="button"
              onClick={getGpsLocation}
              disabled={gpsLoading}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
            >
              {gpsLoading ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
              {gpsLoading ? "Getting location…" : "Use My Location"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input {...register("latitude", { valueAsNumber: true })} type="number" step="any" className={field} placeholder="Latitude (e.g. 12.1234)" />
            <input {...register("longitude", { valueAsNumber: true })} type="number" step="any" className={field} placeholder="Longitude (e.g. -68.9234)" />
          </div>
          {gpsError && <p className="text-red-500 text-xs mt-1">{gpsError}</p>}
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
