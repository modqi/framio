export default function Home() {
  return (
    <main className="min-h-screen bg-white">

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-black">Framio</h1>
        <div className="flex items-center gap-4">
          <a href="#" className="text-gray-600 hover:text-black text-sm">Explore</a>
          <a href="#" className="text-gray-600 hover:text-black text-sm">For Photographers</a>
          <button className="bg-black text-white text-sm px-4 py-2 rounded-full hover:bg-gray-800">
            Sign up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-32">
        <h2 className="text-6xl font-bold text-black max-w-3xl leading-tight">
          Find the perfect photographer, anywhere
        </h2>
        <p className="text-gray-500 text-xl mt-6 max-w-xl">
          Connect with talented photographers worldwide for portraits, weddings, events, and more.
        </p>

        {/* Search Bar */}
        <div className="flex items-center gap-3 mt-10 bg-white border border-gray-200 rounded-full px-6 py-4 shadow-sm w-full max-w-2xl">
          <input
            type="text"
            placeholder="Where are you looking for a photographer?"
            className="flex-1 outline-none text-gray-700 text-sm"
          />
          <button className="bg-black text-white text-sm px-6 py-2 rounded-full hover:bg-gray-800">
            Search
          </button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {["Weddings", "Portraits", "Events", "Travel", "Fashion", "Commercial"].map((cat) => (
            <span
              key={cat}
              className="text-sm text-gray-600 border border-gray-200 rounded-full px-4 py-2 hover:border-black cursor-pointer"
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-24 px-8">
        <div className="max-w-5xl mx-auto">

          <h3 className="text-4xl font-bold text-center text-black mb-4">
            How Framio works
          </h3>
          <p className="text-center text-gray-500 mb-16">
            Book a photographer in 3 simple steps
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mb-6">
                1
              </div>
              <h4 className="text-xl font-bold mb-3">Search</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Enter your location and browse photographers near you. Filter by style, price, and availability.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mb-6">
                2
              </div>
              <h4 className="text-xl font-bold mb-3">Book</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Choose your photographer, pick a date and time, and confirm your booking securely in minutes.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mb-6">
                3
              </div>
              <h4 className="text-xl font-bold mb-3">Shoot</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Meet your photographer, have an amazing session, and receive your edited photos within days.
              </p>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}