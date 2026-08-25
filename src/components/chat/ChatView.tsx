import { MessageSquare } from 'lucide-react';

interface ChatViewProps {
  chatTitle?: string;
}

export default function ChatView({ chatTitle }: ChatViewProps) {
  return (
    <main
      style={{
        flex: 1,
        minWidth: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
      }}
    >
      {/* Chat header */}
      <header
        style={{
          height: 60,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          borderBottom: '1px solid #e5e7eb',
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {chatTitle || '新規チャット'}
        </span>
      </header>

      {/* Conversation area */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 20px',
              display: 'grid',
              placeItems: 'center',
              borderRadius: 18,
              background: '#f1f5f9',
            }}
          >
            <MessageSquare size={26} />
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            TaskHDI
          </h1>

          <p
            style={{
              margin: '10px 0 0',
              color: '#6b7280',
              fontSize: 15,
            }}
          >
            その人専用のAI。自分専用の相棒。
          </p>
        </div>
      </section>

      {/* Input placeholder */}
      <div
        style={{
          padding: '16px 24px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 820,
            margin: '0 auto',
            minHeight: 54,
            border: '1px solid #d1d5db',
            borderRadius: 18,
            background: '#ffffff',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </main>
  );
}