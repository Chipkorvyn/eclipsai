// app/wizard/ChatBox.tsx
'use client';

import React, { useState } from 'react';

export default function ChatBox() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');

  async function handleSend() {
    if (!input.trim()) return;
    const userQuestion = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userQuestion }]);
    setInput('');

    // Example call
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuestion })
      });
      if (!res.ok) {
        const errData = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: errData.answer || 'Error occurred.' }
        ]);
        return;
      }
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error. Try again.' }
      ]);
    }
  }

  return (
    <div
      style={{
        /* Just fill parent container which is 180px high */
        width: '100%',
        height: '100%',
        background: '#f8f8f8',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '14px'
      }}
    >
      {/* Message area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: '0.25rem 0' }}>
            <strong>{m.role === 'user' ? 'You' : 'Chatbot'}:</strong> {m.content}
          </div>
        ))}
      </div>

      {/* Input area */}
      <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #ccc', padding: '0.5rem' }}>
        <input
          style={{ flex: 1, padding: '0.25rem' }}
          placeholder="Ask about Swiss mandatory health insurance..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
