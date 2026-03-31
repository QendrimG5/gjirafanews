import Link from "next/link";

type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  color: string;
  articleCount: number;
};

async function getCategories(): Promise<CategoryWithCount[]> {
  const res = await fetch("http://localhost:3000/api/categories", {
    cache: "no-store",
  });
  return res.json();
}

export default async function TopicsPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gn-gray-900 mb-2">Temat</h1>
      <p className="text-gn-gray-500 mb-6">
        Zgjidhni temat që ju interesojnë për të ndjekur lajmet.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="relative overflow-hidden rounded-xl border border-gn-gray-200 p-5 hover:shadow-md transition-shadow group"
          >
            <div
              className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity"
              style={{ backgroundColor: cat.color }}
            />
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: cat.color + "1a" }}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
            </div>
            <h3 className="font-semibold text-gn-gray-900">{cat.name}</h3>
            <p className="text-sm text-gn-gray-500 mt-1">
              {cat.articleCount} artikuj
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
