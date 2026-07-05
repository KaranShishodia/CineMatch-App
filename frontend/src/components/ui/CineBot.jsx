import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

/**
 * CineBot — Chatbot-style recommendation assistant.
 *
 * Sends conversation history to the backend which proxies to an AI model.
 * Falls back to a rule-based keyword responder if AI endpoint unavailable.
 */

const INITIAL_MSG = {
  role: 'assistant',
  content: "Hi! I'm CineBot 🎬 Your personal movie guide. Ask me anything — recommend me a thriller, find movies like Inception, or just tell me your mood!",
}

// Rule-based fallback responses when AI backend isn't set up
const QUICK_REPLIES = [
  "What mood are you in?",
  "Recommend a thriller",
  "Best sci-fi movies",
  "Something funny",
  "Movies like Interstellar",
]

export default function CineBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([INITIAL_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Build conversation history (last 10 messages for context)
      const history = [...messages, userMsg].slice(-10)

      const res = await api.post('/chatbot/chat', { messages: history })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch (_) {
      // Fallback: simple rule-based responder
      const reply = getRuleBasedReply(text)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl
          flex items-center justify-center text-xl transition-all duration-300
          ${open ? 'bg-cinema-surface border-cinema-gold scale-95' : 'bg-cinema-accent hover:bg-red-700'}
          border border-cinema-border`}
        aria-label="Open CineBot"
      >
        {open ? '✕' : '🎬'}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex flex-col
          bg-cinema-surface border border-cinema-border rounded-2xl shadow-2xl
          shadow-black/50 overflow-hidden animate-slide-up">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-cinema-card border-b border-cinema-border">
            <div className="w-8 h-8 rounded-full bg-cinema-accent flex items-center justify-center text-sm">🎬</div>
            <div>
              <p className="font-semibold text-sm text-cinema-text">CineBot</p>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Online
              </p>
            </div>
            <button
              onClick={() => setMessages([INITIAL_MSG])}
              className="ml-auto text-xs text-cinema-muted hover:text-cinema-text"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-cinema-accent text-white rounded-br-sm'
                    : 'bg-cinema-card text-cinema-text border border-cinema-border rounded-bl-sm'
                  }`}
                >
                  {/* Render movie links if the reply contains [Movie Title](id) syntax */}
                  <MessageContent content={msg.content} />
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-cinema-card border border-cinema-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-cinema-muted animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-2.5 py-1 rounded-full border border-cinema-border
                    text-cinema-muted hover:border-cinema-gold hover:text-cinema-gold transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-cinema-border">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask CineBot anything..."
              className="input-field py-2 text-sm flex-1"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn-primary py-2 px-3 text-sm disabled:opacity-50"
            >
              →
            </button>
          </form>
        </div>
      )}
    </>
  )
}

/** Renders message text, turning [Movie](movieId) markdown into links */
function MessageContent({ content }) {
  const parts = content.split(/(\[.+?\]\(\d+\))/g)
  return (
    <span>
      {parts.map((part, i) => {
        const match = part.match(/\[(.+?)\]\((\d+)\)/)
        if (match) {
          return (
            <Link
              key={i}
              to={`/movie/${match[2]}`}
              className="text-cinema-gold underline hover:no-underline"
            >
              {match[1]}
            </Link>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

/** Simple keyword-based fallback when AI backend not configured */
function getRuleBasedReply(text) {
  const t = text.toLowerCase()

  if (t.includes('thriller') || t.includes('suspense')) {
    return "Great choice! Try these thrillers: Gone Girl (2014), Parasite (2019), Prisoners (2013), or No Country for Old Men (2007). All are absolutely gripping!"
  }
  if (t.includes('comedy') || t.includes('funny') || t.includes('laugh')) {
    return "Need a laugh? Check out The Grand Budapest Hotel, Game Night, What We Do in the Shadows, or Superbad. All guaranteed to make you smile!"
  }
  if (t.includes('sci-fi') || t.includes('science fiction') || t.includes('space')) {
    return "Sci-fi fan! You might love: Arrival (2016), Blade Runner 2049 (2017), Annihilation (2018), or The Martian (2015). All mind-bending!"
  }
  if (t.includes('horror') || t.includes('scary') || t.includes('frightening')) {
    return "Brave soul! Try: Hereditary (2018), Get Out (2017), A Quiet Place (2018), or The Witch (2015). Each one is deeply unsettling in the best way."
  }
  if (t.includes('romance') || t.includes('love') || t.includes('romantic')) {
    return "Feeling romantic? How about: Past Lives (2023), Before Sunrise (1995), Normal People (2020), or Eternal Sunshine of the Spotless Mind?"
  }
  if (t.includes('action') || t.includes('adventure')) {
    return "Action time! Check out: Mad Max: Fury Road, Everything Everywhere All at Once, John Wick, or Top Gun: Maverick. All thrilling rides!"
  }
  if (t.includes('like inception') || t.includes('mind') || t.includes('mind-bending')) {
    return "If you liked Inception, you'll love: Shutter Island, Memento, Tenet, Predestination, or Triangle. All will seriously mess with your mind!"
  }
  if (t.includes('mood') || t.includes('feel')) {
    return "Tell me more about your mood! Are you feeling: adventurous, relaxed, emotional, curious, or wanting something exciting? I'll find the perfect match!"
  }
  if (t.includes('best') || t.includes('top') || t.includes('greatest')) {
    return "Some all-time greats: The Shawshank Redemption, The Godfather, Schindler's List, Parasite, 12 Angry Men. Any of these sound interesting?"
  }
  if (t.includes('new') || t.includes('recent') || t.includes('2024') || t.includes('latest')) {
    return "Recent must-watches: Dune: Part Two, Poor Things, Oppenheimer, Killers of the Flower Moon, and Past Lives. All critically acclaimed!"
  }

  return "Interesting! To give you the best recommendations, could you tell me: what genres you enjoy, a movie you loved recently, or what mood you're in? I'm here to help find your perfect film! 🎬"
}
