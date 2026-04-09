export default function Photographers() {
  const photographers = [
    {
      name: "Sofia Andersen",
      city: "Bergen, Norway",
      specialty: "Weddings & Portraits",
      price: "From 2,500 NOK",
      initials: "SA",
      rating: "4.9",
      reviews: 48,
    },
    {
      name: "Marco Rossi",
      city: "Oslo, Norway",
      specialty: "Fashion & Commercial",
      price: "From 3,000 NOK",
      initials: "MR",
      rating: "4.8",
      reviews: 63,
    },
    {
      name: "Lena Berg",
      city: "Stavanger, Norway",
      specialty: "Travel & Nature",
      price: "From 1,800 NOK",
      initials: "LB",
      rating: "5.0",
      reviews: 31,
    },
    {
      name: "James Carter",
      city: "London, UK",
      specialty: "Events & Corporate",
      price: "From £200",
      initials: "JC",
      rating: "4.7",
      reviews: 92,
    },
    {
      name: "Aiko Tanaka",
      city: "Tokyo, Japan",
      specialty: "Portraits & Street",
      price: "From ¥25,000",
      initials: "AT",
      rating: "4.9",
      reviews: 57,
    },
    {
      name: "Layla Hassan",
      city: "Dubai, UAE",
      specialty: "Luxury & Weddings",
      price: "From AED 800",
      initials: "LH",
      rating: "5.0",
      reviews: 44,
    },
  ];

  return (
    <main className="min-h-screen bg-white">

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <a href="/" className="text-2xl font-bold text-black">Framio</a>
        <div className="flex items-center gap-4">
          <a href="/photographers" className="text-black font-medium text-sm">Explore</a>
          <a href="#" className="text-gray-600 hover:text-black text-sm">For Photographers</a>
          <button className="bg-black text-white text-sm px-4 py-2 rounded-full hover:bg-gray-800">
            Sign up
          </button>
        </div>
      </nav>

      {/* Header */}
      <section className="px-8 py-12 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-black mb-2">Photographers</h2>
        <p className="text-gray-500">Discover talented photographers around the world</p>
      </section>

      {/* Photographer Grid */}
      <section className="px-8 pb-24 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {photographers.map((p) => (
            <div
              key={p.name}
              className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Photo placeholder */}
              <div className="bg-gray-100 h-56 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600">
                  {p.initials}
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-black text-lg">{p.name}</h3>
                  <span className="text-sm text-gray-600">⭐ {p.rating} ({p.reviews})</span>
                </div>
                <p className="text-gray-500 text-sm mb-1">{p.city}</p>
                <p className="text-gray-500 text-sm mb-4">{p.specialty}</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-black text-sm">{p.price}</span>
                  <a href="/photographers/sofia-andersen" className="bg-black text-white text-sm px-4 py-2 rounded-full hover:bg-gray-800">
  View Profile
</a>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}