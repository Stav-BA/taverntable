import InitiativeTracker from '@/components/InitiativeTracker/InitiativeTracker';
import ChatLog from '@/components/ChatLog/ChatLog';

export default function LeftSidebar() {
  return (
    <div
      className="sidebar-panel flex flex-col"
      style={{ width: 320, flexShrink: 0 }}
    >
      {/* Initiative Tracker — top half */}
      <div
        className="flex flex-col"
        style={{
          height: '40%',
          borderBottom: '1px solid rgba(201,162,39,0.3)',
          overflow: 'hidden',
        }}
      >
        <InitiativeTracker />
      </div>

      {/* Chat Log — bottom half */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <ChatLog />
      </div>
    </div>
  );
}
