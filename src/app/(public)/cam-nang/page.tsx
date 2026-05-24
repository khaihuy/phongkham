import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

const SAMPLE_POSTS = [
  {
    slug: "cach-uong-thuoc-dung-cach",
    title: "Cách uống thuốc đúng cách để đạt hiệu quả tối đa",
    excerpt: "Hướng dẫn thời điểm uống thuốc, tương tác với thức ăn và những điều cần tránh.",
    tag: "Thuốc",
    date: "2026-05-20",
  },
  {
    slug: "vitamin-cho-tre-em",
    title: "Vitamin cần thiết cho trẻ em theo từng độ tuổi",
    excerpt: "Bảng tổng hợp vitamin và khoáng chất cần bổ sung cho trẻ 0-12 tuổi.",
    tag: "Mẹ & Bé",
    date: "2026-05-18",
  },
  {
    slug: "cao-huyet-ap",
    title: "Cao huyết áp: nguyên nhân và phòng ngừa",
    excerpt: "Các yếu tố nguy cơ và biện pháp phòng tránh tăng huyết áp ở người lớn.",
    tag: "Bệnh thường gặp",
    date: "2026-05-15",
  },
];

export default function CamNangPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-brand-700" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cẩm nang sức khỏe</h1>
          <p className="text-sm text-gray-500">Bài viết & lời khuyên từ bác sĩ chuyên khoa</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {SAMPLE_POSTS.map((post) => (
          <article
            key={post.slug}
            className="bg-white rounded-xl shadow-product hover:shadow-card transition overflow-hidden"
          >
            <div className="aspect-[16/10] bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-brand-400" />
            </div>
            <div className="p-4">
              <span className="inline-block px-2 py-0.5 bg-brand-50 text-brand-700 text-xs rounded">
                {post.tag}
              </span>
              <h2 className="font-bold text-gray-900 mt-2 line-clamp-2 min-h-[3rem]">
                {post.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{post.excerpt}</p>
              <Link
                href={`/cam-nang/${post.slug}`}
                className="mt-3 inline-flex items-center gap-1 text-sm text-brand-700 font-medium"
              >
                Đọc thêm <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="text-center mt-12 p-8 bg-brand-50 rounded-2xl">
        <p className="text-gray-700">
          📝 Phần cẩm nang sẽ được mở rộng với CMS để bác sĩ đăng bài trực tiếp.
        </p>
      </div>
    </div>
  );
}
