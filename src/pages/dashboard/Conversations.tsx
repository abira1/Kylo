import React, { useState } from 'react';
import { Search, Filter, Bot, User, Clock, CheckCircle2 } from 'lucide-react';
import { MOCK_CONVERSATIONS } from '../../lib/mockData';
export function Conversations() {
  const [activeConv, setActiveConv] = useState<
    (typeof MOCK_CONVERSATIONS)[0] | null>(
    null);
  return (
    <div className="h-[calc(100vh-6rem)] sm:h-[calc(100vh-8rem)] flex flex-col space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Conversations
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
          Monitor live and past interactions with your AI.
        </p>
      </div>

      <div className="flex-1 bento-card p-0 flex overflow-hidden sm:p-0">
        {/* Sidebar List */}
        <div
          className={`w-full md:w-80 border-r border-gray-100 dark:border-navy-700 flex flex-col bg-white dark:bg-navy-800 ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          
          <div className="p-4 border-b border-gray-100 dark:border-navy-700">
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={16} />
              
              <input
                type="text"
                placeholder="Search chats..."
                className="input-field pl-9 py-2 text-sm bg-gray-50 dark:bg-navy-900" />
              
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {MOCK_CONVERSATIONS.map((conv) =>
            <div
              key={conv.id}
              onClick={() => setActiveConv(conv)}
              className={`p-4 border-b border-gray-50 dark:border-navy-700/50 cursor-pointer transition-colors ${activeConv?.id === conv.id ? 'bg-mint-50 dark:bg-navy-700 border-l-4 border-l-emerald-500 dark:border-l-cyan-500' : 'hover:bg-gray-50 dark:hover:bg-navy-700/50 border-l-4 border-l-transparent'}`}>
              
                <div className="flex justify-between items-start mb-1">
                  <div className="font-bold text-gray-900 dark:text-white text-sm">
                    {conv.visitorName}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {conv.time}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                  {conv.lastMessage}
                </div>
                <div className="flex justify-between items-center">
                  <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${conv.status === 'Active' ? 'bg-mint-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-700 dark:bg-navy-900 dark:text-gray-400'}`}>
                  
                    {conv.status}
                  </span>
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-500">
                    {conv.channel}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={`flex-1 flex-col bg-gray-50 dark:bg-navy-900 ${activeConv ? 'flex' : 'hidden md:flex'}`}>
          
          {activeConv ?
          <>
              {/* Chat Header */}
              <div className="h-16 sm:h-20 border-b border-gray-100 dark:border-navy-700 bg-white dark:bg-navy-800 px-4 sm:px-6 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <button
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-lg"
                  onClick={() => setActiveConv(null)}>
                  
                    <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-turquoise-500 dark:from-cyan-500 dark:to-emerald-500 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-sm">
                    {activeConv.visitorName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                      {activeConv.visitorName}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                      <span
                      className={`w-2 h-2 rounded-full ${activeConv.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                    </span>
                      {activeConv.status} • {activeConv.channel}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs sm:text-sm py-1.5 px-3">
                    <CheckCircle2 size={16} className="hidden sm:block" />{' '}
                    Resolve
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="text-center text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 my-2 sm:my-4">
                  Conversation started • {activeConv.time}
                </div>

                {activeConv.messages.map((msg, idx) =>
              <div
                key={idx}
                className={`flex gap-2 sm:gap-3 max-w-[85%] sm:max-w-[80%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                
                    <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'bot' ? 'bg-mint-100 text-emerald-600 dark:bg-cyan-900/30 dark:text-cyan-400' : 'bg-gray-200 text-gray-600 dark:bg-navy-700 dark:text-gray-300'}`}>
                  
                      {msg.sender === 'bot' ?
                  <Bot size={14} /> :

                  <User size={14} />
                  }
                    </div>
                    <div
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  
                      <div
                    className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm shadow-sm ${msg.sender === 'user' ? 'bg-emerald-500 dark:bg-cyan-600 text-white rounded-tr-sm' : 'bg-white dark:bg-navy-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-navy-700 rounded-tl-sm'}`}>
                    
                        {msg.text}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                        <Clock size={10} /> {msg.time}
                      </div>
                    </div>
                  </div>
              )}
              </div>

              {/* Chat Input (Readonly for monitoring) */}
              <div className="p-3 sm:p-4 bg-white dark:bg-navy-900 border-t border-gray-200 dark:border-navy-800">
                <div className="bg-gray-100 dark:bg-navy-950 rounded-xl p-2 sm:p-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center border border-dashed border-gray-300 dark:border-navy-700">
                  You are viewing this conversation in read-only mode.
                </div>
              </div>
            </> :

          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
              Select a conversation to view details
            </div>
          }
        </div>
      </div>
    </div>);

}