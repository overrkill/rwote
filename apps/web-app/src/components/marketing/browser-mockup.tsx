export default function BrowserMockup() {
  return (
    <div className="flex justify-center items-center animate-fadeUp">
      {/* Browser Frame */}
      <div 
        className="w-full max-w-[340px] bg-white rounded-xl 
        shadow-[0_30px_80px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.06)] 
        overflow-hidden rotate-[1.5deg]
        hover:rotate-0 hover:scale-105 
        transition-transform duration-300 ease-out"
      >
        {/* Browser Bar */}
        <div className="bg-[#f0ede8] p-3 flex items-center gap-2 border-b border-[#e5e2dc]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        
        {/* Extension UI */}
        <div className="p-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg" style={{ fontFamily: "'Grand Hotel', cursive" }}>Rwote</span>
            <span className="text-[#8a8278]" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem' }}>2 notes ≡</span>
          </div>
          
          {/* Search */}
          <div className="bg-[#f5f5f5] rounded-full p-2 px-4 text-xs text-[#aaa] mb-3 flex items-center gap-2">
            🔍 Search notes...
          </div>
          
          {/* Filter */}
          <div className="bg-[#f5f5f5] rounded-full p-2 px-4 text-xs text-[#bbb] mb-4 flex items-center gap-2">
            🏷 Filter by tag...
          </div>
          
          {/* Note Card 1 */}
          <div className="border border-[#eee] rounded-lg p-3 mb-3">
            <span className="inline-block bg-[#e8f0fe] text-[#3b5bdb] text-[10px] px-2 py-0.5 rounded-full mb-2 font-medium">SAAS</span>
            <div className="text-sm font-medium mb-1 text-[#0f0e0d]">build saas</div>
            <div className="text-[11px] text-[#aaa]" style={{ fontFamily: "'DM Mono', monospace" }}>12 Apr 2026</div>
          </div>
          
          {/* Note Card 2 */}
          <div className="border border-[#eee] rounded-lg p-3 mb-3">
            <span className="inline-block bg-[#fff0f0] text-[#c8402a] text-[10px] px-2 py-0.5 rounded-full mb-2 font-medium">DSA</span>
            <div className="text-sm font-medium mb-1 text-[#0f0e0d]">Solve problem</div>
            <div className="text-[11px] text-[#aaa]" style={{ fontFamily: "'DM Mono', monospace" }}>12 Apr 2026</div>
          </div>
          
          {/* Input Area */}
          <div className="border-t border-[#eee] pt-4 mt-4">
            <div className="bg-[#f9f9f9] rounded-md p-2 px-3 text-xs text-[#bbb] mb-2">Write your note... use #tag for tags</div>
            <div className="bg-[#f9f9f9] rounded-md p-2 px-3 text-xs text-[#bbb] mb-2">Extra context (optional)...</div>
            <div className="bg-[#0f0e0d] text-white rounded-md p-2 text-xs font-medium text-center">Save</div>
          </div>
        </div>
      </div>
    </div>
  )
}
