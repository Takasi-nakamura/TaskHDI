import { useState } from 'react';
import {
  ArrowUp,
  MessageSquare,
  Paperclip,
  Square,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatViewProps {
  chatTitle?: string;
}

export default function ChatView({ chatTitle }: ChatViewProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const canSend = input.trim().length > 0 && !isGenerating;

  const handleSend = () => {
    const text = input.trim();

    if (!text || isGenerating) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // 現段階ではAI接続前なので仮の応答
    setIsGenerating(true);

    window.setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          'メッセージを受け取りました。次の段階でここをHDI Engine → OpenRouter → GPT-OSS 120Bに接続します。',
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsGenerating(false);
    }, 500);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    setIsGenerating(false);
  };

  return (
    <main className="chat-view">
      {/* Header */}
      <header className="chat-view__header">
        <div className="chat-view__title">
          {chatTitle || '新規チャット'}
        </div>
      </header>

      {/* Messages */}
      <section className="chat-view__messages">
        {messages.length === 0 ? (
          <div className="chat-view__empty">
            <div className="chat-view__empty-icon">
              <MessageSquare size={26} />
            </div>

            <h1>TaskHDI</h1>

            <p>
              その人専用のAI。自分専用の相棒。
            </p>
          </div>
        ) : (
          <div className="chat-view__message-list">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${
                  message.role === 'user'
                    ? 'chat-message--user'
                    : 'chat-message--assistant'
                }`}
              >
                <div className="chat-message__content">
                  {message.content}
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="chat-message chat-message--assistant">
                <div className="chat-message__content chat-message__loading">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Input */}
      <div className="chat-view__input-area">
        <div className="chat-input">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="TaskHDIにメッセージを送信..."
            rows={1}
            disabled={isGenerating}
          />

          <div className="chat-input__bottom">
            <button
              type="button"
              className="chat-input__icon-button"
              aria-label="ファイルを添付"
              disabled={isGenerating}
            >
              <Paperclip size={18} />
            </button>

            <div className="chat-input__hint">
              Enterで送信・Shift + Enterで改行
            </div>

            {isGenerating ? (
              <button
                type="button"
                className="chat-input__send chat-input__send--stop"
                onClick={handleStop}
                aria-label="生成を停止"
              >
                <Square size={15} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                className="chat-input__send"
                onClick={handleSend}
                disabled={!canSend}
                aria-label="送信"
              >
                <ArrowUp size={19} />
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}