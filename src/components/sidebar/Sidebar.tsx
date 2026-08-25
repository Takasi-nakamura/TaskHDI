import { MessageSquarePlus, Settings, MoreHorizontal } from 'lucide-react';

interface SidebarProps {
  chats: string[];
  activeChat: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onOpenSettings: () => void;
}

export default function Sidebar({
  chats,
  activeChat,
  onNewChat,
  onSelectChat,
  onOpenSettings,
}: SidebarProps) {
  return (
    <aside
      style={{
        width: 280,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #e5e7eb',
        background: '#ffffff',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 16px',
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        TaskHDI
      </div>

      {/* New chat */}
      <div style={{ padding: '0 12px 12px' }}>
        <button
          type="button"
          onClick={onNewChat}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '11px 14px',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          <MessageSquarePlus size={18} />
          新規チャット
        </button>
      </div>

      {/* Chat list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 8px',
        }}
      >
        {chats.length === 0 ? (
          <div
            style={{
              padding: '20px 12px',
              color: '#9ca3af',
              fontSize: 13,
            }}
          >
            チャットはまだありません
          </div>
        ) : (
          chats.map((chatId) => (
            <div
              key={chatId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginBottom: 4,
              }}
            >
              <button
                type="button"
                onClick={() => onSelectChat(chatId)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: 'left',
                  padding: '10px 12px',
                  border: 0,
                  borderRadius: 10,
                  background:
                    activeChat === chatId ? '#f1f5f9' : 'transparent',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: 14,
                }}
              >
                {chatId}
              </button>

              <button
                type="button"
                aria-label={`${chatId} のメニュー`}
                style={{
                  width: 32,
                  height: 32,
                  display: 'grid',
                  placeItems: 'center',
                  border: 0,
                  borderRadius: 8,
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                <MoreHorizontal size={17} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* User / settings */}
      <button
        type="button"
        onClick={onOpenSettings}
        style={{
          margin: 12,
          padding: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          border: '1px solid #e5e7eb',
          borderRadius: 14,
          background: '#ffffff',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: '#eef2ff',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          U
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            ユーザー
          </div>

          <div
            style={{
              marginTop: 2,
              fontSize: 12,
              color: '#9ca3af',
            }}
          >
            設定
          </div>
        </div>

        <Settings size={17} color="#6b7280" />
      </button>
    </aside>
  );
}