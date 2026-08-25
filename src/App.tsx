import { useState } from 'react';
import Sidebar from './components/sidebar/Sidebar';
import ChatView from './components/chat/ChatView';
import './styles/app.css';

export interface AppChat {
  id: string;
  title: string;
}

export default function App() {
  const [chats, setChats] = useState<AppChat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleNewChat = () => {
    const number = chats.length + 1;

    const newChat: AppChat = {
      id: crypto.randomUUID(),
      title: `新規チャット ${number}`,
    };

    setChats((prev) => [...prev, newChat]);
    setActiveChat(newChat.id);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChat(chatId);
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  const activeChatData =
    chats.find((chat) => chat.id === activeChat) ?? null;

  return (
    <div className="taskhdi-app">
      <Sidebar
        chats={chats.map((chat) => chat.title)}
        activeChat={activeChatData?.title ?? null}
        onNewChat={handleNewChat}
        onSelectChat={(title) => {
          const chat = chats.find((item) => item.title === title);

          if (chat) {
            handleSelectChat(chat.id);
          }
        }}
        onOpenSettings={handleOpenSettings}
      />

      <main className="taskhdi-main">
        <ChatView
          chatTitle={activeChatData?.title}
        />
      </main>

      {settingsOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(0, 0, 0, 0.25)',
          }}
          onClick={() => setSettingsOpen(false)}
        >
          <div
            style={{
              width: 'min(520px, calc(100vw - 32px))',
              padding: 24,
              borderRadius: 20,
              background: '#ffffff',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 style={{ margin: 0 }}>設定</h2>

            <p
              style={{
                marginTop: 8,
                color: '#6b7280',
              }}
            >
              TaskHDIの設定はここから管理します。
            </p>

            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              style={{
                marginTop: 16,
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                background: '#ffffff',
                cursor: 'pointer',
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}