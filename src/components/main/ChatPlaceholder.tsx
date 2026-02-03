// components/main/ChatPlaceholder.tsx
const ChatPlaceholder = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
      <div className="text-6xl font-bold opacity-20 mb-4">Rad5 Comms</div>
      <p className="text-lg opacity-70">
        Select a chat or channel to get started
      </p>
      <p className="text-sm mt-2 opacity-50">
        Your messages will appear here
      </p>
    </div>
  );
};

export default ChatPlaceholder;