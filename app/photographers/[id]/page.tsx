export default function PhotographerProfile() {
  return (
    <main className="min-h-screen bg-white">

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <a href="/" className="text-2xl font-bold text-black">Framio</a>
        <div className="flex items-center gap-4">
          <a href="/photographers" className="text-gray-600 hover:text-black text-sm">Explore</a>
          <a href="/photographers/sofia-andersen" className="text-gray-600 hover:text-black text-sm">For Photographers</a>
          <button className="bg-black text-white text-sm px-4 py-2 rounded-full hover:bg-gray-800">
            Sign up
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          
          {/* Avatar */}
          <div className="w-40 h-40 rounded-2xl bg-gray-100 flex items-center justify-center text-4xl font-bold text-gray-400 flex-shrink-0">
            SA
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-black mb-1">Sofia Andersen</h1>
                <p className="text-gray-500 mb-1">Bergen, Norway</p>
                <p className="text-gray-500 mb-3">Weddings & Portraits</p>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-medium">4.9</span>
                  <span className="text-gray-400">(48 reviews)</span>
                  <span className="ml-2 bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full">Available</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-black">2,500 NOK</p>
                <p className="text-gray-400 text-sm">per session</p>
              </div>
            </div>

            {/* Bio */}
            <p className="text-gray-600 mt-4 leading-relaxed">
              Professional photographer based in Bergen with over 8 years of experience. Specializing in weddings, portraits, and lifestyle photography. I believe every moment deserves to be captured beautifully.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left — Portfolio & Reviews */}
          <div className="md:col-span-2">
            
            {/* Portfolio */}
            <h2 className="text-xl font-bold mb-4">Portfolio</h2>
            <div className="grid grid-cols-3 gap-3 mb-10">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 text-sm">
                  Photo {i}
                </div>
              ))}
            </div>

            {/* Reviews */}
            <h2 className="text-xl font-bold mb-4">Reviews</h2>
            <div className="flex flex-col gap-4">
              {[
                { name: "Emma L.", text: "Sofia was absolutely amazing! She made us feel so comfortable and the photos were stunning.", date: "March 2026" },
                { name: "Anders K.", text: "Booked Sofia for our wedding and couldn't be happier. Professional, creative and so talented.", date: "February 2026" },
                { name: "Maria S.", text: "Best portrait session I've ever had. Sofia has a real eye for capturing natural moments.", date: "January 2026" },
              ].map((review) => (
                <div key={review.name} className="border border-gray-100 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-black">{review.name}</span>
                    <span className="text-gray-400 text-sm">{review.date}</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>
                  <div className="mt-2 text-yellow-500 text-sm">⭐⭐⭐⭐⭐</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Booking Card */}
          <div className="md:col-span-1">
            <div className="border border-gray-200 rounded-2xl p-6 sticky top-8">
              <h3 className="text-lg font-bold mb-1">Book Sofia</h3>
              <p className="text-gray-400 text-sm mb-6">Choose your session details</p>

              {/* Session Type */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">Session type</label>
                <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none">
                  <option>Wedding (Full day)</option>
                  <option>Portrait (2 hours)</option>
                  <option>Engagement (3 hours)</option>
                  <option>Family (2 hours)</option>
                </select>
              </div>

              {/* Date */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none"
                />
              </div>

              {/* Location */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 block mb-2">Location</label>
                <input
                  type="text"
                  placeholder="Where is the shoot?"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none"
                />
              </div>

              {/* Price Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Session fee</span>
                  <span className="text-black">2,500 NOK</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Framio fee</span>
                  <span className="text-black">250 NOK</span>
                </div>
                <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span>2,750 NOK</span>
                </div>
              </div>

              {/* Book Button */}
              <button className="w-full bg-black text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors">
                Request to Book
              </button>
              <p className="text-center text-gray-400 text-xs mt-3">You won't be charged yet</p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}