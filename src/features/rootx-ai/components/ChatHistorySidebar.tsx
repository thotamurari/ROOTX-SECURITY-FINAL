import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus,
    MessageSquare,
    Trash2,
    Edit2,
    Check,
    X,
    Search,
    Shield,
    Calendar,
    ChevronRight,
    AlertCircle
} from 'lucide-react'
import { useChatHistoryStore, type ChatConversation } from '../stores/chatHistoryStore'
import { Button } from '@/components/shared/Button'

interface Props {
    isOpen: boolean
    onClose: () => void
}

export function ChatHistorySidebar({ isOpen, onClose }: Props) {
    const {
        conversations,
        activeConversationId,
        createNewChat,
        setActiveConversation,
        renameConversation,
        deleteConversation,
        clearAllHistory,
    } = useChatHistoryStore()

    const [search, setSearch] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [confirmClear, setConfirmClear] = useState(false)

    const filteredConversations = conversations.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.messages.some(m => m.content.toLowerCase().includes(search.toLowerCase()))
    )

    const handleStartRename = (conv: ChatConversation) => {
        setEditingId(conv.id)
        setEditTitle(conv.title)
    }

    const handleSaveRename = (id: string) => {
        if (editTitle.trim()) {
            renameConversation(id, editTitle.trim())
        }
        setEditingId(null)
        setEditTitle('')
    }

    const handleSelectChat = (id: string) => {
        setActiveConversation(id)
        onClose()
    }

    const handleNewChat = () => {
        createNewChat()
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-overlay z-[50] lg:hidden backdrop-blur-xs"
                    />

                    {/* Sidebar / Drawer */}
                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed inset-y-0 left-0 w-[290px] sm:w-[320px] bg-surface-1 border-r border-border z-[55] flex flex-col shadow-xl"
                    >
                        {/* Drawer Header */}
                        <div className="p-4 border-b border-border flex items-center justify-between gap-2 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                                    <Shield className="w-4 h-4" />
                                </span>
                                <div>
                                    <h2 className="text-[13.5px] font-bold text-text-primary">Chat History</h2>
                                    <p className="text-[11px] text-text-tertiary">Saved AI consultations</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                aria-label="Close chat history"
                                className="h-8 w-8 text-text-tertiary hover:text-text-primary"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* New Chat Button */}
                        <div className="p-3 border-b border-border shrink-0">
                            <Button
                                variant="primary"
                                size="sm"
                                fullWidth
                                onClick={handleNewChat}
                                leftIcon={<Plus className="w-4 h-4" />}
                                className="font-semibold shadow-xs"
                            >
                                New Security Chat
                            </Button>

                            {/* Search bar */}
                            <div className="relative mt-2.5">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
                                <input
                                    type="text"
                                    placeholder="Search past chats..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-surface-2 border border-border rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
                                />
                            </div>
                        </div>

                        {/* Conversation List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {filteredConversations.length === 0 ? (
                                <div className="text-center py-8 px-4 text-text-tertiary text-[12px]">
                                    {search ? 'No matching conversations' : 'No previous chat sessions'}
                                </div>
                            ) : (
                                filteredConversations.map((conv) => {
                                    const isActive = conv.id === activeConversationId
                                    const isEditing = editingId === conv.id
                                    const dateStr = new Date(conv.updatedAt).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                    })

                                    return (
                                        <div
                                            key={conv.id}
                                            className={`group relative rounded-xl border transition-all ${
                                                isActive
                                                    ? 'bg-accent-soft/60 border-accent/30 text-accent'
                                                    : 'bg-surface-2/60 border-border hover:bg-surface-2 text-text-primary'
                                            }`}
                                        >
                                            {isEditing ? (
                                                <div className="flex items-center gap-1 p-2">
                                                    <input
                                                        type="text"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveRename(conv.id)
                                                            if (e.key === 'Escape') setEditingId(null)
                                                        }}
                                                        autoFocus
                                                        className="flex-1 bg-surface-1 border border-accent rounded px-2 py-1 text-[12px] text-text-primary focus:outline-none"
                                                    />
                                                    <button
                                                        onClick={() => handleSaveRename(conv.id)}
                                                        className="p-1 hover:bg-accent-soft text-accent rounded"
                                                        aria-label="Save title"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-1 hover:bg-surface-3 text-text-tertiary rounded"
                                                        aria-label="Cancel rename"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between p-2.5">
                                                    <button
                                                        onClick={() => handleSelectChat(conv.id)}
                                                        className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                                                    >
                                                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-accent' : 'text-text-tertiary'}`} />
                                                        <div className="min-w-0 flex-1">
                                                            <p className={`text-[12.5px] font-medium truncate leading-tight ${isActive ? 'text-accent font-semibold' : 'text-text-primary'}`}>
                                                                {conv.title}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-text-tertiary">
                                                                <span>{dateStr}</span>
                                                                <span>•</span>
                                                                <span>{conv.messages.length} msg{conv.messages.length !== 1 ? 's' : ''}</span>
                                                            </div>
                                                        </div>
                                                    </button>

                                                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleStartRename(conv)
                                                            }}
                                                            title="Rename chat"
                                                            className="p-1 text-text-tertiary hover:text-text-primary hover:bg-surface-3 rounded transition-colors"
                                                        >
                                                            <Edit2 className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                deleteConversation(conv.id)
                                                            }}
                                                            title="Delete chat"
                                                            className="p-1 text-text-tertiary hover:text-danger hover:bg-danger-soft rounded transition-colors"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* Footer - Clear History */}
                        <div className="p-3 border-t border-border shrink-0 bg-surface-2/40">
                            {confirmClear ? (
                                <div className="space-y-2">
                                    <p className="text-[11px] text-danger flex items-center gap-1 font-medium">
                                        <AlertCircle className="w-3 h-3" /> Clear all conversation logs?
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            fullWidth
                                            onClick={() => {
                                                clearAllHistory()
                                                setConfirmClear(false)
                                            }}
                                            className="text-xs h-7"
                                        >
                                            Confirm
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            fullWidth
                                            onClick={() => setConfirmClear(false)}
                                            className="text-xs h-7"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setConfirmClear(true)}
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11.5px] text-text-tertiary hover:text-danger transition-colors font-medium"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete all history</span>
                                </button>
                            )}
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    )
}
