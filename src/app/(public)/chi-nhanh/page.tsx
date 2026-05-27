import Link from "next/link";
import { prisma } from "@/db/prisma";
import { MapPin, Phone, ArrowRight, Clock } from "lucide-react";
import { IMG } from "@/lib/public-images";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const [clinic, branches] = await Promise.all([
    prisma.clinic.findFirst({ select: { name: true, phone: true, email: true, address: true } }),
    prisma.branch.findMany({
      orderBy: [{ isMain: "desc" }, { name: "asc" }],
      select: { id: true, name: true, address: true, phone: true, isMain: true },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Hệ thống chi nhánh</h1>
      <p className="text-gray-500 mb-6">{branches.length} chi nhánh trên toàn quốc · Sẵn sàng phục vụ bạn</p>

      {clinic && (
        <div className="bg-gradient-to-r from-brand-700 to-brand-500 rounded-2xl p-6 text-white mb-8">
          <h2 className="text-xl font-bold mb-1">{clinic.name}</h2>
          <p className="text-brand-100 text-sm">{clinic.address}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            {clinic.phone && (
              <a href={`tel:${clinic.phone}`} className="flex items-center gap-1.5 hover:text-yellow-300">
                <Phone className="w-4 h-4" /> {clinic.phone}
              </a>
            )}
            {clinic.email && (
              <span className="flex items-center gap-1.5">✉️ {clinic.email}</span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-card hover:border-brand-300 transition"
          >
            <div className="aspect-[16/9] overflow-hidden relative">
              <img
                src={IMG.branchExterior}
                alt={b.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              {b.isMain && (
                <span className="absolute top-3 left-3 px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded shadow">
                  Trụ sở chính
                </span>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-bold text-gray-900">{b.name}</h3>
              <p className="text-sm text-gray-600 mt-1 flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-brand-700 mt-0.5 flex-shrink-0" /> {b.address}
              </p>
              <div className="mt-3 space-y-1 text-sm">
                <a href={`tel:${b.phone}`} className="flex items-center gap-1.5 text-brand-700 hover:text-brand-800">
                  <Phone className="w-3.5 h-3.5" /> {b.phone}
                </a>
                <p className="flex items-center gap-1.5 text-gray-500">
                  <Clock className="w-3.5 h-3.5" /> 7h00 – 21h00 (Thứ 2 – CN)
                </p>
              </div>
              <Link
                href={`/dat-lich`}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                Đặt lịch khám tại đây <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {branches.length === 0 && (
        <div className="text-center py-16 text-gray-400">Chưa có chi nhánh nào</div>
      )}
    </div>
  );
}
