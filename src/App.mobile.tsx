function AppMobile() {
  return (
    <div className="h-screen w-screen bg-[#0f0f0f]">
      <iframe
        src="https://m.youtube.com"
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  )
}

export default AppMobile
