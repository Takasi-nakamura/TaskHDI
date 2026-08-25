import { useState } from 'react';
import {
  ArrowUp,
  MessageSquare,
  Paperclip,
  Square,
} from 'lucide-react';
import {
  callBaseAIStream,
  DEFAULT_MODEL,
  AIProviderError,
} from '../../providers/aiProvider';

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

  const handleSend = async () => {
    const text = input.trim();

    if (!text || isGenerating) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };

    const assistantId = crypto.randomUUID();

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    // APIキーは一時的に環境変数から取得
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content:
            'OpenRouter APIキーが設定されていません。\n\n.env.local に VITE_OPENROUTER_API_KEY を設定してください。',
        },
      ]);

      setIsGenerating(false);
      return;
    }

    // まず現在の会話をBase AI用の形式に変換
    const previousMessages = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
      },
    ]);

    try {
      await callBaseAIStream({
        apiKey,
        model: DEFAULT_MODEL,
        systemPrompt:
          'あなたはTaskHDIのBase AIです。ユーザーと自然に日本語で会話してください。',
        messages: [
          ...previousMessages,
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.7,
        stream: true,
        onToken: (chunk) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content: message.content + chunk,
                  }
                : message,
            ),
          );
        },
      });
    } catch (error) {
      const message =
        error instanceof AIProviderError
          ? error.message
          : 'AIとの通信中にエラーが発生しました。';

      setMessages((prev) =>
        prev.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                content: `⚠️ ${message}`,
              }
            : item,
        ),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleStop = () => {
    setIsGenerating(false);
  };

  return (
    <main className="chat-view">
      <header className="chat-view__header">
        <div className="chat-view__title">
          {chatTitle || '新規チャット'}
        </div>
      </header>

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
          </div>
        )}
      </section>

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
                onClick={() => void handleSend()}
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